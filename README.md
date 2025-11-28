# Ouse Passar - Monorepo

Este monorepo contém todos os projetos do Ouse Passar.

## Estrutura

```
ouse-passar-monorepo/
├── packages/
│   ├── questoes/     # App de questões (PWA)
│   ├── site/         # Site institucional + Admin Panel
│   └── shared/       # Tipos e utilitários compartilhados
├── package.json      # Configuração do workspace
└── README.md
```

## Requisitos

- Node.js >= 18.0.0
- npm >= 9.0.0

## Instalação

```bash
# Na raiz do monorepo
npm install
```

## Desenvolvimento

```bash
# Rodar app de questões
npm run dev:questoes

# Rodar site/admin
npm run dev:site
```

## Build

```bash
# Build de todos os packages
npm run build

# Build individual
npm run build:questoes
npm run build:site
```

## Packages

### @ouse/questoes
App PWA de questões para estudantes.
- React + Vite
- Supabase (backend)
- Sistema de gamificação

### @ouse/site
Site institucional e painel administrativo.
- React + Vite + React Router
- Supabase (backend)
- Blog com IA
- Admin Panel

### @ouse/shared
Tipos e utilitários compartilhados entre os packages.
- Tipos de gamificação
- Configuração Supabase compartilhada

## Variáveis de Ambiente

Cada package tem seu próprio arquivo `.env`:
- `packages/questoes/.env`
- `packages/site/.env.local`

Copie os arquivos `.env.example` correspondentes.
