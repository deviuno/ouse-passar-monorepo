# Configuração de Ambiente Staging - Ouse Passar

**Data:** 2026-01-07
**Status:** Configuração concluída, aguardando reinício do Claude Code

---

## Resumo

Configuramos um ambiente de **staging (teste)** separado do ambiente de **produção** para permitir desenvolvimento seguro sem afetar o sistema em produção.

---

## Projetos Supabase

| Ambiente | Project ID | URL | Uso |
|----------|------------|-----|-----|
| **Produção** | `avlttxzppcywybiaxxzd` | https://avlttxzppcywybiaxxzd.supabase.co | Sistema em produção |
| **Staging** | `dtkkyhtyiilnomfxihvx` | https://dtkkyhtyiilnomfxihvx.supabase.co | Desenvolvimento/testes |

---

## Configuração MCP (`.mcp.json`)

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=dtkkyhtyiilnomfxihvx",
      "headers": {
        "Authorization": "Bearer sbp_194a2141ca8405a6d3252eedad2a02ea70aecc4e"
      }
    },
    "supabase-prod": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=avlttxzppcywybiaxxzd",
      "headers": {
        "Authorization": "Bearer sbp_194a2141ca8405a6d3252eedad2a02ea70aecc4e"
      }
    }
  }
}
```

**Mapeamento:**
- `mcp__supabase__*` → Staging (desenvolvimento diário)
- `mcp__supabase-prod__*` → Produção (apenas consultas/emergências)

---

## Fluxo de Trabalho

```
┌─────────────────────────────────────────────────────────────────┐
│                    FLUXO TESTE → PRODUÇÃO                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   1. DESENVOLVER (branch: develop)                               │
│      └── Usar mcp__supabase__apply_migration                     │
│      └── Migrations vão para STAGING (dtkkyhtyiilnomfxihvx)      │
│                                                                  │
│   2. TESTAR                                                      │
│      └── Verificar funcionamento em staging                      │
│      └── Testar no frontend com variáveis de staging             │
│                                                                  │
│   3. COMMIT & PUSH                                               │
│      └── git add + git commit + git push origin develop          │
│                                                                  │
│   4. MERGE (quando aprovado)                                     │
│      └── PR de develop → main                                    │
│      └── Revisão de código                                       │
│                                                                  │
│   5. DEPLOY PRODUÇÃO                                             │
│      └── Aplicar migrations em produção manualmente:             │
│          - Via CLI: supabase db push --project-ref avlttxzppcywybiaxxzd
│          - Via Dashboard: SQL Editor → colar → executar          │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## Por que Staging Separado?

| Cenário | Mesmo Banco | Banco Separado |
|---------|-------------|----------------|
| Mudança no frontend | ✅ Seguro | ✅ Seguro |
| Nova coluna | ✅ Seguro | ✅ Seguro |
| **DROP TABLE** | ❌ QUEBRA PRODUÇÃO | ✅ Seguro |
| **Refatorar schema** | ❌ QUEBRA PRODUÇÃO | ✅ Seguro |
| Testar migration | ❌ Impossível | ✅ Seguro |

---

## Configuração Vercel (Pendente)

Para deploy separado na Vercel, configurar variáveis por branch:

| Variável | Production (main) | Preview (develop) |
|----------|-------------------|-------------------|
| `VITE_SUPABASE_URL` | `https://avlttxzppcywybiaxxzd.supabase.co` | `https://dtkkyhtyiilnomfxihvx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | (key produção) | (key staging) |

---

## Tarefas Pendentes

### Imediatas (após reinício do Claude Code)
- [ ] Testar conexão MCP com staging (`mcp__supabase__list_tables`)
- [ ] Aplicar migrations no projeto staging (banco está vazio)

### Futuras
- [ ] Configurar variáveis de ambiente na Vercel por branch
- [ ] Configurar Mastra staging (opcional - porta 4001 na VPS)
- [ ] Criar GitHub Action para deploy automático de migrations

---

## Comandos Úteis

### Testar conexão com staging
```
mcp__supabase__list_tables
```

### Aplicar migrations no staging via CLI
```bash
cd packages/site
supabase link --project-ref dtkkyhtyiilnomfxihvx
supabase db push
```

### Aplicar migrations em produção via CLI
```bash
supabase link --project-ref avlttxzppcywybiaxxzd
supabase db push
```

---

## Histórico de Commits

1. `3a56188` - feat: enhance question generator filters and add AI-generated indicator
2. `06964a0` - chore: configure staging environment for development

---

## Contexto Anterior (para referência)

Antes desta configuração, trabalhamos em:
1. **Taxonomia de assuntos** - Mapeamento completo de 136 matérias (82% dos assuntos mapeados)
2. **Página Gerar Questões** - Adicionado campo "Questão Original" e filtros usando RPC com cache

---

*Última atualização: 2026-01-07*
