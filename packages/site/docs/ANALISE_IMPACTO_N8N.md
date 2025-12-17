# Análise de Impacto: Integração N8N no Sistema Existente

## RESUMO EXECUTIVO

**Risco Geral: BAIXO**

A integração N8N é **ADITIVA**, ou seja, adiciona novas funcionalidades sem modificar as existentes. As tabelas e serviços atuais permanecerão intactos.

---

## 1. MAPA DO SISTEMA ATUAL

### 1.1 Estrutura de Tabelas Existentes

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SISTEMA ATUAL                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  preparatorios ─────┬──→ rodadas ──→ missoes                            │
│       │             │                                                    │
│       │             ├──→ mensagens_incentivo                             │
│       │             │                                                    │
│       │             └──→ edital_verticalizado_items                      │
│       │                                                                  │
│       └──→ planejamentos ─────┬──→ planejador_semanal                   │
│                               │                                          │
│                               ├──→ planner_diario                        │
│                               │                                          │
│                               ├──→ atividade_tipos_usuario               │
│                               │                                          │
│                               └──→ missoes_executadas                    │
│                                                                          │
│  atividade_tipos (global, is_default=true)                              │
│                                                                          │
│  leads ──→ students ──→ student_users                                   │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Serviços Existentes e Suas Dependências

| Serviço | Tabelas que Acessa | Funcionalidade |
|---------|-------------------|----------------|
| `preparatoriosService` | preparatorios, rodadas, missoes, mensagens_incentivo, planejamentos | CRUD de preparatórios |
| `missaoService` | missoes_executadas | Tracking de missões executadas |
| `plannerService` | planner_diario, planejador_semanal, atividade_tipos, edital_verticalizado_items | Planner diário e semanal |
| `planejadorService` | planejador_semanal, atividade_tipos, atividade_tipos_usuario | Calendário semanal |
| `adminUsersService` | leads, students, student_users | Gestão de leads/alunos |
| `studentService` | student_users, leads | Autenticação de alunos |
| `schedulingService` | agendamentos | Agendamentos de apresentações |

### 1.3 Páginas do Aluno (Que NÃO podem quebrar)

| Página | Arquivo | Dependências |
|--------|---------|--------------|
| Cockpit | `PlannerPerformanceView.tsx` | plannerService, planejadorService |
| Calendário | `PlanejadorSemanalView.tsx` | planejadorService, usePlannerData |
| Missões | `PlanejamentoPRFView.tsx` | preparatoriosService, missaoService |
| Edital | `EditalVerticalizadoView.tsx` | supabase (edital_verticalizado_items) |
| Perfil | `PlannerPerfilView.tsx` | supabase (planejamentos) |
| Dashboard | `StudentDashboardView.tsx` | plannerService |

---

## 2. O QUE A INTEGRAÇÃO N8N ADICIONA

### 2.1 Novas Tabelas (Não existem ainda)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        NOVAS TABELAS (N8N)                               │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  preparatorios ─────→ preparatorio_materias ──→ assuntos ──→ conteudos  │
│        │                    (NOVA)                (NOVA)       (NOVA)    │
│        │                                                                 │
│        └──→ [campos novos opcionais]:                                    │
│             - orgao                                                      │
│             - banca                                                      │
│             - nivel                                                      │
│             - cargo                                                      │
│             - requisitos                                                 │
│             - area_conhecimento_basico                                   │
│             - area_conhecimento_especifico                               │
│             - data_prevista                                              │
│             - n8n_status                                                 │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Novos Serviços (Serão criados)

| Serviço | Tabelas | Propósito |
|---------|---------|-----------|
| `n8nService` | NENHUMA existente | Chamadas aos webhooks |
| `materiasService` | preparatorio_materias, assuntos | CRUD de matérias/assuntos |
| `conteudosService` | conteudos | CRUD e geração de conteúdo |

---

## 3. ANÁLISE DE IMPACTO POR COMPONENTE

### 3.1 Tabela `preparatorios`

| Aspecto | Impacto | Mitigação |
|---------|---------|-----------|
| Novos campos | BAIXO | Usar `ALTER TABLE ADD COLUMN IF NOT EXISTS` |
| Campos obrigatórios | NENHUM | Todos os novos campos são opcionais (NULL) |
| Queries existentes | NENHUM | `SELECT *` continua funcionando |
| Serviços existentes | NENHUM | Não usam os novos campos |

**Conclusão:** Sem risco para funcionalidades existentes.

### 3.2 Sistema de Planejamentos (Aluno)

| Componente | Impacto | Motivo |
|------------|---------|--------|
| PlannerLayout | NENHUM | Não usa tabelas novas |
| PlanejadorSemanalView | NENHUM | Usa `planejador_semanal`, não muda |
| PlannerPerformanceView | NENHUM | Usa `planner_diario`, não muda |
| PlanejamentoPRFView | NENHUM | Usa `rodadas`/`missoes`, estrutura paralela |
| EditalVerticalizadoView | NENHUM | Usa `edital_verticalizado_items`, não muda |

**Conclusão:** Sistema de planejamento do aluno 100% preservado.

### 3.3 Sistema de Missões

| Componente | Impacto | Motivo |
|------------|---------|--------|
| missaoService | NENHUM | Usa `missoes_executadas`, não muda |
| Tracking de progresso | NENHUM | Baseado em `rodada_numero`/`missao_numero` |

**Conclusão:** Sistema de missões 100% preservado.

### 3.4 Admin Panel

| Componente | Impacto | Mudança Necessária |
|------------|---------|-------------------|
| NewPreparatorio.tsx | MÉDIO | Adicionar novo modo de criação (opcional) |
| EditarPreparatorio.tsx | BAIXO | Pode exibir status N8N (opcional) |
| Planejamentos.tsx | NENHUM | Não muda |
| Leads.tsx | NENHUM | Não muda |

**Conclusão:** Admin panel terá ADIÇÃO de funcionalidade, não substituição.

---

## 4. PONTOS CRÍTICOS DE ATENÇÃO

### 4.1 A Estrutura `rodadas → missoes` vs `materias → assuntos`

**IMPORTANTE:** São estruturas PARALELAS, não substituições!

```
ESTRUTURA ATUAL (Missões táticas):
preparatorio → rodadas → missoes
              └──→ Cada missão = uma tarefa diária
              └──→ Tracking via missoes_executadas

ESTRUTURA NOVA (Conteúdo didático):
preparatorio → preparatorio_materias → assuntos → conteudos
              └──→ Cada assunto = um tópico de estudo
              └──→ Conteúdo multimídia gerado por IA
```

**Ambas coexistem!** Um preparatório pode ter:
- Rodadas com missões (sistema atual)
- Matérias com assuntos e conteúdo (sistema novo)

### 4.2 Formulário de Criação de Preparatório

O formulário atual em `NewPreparatorio.tsx` tem 2 modos:
1. Via Edital (upload PDF)
2. Manual (filtros)

**Proposta segura:** Adicionar um **terceiro modo** "Via N8N" sem remover os existentes.

### 4.3 Hooks e Cache (React Query)

O sistema usa `usePlannerData.ts` com React Query. Os novos dados devem:
- Usar NOVAS query keys (ex: `['materias', id]`, `['conteudos', id]`)
- NÃO invalidar cache existente

---

## 5. ESTRATÉGIA DE IMPLEMENTAÇÃO SEGURA

### 5.1 Princípio: Adição, Nunca Substituição

```
✅ FAZER:
- Criar NOVAS tabelas
- Adicionar campos OPCIONAIS às existentes
- Criar NOVOS serviços
- Adicionar NOVAS rotas

❌ NÃO FAZER:
- Modificar estrutura de tabelas existentes
- Alterar lógica de serviços existentes
- Mudar rotas existentes
- Remover campos ou funcionalidades
```

### 5.2 Ordem de Implementação (Faseada)

**Fase 1: Infraestrutura (0% risco)**
```
1. Criar novas tabelas (não afeta nada)
2. Criar novos tipos TypeScript (não afeta nada)
3. Criar n8nService.ts (novo arquivo)
```

**Fase 2: Admin (Baixo risco)**
```
4. Adicionar terceiro modo ao NewPreparatorio
5. Criar página de visualização de matérias/assuntos
6. Testes isolados
```

**Fase 3: Frontend Aluno (Médio risco)**
```
7. Criar página de conteúdo de assunto
8. Integrar com sistema existente
9. Testes end-to-end
```

### 5.3 Rollback Plan

Se algo der errado:
1. Novas tabelas podem ser dropadas sem afetar nada
2. Novos campos podem ser ignorados (são opcionais)
3. Código novo está em arquivos separados (fácil reverter)

---

## 6. CHECKLIST DE SEGURANÇA

### Antes de Cada Deploy:

- [ ] Todas as novas tabelas usam `IF NOT EXISTS`
- [ ] Todos os novos campos são `NULL` ou têm `DEFAULT`
- [ ] Nenhum serviço existente foi modificado
- [ ] Nenhuma query existente foi alterada
- [ ] Testes passam para funcionalidades existentes:
  - [ ] Login de aluno funciona
  - [ ] Calendário semanal carrega
  - [ ] Planner diário salva
  - [ ] Missões são marcadas/desmarcadas
  - [ ] Edital verticalizado exibe
  - [ ] Perfil carrega dados

---

## 7. CONCLUSÃO

### Funcionalidades que NÃO serão afetadas:

| Funcionalidade | Status | Motivo |
|----------------|--------|--------|
| Login de alunos | SEGURO | Usa tabelas separadas |
| Calendário semanal | SEGURO | Usa `planejador_semanal` |
| Planner diário (cockpit) | SEGURO | Usa `planner_diario` |
| Missões táticas | SEGURO | Usa `rodadas`/`missoes` |
| Edital verticalizado | SEGURO | Usa `edital_verticalizado_items` |
| Perfil do aluno | SEGURO | Usa `planejamentos` |
| Geração de planejamento | SEGURO | Usa `leads`/`planejamentos` |
| Mensagens de incentivo | SEGURO | Usa `mensagens_incentivo` |

### Funcionalidades que serão ADICIONADAS:

| Funcionalidade | Status |
|----------------|--------|
| Criação automática de matérias/assuntos via N8N | NOVO |
| Geração de conteúdo didático sob demanda | NOVO |
| Player de áudio (podcast) | NOVO |
| Visualização de mapa mental | NOVO |

**Veredicto Final:** A integração é segura desde que sigamos o princípio de ADIÇÃO e não modifiquemos código existente.
