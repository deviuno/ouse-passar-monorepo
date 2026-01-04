# Plano: Interface Admin para TecConcursos Scraper

## Resumo
Criar interface administrativa para gerenciar o scraper do TecConcursos, incluindo gestão de contas, cadernos, progresso em tempo real, e logs.

## Decisões do Usuário
- **Cookies:** Campo de texto simples (colar JSON)
- **Vinculação:** Conta ativa global (não por caderno)
- **Atualização:** Tempo real a cada 5 segundos
- **Fila:** Sim, processar cadernos em sequência automaticamente

## Arquitetura

### Localização no Admin
- **Página:** Settings.tsx (`packages/site/pages/admin/Settings.tsx`)
- **Nova Categoria:** `scraping` no sidebar vertical
- **Abas Horizontais:** Cadernos | Contas

---

## Fase 1: Banco de Dados (Migrations)

### Tabela: `tec_accounts` (Contas do TecConcursos)
```sql
CREATE TABLE tec_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email VARCHAR(255) NOT NULL,
  password TEXT, -- Opcional, pode usar só cookies
  cookies JSONB,
  is_active BOOLEAN DEFAULT true, -- Conta ativa global (apenas uma por vez)
  last_login_check TIMESTAMPTZ,
  login_status VARCHAR(50) DEFAULT 'unknown', -- 'valid', 'invalid', 'expired', 'unknown'
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `tec_cadernos` (Cadernos para Extração)
```sql
CREATE TABLE tec_cadernos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  url VARCHAR(500) NOT NULL UNIQUE,
  total_questions INTEGER DEFAULT 0,
  collected_questions INTEGER DEFAULT 0,
  new_questions INTEGER DEFAULT 0, -- Questões novas (não existiam no banco)
  status VARCHAR(50) DEFAULT 'queued', -- 'queued', 'running', 'paused', 'completed', 'error'
  priority INTEGER DEFAULT 0, -- Para ordenar a fila (maior = mais prioritário)
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Tabela: `tec_scraping_logs` (Logs de Execução)
```sql
CREATE TABLE tec_scraping_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  caderno_id UUID REFERENCES tec_cadernos(id) ON DELETE CASCADE,
  log_type VARCHAR(50) NOT NULL, -- 'info', 'warning', 'error', 'success'
  message TEXT NOT NULL,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para busca rápida de logs por caderno
CREATE INDEX idx_tec_logs_caderno ON tec_scraping_logs(caderno_id, created_at DESC);
```

---

## Fase 2: API Backend (Mastra)

### Novos Endpoints

#### Contas
- `GET /api/tec-scraper/accounts` - Listar contas
- `POST /api/tec-scraper/accounts` - Adicionar conta
- `PUT /api/tec-scraper/accounts/:id` - Atualizar conta
- `DELETE /api/tec-scraper/accounts/:id` - Remover conta
- `POST /api/tec-scraper/accounts/:id/test-login` - Testar login da conta
- `POST /api/tec-scraper/accounts/:id/import-cookies` - Importar cookies

#### Cadernos
- `GET /api/tec-scraper/cadernos` - Listar cadernos com status
- `POST /api/tec-scraper/cadernos` - Adicionar caderno (auto-detecta total)
- `DELETE /api/tec-scraper/cadernos/:id` - Remover caderno
- `POST /api/tec-scraper/cadernos/:id/start` - Iniciar extração
- `POST /api/tec-scraper/cadernos/:id/pause` - Pausar extração
- `POST /api/tec-scraper/cadernos/:id/resume` - Retomar extração
- `GET /api/tec-scraper/cadernos/:id/progress` - Progresso em tempo real

#### Logs
- `GET /api/tec-scraper/logs` - Listar logs (com filtros)
- `GET /api/tec-scraper/logs/:caderno_id` - Logs de um caderno específico

---

## Fase 3: Frontend (Settings.tsx)

### Estrutura de Abas

```typescript
const SCRAPING_TABS = [
  { id: 'cadernos', label: 'Cadernos', icon: FolderOpen },
  { id: 'contas', label: 'Contas', icon: Users },
];
```

### Aba Cadernos

**Funcionalidades:**
1. **Lista de Cadernos**
   - Nome, URL, Total, Coletadas, Status, Ações
   - Barra de progresso visual (% concluído)
   - Indicador de status (cores: verde=completed, amarelo=running, vermelho=error)

2. **Adicionar Caderno**
   - Modal com campos: Nome, URL do TecConcursos
   - Ao salvar: API detecta automaticamente total de questões
   - Validação de URL (deve ser tecconcursos.com.br)

3. **Controles por Caderno**
   - Play (iniciar/retomar)
   - Pause (pausar)
   - Trash (remover)
   - View Logs (ver logs)

4. **Atualização de Progresso**
   - Polling a cada 5 segundos
   - Ou tempo real via useEffect + setInterval

### Aba Contas

**Funcionalidades:**
1. **Lista de Contas**
   - Email, Status do Login, Última Verificação, Ações

2. **Adicionar Conta**
   - Modal: Email, Senha, Cookies (opcional)
   - Botão "Testar Login" antes de salvar

3. **Controles por Conta**
   - Test Login (verificar se ainda funciona)
   - Edit (editar dados)
   - Import Cookies (importar novos cookies)
   - Delete (remover)

4. **Indicadores de Status**
   - Verde: Login válido
   - Amarelo: Não verificado
   - Vermelho: Inválido/Expirado

---

## Fase 4: Componentes React

### Arquivos a Criar/Modificar

1. **Modificar:** `packages/site/pages/admin/Settings.tsx`
   - Adicionar categoria 'scraping' ao sidebar
   - Criar `ScrapingSection()` component
   - Implementar abas horizontais

2. **Criar:** `packages/site/services/tecScraperService.ts`
   - Funções para chamar API do Mastra
   - Tipos TypeScript para dados

---

## Fase 5: UI/UX Detalhada

### Caderno Card/Row
```
┌─────────────────────────────────────────────────────────────────┐
│ [Icon] Policial Geral                          Status: RUNNING  │
│ https://www.tecconcursos.com.br/s/Q5jOgS                       │
│                                                                 │
│ Progresso: 1,234 / 121,870 questões (1.01%)                    │
│ [████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░] 1%            │
│                                                                 │
│ Iniciado: 04/01/2026 15:59  |  Tempo: 2h 34min                 │
│                                                                 │
│ [⏸ Pausar]  [📋 Logs]  [🗑 Remover]                            │
└─────────────────────────────────────────────────────────────────┘
```

### Conta Card/Row
```
┌─────────────────────────────────────────────────────────────────┐
│ 📧 engenheirosdaweb2@gmail.com                    [● Válido]    │
│ Última verificação: 04/01/2026 16:00                           │
│                                                                 │
│ [🔄 Testar] [📋 Cookies] [✏️ Editar] [🗑 Remover]              │
└─────────────────────────────────────────────────────────────────┘
```

---

## Estimativa de Arquivos

| Arquivo | Ação | Descrição |
|---------|------|-----------|
| `packages/site/supabase/migrations/053_tec_scraper_tables.sql` | Criar | Tabelas do banco |
| `packages/mastra/src/routes/tecConcursosScraper.ts` | Modificar | Novos endpoints |
| `packages/mastra/src/services/tecConcursosScraper.ts` | Modificar | Lógica de persistência |
| `packages/site/pages/admin/Settings.tsx` | Modificar | Nova seção Scraping |
| `packages/site/services/tecScraperService.ts` | Criar | Service para chamadas API |

---

## Recursos Sugeridos Adicionais

1. **Dashboard de Estatísticas**
   - Total de questões coletadas (todas as contas)
   - Questões por área/matéria
   - Gráfico de progresso ao longo do tempo

2. **Fila de Cadernos**
   - Processar cadernos em sequência
   - Priorização de cadernos

3. **Notificações**
   - Alerta quando um caderno terminar
   - Alerta de erro (email ou toast)

4. **Configurações Avançadas**
   - Velocidade de scraping (delay entre questões)
   - Limite de questões por sessão
   - Horário de execução automática

---

## Ordem de Implementação

1. **Migration do Banco** (tabelas)
2. **Endpoints da API** (Mastra)
3. **Service Frontend** (TypeScript types + fetch)
4. **Settings.tsx** (UI com abas)
5. **Testes e Refinamentos**
