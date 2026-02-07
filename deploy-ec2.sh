#!/bin/bash
# ========================================
# SCRIPT DE DEPLOY - LogiWMS-Pro no EC2
# ========================================
# Execute este script no servidor EC2 (100.27.33.178)

set -e  # Parar em caso de erro

echo "🚀 Iniciando deploy do LogiWMS-Pro..."

# ========================================
# 1. ATUALIZAR CÓDIGO
# ========================================
echo "📥 Atualizando código do GitHub..."
cd ~/logiwms-pro || cd /var/www/logiwms-pro || cd /home/ubuntu/logiwms-pro
git pull origin main

# ========================================
# 2. INSTALAR DEPENDÊNCIAS
# ========================================
echo "📦 Instalando dependências do backend..."
cd api-backend
npm install

echo "📦 Instalando dependências do frontend..."
cd ..
npm install

# ========================================
# 3. EXECUTAR MIGRATION DO BANCO
# ========================================
echo "🗄️  Executando migrations no banco de dados..."
psql -U dmitry -d armazem -f migration.sql

# ========================================
# 4. BUILD DO FRONTEND
# ========================================
echo "🏗️  Fazendo build do frontend..."
npm run build

# ========================================
# 5. COPIAR BUILD PARA NGINX
# ========================================
echo "📋 Copiando build para Nginx..."
sudo cp -r dist/* /var/www/html/

# ========================================
# 6. REINICIAR BACKEND (PM2)
# ========================================
echo "🔄 Reiniciando backend..."
cd api-backend
pm2 restart logiwms-api || pm2 start index.js --name logiwms-api

# ========================================
# 7. REINICIAR NGINX
# ========================================
echo "🔄 Reiniciando Nginx..."
sudo systemctl restart nginx

# ========================================
# 8. VERIFICAR STATUS
# ========================================
echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📊 Status dos serviços:"
pm2 status
echo ""
sudo systemctl status nginx --no-pager
echo ""
echo "🌐 Acesse: http://100.27.33.178"
echo "🔐 Login: admin@nortetech.com / admin"
echo ""
echo "📝 Logs:"
echo "  Backend: pm2 logs logiwms-api"
echo "  Nginx: sudo journalctl -u nginx -f"
