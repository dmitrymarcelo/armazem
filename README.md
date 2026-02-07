<div align="center">
  
  # �Y"� LogiWMS-Pro
  ### Gestão Inteligente de Armazém - Sistema WMS Completo
  
  [![React](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)](https://reactjs.org/)
  [![TypeScript](https://img.shields.io/badge/TypeScript-5.6-3178C6?logo=typescript)](https://www.typescriptlang.org/)
  [![Node.js](https://img.shields.io/badge/Node.js-24.x-339933?logo=node.js)](https://nodejs.org/)
  [![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)
</div>

---

## �Ys? Sobre o Projeto

**LogiWMS-Pro** é um sistema completo de **Warehouse Management System (WMS)** desenvolvido para otimizar operações logísticas em centros de distribuição. Com foco em **usabilidade**, **segurança** e **performance**, o sistema oferece controle total sobre:

- �Y"� **Recebimento de Mercadorias**
- �Y"� **Gestão de Estoque** com classificação ABC
- �Y"" **Movimentações Internas**
- �Y"� **Expedição e Solicitações SA**
- �Y"� **Inventário Cíclico**
- �Y>' **Gestão de Compras** com cotações e aprovações
- �Y"S **Relatórios Analíticos**
- �Y'� **Controle de Usuários e Permissões**

---

## �o� Principais Funcionalidades

### �YZ� Dashboard Inteligente
- KPIs em tempo real (volume, ocupação, alertas)
- Gráficos de produtividade
- Atividades recentes do sistema

### �Y"� Segurança OWASP
- Autenticação server-side
- Sanitização automática de dados
- Proteção contra SQL Injection
- Whitelist de tabelas

### �Y"� Interface Moderna
- Design responsivo (desktop, tablet, mobile)
- Dark mode nativo
- Animações fluidas
- Sidebar colapsável

### �Y"" Persistência Híbrida
- Suporte a PostgreSQL/SQLite
- Fallback automático para JSON
- Sincronização de dados

---

## �Y>�️ Tecnologias Utilizadas

### Frontend
- **React 18.3** - Biblioteca UI
- **TypeScript 5.6** - Tipagem estática
- **Vite** - Build tool ultrarrápido
- **Recharts** - Gráficos e visualizações
- **XLSX** - Importação/exportação Excel

### Backend
- **Node.js 24.x** - Runtime JavaScript
- **Express** - Framework web
- **PostgreSQL** - Banco de dados principal
- **SQLite** - Banco alternativo local

### Segurança
- **OWASP Guard** - Auditoria automática
- **TDD Mastery** - Desenvolvimento orientado a testes
- **Agent Manager** - Otimização de tarefas

---

## �Y"< Pré-requisitos

- **Node.js** >= 18.0.0
- **npm** ou **yarn**
- **PostgreSQL** (opcional - usa JSON como fallback)

---

## �sT️ Instalação

### 1. Clone o repositório
```bash
git clone https://github.com/seu-usuario/logiwms-pro.git
cd logiwms-pro
```

### 2. Instale as dependências

**Frontend:**
```bash
npm install
```

**Backend:**
```bash
cd api-backend
npm install
cd ..
```

### 3. Configure as variáveis de ambiente (opcional)

Crie um arquivo `.env.local` na raiz do projeto:
```env
VITE_API_URL=http://localhost:3001
GEMINI_API_KEY=sua_chave_aqui
```

### 4. Inicie o sistema

**Terminal 1 - Backend:**
```bash
cd api-backend
npm start
```

**Terminal 2 - Frontend:**
```bash
npm run dev
```

### 5. Acesse o sistema
Abra seu navegador em: **http://localhost:3000**

---

## ?? Acesso ao Sistema

- Credenciais locais de teste (seed):
  - `admin@nortetech.com` / `admin`
  - `MATIAS@G.COM` / `matias`
- Usu�rios podem ser ajustados no banco (`users`) ou no fallback JSON (`api-backend/data/users.json`).
- N�o mantenha credenciais padr�o em produ��o.

### Troubleshooting r�pido

- Erro `Failed to fetch` na tela de login:
  - Confirme backend ativo em `http://localhost:3001/health`
  - Reinicie os dois servi�os:
    - Backend: `cd api-backend && npm run dev`
    - Frontend: `npm run dev`

---

## �Y"� Estrutura do Projeto

```
logiwms-pro/
�"o�"?�"? api-backend/          # Backend Node.js + Express
�",   �"o�"?�"? data/            # Dados JSON (fallback)
�",   �"o�"?�"? tests/           # Testes automatizados
�",   �""�"?�"? index.js         # Servidor principal
�"o�"?�"? components/          # Componentes React reutilizáveis
�"o�"?�"? pages/              # Páginas/Módulos do sistema
�"o�"?�"? public/             # Assets estáticos
�"o�"?�"? types.ts            # Definições TypeScript
�"o�"?�"? App.tsx             # Componente principal
�""�"?�"? schema.sql          # Schema do banco de dados

```

---

## ?? Testes

```bash
# Frontend (typecheck)
npm test

# Backend (integra��o + auth + fluxo)
cd api-backend
npm test

# Popular massa Big Data (gera backup autom�tico em api-backend/data-backups/)
npm run seed:bigdata

# Stress test automatizado (login, leitura, escrita e fluxo misto)
npm run test:stress
```

---

## �Ys� Deploy

### Opção 1: Vercel (Frontend) + Railway (Backend)
1. Deploy frontend no Vercel
2. Deploy backend no Railway
3. Configure variáveis de ambiente

### Opção 2: Docker
```bash
docker-compose up -d
```

---

## �Y"� Screenshots

<div align="center">
  <img src="docs/screenshots/dashboard.png" alt="Dashboard" width="45%"/>
  <img src="docs/screenshots/inventory.png" alt="Estoque" width="45%"/>
</div>

---

## �Y�� Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

---

## �Y"� Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## �Y'��?��Y'� Autor

**Norte Tech Solutions**
- Website: [nortetech.com](https://nortetech.com)
- Email: contato@nortetech.com

---

## �YT� Agradecimentos

- [React](https://reactjs.org/)
- [Vite](https://vitejs.dev/)
- [Recharts](https://recharts.org/)
- [OWASP](https://owasp.org/)

---

<div align="center">
  Feito com ❤️ por <strong>Norte Tech</strong>
  
  ⭐ Se este projeto te ajudou, considere dar uma estrela!
</div>



