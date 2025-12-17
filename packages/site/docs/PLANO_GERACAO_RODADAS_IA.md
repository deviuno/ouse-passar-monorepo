# Plano: Geracao Automatica de Rodadas e Missoes com IA

## 1. Visao Geral

### 1.1 Objetivo
Criar um sistema automatizado que gera todas as rodadas e missoes de um preparatorio com base no edital verticalizado, seguindo uma metodologia pedagogica bem definida.

### 1.2 Fluxo do Usuario

```
Pagina Rodadas → Clique "Gerar com IA" → Modal Wizard
    ↓
Etapa 1: Selecionar e Ordenar Materias por Prioridade
    ↓
Etapa 2: Configuracoes (opcional)
    ↓
Etapa 3: Preview e Confirmacao
    ↓
Geracao Automatica → Rodadas + Missoes criadas
```

---

## 2. Estrutura do Banco de Dados (Atual)

### 2.1 Tabelas Principais

```
preparatorios
├── id (UUID)
├── nome
├── slug
└── ...

edital_verticalizado_items
├── id (UUID)
├── preparatorio_id (FK)
├── tipo (ENUM: 'bloco', 'materia', 'topico')
├── titulo
├── ordem
├── parent_id (self-reference para hierarquia)
└── ...

rodadas
├── id (UUID)
├── preparatorio_id (FK)
├── numero (INT)
├── titulo
├── nota
├── ordem
└── ...

missoes
├── id (UUID)
├── rodada_id (FK)
├── numero (VARCHAR - permite "1", "1,2", etc)
├── tipo (ENUM: 'padrao', 'revisao', 'acao')
├── materia
├── assunto
├── instrucoes
├── tema (para revisao)
├── acao (para tipo acao)
├── extra (TEXT[])
├── obs
├── ordem
└── ...

missao_edital_items (vinculo missao <-> topico)
├── id (UUID)
├── missao_id (FK)
├── edital_item_id (FK)
└── ...

missao_questao_filtros (filtros para questoes - Ouse Questoes)
├── id (UUID)
├── missao_id (FK)
├── filtros (JSONB)
├── questoes_count
└── ...
```

### 2.2 Hierarquia do Edital

```
BLOCO I (tipo: bloco)
├── LINGUA PORTUGUESA (tipo: materia)
│   ├── Compreensao de textos (tipo: topico)
│   ├── Coesao textual (tipo: topico)
│   └── ...
├── RACIOCINIO LOGICO (tipo: materia)
│   ├── Equacoes 1o e 2o grau (tipo: topico)
│   └── ...
└── ...

BLOCO II (tipo: bloco)
├── LEGISLACAO DE TRANSITO (tipo: materia)
│   └── ...
└── ...
```

---

## 3. Metodologia de Geracao (Regras de Negocio)

### 3.1 Regras Fundamentais

| Regra | Descricao |
|-------|-----------|
| **5 missoes por rodada** | Cada rodada contem exatamente 5 missoes de estudo |
| **Max 3 topicos por missao** | Uma missao pode cobrir 1, 2 ou 3 topicos |
| **Alternancia obrigatoria** | Nunca duas missoes consecutivas da mesma materia |
| **2 materias principais** | As duas materias prioritarias devem aparecer nas primeiras missoes |
| **Distribuicao harmonica** | Topicos devem ser divididos de forma equilibrada |
| **Continuidade entre rodadas** | Se sobram topicos, continuam na proxima rodada |
| **Revisao apos conclusao** | Materia finalizada entra como revisao na proxima rodada |
| **Revisao persegue** | Revisoes continuam nas rodadas seguintes |

### 3.2 Algoritmo de Distribuicao de Topicos

**Regra para quebrar topicos em missoes:**

```
Dado N topicos de uma materia:

- N <= 3: 1 missao com N topicos
- N = 4: 2 missoes com 2 topicos cada
- N = 5: 2 missoes (3 + 2) ou (2 + 3)
- N = 6: 2 missoes com 3 topicos cada
- N = 7: 3 missoes (3 + 2 + 2) ou (2 + 3 + 2)
- N = 8: 3 missoes (3 + 3 + 2)
- N = 9: 3 missoes com 3 topicos cada
- N >= 10: ceil(N/3) missoes, distribuindo equilibradamente

Formula geral:
- num_missoes = ceil(N / 3)
- topicos_por_missao = dividir N em num_missoes partes equilibradas
```

### 3.3 Algoritmo de Alternancia

```
Materias ordenadas por prioridade: [M1, M2, M3, M4, ...]

Rodada 1:
- Missao 1: M1 (topicos 1-3)
- Missao 2: M2 (topicos 1-3)
- Missao 3: M1 (topicos 4-6) ou M3 se M1 esgotou
- Missao 4: M2 (topicos 4-6) ou M4 se M2 esgotou
- Missao 5: alternancia continua...

Regra de alternancia:
- Guardar ultima materia usada
- Proxima missao deve ser de materia diferente
- Priorizar materias com mais topicos restantes
- Se todas as materias prioritarias esgotaram, passar para proximas
```

### 3.4 Sistema de Revisao

```
Quando materia M finaliza na rodada R:
1. Criar missao de revisao de M na rodada R+1
2. Tipo: 'revisao'
3. Tema: "REVISAO: {nome_materia}"
4. A revisao persiste enquanto houver:
   - Questoes erradas pelo aluno
   - Questoes marcadas como dificeis

Nota: A logica de "questoes erradas" eh especifica do Ouse Questoes
e sera tratada pelos filtros de questoes (missao_questao_filtros)
```

### 3.5 Exemplo Pratico

**Entrada:**
```
Materias (ordem de prioridade):
1. Portugues (8 topicos)
2. Matematica (6 topicos)
3. Direito Constitucional (4 topicos)
4. Informatica (3 topicos)
```

**Saida esperada:**

```
RODADA 1:
├── Missao 1: Portugues - Topicos 1-3 (tipo: padrao)
├── Missao 2: Matematica - Topicos 1-3 (tipo: padrao)
├── Missao 3: Portugues - Topicos 4-6 (tipo: padrao)
├── Missao 4: Matematica - Topicos 4-6 (tipo: padrao)
└── Missao 5: Portugues - Topicos 7-8 (tipo: padrao) [FINALIZA]

RODADA 2:
├── Missao 1: Direito Const. - Topicos 1-2 (tipo: padrao)
├── Missao 2: REVISAO PORTUGUES (tipo: revisao) ← Entrou revisao
├── Missao 3: Direito Const. - Topicos 3-4 (tipo: padrao) [FINALIZA]
├── Missao 4: REVISAO MATEMATICA (tipo: revisao) ← Matematica finalizou
└── Missao 5: Informatica - Topicos 1-3 (tipo: padrao) [FINALIZA]

RODADA 3:
├── Missao 1: REVISAO PORTUGUES (tipo: revisao)
├── Missao 2: REVISAO DIR. CONSTITUCIONAL (tipo: revisao)
├── Missao 3: REVISAO MATEMATICA (tipo: revisao)
├── Missao 4: REVISAO INFORMATICA (tipo: revisao)
└── Missao 5: [vazia ou simulado/acao especial]

FIM - Todas as materias foram estudadas e revisadas pelo menos 1x
```

---

## 4. Arquitetura Tecnica

### 4.1 Opcoes Avaliadas

| Opcao | Pros | Contras |
|-------|------|---------|
| **Mastra Agent** | Orquestracao complexa, memoria, tools | Mais overhead, dependencia de API |
| **Edge Function** | Serverless, rapido, direto | Sem memoria/contexto, timeout |
| **Frontend + Service** | Simples, sem dependencias | Logica no client, menos escalavel |

### 4.2 Decisao: Abordagem Hibrida

**Frontend (React):**
- Interface do wizard (selecao de materias, drag-and-drop)
- Preview da geracao
- Chamada ao backend

**Backend (Mastra ou API local):**
- Processamento do algoritmo de distribuicao
- Criacao em batch das rodadas e missoes
- (Opcional) IA para sugerir ordem de prioridade

**Justificativa:**
- O algoritmo eh deterministico (nao precisa de IA para gerar)
- IA pode ser usada para SUGERIR a ordem de materias (opcional)
- Mastra pode orquestrar a criacao e vincular filtros de questoes

### 4.3 Fluxo Detalhado

```
[Frontend - Modal Wizard]
    │
    ├── Etapa 1: Buscar edital_verticalizado_items
    │   └── Exibir arvore de materias para ordenacao
    │
    ├── Etapa 2: Usuario ordena materias por prioridade (drag-and-drop)
    │
    ├── Etapa 3: Preview - Frontend calcula preview do algoritmo
    │   └── Mostrar quantas rodadas, missoes por rodada, etc.
    │
    └── Etapa 4: Confirmar → POST para backend
            │
            ▼
[Backend - /api/preparatorio/gerar-rodadas]
    │
    ├── Receber: preparatorio_id, materias_ordenadas[]
    │
    ├── Executar algoritmo de distribuicao
    │   ├── Criar rodadas
    │   ├── Criar missoes
    │   ├── Vincular topicos (missao_edital_items)
    │   └── (Opcional) Criar filtros de questoes
    │
    └── Retornar: { success, rodadas_criadas, missoes_criadas }
```

---

## 5. Detalhamento da Interface

### 5.1 Botao "Gerar com IA"

**Localizacao:** Pagina `Rodadas.tsx`, ao lado do botao "Nova Rodada"

```tsx
<button className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 ...">
  <Sparkles className="w-4 h-4" />
  Gerar com IA
</button>
```

### 5.2 Modal Wizard - Etapa 1: Selecao de Materias

**Layout:**
```
┌─────────────────────────────────────────────────────────┐
│  GERAR RODADAS COM IA                              [X]  │
├─────────────────────────────────────────────────────────┤
│  Etapa 1 de 3: Ordenar Materias por Prioridade          │
│                                                          │
│  Arraste as materias para definir a ordem de estudo.     │
│  As materias no topo terao mais peso no planejamento.    │
│                                                          │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ ≡ 1. LINGUA PORTUGUESA (8 topicos)            [↑↓] │ │
│  │ ≡ 2. RACIOCINIO LOGICO (6 topicos)            [↑↓] │ │
│  │ ≡ 3. DIREITO CONSTITUCIONAL (4 topicos)       [↑↓] │ │
│  │ ≡ 4. INFORMATICA (3 topicos)                  [↑↓] │ │
│  │ ≡ 5. LEGISLACAO DE TRANSITO (5 topicos)       [↑↓] │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  [ ] Usar sugestao da IA (analisa peso da banca)         │
│                                                          │
│                              [Cancelar]  [Proximo →]     │
└─────────────────────────────────────────────────────────┘
```

### 5.3 Modal Wizard - Etapa 2: Configuracoes (Opcional)

```
┌─────────────────────────────────────────────────────────┐
│  GERAR RODADAS COM IA                              [X]  │
├─────────────────────────────────────────────────────────┤
│  Etapa 2 de 3: Configuracoes                            │
│                                                          │
│  Missoes por rodada:  [ 5 ▼ ]                           │
│                                                          │
│  Max topicos por missao:  [ 3 ▼ ]                       │
│                                                          │
│  Incluir missoes de revisao:  [✓]                       │
│                                                          │
│  Gerar filtros de questoes:  [✓]  (Ouse Questoes)       │
│                                                          │
│                         [← Voltar]  [Proximo →]          │
└─────────────────────────────────────────────────────────┘
```

### 5.4 Modal Wizard - Etapa 3: Preview e Confirmacao

```
┌─────────────────────────────────────────────────────────┐
│  GERAR RODADAS COM IA                              [X]  │
├─────────────────────────────────────────────────────────┤
│  Etapa 3 de 3: Preview                                  │
│                                                          │
│  📊 Resumo da Geracao:                                   │
│  ┌─────────────────────────────────────────────────────┐ │
│  │  Total de Rodadas: 8                                 │ │
│  │  Total de Missoes: 40                                │ │
│  │  Missoes de Estudo: 32                               │ │
│  │  Missoes de Revisao: 8                               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  📋 Detalhamento:                                        │
│  ┌─────────────────────────────────────────────────────┐ │
│  │ Rodada 1                                     [▼]    │ │
│  │   Missao 1: Portugues - Topicos 1-3                 │ │
│  │   Missao 2: Matematica - Topicos 1-3                │ │
│  │   ...                                               │ │
│  ├─────────────────────────────────────────────────────┤ │
│  │ Rodada 2                                     [▼]    │ │
│  │   ...                                               │ │
│  └─────────────────────────────────────────────────────┘ │
│                                                          │
│  ⚠️ Rodadas existentes serao SUBSTITUIDAS!               │
│                                                          │
│                         [← Voltar]  [✓ Confirmar]        │
└─────────────────────────────────────────────────────────┘
```

---

## 6. Implementacao - Componentes

### 6.1 Novos Arquivos

```
packages/site/
├── components/admin/
│   ├── GerarRodadasModal.tsx       # Modal wizard principal
│   ├── MateriaPriorityList.tsx     # Lista drag-and-drop de materias
│   └── RodadasPreview.tsx          # Preview das rodadas geradas
│
├── services/
│   └── rodadasGeneratorService.ts  # Algoritmo de geracao (client-side)
│
└── hooks/
    └── useRodadasGenerator.ts      # Hook para geracao

packages/mastra/
├── src/
│   ├── mastra/agents/
│   │   └── rodadasGeneratorAgent.ts  # (Opcional) Agente para sugestoes
│   │
│   └── server.ts                     # Novo endpoint /api/gerar-rodadas
```

### 6.2 Tipos TypeScript

```typescript
// types/rodadasGenerator.ts

interface MateriaParaGeracao {
  id: string;                    // ID do edital_item (tipo: materia)
  titulo: string;
  topicos: TopicoParaGeracao[];
  prioridade: number;            // 1 = mais importante
}

interface TopicoParaGeracao {
  id: string;                    // ID do edital_item (tipo: topico)
  titulo: string;
  coberto: boolean;              // Ja foi usado em alguma missao
}

interface MissaoGerada {
  numero: string;
  tipo: 'padrao' | 'revisao' | 'acao';
  materia: string;
  assunto: string;               // Concatenacao dos titulos dos topicos
  topico_ids: string[];          // IDs para vincular em missao_edital_items
  instrucoes?: string;
  tema?: string;                 // Para revisao
}

interface RodadaGerada {
  numero: number;
  titulo: string;
  missoes: MissaoGerada[];
}

interface ResultadoGeracao {
  rodadas: RodadaGerada[];
  estatisticas: {
    total_rodadas: number;
    total_missoes: number;
    missoes_estudo: number;
    missoes_revisao: number;
  };
}

interface ConfiguracaoGeracao {
  missoes_por_rodada: number;     // Default: 5
  max_topicos_por_missao: number; // Default: 3
  incluir_revisoes: boolean;      // Default: true
  gerar_filtros_questoes: boolean;// Default: false
}
```

---

## 7. Algoritmo - Pseudocodigo

```typescript
function gerarRodadas(
  materias: MateriaParaGeracao[],
  config: ConfiguracaoGeracao
): ResultadoGeracao {

  const rodadas: RodadaGerada[] = [];
  const materiasFinalizadas: Set<string> = new Set();
  const materiasParaRevisar: string[] = [];

  let rodadaAtual = 1;
  let ultimaMateriaUsada: string | null = null;

  // Preparar filas de missoes por materia
  const filaMissoes: Map<string, MissaoGerada[]> = new Map();

  for (const materia of materias) {
    const missoes = dividirTopicosEmMissoes(materia, config.max_topicos_por_missao);
    filaMissoes.set(materia.id, missoes);
  }

  // Loop principal
  while (true) {
    const missoesRodada: MissaoGerada[] = [];

    // Gerar 5 missoes para esta rodada
    for (let i = 0; i < config.missoes_por_rodada; i++) {
      // Buscar proxima materia (diferente da anterior)
      const proximaMateria = buscarProximaMateria(
        materias,
        filaMissoes,
        materiasFinalizadas,
        materiasParaRevisar,
        ultimaMateriaUsada,
        config.incluir_revisoes
      );

      if (!proximaMateria) {
        // Nao ha mais materias nem revisoes
        break;
      }

      if (proximaMateria.tipo === 'revisao') {
        missoesRodada.push(criarMissaoRevisao(proximaMateria.materia));
        // Revisao continua na fila
      } else {
        const fila = filaMissoes.get(proximaMateria.id);
        const missao = fila.shift();
        missao.numero = String(i + 1);
        missoesRodada.push(missao);

        // Verificar se materia finalizou
        if (fila.length === 0) {
          materiasFinalizadas.add(proximaMateria.id);
          if (config.incluir_revisoes) {
            materiasParaRevisar.push(proximaMateria.id);
          }
        }
      }

      ultimaMateriaUsada = proximaMateria.id;
    }

    if (missoesRodada.length === 0) {
      break; // Fim da geracao
    }

    rodadas.push({
      numero: rodadaAtual,
      titulo: `${rodadaAtual}a RODADA`,
      missoes: missoesRodada
    });

    rodadaAtual++;

    // Condicao de parada: todas materias finalizadas E todas revisadas 1x
    if (materiasFinalizadas.size === materias.length &&
        todasMateriasRevisadas(materiasParaRevisar)) {
      break;
    }
  }

  return {
    rodadas,
    estatisticas: calcularEstatisticas(rodadas)
  };
}

function dividirTopicosEmMissoes(
  materia: MateriaParaGeracao,
  maxTopicos: number
): MissaoGerada[] {
  const topicos = materia.topicos;
  const n = topicos.length;

  if (n === 0) return [];

  const numMissoes = Math.ceil(n / maxTopicos);
  const missoes: MissaoGerada[] = [];

  // Distribuir equilibradamente
  const base = Math.floor(n / numMissoes);
  const extra = n % numMissoes;

  let idx = 0;
  for (let i = 0; i < numMissoes; i++) {
    const qtd = base + (i < extra ? 1 : 0);
    const topicosSlice = topicos.slice(idx, idx + qtd);

    missoes.push({
      numero: '',
      tipo: 'padrao',
      materia: materia.titulo,
      assunto: topicosSlice.map(t => t.titulo).join('\n'),
      topico_ids: topicosSlice.map(t => t.id),
      instrucoes: `Estudar os topicos e resolver questoes relacionadas.`
    });

    idx += qtd;
  }

  return missoes;
}
```

---

## 8. Fases de Implementacao

### Fase 1: Service de Geracao (Frontend)
**Arquivos:** `rodadasGeneratorService.ts`

- [ ] Implementar algoritmo de distribuicao de topicos
- [ ] Implementar algoritmo de alternancia
- [ ] Implementar sistema de revisao
- [ ] Testes unitarios do algoritmo

### Fase 2: Interface do Wizard
**Arquivos:** `GerarRodadasModal.tsx`, `MateriaPriorityList.tsx`

- [ ] Criar modal wizard com 3 etapas
- [ ] Implementar drag-and-drop para ordenacao de materias
- [ ] Etapa de configuracoes
- [ ] Componente de preview

### Fase 3: Integracao com Backend
**Arquivos:** `Rodadas.tsx`, `preparatoriosService.ts`

- [ ] Adicionar botao "Gerar com IA" na pagina de Rodadas
- [ ] Criar funcao de persistencia (criar rodadas + missoes + vinculos)
- [ ] Tratamento de erros e loading states

### Fase 4: (Opcional) Integracao com Mastra
**Arquivos:** `server.ts`, `rodadasGeneratorAgent.ts`

- [ ] Criar endpoint `/api/gerar-rodadas`
- [ ] (Opcional) Agente para sugerir ordem de materias
- [ ] (Opcional) Geracao de filtros de questoes automaticos

### Fase 5: Testes e Polimento

- [ ] Testes end-to-end
- [ ] Tratamento de edge cases
- [ ] UX improvements (animacoes, feedback)

---

## 9. Consideracoes Finais

### 9.1 Tratamento de Casos Especiais

| Caso | Tratamento |
|------|------------|
| Materia com 1 topico | 1 missao com 1 topico |
| Materia sem topicos | Ignorar na geracao |
| Todas materias iguais em topicos | Alternar normalmente |
| Apenas 1 materia no edital | Gerar rodadas so com ela (sem alternancia) |
| Rodadas ja existentes | Perguntar se deseja substituir |

### 9.2 Decisoes Tomadas

| Questao | Decisao |
|---------|---------|
| **Backend** | Mastra (orquestracao completa) |
| **Filtros de questoes** | Gerar automaticamente baseado nos topicos |
| **Simulados** | Sim, 1 missao de simulado ao FINAL de cada rodada |
| **IA para sugestao** | SIM! Prioridade automatica via analise da banca |

---

## 10. Funcionalidade Extra: IA para Priorizacao Automatica

### 10.1 Visao Geral

A IA analisara o historico da banca para sugerir automaticamente a ordem de prioridade das materias. Isso torna o sistema **100% automatico** - o usuario so precisa confirmar.

### 10.2 Fontes de Dados para Analise

```
1. Banco de Questoes (questoes_concurso)
   - Quantidade de questoes por materia/assunto
   - Frequencia de aparicao em provas anteriores

2. Dados do Preparatorio
   - Banca (CESPE, FGV, etc.)
   - Orgao
   - Cargo/Nivel

3. (Opcional) Upload da Ultima Prova
   - PDF da prova anterior
   - Analise via IA para extrair peso das materias
```

### 10.3 Algoritmo de Priorizacao

```typescript
interface AnaliseBanca {
  materia: string;
  total_questoes: number;
  percentual: number;           // % do total de questoes
  frequencia_provas: number;    // Em quantas provas apareceu
  media_questoes_prova: number; // Media de questoes por prova
  tendencia: 'alta' | 'estavel' | 'baixa'; // Comparando ultimas provas
  score_prioridade: number;     // Score calculado (0-100)
}

// Score de prioridade =
//   (percentual * 0.4) +
//   (frequencia_normalizada * 0.3) +
//   (tendencia_score * 0.3)
```

### 10.4 Fluxo com IA

```
Usuario clica "Gerar com IA"
    ↓
Sistema busca dados do preparatorio (banca, orgao)
    ↓
Mastra Agent analisa:
  1. Historico de questoes da banca
  2. Peso de cada materia
  3. Tendencias recentes
    ↓
IA retorna ordem sugerida com justificativa:
  "Portugues (35% das questoes, alta frequencia)
   Direito Const. (25%, crescendo nas ultimas provas)
   ..."
    ↓
Usuario ve sugestao → Pode aceitar ou reordenar manualmente
    ↓
Confirma → Geracao automatica
```

### 10.5 Agente Mastra: `materiaPriorityAgent`

```typescript
const materiaPriorityAgent = new Agent({
  name: "materiaPriorityAgent",
  instructions: `
    Voce e um especialista em concursos publicos.
    Sua tarefa e analisar o historico de uma banca e sugerir
    a ordem de prioridade das materias para estudo.

    Considere:
    - Quantidade de questoes por materia
    - Frequencia em provas anteriores
    - Tendencias recentes
    - Peso relativo no total da prova

    Retorne um JSON com a ordem sugerida e justificativa.
  `,
  model: google("gemini-2.0-flash"),
  tools: {
    buscarHistoricoBanca,
    analisarPesoMaterias,
    buscarTendencias
  }
});
```

---

## 11. Missao Simulado (Final de Cada Rodada)

### 11.1 Regra

Ao final de **cada rodada**, adicionar uma missao do tipo `acao` com um simulado contendo questoes de TODOS os topicos estudados naquela rodada.

### 11.2 Estrutura

```typescript
const missaoSimulado: MissaoGerada = {
  numero: '6',  // Sempre a ultima da rodada (pos 5 missoes de estudo)
  tipo: 'acao',
  materia: 'SIMULADO',
  assunto: null,
  acao: `SIMULADO DA RODADA ${rodadaNumero} - Questoes de todas as materias estudadas`,
  topico_ids: [...todosTopicosRodada],  // Todos os topicos da rodada
  instrucoes: 'Realizar simulado com tempo cronometrado e corrigir ao final.'
};
```

### 11.3 Filtros de Questoes do Simulado

```typescript
const filtrosSimulado = {
  // Buscar questoes dos topicos estudados na rodada
  assuntos: topicosRodada.map(t => t.titulo),
  // Limitar quantidade
  limit: 20,  // ou configuravel
  // Priorizar questoes da banca do preparatorio
  bancas: [preparatorio.banca],
  // Misturar dificuldades
  shuffle: true
};
```

---

## 12. Arquitetura Final com Mastra

### 12.1 Novos Agentes

```
packages/mastra/src/mastra/agents/
├── materiaPriorityAgent.ts    # IA para sugerir prioridade
└── rodadasGeneratorAgent.ts   # Orquestra a geracao completa
```

### 12.2 Novos Endpoints

```
POST /api/preparatorio/analisar-prioridade
  Body: { preparatorio_id, banca, orgao }
  Response: { materias_priorizadas[], justificativa }

POST /api/preparatorio/gerar-rodadas
  Body: { preparatorio_id, materias_ordenadas[], config }
  Response: { rodadas[], estatisticas }
```

### 12.3 Fluxo Completo

```
[Frontend]
    │
    ├── GET /edital-items → Lista materias do edital
    │
    ├── POST /api/preparatorio/analisar-prioridade
    │   └── Mastra: materiaPriorityAgent analisa banca
    │   └── Retorna ordem sugerida + justificativa
    │
    ├── Usuario revisa/confirma ordem
    │
    └── POST /api/preparatorio/gerar-rodadas
        └── Mastra: rodadasGeneratorAgent
            ├── Executa algoritmo de distribuicao
            ├── Cria rodadas no Supabase
            ├── Cria missoes no Supabase
            ├── Vincula topicos (missao_edital_items)
            ├── Cria filtros de questoes (missao_questao_filtros)
            └── Retorna resultado

[Supabase]
    ├── rodadas (criadas)
    ├── missoes (criadas)
    ├── missao_edital_items (vinculos)
    └── missao_questao_filtros (filtros)
```

---

### 9.3 Metricas de Sucesso

- Tempo de geracao < 5 segundos
- Preview preciso (o que mostra eh o que cria)
- Zero duplicacao de topicos
- Alternancia 100% respeitada
- Revisoes criadas corretamente

---

**Criado em:** ${new Date().toISOString().split('T')[0]}
**Autor:** Claude + Usuario
**Status:** AGUARDANDO APROVACAO
