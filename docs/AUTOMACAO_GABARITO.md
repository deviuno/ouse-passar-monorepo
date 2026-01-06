"# Automacao Hibrida de Extracao de Gabarito

## Resumo

Sistema automatizado para extrair gabaritos de questoes de concurso a partir dos comentarios/explicacoes, usando uma abordagem hibrida:

1. **Trigger PostgreSQL (Regex)** - Tenta padroes conhecidos instantaneamente
2. **Mastra Agent (IA)** - Usa Gemini para casos que o regex nao consegue resolver

---

## Status Atual (03/01/2026)

### Progresso Concluido

- [x] Trigger PostgreSQL criado e funcionando
- [x] Tabela `questoes_pendentes_ia` criada para fila de processamento
- [x] Colunas de auditoria adicionadas (`gabarito_auto_extraido`, `gabarito_metodo`)
- [x] Agente Mastra `gabaritoExtractorAgent` implementado
- [x] Endpoints de API criados e deployados
- [x] Primeiro batch de 1000 questoes processado

### Resultados do Primeiro Processamento

| Metrica | Valor |
|---------|-------|
| Total processadas | 1000 |
| Questoes recuperadas | **306** (30.6%) |
| Sem gabarito no comentario | 694 |

**306 questoes foram reativadas com gabarito extraido por IA!**

### Pendente

- [ ] Configurar MCP para banco de questoes (ja adicionado em `.mcp.json`, precisa reiniciar Claude Code)
- [ ] Processar restante das questoes inativas (existem mais alem das 1000 ja processadas)
- [ ] Possivelmente ajustar padroes regex para melhorar taxa de sucesso

---

## Arquitetura

```
Nova questao INSERT/UPDATE
         |
         v
+----------------------------------+
|   Trigger PostgreSQL (Regex)    |
|   - Tenta padroes conhecidos    |
|   - ~1ms de execucao            |
+----------------------------------+
         |
    Encontrou?
    /        \
  SIM        NAO
   |          |
+-------+  +-----------------------------+
| Salva |  | Insere na fila de           |
| gab.  |  | processamento por IA        |
| ativo |  | (tabela: questoes_pendentes)|
+-------+  +-----------------------------+
                    |
          +--------------------------+
          |  Mastra Agent (Async)    |
          |  - Gemini analisa coment.|
          |  - Endpoint: /api/questao|
          |    /extrair-gabarito     |
          +--------------------------+
                    |
               Encontrou?
               /        \
             SIM        NAO
              |          |
        +-------+  +-------+
        | Salva |  | ativo |
        | gab.  |  |  = 0  |
        | ativo |  +-------+
        +-------+
```

---

## Arquivos Criados/Modificados

### Banco de Dados (swzosaapqtyhmwdiwdje)

```sql
-- Tabela de fila
CREATE TABLE questoes_pendentes_ia (
    id SERIAL PRIMARY KEY,
    questao_id INTEGER NOT NULL UNIQUE,
    tentativas INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pendente', -- pendente, processando, concluido, falha
    erro TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Colunas de auditoria em questoes_concurso
ALTER TABLE questoes_concurso
ADD COLUMN gabarito_auto_extraido BOOLEAN DEFAULT false,
ADD COLUMN gabarito_metodo TEXT; -- 'regex' ou 'ia'
```

### Mastra Agent

**Arquivo:** `packages/mastra/src/mastra/agents/gabaritoExtractorAgent.ts`

```typescript
export const gabaritoExtractorAgent = new Agent({
    name: "GabaritoExtractorAgent",
    instructions: `...`, // Instrucoes para extrair gabarito
    model: google("gemini-2.0-flash"),
});
```

### Endpoints da API (packages/mastra/src/server.ts)

1. `GET /api/questoes/fila-gabaritos/status` - Status da fila
2. `POST /api/questao/extrair-gabarito` - Extrai gabarito de uma questao
3. `POST /api/questoes/processar-fila-gabaritos` - Processa fila em batch

---

## Como Usar

### Verificar Status da Fila

```bash
curl https://mastra.ousepassar.com.br/api/questoes/fila-gabaritos/status
```

Resposta:
```json
{
  "success": true,
  "total": 1000,
  "pendente": 0,
  "processando": 0,
  "concluido": 306,
  "falha": 694
}
```

### Processar Fila

```bash
curl -X POST https://mastra.ousepassar.com.br/api/questoes/processar-fila-gabaritos \
  -H "Content-Type: application/json" \
  -d '{"limite": 50}'
```

### Enfileirar Questoes Inativas (via SQL)

```sql
INSERT INTO questoes_pendentes_ia (questao_id, status, tentativas)
SELECT id, 'pendente', 0
FROM questoes_concurso
WHERE ativo = false
  AND comentario IS NOT NULL
  AND comentario != ''
  AND (gabarito IS NULL OR gabarito = '')
ON CONFLICT (questao_id) DO UPDATE SET
    status = 'pendente',
    tentativas = 0,
    erro = NULL;
```

---

## Configuracao MCP

O arquivo `.mcp.json` foi atualizado para incluir o banco de questoes:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=avlttxzppcywybiaxxzd",
      "headers": {
        "Authorization": "Bearer sbp_..."
      }
    },
    "supabase-questoes": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp?project_ref=swzosaapqtyhmwdiwdje",
      "headers": {
        "Authorization": "Bearer sbp_..."
      }
    }
  }
}
```

**IMPORTANTE:** Apos reiniciar o Claude Code, o MCP `supabase-questoes` estara disponivel para executar SQL diretamente no banco de questoes.

---

## Proximos Passos

1. **Reiniciar Claude Code** para carregar o novo MCP
2. **Contar questoes inativas restantes** (usar MCP supabase-questoes)
3. **Enfileirar todas as questoes inativas** via SQL direto (muito mais rapido)
4. **Processar em batches** ou usar SQL para aplicar regex em bulk primeiro

---

## Instrucoes para Uso do MCP (Apos Reiniciar)

### Verificar se o MCP esta funcionando

Apos reiniciar o Claude Code, peca para executar:

```
Use o MCP supabase-questoes para listar as tabelas do banco de questoes
```

Isso deve retornar a lista de tabelas incluindo `questoes_concurso` e `questoes_pendentes_ia`.

### Comandos SQL via MCP

O Claude Code tera acesso a duas ferramentas MCP do Supabase:

1. **mcp__supabase__*** - Banco principal (app, usuarios)
2. **mcp__supabase-questoes__*** - Banco de questoes

Para executar SQL no banco de questoes, peca:

```
Execute no banco de questoes (supabase-questoes):
SELECT COUNT(*) FROM questoes_concurso WHERE ativo = false;
```

### Enfileirar Questoes Inativas (SQL Direto)

```
Execute no banco de questoes:

INSERT INTO questoes_pendentes_ia (questao_id, status, tentativas)
SELECT id, 'pendente', 0
FROM questoes_concurso
WHERE ativo = false
  AND comentario IS NOT NULL
  AND comentario != ''
  AND (gabarito IS NULL OR gabarito = '')
  AND id NOT IN (SELECT questao_id FROM questoes_pendentes_ia)
LIMIT 5000;
```

### Verificar Status da Fila

```
Execute no banco de questoes:

SELECT status, COUNT(*) as total
FROM questoes_pendentes_ia
GROUP BY status;
```

### Aplicar Regex em Bulk (Mais Rapido que IA)

Para extrair gabaritos via regex diretamente no banco (sem usar IA):

```sql
-- Padrao 1: "Gabarito: Letra X" ou "Gabarito: X"
UPDATE questoes_concurso
SET
    gabarito = UPPER(substring(comentario FROM '(?i)gabarito\s*[;:]?\s*(?:letra\s*)?([A-Ea-e])')),
    ativo = true,
    gabarito_auto_extraido = true,
    gabarito_metodo = 'regex'
WHERE ativo = false
  AND gabarito IS NULL
  AND comentario ~* 'gabarito\s*[;:]?\s*(?:letra\s*)?[A-Ea-e]';

-- Padrao 2: "Resposta: X" ou "Resposta correta: X"
UPDATE questoes_concurso
SET
    gabarito = UPPER(substring(comentario FROM '(?i)resposta\s*(?:correta)?\s*[:\-]?\s*(?:letra\s*)?([A-Ea-e])')),
    ativo = true,
    gabarito_auto_extraido = true,
    gabarito_metodo = 'regex'
WHERE ativo = false
  AND gabarito IS NULL
  AND comentario ~* 'resposta\s*(?:correta)?\s*[:\-]?\s*(?:letra\s*)?[A-Ea-e]';

-- Padrao 3: CESPE "ITEM CERTO" / "ITEM ERRADO"
UPDATE questoes_concurso
SET
    gabarito = 'C',
    ativo = true,
    gabarito_auto_extraido = true,
    gabarito_metodo = 'regex'
WHERE ativo = false
  AND gabarito IS NULL
  AND comentario ~* 'ITEM\s+CERTO';

UPDATE questoes_concurso
SET
    gabarito = 'E',
    ativo = true,
    gabarito_auto_extraido = true,
    gabarito_metodo = 'regex'
WHERE ativo = false
  AND gabarito IS NULL
  AND comentario ~* 'ITEM\s+ERRADO';
```

### Processar Fila via API

Apos enfileirar, processar via Mastra:

```bash
# No VPS ou via curl
curl -X POST https://mastra.ousepassar.com.br/api/questoes/processar-fila-gabaritos \
  -H "Content-Type: application/json" \
  -d '{"limite": 100}'
```

### Limpar Fila de Falhas (para reprocessar)

```sql
-- Resetar falhas para pendente
UPDATE questoes_pendentes_ia
SET status = 'pendente', tentativas = 0, erro = NULL
WHERE status = 'falha';

-- Ou deletar falhas definitivas
DELETE FROM questoes_pendentes_ia WHERE status = 'falha';
```

---

## Bancos de Dados

| Projeto | ID | Uso |
|---------|-----|-----|
| Principal (App) | avlttxzppcywybiaxxzd | Auth, usuarios, preparatorios |
| Questoes | swzosaapqtyhmwdiwdje | Banco de questoes de concurso |

**VPS Mastra:**
- Host: 72.61.217.225
- Servico: PM2 process "mastra"
- Porta: 4000

---

## Observacoes

- Taxa de sucesso da IA: ~30% (muitos comentarios nao mencionam o gabarito)
- Questoes com falha sao marcadas como `ativo = false`
- Questoes recuperadas tem `gabarito_auto_extraido = true` e `gabarito_metodo = 'ia'`
- O campo `erro` na fila contem o motivo da falha (ex: "Confianca baixa: 0.3")
