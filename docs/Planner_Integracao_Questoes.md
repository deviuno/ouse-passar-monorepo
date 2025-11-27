# Planner: Integração de Questões - Ouse Passar

> **Versão:** 1.0
> **Data:** 27/11/2025
> **Projetos Envolvidos:** site-ouse (Admin), Ouse-Questoes (App), n8n (Automação)

---

## 1. Visão Geral

### 1.1 Objetivo

Criar um sistema automatizado onde o administrador pode criar simulados/preparatórios fazendo upload de um edital de concurso. Um agente de IA (via n8n) interpretará o edital e selecionará automaticamente as questões relevantes do banco de dados externo (78.908 questões), disponibilizando-as no aplicativo de questões para os usuários.

### 1.2 Arquitetura dos Projetos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                            ECOSSISTEMA OUSE PASSAR                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐     ┌──────────────────────┐                     │
│  │     site-ouse        │     │    Ouse-Questoes     │                     │
│  │   (Painel Admin)     │     │   (App do Usuário)   │                     │
│  │                      │     │                      │                     │
│  │  - Blog              │     │  - Simulados         │                     │
│  │  - Artigos           │     │  - Questões          │                     │
│  │  - Autores           │     │  - Flashcards        │                     │
│  │  - Simulados/Prep    │     │  - Revisão           │                     │
│  │  - Upload Editais    │     │  - Gamificação       │                     │
│  └──────────┬───────────┘     └──────────┬───────────┘                     │
│             │                            │                                  │
│             │         ┌──────────────────┤                                  │
│             │         │                  │                                  │
│             ▼         ▼                  ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SUPABASE - ousepassar                           │   │
│  │                   (avlttxzppcywybiaxxzd)                            │   │
│  │                                                                     │   │
│  │  Tabelas: user_profiles, courses, user_answers, user_reviews,      │   │
│  │           user_flashcards, study_sessions, artigos, categories...  │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│             │                            │                                  │
│             │                            ▼                                  │
│             │         ┌─────────────────────────────────────────────┐      │
│             │         │     SUPABASE - Banco de Questões            │      │
│             │         │       (swzosaapqtyhmwdiwdje)                │      │
│             │         │                                             │      │
│             │         │  Tabela: questoes_concurso (78.908 questões)│      │
│             │         │  Alimentado via n8n (scrapping automático)  │      │
│             │         └─────────────────────────────────────────────┘      │
│             │                                                               │
│             ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                            N8N                                      │   │
│  │                                                                     │   │
│  │  - Scrapping de questões (alimenta banco externo)                  │   │
│  │  - Agente IA para interpretação de editais                         │   │
│  │  - Geração automática de filtros                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Projetos Supabase

### 2.1 Projeto Principal - ousepassar

| Propriedade | Valor |
|-------------|-------|
| **Project ID** | `avlttxzppcywybiaxxzd` |
| **URL** | `https://avlttxzppcywybiaxxzd.supabase.co` |
| **Região** | `sa-east-1` (São Paulo) |
| **Status** | ACTIVE_HEALTHY |

**Responsável por:**
- Dados de usuários (perfis, XP, moedas, streaks)
- Cursos/Simulados (definição e filtros)
- Respostas dos usuários
- Sistema de revisão espaçada
- Flashcards
- Sessões de estudo
- Blog e artigos (site-ouse)

### 2.2 Banco de Questões - Scrapping

| Propriedade | Valor |
|-------------|-------|
| **Project ID** | `swzosaapqtyhmwdiwdje` |
| **URL** | `https://swzosaapqtyhmwdiwdje.supabase.co` |
| **Região** | `sa-east-1` (São Paulo) |
| **Status** | ACTIVE_HEALTHY |
| **Total de Questões** | **78.908** |

**Responsável por:**
- Armazenamento do banco de questões
- Alimentado automaticamente via n8n (scrapping)

---

## 3. Estrutura de Dados

### 3.1 Tabela `courses` (Projeto Principal)

Esta tabela armazena os simulados/preparatórios e seus filtros de questões.

```sql
CREATE TABLE courses (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  price NUMERIC,
  is_active BOOLEAN DEFAULT true,

  -- Campos para integração com banco de questões
  question_filters JSONB DEFAULT '{}',  -- Filtros gerados pela IA
  questions_count INTEGER DEFAULT 0,     -- Total de questões disponíveis

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Exemplo de `question_filters`:**
```json
{
  "materias": ["Direito Constitucional", "Direito Administrativo", "Direito Penal"],
  "bancas": ["CEBRASPE", "CESPE"],
  "anos": [2019, 2020, 2021, 2022, 2023, 2024],
  "orgaos": ["PRF", "PF"],
  "assuntos": ["Direitos Fundamentais", "Atos Administrativos", "Crimes contra a Administração"],
  "excludeIds": [],
  "limit": 2000
}
```

### 3.2 Tabela `questoes_concurso` (Banco de Questões)

```sql
CREATE TABLE questoes_concurso (
  id BIGINT PRIMARY KEY,
  materia TEXT NOT NULL,
  assunto TEXT,
  concurso TEXT,
  enunciado TEXT NOT NULL,
  alternativas JSON NOT NULL,
  gabarito CHAR(1),
  comentario TEXT,
  orgao TEXT,
  cargo_area_especialidade_edicao TEXT,
  prova TEXT,
  ano INTEGER,
  banca TEXT,
  imagens_enunciado TEXT,
  imagens_comentario TEXT[],
  questao_revisada TEXT,
  created_at TIMESTAMP DEFAULT now()
);
```

### 3.3 Nova Tabela Sugerida: `editais`

Para armazenar os editais enviados e o resultado da análise da IA:

```sql
CREATE TABLE editais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT REFERENCES courses(id),

  -- Arquivo do edital
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,

  -- Status do processamento
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'error')),

  -- Resultado da análise da IA
  ai_analysis JSONB,                    -- Análise completa do edital
  suggested_filters JSONB,              -- Filtros sugeridos pela IA
  matched_questions_count INTEGER,      -- Quantidade de questões encontradas

  -- Metadados do concurso extraídos
  concurso_nome TEXT,
  orgao TEXT,
  banca TEXT,
  ano INTEGER,
  cargos TEXT[],

  -- Logs e erros
  processing_log TEXT,
  error_message TEXT,

  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);
```

---

## 4. Fluxo Detalhado

### 4.1 Fluxo de Criação de Simulado

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        ETAPA 1: UPLOAD DO EDITAL                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Admin acessa: /admin/preparatorios/new                                 │
│  2. Preenche dados básicos (título, descrição, preço)                      │
│  3. Seleciona tipo: "Simulado" ou "Preparatório"                           │
│  4. Faz upload do PDF do edital                                            │
│  5. Sistema salva arquivo no Supabase Storage                              │
│  6. Cria registro na tabela `editais` com status "pending"                 │
│  7. Dispara webhook para n8n                                               │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                     ETAPA 2: PROCESSAMENTO NO N8N                           │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  WORKFLOW: "Processar Edital de Concurso"                                  │
│                                                                             │
│  1. Webhook recebe notificação com ID do edital                            │
│  2. Busca dados do edital no Supabase                                      │
│  3. Download do PDF do Storage                                             │
│  4. Extração de texto do PDF                                               │
│  5. Agente IA analisa o conteúdo:                                          │
│     - Identifica órgão, banca, ano                                         │
│     - Lista matérias/disciplinas do edital                                 │
│     - Identifica cargos e especialidades                                   │
│     - Mapeia assuntos específicos                                          │
│                                                                             │
│  6. Consulta banco de questões para validar filtros                        │
│  7. Gera `suggested_filters` otimizados                                    │
│  8. Conta questões que matcham os filtros                                  │
│  9. Atualiza registro do edital com resultados                             │
│  10. Notifica admin (email/webhook) que análise está pronta                │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                      ETAPA 3: APROVAÇÃO DO ADMIN                            │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. Admin recebe notificação de análise concluída                          │
│  2. Acessa página de revisão do simulado                                   │
│  3. Visualiza:                                                             │
│     - Resumo do edital interpretado pela IA                                │
│     - Filtros sugeridos                                                    │
│     - Quantidade de questões encontradas                                   │
│     - Preview de algumas questões de exemplo                               │
│                                                                             │
│  4. Admin pode:                                                            │
│     - Aprovar filtros como estão                                           │
│     - Ajustar filtros manualmente                                          │
│     - Adicionar/remover matérias                                           │
│     - Excluir questões específicas                                         │
│     - Definir limite de questões                                           │
│                                                                             │
│  5. Ao aprovar:                                                            │
│     - Cria/atualiza registro em `courses`                                  │
│     - Salva `question_filters` final                                       │
│     - Atualiza `questions_count`                                           │
│     - Marca `is_active = true`                                             │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                    ETAPA 4: DISPONÍVEL NO APP                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  1. App Ouse-Questoes lista cursos ativos                                  │
│  2. Usuário seleciona o simulado                                           │
│  3. App busca `question_filters` do curso                                  │
│  4. Executa query no banco de questões externo com os filtros              │
│  5. Retorna questões para o usuário responder                              │
│  6. Registra respostas em `user_answers`                                   │
│  7. Atualiza progresso, XP, streaks                                        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## 5. Implementação Detalhada

### 5.1 Site-Ouse (Painel Admin)

#### 5.1.1 Páginas a Criar/Modificar

| Página | Caminho | Descrição |
|--------|---------|-----------|
| Lista de Simulados | `/admin/preparatorios` | Listar todos os simulados com status |
| Novo Simulado | `/admin/preparatorios/new` | Criar simulado com upload de edital |
| Editar Simulado | `/admin/preparatorios/edit/:id` | Editar e aprovar filtros |
| Revisar Análise | `/admin/preparatorios/:id/review` | Revisar análise da IA |

#### 5.1.2 Componentes Necessários

```typescript
// components/admin/SimuladoForm.tsx
// - Formulário de criação com upload de PDF
// - Campos: título, descrição, preço, tipo, edital

// components/admin/EditalUploader.tsx
// - Componente de upload de PDF para Supabase Storage
// - Progress bar, validação de tipo de arquivo

// components/admin/FilterReview.tsx
// - Exibição dos filtros sugeridos pela IA
// - Edição manual de filtros
// - Preview de questões

// components/admin/QuestionPreview.tsx
// - Lista de questões de exemplo que matcham os filtros
// - Opção de excluir questões específicas
```

#### 5.1.3 Services Necessários

```typescript
// services/simuladoService.ts

export interface Simulado {
  id: string;
  title: string;
  subtitle?: string;
  description?: string;
  price?: number;
  is_active: boolean;
  question_filters: QuestionFilters;
  questions_count: number;
  edital?: Edital;
}

export interface Edital {
  id: string;
  file_url: string;
  status: 'pending' | 'processing' | 'completed' | 'error';
  ai_analysis?: AIAnalysis;
  suggested_filters?: QuestionFilters;
  matched_questions_count?: number;
}

export interface QuestionFilters {
  materias?: string[];
  bancas?: string[];
  anos?: number[];
  orgaos?: string[];
  assuntos?: string[];
  excludeIds?: number[];
  limit?: number;
}

export interface AIAnalysis {
  concurso_nome: string;
  orgao: string;
  banca: string;
  ano: number;
  cargos: string[];
  materias_identificadas: MateriaIdentificada[];
  resumo: string;
}

export interface MateriaIdentificada {
  nome: string;
  peso?: number;
  assuntos: string[];
  questoes_encontradas: number;
}

// Funções do service
export async function createSimulado(data: CreateSimuladoInput): Promise<Simulado>;
export async function uploadEdital(simuladoId: string, file: File): Promise<Edital>;
export async function getEditalStatus(editalId: string): Promise<Edital>;
export async function approveFilters(simuladoId: string, filters: QuestionFilters): Promise<Simulado>;
export async function previewQuestions(filters: QuestionFilters, limit?: number): Promise<Question[]>;
export async function countMatchingQuestions(filters: QuestionFilters): Promise<number>;
```

### 5.2 N8N Workflow

#### 5.2.1 Workflow: Processar Edital

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Webhook   │───▶│  Supabase   │───▶│  Download   │───▶│  Extract    │
│   Trigger   │    │  Get Edital │    │    PDF      │    │   Text      │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
                                                                │
                                                                ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│  Supabase   │◀───│   Count     │◀───│   Query     │◀───│  AI Agent   │
│   Update    │    │  Questions  │    │  Questions  │    │   Gemini    │
└─────────────┘    └─────────────┘    └─────────────┘    └─────────────┘
       │
       ▼
┌─────────────┐
│   Notify    │
│    Admin    │
└─────────────┘
```

#### 5.2.2 Prompt do Agente IA

```markdown
# Agente Analisador de Editais de Concursos

## Contexto
Você é um especialista em concursos públicos brasileiros. Sua tarefa é analisar editais
de concursos e extrair informações estruturadas para criar filtros de busca em um banco
de questões.

## Banco de Questões Disponível
O banco possui questões com os seguintes campos para filtro:
- materia: Nome da disciplina (ex: "Direito Constitucional", "Português")
- assunto: Tópico específico dentro da matéria
- banca: Organizadora do concurso (ex: "CEBRASPE", "FCC", "FGV")
- orgao: Órgão do concurso (ex: "PRF", "PF", "TRT")
- ano: Ano da prova (2015-2024)

## Matérias Disponíveis no Banco
[Lista de matérias únicas do banco será injetada aqui]

## Bancas Disponíveis no Banco
[Lista de bancas únicas do banco será injetada aqui]

## Sua Tarefa
Analise o edital fornecido e retorne um JSON estruturado com:

1. **Informações do Concurso**
   - Nome completo do concurso
   - Órgão realizador
   - Banca organizadora
   - Ano do edital
   - Cargos oferecidos

2. **Mapeamento de Matérias**
   Para cada disciplina do edital:
   - Identifique a matéria correspondente no banco
   - Liste os assuntos específicos mencionados
   - Sugira o peso/importância baseado no edital

3. **Filtros Sugeridos**
   Gere os filtros otimizados considerando:
   - Priorizar bancas similares (mesma banca > bancas do mesmo estilo)
   - Questões mais recentes têm prioridade
   - Balancear quantidade por matéria conforme peso no edital

## Formato de Saída
{
  "concurso": {
    "nome": "string",
    "orgao": "string",
    "banca": "string",
    "ano": number,
    "cargos": ["string"]
  },
  "materias": [
    {
      "nome_edital": "string",
      "nome_banco": "string",
      "peso": number,
      "assuntos": ["string"]
    }
  ],
  "filtros_sugeridos": {
    "materias": ["string"],
    "bancas": ["string"],
    "anos": [number],
    "orgaos": ["string"],
    "assuntos": ["string"]
  },
  "resumo": "string com análise geral do edital"
}
```

#### 5.2.3 Queries para o Banco de Questões

```sql
-- Buscar matérias únicas disponíveis
SELECT DISTINCT materia FROM questoes_concurso ORDER BY materia;

-- Buscar bancas únicas disponíveis
SELECT DISTINCT banca FROM questoes_concurso WHERE banca IS NOT NULL ORDER BY banca;

-- Buscar assuntos por matéria
SELECT DISTINCT assunto
FROM questoes_concurso
WHERE materia = $1 AND assunto IS NOT NULL
ORDER BY assunto;

-- Contar questões com filtros
SELECT COUNT(*) as total
FROM questoes_concurso
WHERE
  ($1::text[] IS NULL OR materia = ANY($1))
  AND ($2::text[] IS NULL OR banca = ANY($2))
  AND ($3::int[] IS NULL OR ano = ANY($3))
  AND ($4::text[] IS NULL OR orgao = ANY($4))
  AND ($5::text[] IS NULL OR assunto = ANY($5))
  AND ($6::int[] IS NULL OR id != ALL($6));

-- Buscar questões de exemplo
SELECT id, materia, assunto, banca, ano, enunciado
FROM questoes_concurso
WHERE
  ($1::text[] IS NULL OR materia = ANY($1))
  AND ($2::text[] IS NULL OR banca = ANY($2))
  AND ($3::int[] IS NULL OR ano = ANY($3))
ORDER BY ano DESC, RANDOM()
LIMIT 10;
```

### 5.3 Ouse-Questoes (App)

#### 5.3.1 Service de Questões Externas

O arquivo `services/externalQuestionsService.ts` deve implementar:

```typescript
// services/externalQuestionsService.ts

import { questionsDb, ExternalQuestion, CourseQuestionFilters } from './questionsDbClient';

/**
 * Busca questões do banco externo baseado nos filtros do curso
 */
export async function getQuestionsForCourse(
  filters: CourseQuestionFilters,
  options?: {
    limit?: number;
    offset?: number;
    randomize?: boolean;
    excludeAnswered?: number[]; // IDs de questões já respondidas pelo usuário
  }
): Promise<ExternalQuestion[]> {
  let query = questionsDb
    .from('questoes_concurso')
    .select('*');

  // Aplicar filtros
  if (filters.materias?.length) {
    query = query.in('materia', filters.materias);
  }

  if (filters.bancas?.length) {
    query = query.in('banca', filters.bancas);
  }

  if (filters.anos?.length) {
    query = query.in('ano', filters.anos);
  }

  if (filters.orgaos?.length) {
    query = query.in('orgao', filters.orgaos);
  }

  if (filters.assuntos?.length) {
    query = query.in('assunto', filters.assuntos);
  }

  if (filters.excludeIds?.length) {
    query = query.not('id', 'in', `(${filters.excludeIds.join(',')})`);
  }

  if (options?.excludeAnswered?.length) {
    query = query.not('id', 'in', `(${options.excludeAnswered.join(',')})`);
  }

  // Paginação
  const limit = options?.limit || filters.limit || 1000;
  const offset = options?.offset || 0;

  query = query.range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) throw error;

  // Randomizar se solicitado
  if (options?.randomize && data) {
    return shuffleArray(data);
  }

  return data || [];
}

/**
 * Conta total de questões disponíveis para um filtro
 */
export async function countQuestionsForFilters(
  filters: CourseQuestionFilters
): Promise<number> {
  let query = questionsDb
    .from('questoes_concurso')
    .select('id', { count: 'exact', head: true });

  if (filters.materias?.length) {
    query = query.in('materia', filters.materias);
  }

  if (filters.bancas?.length) {
    query = query.in('banca', filters.bancas);
  }

  if (filters.anos?.length) {
    query = query.in('ano', filters.anos);
  }

  const { count, error } = await query;

  if (error) throw error;

  return count || 0;
}

/**
 * Busca estatísticas do banco de questões
 */
export async function getQuestionsStats(): Promise<{
  total: number;
  byMateria: Record<string, number>;
  byBanca: Record<string, number>;
  byAno: Record<number, number>;
}> {
  // Implementar queries de agregação
}

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}
```

#### 5.3.2 Hook para Carregar Questões do Simulado

```typescript
// hooks/useSimuladoQuestions.ts

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabaseClient';
import { getQuestionsForCourse } from '../services/externalQuestionsService';
import { ExternalQuestion, CourseQuestionFilters } from '../services/questionsDbClient';

interface UseSimuladoQuestionsResult {
  questions: ExternalQuestion[];
  loading: boolean;
  error: Error | null;
  totalCount: number;
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
}

export function useSimuladoQuestions(
  courseId: string,
  options?: {
    pageSize?: number;
    excludeAnswered?: boolean;
    randomize?: boolean;
  }
): UseSimuladoQuestionsResult {
  const [questions, setQuestions] = useState<ExternalQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [filters, setFilters] = useState<CourseQuestionFilters | null>(null);
  const [offset, setOffset] = useState(0);

  const pageSize = options?.pageSize || 20;

  // Carregar filtros do curso
  useEffect(() => {
    async function loadCourseFilters() {
      try {
        const { data, error } = await supabase
          .from('courses')
          .select('question_filters, questions_count')
          .eq('id', courseId)
          .single();

        if (error) throw error;

        setFilters(data.question_filters);
        setTotalCount(data.questions_count);
      } catch (err) {
        setError(err as Error);
      }
    }

    loadCourseFilters();
  }, [courseId]);

  // Carregar questões quando filtros estiverem disponíveis
  useEffect(() => {
    if (!filters) return;

    async function loadQuestions() {
      setLoading(true);
      try {
        const data = await getQuestionsForCourse(filters, {
          limit: pageSize,
          offset: 0,
          randomize: options?.randomize,
        });

        setQuestions(data);
        setOffset(pageSize);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    }

    loadQuestions();
  }, [filters, pageSize, options?.randomize]);

  const loadMore = useCallback(async () => {
    if (!filters || loading) return;

    setLoading(true);
    try {
      const data = await getQuestionsForCourse(filters, {
        limit: pageSize,
        offset,
        randomize: false,
      });

      setQuestions(prev => [...prev, ...data]);
      setOffset(prev => prev + pageSize);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters, offset, pageSize, loading]);

  const refresh = useCallback(async () => {
    if (!filters) return;

    setLoading(true);
    setOffset(0);
    try {
      const data = await getQuestionsForCourse(filters, {
        limit: pageSize,
        offset: 0,
        randomize: options?.randomize,
      });

      setQuestions(data);
      setOffset(pageSize);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, [filters, pageSize, options?.randomize]);

  return {
    questions,
    loading,
    error,
    totalCount,
    loadMore,
    refresh,
  };
}
```

---

## 6. Configurações de Ambiente

### 6.1 Site-Ouse (.env.local)

```bash
# Supabase Principal
VITE_SUPABASE_URL=https://avlttxzppcywybiaxxzd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Banco de Questões (para preview no admin)
VITE_QUESTIONS_DB_URL=https://swzosaapqtyhmwdiwdje.supabase.co
VITE_QUESTIONS_DB_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# N8N Webhook
VITE_N8N_WEBHOOK_URL=https://n8n.ousepassar.com/webhook/processar-edital

# Google AI (já existe)
VITE_GEMINI_API_KEY=...
```

### 6.2 Ouse-Questoes (.env)

```bash
# Supabase Principal
VITE_SUPABASE_URL=https://avlttxzppcywybiaxxzd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Banco de Questões Externo
VITE_QUESTIONS_DB_URL=https://swzosaapqtyhmwdiwdje.supabase.co
VITE_QUESTIONS_DB_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 6.3 N8N Credentials

```json
{
  "supabase_main": {
    "url": "https://avlttxzppcywybiaxxzd.supabase.co",
    "serviceKey": "SERVICE_ROLE_KEY_AQUI"
  },
  "supabase_questions": {
    "url": "https://swzosaapqtyhmwdiwdje.supabase.co",
    "serviceKey": "SERVICE_ROLE_KEY_AQUI"
  },
  "gemini": {
    "apiKey": "GEMINI_API_KEY_AQUI"
  }
}
```

---

## 7. Migrations SQL

### 7.1 Criar Tabela de Editais

```sql
-- Migration: create_editais_table
-- Projeto: ousepassar (avlttxzppcywybiaxxzd)

CREATE TABLE IF NOT EXISTS editais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,

  -- Arquivo
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,

  -- Status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'error')),

  -- Análise da IA
  ai_analysis JSONB,
  suggested_filters JSONB,
  matched_questions_count INTEGER,

  -- Dados do concurso
  concurso_nome TEXT,
  orgao TEXT,
  banca TEXT,
  ano INTEGER,
  cargos TEXT[],

  -- Logs
  processing_log TEXT,
  error_message TEXT,

  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id)
);

-- Índices
CREATE INDEX idx_editais_course_id ON editais(course_id);
CREATE INDEX idx_editais_status ON editais(status);

-- RLS
ALTER TABLE editais ENABLE ROW LEVEL SECURITY;

-- Política: apenas admins podem acessar
CREATE POLICY "Admins can manage editais" ON editais
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
```

### 7.2 Adicionar Tipo aos Courses

```sql
-- Migration: add_course_type
-- Projeto: ousepassar (avlttxzppcywybiaxxzd)

-- Adicionar coluna de tipo
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'preparatorio'
CHECK (course_type IN ('preparatorio', 'simulado'));

-- Adicionar coluna de edital associado
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS edital_id UUID REFERENCES editais(id);

-- Índice
CREATE INDEX idx_courses_type ON courses(course_type);
```

### 7.3 Storage Bucket para Editais

```sql
-- Criar bucket para editais
INSERT INTO storage.buckets (id, name, public)
VALUES ('editais', 'editais', false)
ON CONFLICT (id) DO NOTHING;

-- Política de upload (apenas autenticados)
CREATE POLICY "Authenticated users can upload editais"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'editais');

-- Política de leitura (apenas autenticados)
CREATE POLICY "Authenticated users can read editais"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'editais');
```

---

## 8. Checklist de Implementação

### 8.1 Fase 1: Infraestrutura

- [ ] Criar tabela `editais` no Supabase
- [ ] Adicionar coluna `course_type` na tabela `courses`
- [ ] Criar bucket de storage para editais
- [ ] Configurar políticas de RLS

### 8.2 Fase 2: Site-Ouse (Admin)

- [ ] Criar página de listagem de simulados
- [ ] Criar formulário de novo simulado com upload
- [ ] Implementar componente de upload de PDF
- [ ] Criar página de revisão de análise da IA
- [ ] Implementar edição manual de filtros
- [ ] Adicionar preview de questões
- [ ] Integrar com webhook do n8n

### 8.3 Fase 3: N8N Workflow

- [ ] Criar workflow de processamento de edital
- [ ] Configurar extração de texto de PDF
- [ ] Implementar agente IA para análise
- [ ] Criar queries de validação no banco de questões
- [ ] Configurar notificações para admin

### 8.4 Fase 4: Ouse-Questoes (App)

- [ ] Implementar `externalQuestionsService.ts`
- [ ] Criar hook `useSimuladoQuestions`
- [ ] Integrar listagem de cursos com filtro por tipo
- [ ] Implementar fluxo de questões do simulado
- [ ] Testar integração completa

### 8.5 Fase 5: Testes e Deploy

- [ ] Testes de integração entre projetos
- [ ] Testes de carga no banco de questões
- [ ] Validação de filtros com editais reais
- [ ] Deploy em produção
- [ ] Monitoramento e ajustes

---

## 9. Considerações Técnicas

### 9.1 Performance

- **Índices no Banco de Questões:** Garantir índices em `materia`, `banca`, `ano`, `orgao`, `assunto`
- **Paginação:** Sempre usar paginação ao buscar questões (máximo 100 por request)
- **Cache:** Considerar cache de filtros de cursos no app
- **Lazy Loading:** Carregar questões sob demanda conforme usuário avança

### 9.2 Segurança

- **RLS:** Row Level Security em todas as tabelas sensíveis
- **Storage:** Bucket de editais deve ser privado
- **Service Keys:** Usar service role key apenas no n8n (server-side)
- **Validação:** Validar tipo de arquivo no upload (apenas PDF)

### 9.3 Escalabilidade

- **Banco de Questões:** Preparado para crescer (já tem 78.908 questões)
- **Filtros JSONB:** Flexível para adicionar novos critérios
- **N8N:** Pode processar múltiplos editais em paralelo

---

## 10. Próximos Passos

1. **Revisar este documento** com stakeholders
2. **Priorizar fases** de implementação
3. **Criar issues/tasks** para cada item do checklist
4. **Iniciar pela Fase 1** (infraestrutura)
5. **Desenvolver em paralelo** Site-Ouse e N8N
6. **Integrar com App** após admin funcional

---

> **Nota:** Este documento deve ser atualizado conforme o desenvolvimento avança e novas decisões são tomadas.
