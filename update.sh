#!/usr/bin/env bash
set -euo pipefail

# Unified update script for EC2 (manual clone strategy).
# Always refreshes code via new git clone before deploy.

REPO_URL="${REPO_URL:-https://github.com/dmitrymarcelo/armazem.git}"
PROJECT_DIR="${PROJECT_DIR:-$HOME/logiwms-pro}"
PROJECT_PARENT_DIR="$(dirname "$PROJECT_DIR")"
PERSISTED_ENV_FILE="${PERSISTED_ENV_FILE:-$HOME/.config/logiwms/api-backend.env}"
PUBLIC_IP="${PUBLIC_IP:-100.27.33.178}"
RUN_BOOTSTRAP="${RUN_BOOTSTRAP:-false}"

DB_HOST="${DB_HOST:-}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-armazem}"
DB_USER="${DB_USER:-dmitry}"
DB_PASSWORD="${DB_PASSWORD:-dmitry}"
DB_SSL="${DB_SSL:-true}"
DB_SSL_REJECT_UNAUTHORIZED="${DB_SSL_REJECT_UNAUTHORIZED:-false}"
JWT_SECRET="${JWT_SECRET:-}"
JWT_EXPIRES_IN="${JWT_EXPIRES_IN:-8h}"

if ! command -v git >/dev/null 2>&1; then
  echo "git nao encontrado. Rode primeiro: sudo ./infra/aws/bootstrap-ec2.sh"
  exit 1
fi

if [[ -d "$PROJECT_DIR" && -f "$PROJECT_DIR/api-backend/.env" ]]; then
  echo "[backup] Salvando env existente em $PERSISTED_ENV_FILE"
  mkdir -p "$(dirname "$PERSISTED_ENV_FILE")"
  cp "$PROJECT_DIR/api-backend/.env" "$PERSISTED_ENV_FILE"
fi

echo "[1/6] Atualizando codigo via novo clone"
rm -rf "$PROJECT_DIR"
mkdir -p "$PROJECT_PARENT_DIR"
git clone "$REPO_URL" "$PROJECT_DIR"

if [[ "$RUN_BOOTSTRAP" == "true" ]]; then
  echo "[2/6] Bootstrap de dependencias da instancia"
  chmod +x "$PROJECT_DIR/infra/aws/bootstrap-ec2.sh"
  sudo "$PROJECT_DIR/infra/aws/bootstrap-ec2.sh"
else
  echo "[2/6] Bootstrap ignorado (RUN_BOOTSTRAP=false)"
fi

if [[ ! -f "$PERSISTED_ENV_FILE" ]]; then
  if [[ -z "$DB_HOST" ]]; then
    echo "DB_HOST nao definido e $PERSISTED_ENV_FILE nao existe."
    echo "Defina DB_HOST e JWT_SECRET para gerar o arquivo de ambiente na primeira execucao."
    echo "Exemplo:"
    echo "DB_HOST=<rds-endpoint> JWT_SECRET='<segredo-forte>' ./update.sh"
    exit 1
  fi

  if [[ -z "$JWT_SECRET" ]]; then
    echo "JWT_SECRET nao definido para primeira execucao."
    echo "Exemplo:"
    echo "DB_HOST=<rds-endpoint> JWT_SECRET='<segredo-forte>' ./update.sh"
    exit 1
  fi

  echo "[3/6] Criando env persistente em $PERSISTED_ENV_FILE"
  mkdir -p "$(dirname "$PERSISTED_ENV_FILE")"
  cat > "$PERSISTED_ENV_FILE" <<EOF
PORT=3001
NODE_ENV=production
DB_HOST=$DB_HOST
DB_PORT=$DB_PORT
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
DB_SSL=$DB_SSL
DB_SSL_REJECT_UNAUTHORIZED=$DB_SSL_REJECT_UNAUTHORIZED
JWT_SECRET=$JWT_SECRET
JWT_EXPIRES_IN=$JWT_EXPIRES_IN
CORS_ORIGIN=http://$PUBLIC_IP
EOF
else
  echo "[3/6] Reutilizando env persistente: $PERSISTED_ENV_FILE"
fi

echo "[4/6] Aplicando env no backend"
cp "$PERSISTED_ENV_FILE" "$PROJECT_DIR/api-backend/.env"

echo "[5/6] Executando deploy completo"
chmod +x "$PROJECT_DIR/deploy-ec2.sh"
PROJECT_DIR="$PROJECT_DIR" "$PROJECT_DIR/deploy-ec2.sh"

echo "[6/6] Validacao rapida"
curl -fsS "http://$PUBLIC_IP/api/health" >/dev/null || {
  echo "Aviso: healthcheck externo falhou. Verifique SG/firewall ou DNS."
}

echo
echo "Atualizacao concluida."
echo "Frontend: http://$PUBLIC_IP"
echo "Backend health: http://$PUBLIC_IP/api/health"
