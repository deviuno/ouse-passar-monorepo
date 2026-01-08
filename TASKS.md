# Tarefas de Melhoria - Sistema Ouse Passar

## Status Geral

| # | Tarefa | Status | Arquivos |
|---|--------|--------|----------|
| 1 | Seleção tópicos pai/filho | Concluído | EditalTopicSelector.tsx |
| 2 | Drag-and-drop no EditalAdmin | Concluído | EditalAdmin.tsx |
| 3 | Busca cross-matéria (Mastra) | Concluído | editalFilterAutoConfigAgent.ts |
| 4 | Seleção manual de matéria | Concluído | EditalAdmin.tsx |
| 5 | Modo Light - ThemeContext | Concluído | ThemeContext.tsx |
| 6 | Modo Light - CSS Variables | Concluído | theme.css |
| 7 | Migração PlannerLayout | Concluído | PlannerLayout.tsx |
| 8 | Migração Área do Aluno | Concluído | 6 arquivos |

---

## 1. Seleção de Tópicos Pai/Filho [CONCLUÍDO]

**Problema:** Quando um item pai era selecionado para uma missão, todos os filhos desapareciam da listagem nas próximas missões.

**Solução implementada:**
- Modificada função `hasAvailableChildren()` para verificar recursivamente se há filhos disponíveis, mesmo quando o pai está usado
- Adicionada função `isUsedButHasAvailableChildren()` para identificar pais usados com filhos disponíveis
- Atualizada renderização para mostrar pais usados de forma desabilitada (opacity 50%, texto riscado, badge "já usado")
- Pais usados agora mostram seta de expandir para acessar filhos disponíveis

**Arquivo:** `packages/site/components/admin/EditalTopicSelector.tsx`

---

## 2. Reordenação Drag-and-Drop [CONCLUÍDO]

**Problema:** O ícone de arrastar (GripVertical) existe mas não tem funcionalidade.

**Solução planejada:**
- Instalar @dnd-kit/core, @dnd-kit/sortable, @dnd-kit/utilities
- Implementar DndContext e SortableContext
- Ao arrastar item pai, mover filhos junto
- Persistir nova ordem no banco via editalService.reorder()

**Arquivo:** `packages/site/pages/admin/EditalAdmin.tsx`

---

## 3. Busca Cross-Matéria no Mastra [PENDENTE]

**Problema:** O agente busca assuntos apenas na matéria do item pai, não encontrando correspondências em outras matérias.

**Solução planejada:**
- Modificar lógica de busca para primeiro buscar na matéria pai
- Se não encontrar, expandir busca para todas as matérias
- Retornar flag indicando se encontrou em matéria diferente
- Mostrar alerta visual no admin quando isso ocorrer

**Arquivo:** `packages/mastra/src/mastra/agents/editalFilterAutoConfigAgent.ts`

---

## 4. Seleção Manual de Matéria [PENDENTE]

**Problema:** Não é possível selecionar assunto de matéria diferente da configurada no pai.

**Solução planejada:**
- Adicionar opção "Trocar Matéria" no topo do dropdown de assuntos
- Ao clicar, mostrar lista de todas as matérias
- Ao selecionar matéria, filtrar assuntos por ela
- Manter indicador visual da matéria alternativa selecionada

**Arquivo:** `packages/site/pages/admin/EditalAdmin.tsx`

---

## 5. Modo Light - ThemeContext [CONCLUÍDO]

**Solução implementada:**
- Criado ThemeContext com provider
- Preferência guardada no localStorage
- Atributo data-theme setado no document.documentElement
- Hook useTheme() disponível para componentes

**Arquivo:** `packages/site/lib/ThemeContext.tsx`

---

## 6. Modo Light - CSS Variables [CONCLUÍDO]

**Solução implementada:**
- Arquivo theme.css criado com variáveis CSS
- Tema dark: cores atuais (#121212, #1A1A1A, etc.)
- Tema light: cores claras (#FFFFFF, #F5F5F5, etc.)
- Amarelo ajustado para contraste em fundo claro (#D4A000)
- Classe utilitária theme-transition para transições suaves

**Arquivo:** `packages/site/styles/theme.css`

---

## 7. Migração PlannerLayout [CONCLUÍDO]

**Solução implementada:**
- Toggle de tema adicionado ao header (desktop e mobile)
- Todas as cores hardcoded migradas para CSS Variables
- Classe theme-transition adicionada para transições suaves
- Ícones Sun/Moon para indicar ação

**Arquivo:** `packages/site/components/PlannerLayout.tsx`

**Padrão de migração usado:**
```tsx
// ANTES
<div className="bg-[#1A1A1A] text-white">

// DEPOIS
<div className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)]">
```

---

## 8. Migração Área do Aluno [CONCLUÍDO]

**Solução implementada:**
Todos os componentes da área do aluno migrados para CSS Variables:

| Arquivo | Componentes Migrados |
|---------|---------------------|
| StudentDashboardView.tsx | Main container, KPI cards, navigation |
| PlanejadorSemanalView.tsx | Tooltips, modals, calendar grid, activity bar |
| EditalVerticalizadoView.tsx | SectionProgress, CheckboxGigante, main content |
| PlannerPerformanceView.tsx | PomodoroTimer, TimeInput, CheckboxItem, SemaforoPicker, ContributionCalendar |
| PlannerPerfilView.tsx | Avatar section, stats cards, achievements, sleep modal |
| PlanejamentoPRFView.tsx | Loading state, error state, header, footer, mission modal |

**Toggle de tema localizado em:**
- Header desktop: Botão Sun/Moon ao lado do perfil
- Menu mobile: Última opção "Modo Claro" / "Modo Escuro"

---

## Notas Técnicas

### Instalações necessárias
```bash
# Para drag-and-drop (já instalado)
npm install @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities -w @ouse/site
```

### Arquivos modificados/criados
```
packages/site/
├── components/admin/
│   └── EditalTopicSelector.tsx     # Tarefa 1 (concluída)
├── pages/admin/
│   └── EditalAdmin.tsx             # Tarefas 2, 4 (concluídas)
├── lib/
│   └── ThemeContext.tsx            # Tarefa 5 (concluída)
├── styles/
│   └── theme.css                   # Tarefa 6 (concluída)
├── components/
│   └── PlannerLayout.tsx           # Tarefa 7 (concluída)
├── pages/
│   ├── StudentDashboardView.tsx    # Tarefa 8 (concluída)
│   ├── PlanejadorSemanalView.tsx   # Tarefa 8 (concluída)
│   ├── EditalVerticalizadoView.tsx # Tarefa 8 (concluída)
│   ├── PlannerPerformanceView.tsx  # Tarefa 8 (concluída)
│   ├── PlannerPerfilView.tsx       # Tarefa 8 (concluída)
│   └── PlanejamentoPRFView.tsx     # Tarefa 8 (concluída)
├── index.tsx                       # Import do theme.css
└── App.tsx                         # ThemeProvider adicionado

packages/mastra/
└── src/mastra/agents/
    └── editalFilterAutoConfigAgent.ts  # Tarefa 3 (concluída)
```
