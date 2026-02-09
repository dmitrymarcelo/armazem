# Arquitetura Híbrida: Backend Local + Frontend no EC2

Este guia deixa o sistema no modelo:
- Frontend publicado no EC2 (Nginx)
- Backend + PostgreSQL rodando localmente

## 1) Preparar backend local com PostgreSQL

No seu computador (raiz do projeto):

```powershell
npm run local:backend:setup
```

O script:
- sobe `docker compose up -d db`
- prepara `api-backend/.env`
- aplica migração
- valida conexão com PostgreSQL local

Depois, inicie a API local:

```powershell
npm --prefix api-backend run dev
```

## 2) Permitir chamadas do frontend EC2 no backend local

No `api-backend/.env`, mantenha `CORS_ORIGIN` com:

```env
CORS_ORIGIN=http://localhost:3000,http://3.83.164.82
```

Se usar domínio no EC2, adicione também o domínio.

## 3) Publicar somente frontend no EC2

Na EC2:

```bash
cd ~/logiwms-pro
chmod +x deploy-ec2-frontend-only.sh
API_UPSTREAM=http://127.0.0.1:3001 ./deploy-ec2-frontend-only.sh
```

## 4) Trocar API do EC2 para backend local

Para o frontend em EC2 chamar seu backend local, você precisa expor sua API local com URL pública
(ex.: IP público + port-forward, túnel corporativo, Cloudflare Tunnel, etc.).

Depois, rode na EC2:

```bash
cd ~/logiwms-pro
API_UPSTREAM=http://SEU_BACKEND_PUBLICO:3001 ./deploy-ec2-frontend-only.sh
```

Opcional para desligar backend da EC2:

```bash
API_UPSTREAM=http://SEU_BACKEND_PUBLICO:3001 DISABLE_EC2_BACKEND=true ./deploy-ec2-frontend-only.sh
```

## 5) Checklist de validação

- Frontend: `http://3.83.164.82`
- Health API local: `http://localhost:3001/health`
- Login no frontend EC2 funcionando
- Criação de item no Cadastro Geral funcionando
