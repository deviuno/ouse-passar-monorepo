# Instruções do Projeto - Ouse Passar Monorepo

## Supabase Branching (Ambiente Único com Branches)

O projeto usa **Supabase Branching** para gerenciar ambientes de desenvolvimento e produção dentro do mesmo projeto.

### Branch Principal (Produção)
- **Project ID:** `avlttxzppcywybiaxxzd`
- **URL:** https://avlttxzppcywybiaxxzd.supabase.co
- **Branch Git:** `main`
- **Uso:** Banco de dados de produção

### Branch Develop (Desenvolvimento)
- **Project ID:** `dzfjjpdwvotmcpwntprh`
- **URL:** https://dzfjjpdwvotmcpwntprh.supabase.co
- **Branch Git:** `develop`
- **Uso:** Testes e desenvolvimento
- **Parent:** Produção (herda todas as migrations)

> **IMPORTANTE:** O MCP `supabase-prod` está conectado ao projeto principal.
> Ao criar migrations, elas são aplicadas na branch atual e sincronizadas via Git.

## Fluxo de Trabalho com Branching

```
1. DESENVOLVER    → Trabalhar na branch Git `develop`
2. MIGRATION      → Criar migration via MCP (aplica em develop automaticamente)
3. TESTAR         → Testar no ambiente develop (dzfjjpdwvotmcpwntprh)
4. COMMIT/PUSH    → git add + git commit + git push origin develop
5. PR + MERGE     → Criar PR de develop → main
6. AUTO-DEPLOY    → Supabase aplica migrations automaticamente em produção
```

### Vantagens do Branching:
- ✅ Schema sincronizado automaticamente
- ✅ Sem necessidade de aplicar migrations manualmente
- ✅ Ambientes isolados para teste
- ✅ Merge automático ao fazer PR no Git

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
