# Planejamento: Migração do Sistema de Scraping n8n para Mastra

## Visão Geral do Sistema Atual (n8n)

O sistema atual consiste em **6 workflows n8n** interconectados:

| Workflow | Função Principal |
|----------|------------------|
| `salva questões` | Recebe questões via webhook e salva no Supabase |
| `SALVA IMAGENS NO SUPABASE` | Baixa imagens externas e salva no Storage |
| `REFAZ COMENTARIO` | IA (Gemini/GPT) gera gabarito e comentários |
| `Dashboard TEC Scraper` | Dashboard de monitoramento em tempo real |
| `CONSULTAR IDS` | API para listar IDs existentes |
| `TESTE EXIBIÇÃO` | Interface web para visualizar questões |

---

## Arquitetura Implementada com Mastra

```
packages/mastra/src/
├── server.ts                      # Express server principal
├── mastra/
│   ├── agents/
│   │   └── questionReviewerAgent.ts   # Agente de IA para revisar questões
│   ├── tools/
│   │   ├── imageAnalyzerTool.ts       # Tool para analisar imagens
│   │   └── supabaseUpdateTool.ts      # Tool para atualizar Supabase
│   └── index.ts
├── routes/
│   ├── scraper.ts                 # Rotas de API do scraper
│   └── dashboard.ts               # Rotas do dashboard
├── services/
│   ├── questionService.ts         # Lógica de negócio de questões
│   ├── imageService.ts            # Lógica de processamento de imagens
│   └── statsService.ts            # Lógica de estatísticas
└── cron/
    ├── imageProcessor.ts          # Job agendado para processar imagens
    └── questionReviewer.ts        # Job agendado para revisar questões
```

---

## Endpoints Implementados

### Scraper API
- `POST /api/scraper/questoes` - Recebe questões do scraper externo
- `GET /api/scraper/ids` - Lista todos os IDs de questões existentes
- `GET /api/scraper/questao/:id` - Busca questão por ID

### Dashboard API
- `GET /api/dashboard/stats` - Estatísticas em tempo real

### Cron Jobs
- **Image Processor**: A cada 2 minutos, processa imagens pendentes
- **Question Reviewer**: A cada 10 minutos, revisa questões com IA

---

## Configuração

### Variáveis de Ambiente
```env
# Supabase - Banco de Questões
SUPABASE_QUESTOES_URL=https://jvlbnetrpfbolqfgswhe.supabase.co
SUPABASE_QUESTOES_ANON_KEY=...
SUPABASE_QUESTOES_SERVICE_KEY=...

# Google AI (Gemini)
GOOGLE_API_KEY=...

# OpenAI (alternativo)
OPENAI_API_KEY=...
```

---

## Status de Implementação

- [x] Fase 1: Infraestrutura Base
- [x] Fase 2: Endpoint de Recebimento de Questões
- [x] Fase 3: Processamento de Imagens
- [x] Fase 4: Agente de Revisão com IA
- [x] Fase 5: Dashboard de Monitoramento
- [x] Fase 6: APIs Auxiliares
- [x] Fase 7: Integração com Cron Jobs
- [x] Fase 8: Testes e Documentação
