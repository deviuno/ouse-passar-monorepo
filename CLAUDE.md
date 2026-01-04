# Instruções do Projeto - Ouse Passar Monorepo

## Projeto Supabase (Banco Unificado)

- **Project ID:** `avlttxzppcywybiaxxzd`
- **URL:** https://avlttxzppcywybiaxxzd.supabase.co
- **Uso:** Banco de dados unificado contendo:
  - Tabelas do sistema (users, battery, audio_cache, preparatorios, etc.)
  - Banco de questões (questoes_concurso, assuntos_taxonomia, etc.)
  - Autenticação e storage
- **SEMPRE usar este projeto para migrations e queries MCP**

> **Nota:** O projeto secundário de questões (swzosaapqtyhmwdiwdje) foi descontinuado.
> Todos os dados foram migrados para o projeto principal.

## Estrutura do Monorepo

```
packages/
├── questoes/          # App React (Vite) - Ouse Questões
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── stores/
│   │   └── types/
│   └── ...
├── site/              # Site institucional + Admin Panel
│   ├── pages/
│   ├── components/
│   ├── services/
│   └── supabase/
│       └── migrations/   # Migrations do banco principal
└── mastra/            # Backend de IA (Mastra Agent Server)
```

## Comandos de Desenvolvimento

```bash
# App Questões (porta 5180)
npm run dev:questoes

# Site/Admin (porta 5173)
npm run dev:site

# Mastra Server (porta 4000)
cd packages/mastra && npm run dev
```

## Sistema de Bateria

- Bateria é **POR PREPARATÓRIO** (cada preparatório tem sua própria bateria)
- Usar `preparatorio_id` (da tabela preparatorios) e NÃO `user_trail.id`
- Tipos de ação: `question`, `mission_start`, `chat_message`, `chat_audio`, `chat_podcast`, `chat_summary`, `notebook_create`, `practice_session`

## URLs de API

As URLs do Mastra devem usar operador ternário para fallback correto:
```typescript
// CORRETO
const API_URL = import.meta.env.VITE_MASTRA_URL
  ? `${import.meta.env.VITE_MASTRA_URL}/api/endpoint`
  : 'http://localhost:4000/api/endpoint';

// INCORRETO (template literal sempre gera string, mesmo com undefined)
const API_URL = `${import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000'}/api/endpoint`;
```

## Cores do Sistema

- Amarelo principal: `#FFB800`
- Amarelo hover: `#FFC933`
- Background escuro: `#1A1A1A`, `#121212`
- Cinza bordas: `#3A3A3A`, `#4A4A4A`
- Texto: `#E0E0E0`, `#A0A0A0`, `#6E6E6E`

## Deploy para Produção

### Deploy do Mastra (VPS)
Use o comando `/deploy-mastra` para fazer deploy automático do backend Mastra.

**VPS Details:**
- Host: `72.61.217.225`
- User: `root`
- Service: PM2 process "mastra"

**Comando manual (se necessário):**
```bash
ssh root@72.61.217.225 "cd /root/ouse-passar-monorepo && git stash && git pull origin main && cd packages/mastra && npm install && npm run build && pm2 restart mastra && pm2 status"
```
