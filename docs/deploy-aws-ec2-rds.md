# Deploy AWS (EC2 + RDS)

Guia rapido para publicar o LogiWMS em producao com EC2 para app e RDS para banco.

## Pre requisitos
- Conta AWS com acesso a `EC2`, `RDS`, `VPC`, `SSM`.
- Key Pair EC2 ja criado (arquivo `.pem`).
- Regiao sugerida: `us-east-1`.

## 1) Provisionar infraestrutura
No AWS CloudShell (na mesma conta/regiao):

```bash
git clone https://github.com/dmitrymarcelo/armazem.git
cd armazem
chmod +x infra/aws/provision-ec2-rds.sh
KEY_NAME=<seu-keypair> DB_PASSWORD='<senha-forte>' ./infra/aws/provision-ec2-rds.sh
```

Saida esperada:
- `EC2 PublicIP`
- `RDS Endpoint`

## 2) Configurar e publicar na EC2
No seu computador local:

```bash
ssh -i <seu-key.pem> ec2-user@<EC2_PUBLIC_IP>
```

Na EC2:

```bash
git clone https://github.com/dmitrymarcelo/armazem.git ~/logiwms-pro
cp ~/logiwms-pro/api-backend/.env.production.rds.example ~/logiwms-pro/api-backend/.env
nano ~/logiwms-pro/api-backend/.env
```

Ajuste no `.env`:
- `DB_HOST=<RDS_ENDPOINT>`
- `DB_PASSWORD=<DB_PASSWORD>`
- `CORS_ORIGIN=http://<EC2_PUBLIC_IP>`
- `JWT_SECRET=<segredo-forte>`

Depois:

```bash
cd ~/logiwms-pro
chmod +x deploy-ec2.sh
./deploy-ec2.sh
```

## 3) Validar
- Frontend: `http://<EC2_PUBLIC_IP>`
- Health: `http://<EC2_PUBLIC_IP>/api/health`
- PM2: `pm2 status`
- Nginx: `sudo systemctl status nginx`

## 4) Producao recomendada
- Trocar IP por dominio + HTTPS (ALB + ACM ou Nginx + Certbot).
- Restringir `SSH 22` ao seu IP.
- Nunca commitar `.env`.
- Ativar backup automatico do RDS.
- Configurar CloudWatch alarms (CPU, memoria, conexoes DB).
