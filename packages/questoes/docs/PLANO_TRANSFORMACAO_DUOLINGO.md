# Plano de Transformacao - Ouse Questoes Estilo Duolingo

**Data:** 2025-12-13
**Versao:** 1.0
**Status:** Em Planejamento

---

## 1. Resumo Executivo

Este documento detalha o plano de transformacao do app "Ouse Questoes" para uma experiencia similar ao Duolingo, incluindo:

- **Onboarding interativo** com animacoes suaves
- **Tela inicial estilo mapa de tabuleiro** com rodadas e missoes
- **Algoritmo de trilha adaptativa** com alternancia de materias
- **Sistema de massificacao** (bloqueio condicional)
- **Analytics avancados** (Raio-X do Aluno)

---

## 2. Analise do Estado Atual

### 2.1 Tecnologias Existentes
| Tecnologia | Status | Acao |
|------------|--------|------|
| React 18 + TypeScript | OK | Manter |
| Supabase (Auth + DB) | OK | Expandir schema |
| Tailwind CSS | OK | Manter |
| Gemini AI | OK | Expandir uso |
| Vite | OK | Manter |

### 2.2 Pontos de Refatoracao Necessarios

1. **App.tsx monolitico (990 linhas)** - Quebrar em componentes menores
2. **Navegacao baseada em estado** - Implementar React Router
3. **State management disperso** - Migrar para Zustand
4. **Ausencia de onboarding** - Criar fluxo completo
5. **Dashboard tradicional** - Redesenhar para mapa de tabuleiro

---

## 3. Arquitetura Proposta

### 3.1 Nova Estrutura de Pastas

```
packages/questoes/
├── src/
│   ├── app/
│   │   ├── App.tsx                    # Root component
│   │   ├── AppProviders.tsx           # Context providers wrapper
│   │   └── router.tsx                 # React Router config
│   │
│   ├── components/
│   │   ├── ui/                        # Componentes UI base
│   │   │   ├── Button.tsx
│   │   │   ├── Card.tsx
│   │   │   ├── Modal.tsx
│   │   │   ├── Toast.tsx
│   │   │   ├── Progress.tsx
│   │   │   └── animations/            # Animacoes reutilizaveis
│   │   │       ├── FadeIn.tsx
│   │   │       ├── SlideUp.tsx
│   │   │       └── Confetti.tsx
│   │   │
│   │   ├── onboarding/                # Novo: Fluxo de onboarding
│   │   │   ├── OnboardingFlow.tsx     # Controlador principal
│   │   │   ├── WelcomeStep.tsx        # Tela de boas-vindas
│   │   │   ├── GoalStep.tsx           # Selecao de objetivo
│   │   │   ├── ConcursoStep.tsx       # Selecao de concurso
│   │   │   ├── LevelStep.tsx          # Nivel de conhecimento
│   │   │   ├── ScheduleStep.tsx       # Meta diaria
│   │   │   ├── ProfileStep.tsx        # Nome e avatar
│   │   │   └── ProgressIndicator.tsx  # Indicador de progresso
│   │   │
│   │   ├── trail/                     # Novo: Mapa de trilha (core)
│   │   │   ├── TrailMap.tsx           # Mapa principal (tabuleiro)
│   │   │   ├── TrailRound.tsx         # Rodada (grupo de missoes)
│   │   │   ├── MissionNode.tsx        # No/bolinha da missao
│   │   │   ├── MissionPath.tsx        # Conexao entre nos
│   │   │   ├── RoundHeader.tsx        # Header da rodada
│   │   │   └── MissionPreview.tsx     # Preview ao clicar
│   │   │
│   │   ├── mission/                   # Novo: Execucao de missao
│   │   │   ├── MissionView.tsx        # Container da missao
│   │   │   ├── ContentPhase.tsx       # Fase 1: Teoria
│   │   │   ├── QuestionsPhase.tsx     # Fase 2: Questoes
│   │   │   ├── MassificationView.tsx  # Tela de bloqueio/refazer
│   │   │   ├── MissionComplete.tsx    # Tela de sucesso
│   │   │   └── MissionProgress.tsx    # Barra de progresso
│   │   │
│   │   ├── study/                     # Componentes de estudo (existentes refatorados)
│   │   │   ├── QuestionCard.tsx
│   │   │   ├── AnswerFeedback.tsx
│   │   │   ├── ExplanationPanel.tsx
│   │   │   └── QuestionTimer.tsx
│   │   │
│   │   ├── analytics/                 # Novo: Raio-X do Aluno
│   │   │   ├── StudentXRay.tsx        # Dashboard principal
│   │   │   ├── HeatMap.tsx            # Mapa de calor materias
│   │   │   ├── PerformanceChart.tsx   # Graficos de desempenho
│   │   │   └── ComparisonCard.tsx     # Comparativo com media
│   │   │
│   │   ├── simulados/                 # Simulados (existentes + novos)
│   │   │   ├── SimuladosList.tsx
│   │   │   ├── SimuladoExecution.tsx
│   │   │   ├── SimuladoResult.tsx
│   │   │   └── SimuladoRanking.tsx
│   │   │
│   │   ├── layout/                    # Layouts reutilizaveis
│   │   │   ├── MainLayout.tsx         # Layout principal (sidebar)
│   │   │   ├── MobileNav.tsx          # Bottom nav mobile
│   │   │   ├── Sidebar.tsx            # Sidebar desktop
│   │   │   └── Header.tsx             # Header adaptativo
│   │   │
│   │   └── auth/                      # Auth (manter existentes)
│   │       └── ...
│   │
│   ├── pages/                         # Paginas (React Router)
│   │   ├── OnboardingPage.tsx
│   │   ├── HomePage.tsx               # Mapa da trilha
│   │   ├── MissionPage.tsx            # Execucao de missao
│   │   ├── PracticePage.tsx           # Praticar questoes (sandbox)
│   │   ├── SimuladosPage.tsx          # Meus simulados
│   │   ├── StatsPage.tsx              # Raio-X do aluno
│   │   ├── StorePage.tsx              # Loja
│   │   ├── ProfilePage.tsx            # Perfil
│   │   └── ReviewPage.tsx             # Revisao espacada
│   │
│   ├── stores/                        # Zustand stores
│   │   ├── useAuthStore.ts            # Estado de autenticacao
│   │   ├── useUserStore.ts            # Dados do usuario (stats, etc)
│   │   ├── useTrailStore.ts           # Estado da trilha/missoes
│   │   ├── useMissionStore.ts         # Missao atual em execucao
│   │   ├── useOnboardingStore.ts      # Estado do onboarding
│   │   └── useUIStore.ts              # Estado de UI (modals, toasts)
│   │
│   ├── services/                      # Services (manter + expandir)
│   │   ├── supabaseClient.ts
│   │   ├── authService.ts
│   │   ├── userService.ts
│   │   ├── trailService.ts            # Novo: Logica da trilha
│   │   ├── missionService.ts          # Novo: Logica de missoes
│   │   ├── contentService.ts          # Novo: Fetch de conteudo teorico
│   │   └── analyticsService.ts        # Novo: Raio-X analytics
│   │
│   ├── hooks/                         # Custom hooks
│   │   ├── useTrail.ts                # Hook da trilha
│   │   ├── useMission.ts              # Hook de missao
│   │   ├── useQuestions.ts            # Existente
│   │   └── useAnimations.ts           # Novo: Animacoes
│   │
│   ├── lib/                           # Utilidades
│   │   ├── trailAlgorithm.ts          # Algoritmo de alternancia
│   │   ├── massification.ts           # Logica de massificacao
│   │   ├── scoreCalculator.ts         # Calculo de scores
│   │   └── animations.ts              # Helpers de animacao
│   │
│   ├── types/                         # TypeScript types
│   │   ├── trail.ts                   # Types da trilha
│   │   ├── mission.ts                 # Types de missao
│   │   ├── user.ts                    # Types de usuario
│   │   └── database.ts                # Types do Supabase
│   │
│   └── constants/                     # Constantes
│       ├── levelConfig.ts             # Config de niveis/carga
│       ├── trailConfig.ts             # Config da trilha
│       └── theme.ts                   # Cores e estilos
```

### 3.2 Schema do Banco de Dados (Novas Tabelas Supabase)

```sql
-- Preparatorios (cursos/concursos)
CREATE TABLE preparatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  banca TEXT,
  orgao TEXT,
  ano_previsto INTEGER,
  edital_url TEXT,
  raio_x JSONB, -- Analise de materias/pesos
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Materias do preparatorio com peso/ordem
CREATE TABLE preparatorio_materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparatorio_id UUID REFERENCES preparatorios(id),
  materia TEXT NOT NULL,
  peso INTEGER DEFAULT 1, -- Relevancia (1-10)
  ordem INTEGER, -- Ordem no raio-x
  total_assuntos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Assuntos de cada materia
CREATE TABLE assuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id UUID REFERENCES preparatorio_materias(id),
  nome TEXT NOT NULL,
  ordem INTEGER,
  nivel_dificuldade TEXT DEFAULT 'intermediario',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conteudo teorico (gerado por IA ou manual)
CREATE TABLE conteudos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assunto_id UUID REFERENCES assuntos(id),
  nivel TEXT NOT NULL, -- iniciante, intermediario, avancado
  texto_content TEXT,
  audio_url TEXT,
  visual_url TEXT, -- Mapa mental/infografico
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trilha do usuario (instancia personalizada)
CREATE TABLE user_trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  preparatorio_id UUID REFERENCES preparatorios(id),
  nivel_usuario TEXT DEFAULT 'iniciante',
  slot_a_materia_id UUID REFERENCES preparatorio_materias(id),
  slot_b_materia_id UUID REFERENCES preparatorio_materias(id),
  current_round INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preparatorio_id)
);

-- Rodadas da trilha
CREATE TABLE trail_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID REFERENCES user_trails(id),
  round_number INTEGER NOT NULL,
  status TEXT DEFAULT 'locked', -- locked, active, completed
  tipo TEXT DEFAULT 'normal', -- normal, revisao, simulado
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Missoes dentro de cada rodada
CREATE TABLE trail_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES trail_rounds(id),
  assunto_id UUID REFERENCES assuntos(id),
  materia_id UUID REFERENCES preparatorio_materias(id),
  ordem INTEGER NOT NULL,
  status TEXT DEFAULT 'locked', -- locked, available, in_progress, completed, massification
  tipo TEXT DEFAULT 'normal', -- normal, revisao, simulado_rodada
  score DECIMAL(5,2),
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- Respostas por missao
CREATE TABLE mission_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID REFERENCES trail_missions(id),
  user_id UUID REFERENCES auth.users(id),
  question_id TEXT NOT NULL, -- ID da questao externa
  selected_answer TEXT,
  is_correct BOOLEAN,
  time_spent INTEGER, -- Segundos
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Pool de revisao (materias finalizadas)
CREATE TABLE revision_pool (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID REFERENCES user_trails(id),
  materia_id UUID REFERENCES preparatorio_materias(id),
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- Onboarding do usuario
CREATE TABLE user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  objetivo TEXT, -- passar_concurso, estudar, revisar
  concurso_alvo TEXT,
  nivel_conhecimento TEXT, -- iniciante, intermediario, avancado
  meta_diaria INTEGER DEFAULT 30, -- minutos
  materias_dominadas TEXT[], -- Array de materias
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Simulados avulsos
CREATE TABLE simulados (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  preparatorio_id UUID REFERENCES preparatorios(id),
  duracao_minutos INTEGER DEFAULT 180,
  total_questoes INTEGER,
  is_premium BOOLEAN DEFAULT false,
  preco DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Resultados de simulados
CREATE TABLE simulado_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id),
  simulado_id UUID REFERENCES simulados(id),
  score DECIMAL(5,2),
  tempo_gasto INTEGER, -- Segundos
  ranking_position INTEGER,
  completed_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 4. Fluxos Principais

### 4.1 Fluxo de Onboarding (Novo Usuario)

```
[Splash Screen]
      |
      v
[1. Boas-vindas] - Animacao + "Vamos comecar?"
      |
      v
[2. Qual seu objetivo?]
   - Passar em concurso (primario)
   - Apenas estudar
   - Revisar materias
      |
      v
[3. Qual concurso?] - Lista de preparatorios
   - Busca por nome
   - Cards visuais
      |
      v
[4. Seu nivel de conhecimento]
   - Iniciante (nunca estudei)
   - Intermediario (ja estudei um pouco)
   - Avancado (ja fiz provas)
      |
      v
[5. Meta diaria]
   - 15 min (casual)
   - 30 min (regular)
   - 60 min (intenso)
   - 120 min (dedicacao total)
      |
      v
[6. Configurar perfil]
   - Nome
   - Avatar (selecao)
      |
      v
[7. Tudo pronto!] - Animacao celebracao
      |
      v
[Redirect -> Home (Mapa da Trilha)]
```

**Animacoes do Onboarding:**
- Transicao suave entre steps (slide left/right)
- Check animation ao selecionar opcao
- Progress bar animada no topo
- Confetti na tela final

### 4.2 Fluxo da Trilha Principal

```
[Home - Mapa da Trilha]
        |
        v
[Visualizacao do Mapa]
- Scroll vertical infinito
- Rodadas agrupadas visualmente
- Nos/bolinhas coloridas por status:
  - Cinza: Bloqueada
  - Azul: Disponivel
  - Amarelo: Em progresso
  - Verde: Concluida
  - Vermelho: Massificacao
        |
        v
[Clicar em Missao Disponivel]
        |
        v
[Preview da Missao]
- Nome do assunto
- Materia
- Numero de questoes
- Botao "Comecar"
        |
        v
[Execucao da Missao - Fase 1: Conteudo]
- Texto teorico
- Audio (opcional)
- Mapa mental (opcional)
- Botao "Entendi, vamos praticar!"
        |
        v
[Execucao da Missao - Fase 2: Questoes]
- QuestionCard (existente, adaptado)
- Progresso X/N questoes
- Sem timer (modo zen)
        |
        v
[Calculo do Score]
        |
   [Score >= 50%?]
      /        \
    SIM        NAO
     |          |
     v          v
[Missao       [Tela de Massificacao]
Completa]     - "Voce precisa revisar"
     |        - Score atual
     |        - Botao "Refazer Missao"
     |              |
     v              v
[Desbloqueia   [Reload da Missao]
Proxima]       (mesmo assunto)
     |              |
     v              |
[Animacao      <----+
Celebracao]
     |
     v
[Retorna ao Mapa]
```

### 4.3 Algoritmo de Alternancia de Materias

```typescript
// lib/trailAlgorithm.ts

interface TrailSlots {
  slotA: Materia;  // Materia primaria (maior peso)
  slotB: Materia;  // Materia secundaria
}

interface GeneratedMission {
  assunto: Assunto;
  materia: Materia;
  slot: 'A' | 'B';
}

function generateNextMissions(
  trail: UserTrail,
  lastMission: Mission | null
): GeneratedMission[] {
  const { slotA, slotB, revisionPool } = trail;

  // Determinar qual slot usar (alternancia)
  const nextSlot = lastMission?.slot === 'A' ? 'B' : 'A';
  const currentMateria = nextSlot === 'A' ? slotA : slotB;

  // Buscar proximo assunto da materia
  const nextAssunto = getNextAssunto(currentMateria);

  // Verificar se materia acabou
  if (!nextAssunto) {
    // Mover materia para pool de revisao
    addToRevisionPool(trail.id, currentMateria.id);

    // Puxar proxima materia da lista de relevancia
    const newMateria = getNextMateriaByRelevance(trail.preparatorio_id);

    if (nextSlot === 'A') {
      updateTrailSlotA(trail.id, newMateria.id);
    } else {
      updateTrailSlotB(trail.id, newMateria.id);
    }

    // Recursao com nova materia
    return generateNextMissions(trail, lastMission);
  }

  return [{
    assunto: nextAssunto,
    materia: currentMateria,
    slot: nextSlot
  }];
}
```

### 4.4 Logica de Massificacao

```typescript
// lib/massification.ts

interface MissionResult {
  missionId: string;
  totalQuestions: number;
  correctAnswers: number;
  score: number; // 0-100
}

interface MassificationCheck {
  passed: boolean;
  score: number;
  requiredScore: number;
  action: 'unlock_next' | 'massification_required';
}

const PASSING_SCORE = 50; // 50%

function checkMassification(result: MissionResult): MassificationCheck {
  const score = (result.correctAnswers / result.totalQuestions) * 100;

  if (score >= PASSING_SCORE) {
    return {
      passed: true,
      score,
      requiredScore: PASSING_SCORE,
      action: 'unlock_next'
    };
  }

  return {
    passed: false,
    score,
    requiredScore: PASSING_SCORE,
    action: 'massification_required'
  };
}

async function processMissionCompletion(
  missionId: string,
  result: MissionResult
): Promise<void> {
  const check = checkMassification(result);

  if (check.passed) {
    // Marcar missao como concluida
    await updateMissionStatus(missionId, 'completed', result.score);

    // Desbloquear proxima missao
    const nextMission = await getNextMission(missionId);
    if (nextMission) {
      await updateMissionStatus(nextMission.id, 'available');
    }

    // Atualizar stats do usuario
    await incrementUserStats({
      xp: calculateXP(result),
      coins: calculateCoins(result)
    });
  } else {
    // Marcar missao para massificacao
    await updateMissionStatus(missionId, 'massification');

    // Incrementar tentativas
    await incrementMissionAttempts(missionId);

    // Proxima missao permanece bloqueada
    // (nenhuma acao necessaria)
  }
}
```

---

## 5. Componentes Visuais Principais

### 5.1 Mapa da Trilha (TrailMap)

**Design Visual:**
```
+------------------------------------------+
|  [Header: Nome do Preparatorio + Stats]  |
+------------------------------------------+
|                                          |
|     RODADA 3 - Revisao                   |
|     ================================     |
|                                          |
|           O  (Revisao Geral)             |
|           |                              |
|     +-----+-----+                        |
|     |           |                        |
|                                          |
|     RODADA 2 - Direito + Informatica     |
|     ================================     |
|                                          |
|     O           O           O            |
|     |           |           |            |
|     +-----+-----+-----+-----+            |
|           |           |                  |
|           O           O                  |
|           |           |                  |
|     +-----+-----+-----+                  |
|           |                              |
|                                          |
|     RODADA 1 - Portugues + Matematica    |
|     ================================     |
|                                          |
|           O  (Simulado R1)               |
|           |                              |
|     +-----+-----+                        |
|     |           |                        |
|     O           O                        |
|   Port.3      Mat.3                      |
|     |           |                        |
|     +-----+-----+                        |
|           |                              |
|     O           O                        |
|   Port.2      Mat.2                      |
|     |           |                        |
|     +-----+-----+                        |
|           |                              |
|     O           O                        |
|   Port.1      Mat.1                      |
|     |           |                        |
|     +-----+-----+                        |
|           |                              |
|           *  (Inicio)                    |
|                                          |
+------------------------------------------+
|  [Bottom Nav: Home | Praticar | Stats]   |
+------------------------------------------+

Legenda:
O = Missao (bolinha)
| = Caminho/conexao
* = Ponto de inicio
```

**Estados Visuais dos Nos:**
- `locked`: Cinza com cadeado
- `available`: Azul pulsando (atencao)
- `in_progress`: Amarelo com borda animada
- `completed`: Verde com checkmark
- `massification`: Vermelho com icone de refazer

### 5.2 Componente de Missao (MissionNode)

```tsx
// components/trail/MissionNode.tsx

interface MissionNodeProps {
  mission: Mission;
  onClick: () => void;
  isNext: boolean; // Proxima missao a fazer
}

const statusStyles = {
  locked: 'bg-gray-300 cursor-not-allowed',
  available: 'bg-blue-500 hover:bg-blue-600 animate-pulse cursor-pointer',
  in_progress: 'bg-yellow-500 ring-4 ring-yellow-300 cursor-pointer',
  completed: 'bg-green-500 cursor-pointer',
  massification: 'bg-red-500 animate-bounce cursor-pointer'
};

const statusIcons = {
  locked: <Lock size={20} />,
  available: <Play size={20} />,
  in_progress: <Clock size={20} />,
  completed: <Check size={20} />,
  massification: <RefreshCw size={20} />
};
```

### 5.3 Preview de Missao

```
+----------------------------------+
|                                  |
|     [Icone da Materia]           |
|                                  |
|     Portugues                    |
|     Assunto: Concordancia Verbal |
|                                  |
|     20 questoes                  |
|     Nivel: Intermediario         |
|                                  |
|     [======= COMECAR =======]    |
|                                  |
+----------------------------------+
```

---

## 6. Fases de Implementacao

### FASE 1: Fundacao (Refatoracao Base)
**Prioridade: ALTA**

- [ ] Criar estrutura de pastas nova
- [ ] Configurar React Router v6
- [ ] Implementar Zustand stores
- [ ] Migrar AuthContext para Zustand
- [ ] Criar componentes UI base (Button, Card, Modal)
- [ ] Criar layout principal (MainLayout, MobileNav)
- [ ] Migrar servicos existentes

### FASE 2: Onboarding
**Prioridade: ALTA**

- [ ] Criar tabela `user_onboarding` no Supabase
- [ ] Implementar OnboardingFlow.tsx
- [ ] Criar steps individuais com animacoes
- [ ] Implementar logica de persistencia
- [ ] Redirect condicional baseado em onboarding completo

### FASE 3: Mapa da Trilha
**Prioridade: ALTA**

- [ ] Criar tabelas de trilha no Supabase
- [ ] Implementar TrailMap.tsx
- [ ] Criar MissionNode.tsx com estados visuais
- [ ] Implementar conexoes visuais (paths)
- [ ] Criar animacoes de scroll/navegacao
- [ ] Implementar preview de missao

### FASE 4: Sistema de Missoes
**Prioridade: ALTA**

- [ ] Criar MissionView.tsx (container)
- [ ] Implementar ContentPhase (teoria)
- [ ] Adaptar QuestionCard existente para QuestionsPhase
- [ ] Implementar calculo de score
- [ ] Criar MassificationView (tela de bloqueio)
- [ ] Implementar MissionComplete (celebracao)

### FASE 5: Algoritmo de Trilha
**Prioridade: ALTA**

- [ ] Implementar algoritmo de alternancia
- [ ] Criar logica de slots ativos
- [ ] Implementar rotacao de materias
- [ ] Criar pool de revisao
- [ ] Implementar geracao dinamica de rodadas

### FASE 6: Raio-X do Aluno
**Prioridade: MEDIA**

- [ ] Criar StudentXRay.tsx (dashboard)
- [ ] Implementar HeatMap de materias
- [ ] Criar graficos de performance
- [ ] Implementar comparativo com media
- [ ] Integrar com dados existentes

### FASE 7: Simulados
**Prioridade: MEDIA**

- [ ] Criar area de simulados avulsos
- [ ] Implementar cronometro rigido
- [ ] Criar ranking por simulado
- [ ] Implementar historico de simulados

### FASE 8: Refinamentos
**Prioridade: BAIXA**

- [ ] Modo Reta Final
- [ ] Animacoes avancadas
- [ ] PWA otimizacoes
- [ ] Performance tuning
- [ ] Testes E2E

---

## 7. Dependencias a Adicionar

```json
{
  "dependencies": {
    "react-router-dom": "^6.x",
    "zustand": "^4.x",
    "framer-motion": "^10.x",
    "@tanstack/react-query": "^5.x",
    "recharts": "^2.x"
  }
}
```

---

## 8. Metricas de Sucesso

| Metrica | Atual | Meta |
|---------|-------|------|
| Tempo no onboarding | N/A | < 3 min |
| Taxa de conclusao onboarding | N/A | > 80% |
| Sessoes diarias | ? | +50% |
| Retencao D7 | ? | > 40% |
| Missoes completadas/sessao | ? | > 3 |

---

## 9. Riscos e Mitigacoes

| Risco | Impacto | Mitigacao |
|-------|---------|-----------|
| Refatoracao muito grande | Alto | Fases incrementais, feature flags |
| Performance do mapa | Medio | Virtualizacao, lazy loading |
| Migracao de dados | Alto | Scripts de migracao, backup |
| UX complexa | Medio | Testes com usuarios reais |

---

## 10. Proximos Passos Imediatos

1. **Aprovacao do plano** - Validar com stakeholder
2. **Setup do ambiente** - Criar branch de feature
3. **Iniciar FASE 1** - Refatoracao base
4. **Reuniao de design** - Validar UI/UX do mapa

---

**Documento criado por:** Claude (AI Assistant)
**Revisao necessaria:** Sim - Aguardando aprovacao do usuario
