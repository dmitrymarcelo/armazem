#!/usr/bin/env bash
set -euo pipefail

# Run this script in AWS CloudShell (or any host with aws cli configured).
# It provisions:
# - 1 EC2 instance (Amazon Linux 2023)
# - 1 RDS PostgreSQL instance
# - Security groups and DB subnet group

if ! command -v aws >/dev/null 2>&1; then
  echo "aws cli nao encontrado."
  exit 1
fi

PROJECT_NAME="${PROJECT_NAME:-logiwms}"
REGION="${AWS_REGION:-us-east-1}"
KEY_NAME="${KEY_NAME:-}"
INSTANCE_TYPE="${INSTANCE_TYPE:-t3.micro}"
DB_INSTANCE_CLASS="${DB_INSTANCE_CLASS:-db.t3.micro}"
DB_STORAGE_GB="${DB_STORAGE_GB:-20}"
DB_ENGINE_VERSION="${DB_ENGINE_VERSION:-15.7}"
DB_NAME="${DB_NAME:-logiwms_db}"
DB_USER="${DB_USER:-admin_logiwms}"
DB_PASSWORD="${DB_PASSWORD:-}"

if [[ -z "$KEY_NAME" ]]; then
  echo "Defina KEY_NAME com o nome do seu key pair EC2."
  echo "Exemplo: KEY_NAME=minha-chave-ec2 ./infra/aws/provision-ec2-rds.sh"
  exit 1
fi

if [[ -z "$DB_PASSWORD" || ${#DB_PASSWORD} -lt 8 ]]; then
  echo "Defina DB_PASSWORD com pelo menos 8 caracteres."
  echo "Exemplo: DB_PASSWORD='SenhaForte123!' KEY_NAME=minha-chave-ec2 ./infra/aws/provision-ec2-rds.sh"
  exit 1
fi

EC2_NAME="${PROJECT_NAME}-ec2"
EC2_SG_NAME="${PROJECT_NAME}-ec2-sg"
RDS_SG_NAME="${PROJECT_NAME}-rds-sg"
DB_SUBNET_GROUP="${PROJECT_NAME}-db-subnet-group"
DB_INSTANCE_ID="${PROJECT_NAME}-postgres"

VPC_ID="$(aws ec2 describe-vpcs \
  --region "$REGION" \
  --filters Name=isDefault,Values=true \
  --query 'Vpcs[0].VpcId' \
  --output text)"

if [[ -z "$VPC_ID" || "$VPC_ID" == "None" ]]; then
  echo "VPC default nao encontrada em $REGION."
  exit 1
fi

mapfile -t SUBNET_IDS < <(
  aws ec2 describe-subnets \
    --region "$REGION" \
    --filters Name=vpc-id,Values="$VPC_ID" \
    --query 'Subnets[].SubnetId' \
    --output text | tr '\t' '\n'
)

if [[ ${#SUBNET_IDS[@]} -lt 2 ]]; then
  echo "Subnets insuficientes na VPC default para criar DB subnet group."
  exit 1
fi

get_or_create_sg() {
  local name="$1"
  local description="$2"
  local sg_id
  sg_id="$(aws ec2 describe-security-groups \
    --region "$REGION" \
    --filters "Name=vpc-id,Values=$VPC_ID" "Name=group-name,Values=$name" \
    --query 'SecurityGroups[0].GroupId' \
    --output text)"

  if [[ "$sg_id" == "None" || -z "$sg_id" ]]; then
    sg_id="$(aws ec2 create-security-group \
      --region "$REGION" \
      --group-name "$name" \
      --description "$description" \
      --vpc-id "$VPC_ID" \
      --query 'GroupId' \
      --output text)"
  fi

  echo "$sg_id"
}

EC2_SG_ID="$(get_or_create_sg "$EC2_SG_NAME" "EC2 security group for ${PROJECT_NAME}")"
RDS_SG_ID="$(get_or_create_sg "$RDS_SG_NAME" "RDS security group for ${PROJECT_NAME}")"

aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$EC2_SG_ID" --protocol tcp --port 22 --cidr 0.0.0.0/0 >/dev/null 2>&1 || true
aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$EC2_SG_ID" --protocol tcp --port 80 --cidr 0.0.0.0/0 >/dev/null 2>&1 || true
aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$EC2_SG_ID" --protocol tcp --port 443 --cidr 0.0.0.0/0 >/dev/null 2>&1 || true
aws ec2 authorize-security-group-ingress --region "$REGION" --group-id "$RDS_SG_ID" --protocol tcp --port 5432 --source-group "$EC2_SG_ID" >/dev/null 2>&1 || true

if ! aws rds describe-db-subnet-groups --region "$REGION" --db-subnet-group-name "$DB_SUBNET_GROUP" >/dev/null 2>&1; then
  aws rds create-db-subnet-group \
    --region "$REGION" \
    --db-subnet-group-name "$DB_SUBNET_GROUP" \
    --db-subnet-group-description "Subnet group for ${PROJECT_NAME}" \
    --subnet-ids "${SUBNET_IDS[@]}" >/dev/null
fi

if ! aws rds describe-db-instances --region "$REGION" --db-instance-identifier "$DB_INSTANCE_ID" >/dev/null 2>&1; then
  aws rds create-db-instance \
    --region "$REGION" \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --engine postgres \
    --engine-version "$DB_ENGINE_VERSION" \
    --db-instance-class "$DB_INSTANCE_CLASS" \
    --allocated-storage "$DB_STORAGE_GB" \
    --storage-type gp3 \
    --db-name "$DB_NAME" \
    --master-username "$DB_USER" \
    --master-user-password "$DB_PASSWORD" \
    --vpc-security-group-ids "$RDS_SG_ID" \
    --db-subnet-group-name "$DB_SUBNET_GROUP" \
    --no-publicly-accessible \
    --backup-retention-period 7 \
    --no-multi-az >/dev/null
fi

echo "Aguardando RDS ficar disponivel..."
aws rds wait db-instance-available --region "$REGION" --db-instance-identifier "$DB_INSTANCE_ID"

RDS_ENDPOINT="$(
  aws rds describe-db-instances \
    --region "$REGION" \
    --db-instance-identifier "$DB_INSTANCE_ID" \
    --query 'DBInstances[0].Endpoint.Address' \
    --output text
)"

AMI_ID="$(
  aws ssm get-parameter \
    --region "$REGION" \
    --name /aws/service/ami-amazon-linux-latest/al2023-ami-kernel-default-x86_64 \
    --query 'Parameter.Value' \
    --output text
)"

INSTANCE_ID="$(
  aws ec2 describe-instances \
    --region "$REGION" \
    --filters "Name=tag:Name,Values=$EC2_NAME" "Name=instance-state-name,Values=pending,running,stopping,stopped" \
    --query 'Reservations[0].Instances[0].InstanceId' \
    --output text
)"

if [[ "$INSTANCE_ID" == "None" || -z "$INSTANCE_ID" ]]; then
  USER_DATA=$(cat <<'EOF'
#!/bin/bash
set -eux
dnf update -y
dnf install -y git nginx rsync
curl -fsSL https://rpm.nodesource.com/setup_20.x | bash -
dnf install -y nodejs
npm install -g pm2
mkdir -p /var/www/logiwms
chown ec2-user:ec2-user /var/www/logiwms
systemctl enable nginx
systemctl start nginx
EOF
)

  INSTANCE_ID="$(
    aws ec2 run-instances \
      --region "$REGION" \
      --image-id "$AMI_ID" \
      --instance-type "$INSTANCE_TYPE" \
      --key-name "$KEY_NAME" \
      --security-group-ids "$EC2_SG_ID" \
      --subnet-id "${SUBNET_IDS[0]}" \
      --tag-specifications "ResourceType=instance,Tags=[{Key=Name,Value=$EC2_NAME}]" \
      --user-data "$USER_DATA" \
      --query 'Instances[0].InstanceId' \
      --output text
  )"
fi

echo "Aguardando EC2 ficar em estado running..."
aws ec2 wait instance-running --region "$REGION" --instance-ids "$INSTANCE_ID"

EC2_PUBLIC_IP="$(
  aws ec2 describe-instances \
    --region "$REGION" \
    --instance-ids "$INSTANCE_ID" \
    --query 'Reservations[0].Instances[0].PublicIpAddress' \
    --output text
)"

cat <<EOF

Provisionamento concluido.

EC2:
  InstanceId: $INSTANCE_ID
  PublicIP:   $EC2_PUBLIC_IP
  SG:         $EC2_SG_ID

RDS:
  Identifier: $DB_INSTANCE_ID
  Endpoint:   $RDS_ENDPOINT
  Port:       5432
  DB Name:    $DB_NAME
  User:       $DB_USER
  SG:         $RDS_SG_ID

Proximos passos:
1) ssh -i <seu-key.pem> ec2-user@$EC2_PUBLIC_IP
2) git clone https://github.com/dmitrymarcelo/armazem.git ~/logiwms-pro
3) cp ~/logiwms-pro/api-backend/.env.production.rds.example ~/logiwms-pro/api-backend/.env
4) Edite ~/logiwms-pro/api-backend/.env com:
   DB_HOST=$RDS_ENDPOINT
   DB_PORT=5432
   DB_NAME=$DB_NAME
   DB_USER=$DB_USER
   DB_PASSWORD=<sua senha>
5) cd ~/logiwms-pro && chmod +x deploy-ec2.sh && ./deploy-ec2.sh

EOF
