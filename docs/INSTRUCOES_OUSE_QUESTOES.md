# Instruções de Integração - Ouse Questões (App Mobile)

## Contexto

O projeto **Ouse Passar (site-ouse)** é o painel administrativo onde criamos e gerenciamos simulados/preparatórios. O projeto **Ouse Questões** é o aplicativo mobile onde os usuários respondem as questões.

Este documento contém as instruções para integrar o app Ouse Questões com o backend Supabase já configurado no site Ouse Passar.

---

## 1. O Que Já Foi Feito no Site (Ouse Passar)

### 1.1 Banco de Dados Supabase (Projeto Principal)

**Project ID:** `avlttxzppcywybiaxxzd`
**URL:** `https://avlttxzppcywybiaxxzd.supabase.co`

#### Tabela `courses` (Simulados/Preparatórios)
```sql
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT false,
  course_type TEXT DEFAULT 'simulado', -- 'simulado' ou 'preparatorio'
  question_filters JSONB DEFAULT '{}',
  questions_count INTEGER DEFAULT 0,
  edital_id UUID REFERENCES editais(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

#### Estrutura do campo `question_filters` (JSONB)
```json
{
  "materias": ["Direito Constitucional", "Português"],
  "bancas": ["CESPE", "FCC"],
  "anos": [2023, 2024],
  "orgaos": ["Polícia Federal", "TRF"],
  "assuntos": ["Princípios Fundamentais"],
  "limit": 100
}
```

#### Tabela `editais` (Editais de Concursos)
```sql
CREATE TABLE editais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'analyzed', 'approved', 'error'
  ai_analysis JSONB,
  suggested_filters JSONB,
  matched_questions_count INTEGER,
  concurso_nome TEXT,
  orgao TEXT,
  banca TEXT,
  ano INTEGER,
  cargos TEXT[],
  processing_log TEXT,
  error_message TEXT,
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by UUID,
  n8n_execution_id TEXT,
  webhook_response JSONB
);
```

### 1.2 Banco de Dados de Questões (Projeto Separado)

**Project ID:** `swzosaapqtyhmwdiwdje`
**URL:** `https://swzosaapqtyhmwdiwdje.supabase.co`

#### Tabela `questoes_concurso`
```sql
-- Esta tabela já existe e contém as questões de concursos
-- Estrutura principal:
CREATE TABLE questoes_concurso (
  id SERIAL PRIMARY KEY,
  materia TEXT,
  assunto TEXT,
  concurso TEXT,
  enunciado TEXT,
  alternativas JSONB, -- {"a": "...", "b": "...", "c": "...", "d": "...", "e": "..."}
  gabarito TEXT,
  comentario TEXT,
  orgao TEXT,
  cargo_area_especialidade_edicao TEXT,
  prova TEXT,
  ano INTEGER,
  banca TEXT,
  imagens_enunciado TEXT,
  imagens_comentario TEXT[],
  questao_revisada TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 1.3 Storage Buckets Configurados

- **`editais`** - PDFs de editais (privado)
- **`course-images`** - Imagens de capa dos cursos (público)

### 1.4 Funcionalidades do Admin

O painel admin permite:
1. Criar simulados de duas formas:
   - **Via Edital**: Upload de PDF para análise por IA
   - **Manual**: Seleção direta de filtros (matérias, bancas, anos, órgãos)
2. Adicionar imagem de capa
3. Definir preço (ou gratuito)
4. Ativar/desativar simulados
5. Preview de questões correspondentes aos filtros

---

## 2. O Que Precisa Ser Feito no App (Ouse Questões)

### 2.1 PROBLEMA IDENTIFICADO

**O app Ouse Questões NÃO está buscando os simulados do Supabase.** Os dados parecem estar hardcoded ou em uma fonte diferente. Quando alteramos o nome de um simulado no Supabase, o app continua mostrando o nome antigo.

### 2.2 Configuração do Supabase

O app precisa se conectar a **DOIS** projetos Supabase:

#### Projeto Principal (Cursos/Simulados)
```env
SUPABASE_URL=https://avlttxzppcywybiaxxzd.supabase.co
SUPABASE_ANON_KEY=<chave_anon_do_projeto_principal>
```

#### Projeto de Questões
```env
QUESTIONS_DB_URL=https://swzosaapqtyhmwdiwdje.supabase.co
QUESTIONS_DB_ANON_KEY=<chave_anon_do_projeto_questoes>
```

### 2.3 Buscar Simulados do Supabase

Criar ou atualizar o serviço para buscar simulados:

```typescript
// services/coursesService.ts
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  icon: string | null;
  image_url: string | null;
  price: number | null;
  is_active: boolean;
  course_type: 'simulado' | 'preparatorio';
  question_filters: QuestionFilters;
  questions_count: number;
  created_at: string;
}

export interface QuestionFilters {
  materias?: string[];
  bancas?: string[];
  anos?: number[];
  orgaos?: string[];
  assuntos?: string[];
  limit?: number;
}

/**
 * Buscar todos os simulados ativos
 */
export async function getActiveSimulados(): Promise<Course[]> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('is_active', true)
    .eq('course_type', 'simulado')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching simulados:', error);
    return [];
  }

  return data || [];
}

/**
 * Buscar um simulado por ID
 */
export async function getSimuladoById(id: string): Promise<Course | null> {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching simulado:', error);
    return null;
  }

  return data;
}
```

### 2.4 Buscar Questões do Banco de Questões

```typescript
// services/questionsService.ts
import { createClient } from '@supabase/supabase-js';

const questionsDb = createClient(
  process.env.QUESTIONS_DB_URL!,
  process.env.QUESTIONS_DB_ANON_KEY!
);

export interface Question {
  id: number;
  materia: string;
  assunto: string | null;
  enunciado: string;
  alternativas: {
    a?: string;
    b?: string;
    c?: string;
    d?: string;
    e?: string;
  };
  gabarito: string | null;
  comentario: string | null;
  orgao: string | null;
  ano: number | null;
  banca: string | null;
}

/**
 * Buscar questões baseado nos filtros do simulado
 */
export async function getQuestionsForSimulado(
  filters: QuestionFilters,
  options?: { limit?: number; offset?: number; randomize?: boolean }
): Promise<Question[]> {
  let query = questionsDb
    .from('questoes_concurso')
    .select('*');

  // Aplicar filtros
  if (filters.materias && filters.materias.length > 0) {
    query = query.in('materia', filters.materias);
  }

  if (filters.bancas && filters.bancas.length > 0) {
    query = query.in('banca', filters.bancas);
  }

  if (filters.anos && filters.anos.length > 0) {
    query = query.in('ano', filters.anos);
  }

  if (filters.orgaos && filters.orgaos.length > 0) {
    query = query.in('orgao', filters.orgaos);
  }

  if (filters.assuntos && filters.assuntos.length > 0) {
    query = query.in('assunto', filters.assuntos);
  }

  // Paginação
  const limit = options?.limit || filters.limit || 50;
  const offset = options?.offset || 0;

  query = query
    .order('ano', { ascending: false })
    .range(offset, offset + limit - 1);

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching questions:', error);
    return [];
  }

  let questions = data || [];

  // Embaralhar se solicitado
  if (options?.randomize && questions.length > 0) {
    questions = shuffleArray(questions);
  }

  return questions;
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

### 2.5 Fluxo de Uso no App

```typescript
// Exemplo de uso em uma tela de simulado

// 1. Carregar lista de simulados disponíveis
const simulados = await getActiveSimulados();

// 2. Quando usuário seleciona um simulado
const simulado = await getSimuladoById(simuladoId);

// 3. Carregar questões do simulado
const questions = await getQuestionsForSimulado(
  simulado.question_filters,
  { randomize: true }
);

// 4. Exibir questões para o usuário responder
```

### 2.6 Checklist de Implementação

- [ ] Configurar variáveis de ambiente com URLs e chaves dos dois Supabase
- [ ] Criar/atualizar cliente Supabase para projeto principal (cursos)
- [ ] Criar cliente Supabase para projeto de questões
- [ ] Implementar `getActiveSimulados()` - buscar simulados ativos
- [ ] Implementar `getSimuladoById()` - buscar simulado específico
- [ ] Implementar `getQuestionsForSimulado()` - buscar questões com filtros
- [ ] Atualizar tela de listagem de simulados para usar dados do Supabase
- [ ] Atualizar tela de simulado para carregar questões dinamicamente
- [ ] Exibir imagem de capa do simulado (`image_url`)
- [ ] Exibir preço ou "Gratuito" baseado no campo `price`
- [ ] Remover dados hardcoded/mockados

---

## 3. Credenciais Necessárias

Para obter as chaves `anon` dos projetos Supabase:

1. Acesse https://supabase.com/dashboard
2. Selecione o projeto
3. Vá em Settings > API
4. Copie a `anon` key (não a `service_role`)

### Projeto Principal (avlttxzppcywybiaxxzd)
- URL: `https://avlttxzppcywybiaxxzd.supabase.co`
- Anon Key: [obter no dashboard]

### Projeto Questões (swzosaapqtyhmwdiwdje)
- URL: `https://swzosaapqtyhmwdiwdje.supabase.co`
- Anon Key: [obter no dashboard]

---

## 4. Testes de Validação

Após implementar, verificar:

1. **Listagem**: Os simulados criados no admin aparecem no app?
2. **Atualização**: Ao mudar o nome no Supabase, o app reflete a mudança?
3. **Filtros**: As questões exibidas correspondem aos filtros do simulado?
4. **Ativação**: Apenas simulados com `is_active = true` aparecem?
5. **Imagens**: A imagem de capa é exibida corretamente?

---

## 5. Estrutura de Dados Esperada

### Simulado (do Supabase)
```json
{
  "id": "uuid-do-simulado",
  "title": "Simulado PRF 2025",
  "subtitle": "Prepare-se para o concurso",
  "description": "Simulado completo com questões...",
  "image_url": "https://...supabase.co/storage/v1/object/public/course-images/...",
  "price": 29.90,
  "is_active": true,
  "course_type": "simulado",
  "question_filters": {
    "materias": ["Direito Constitucional", "Legislação de Trânsito"],
    "bancas": ["CESPE"],
    "anos": [2022, 2023, 2024],
    "orgaos": ["PRF"],
    "limit": 80
  },
  "questions_count": 80
}
```

### Questão (do banco de questões)
```json
{
  "id": 12345,
  "materia": "Direito Constitucional",
  "assunto": "Direitos Fundamentais",
  "enunciado": "<p>Considerando o disposto na CF/88...</p>",
  "alternativas": {
    "a": "Texto da alternativa A",
    "b": "Texto da alternativa B",
    "c": "Texto da alternativa C",
    "d": "Texto da alternativa D",
    "e": "Texto da alternativa E"
  },
  "gabarito": "c",
  "comentario": "<p>A alternativa C está correta porque...</p>",
  "banca": "CESPE",
  "ano": 2023,
  "orgao": "PRF"
}
```

---

## 6. Observações Importantes

1. **HTML nos campos**: Os campos `enunciado`, `alternativas` e `comentario` podem conter HTML. O app deve renderizar HTML corretamente.

2. **Imagens nas questões**: O campo `imagens_enunciado` pode conter URLs de imagens que devem ser exibidas junto com o enunciado.

3. **Dois bancos de dados**: O app precisa se conectar a DOIS projetos Supabase diferentes:
   - Projeto principal: informações dos simulados
   - Projeto de questões: banco de questões

4. **Cache**: Considere implementar cache local para melhorar performance e permitir uso offline.

5. **Paginação**: Para simulados com muitas questões, implemente paginação ou carregamento sob demanda.
