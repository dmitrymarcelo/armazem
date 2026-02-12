# Deploy AWS (EC2 ja existente + RDS)

Fluxo oficial para publicar o LogiWMS quando:
- a instancia EC2 ja foi criada;
- o deploy e manual;
- cada atualizacao usa novo `git clone` (sem `git pull` no script).

## Arquitetura
- Frontend build (`npm run build`) publicado em `/var/www/logiwms` e servido pelo Nginx.
- Backend Node (`api-backend/index.js`) gerenciado por PM2.
- Banco PostgreSQL em RDS.

## 1) Acesso na EC2

```bash
ssh -i <sua-chave.pem> ec2-user@100.27.33.178
```

## 2) Preparacao da maquina (somente primeira vez)

```bash
cd ~/logiwms-pro
chmod +x infra/aws/bootstrap-ec2.sh
sudo ./infra/aws/bootstrap-ec2.sh
```

O script apenas instala dependencias da maquina (Node, Nginx, PM2, rsync).

## 3) Codigo da aplicacao (manual)

Para deploy novo em maquina limpa:

```bash
cd ~
git clone <URL_DO_REPOSITORIO> logiwms-pro
cd logiwms-pro
```

Para atualizacao de versao (sem integracao automatica com GitHub):

```bash
cd ~
rm -rf logiwms-pro
git clone <URL_DO_REPOSITORIO> logiwms-pro
cd logiwms-pro
```

## 4) Configurar backend (.env)

```bash
cp api-backend/.env.production.rds.example api-backend/.env
```

Preencha `api-backend/.env`:

```env
PORT=3001
NODE_ENV=production
DB_HOST=<RDS_ENDPOINT>
DB_PORT=5432
DB_NAME=armazem
DB_USER=<DB_USER>
DB_PASSWORD=<DB_PASSWORD>
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false
JWT_SECRET=<SEGREDO_FORTE>
CORS_ORIGIN=http://100.27.33.178
```

## 5) Executar deploy completo (frontend + backend)

```bash
cd ~/logiwms-pro
chmod +x deploy-ec2.sh
PROJECT_DIR=$PWD ./deploy-ec2.sh
```

Ordem interna do script:
1. `npm ci` (frontend)
2. `npm --prefix api-backend ci`
3. `npm --prefix api-backend run db:health`
4. `npm --prefix api-backend run db:migrate`
5. `npm run build` (frontend)
6. copia `dist/` para `/var/www/logiwms`
7. sobe/reinicia backend no PM2 e recarrega Nginx

## 6) Validacao

```bash
curl http://100.27.33.178
curl http://100.27.33.178/api/health
pm2 status
pm2 logs logiwms-api --lines 100
sudo systemctl status nginx --no-pager
```

## Opcional: frontend-only na EC2

```bash
cd ~/logiwms-pro
chmod +x deploy-ec2-frontend-only.sh
API_UPSTREAM=http://SEU_BACKEND:3001 PROJECT_DIR=$PWD DISABLE_EC2_BACKEND=true ./deploy-ec2-frontend-only.sh
```
