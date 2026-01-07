# Instruções do Projeto - Ouse Passar Monorepo

## Projetos Supabase

### Produção (Principal)
- **Project ID:** `avlttxzppcywybiaxxzd`
- **URL:** https://avlttxzppcywybiaxxzd.supabase.co
- **Branch Git:** `main`
- **Uso:** Banco de dados de produção

### Staging (Desenvolvimento)
- **Project ID:** `dtkkyhtyiilnomfxihvx`
- **URL:** https://dtkkyhtyiilnomfxihvx.supabase.co
- **Branch Git:** `develop`
- **Uso:** Banco de dados para testes e desenvolvimento
- **MCP conectado aqui para desenvolvimento**

> **IMPORTANTE:** O MCP deve estar conectado ao projeto de **STAGING** para desenvolvimento.
> Migrations testadas em staging devem ser aplicadas manualmente em produção.

## Fluxo de Trabalho (Teste → Produção)

```
1. DESENVOLVER    → MCP cria migration em STAGING (dtkkyhtyiilnomfxihvx)
2. TESTAR         → Verificar funcionamento em staging
3. COMMIT         → git add + git commit na branch develop
4. MERGE          → PR de develop → main
5. DEPLOY PROD    → Aplicar migration em PRODUÇÃO (avlttxzppcywybiaxxzd)
```

### Para aplicar migrations em produção:
```bash
# Via Supabase CLI
supabase link --project-ref avlttxzppcywybiaxxzd
supabase db push

# Ou via Dashboard: SQL Editor → colar migration → executar
```

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
