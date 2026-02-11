# Deploy AWS (EC2 existente + RDS existente)

Guia rapido para publicar o LogiWMS com:
- Frontend: Nginx na EC2
- Backend: PM2 na mesma EC2
- Banco: RDS PostgreSQL

## Premissas
- A EC2 ja existe e esta acessivel.
- O `git clone` sera manual em cada atualizacao (sem `git pull` no deploy).
- Exemplo de IP publico da EC2: `100.27.33.178`.

## 1) Acessar a EC2

```bash
ssh -i <seu-key.pem> ec2-user@100.27.33.178
```

## 2) Bootstrap da instancia (primeira vez)

Na raiz do repositorio clonado na EC2:

```bash
chmod +x infra/aws/bootstrap-ec2.sh
sudo ./infra/aws/bootstrap-ec2.sh
```

Esse script instala Node.js, Nginx, PM2 e prepara `/var/www/logiwms`.

## 3) Clonar o projeto (manual)

```bash
cd ~
rm -rf logiwms-pro
git clone https://github.com/dmitrymarcelo/armazem.git logiwms-pro
cd logiwms-pro
```

## 4) Configurar backend para RDS

```bash
cp api-backend/.env.production.rds.example api-backend/.env
```

Edite `api-backend/.env` com os dados do seu RDS:

```env
PORT=3001
NODE_ENV=production
DB_HOST=<RDS_ENDPOINT>
DB_PORT=5432
DB_NAME=armazem
DB_USER=dmitry
DB_PASSWORD=dmitry
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
JWT_SECRET=<segredo-forte-com-32+-caracteres>
CORS_ORIGIN=http://100.27.33.178
```

## 5) Deploy completo (frontend + backend)

```bash
chmod +x deploy-ec2.sh
PROJECT_DIR=$PWD ./deploy-ec2.sh
```

Ordem executada pelo script:
1. `npm ci` (raiz)
2. `npm --prefix api-backend ci`
3. `npm --prefix api-backend run db:health`
4. `npm --prefix api-backend run db:migrate`
5. `npm run build` (frontend)
6. publica `dist` em `/var/www/logiwms`
7. reinicia PM2 e Nginx

## 6) Validacao

```bash
curl http://100.27.33.178
curl http://100.27.33.178/api/health
pm2 status
pm2 logs logiwms-api --lines 100
sudo systemctl status nginx --no-pager
```

## Atualizacao de versao (sem git pull)

Sempre que atualizar:
1. `rm -rf ~/logiwms-pro`
2. `git clone ... ~/logiwms-pro`
3. copiar novamente `api-backend/.env`
4. executar `PROJECT_DIR=$PWD ./deploy-ec2.sh`

## Opcional: frontend-only no EC2

```bash
cd ~/logiwms-pro
chmod +x deploy-ec2-frontend-only.sh
API_UPSTREAM=http://SEU_BACKEND_PUBLICO:3001 PROJECT_DIR=$PWD DISABLE_EC2_BACKEND=true ./deploy-ec2-frontend-only.sh
```
