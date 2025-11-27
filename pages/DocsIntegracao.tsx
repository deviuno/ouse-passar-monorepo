import React from 'react';
import { SEOHead } from '../components/SEOHead';
import '../styles/blog-content.css';

export const DocsIntegracao: React.FC = () => {
  return (
    <div className="min-h-screen bg-brand-dark">
      <SEOHead
        title="Documentação: Integração de Questões - Ouse Passar"
        description="Documentação técnica para desenvolvedores sobre a integração do sistema de questões."
      />

      {/* Header */}
      <div className="bg-brand-darker border-b border-white/10">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="flex items-center gap-3 mb-4">
            <span className="bg-brand-yellow/20 text-brand-yellow text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Documentação Técnica
            </span>
            <span className="text-gray-500 text-sm">v1.0 - 27/11/2025</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white font-display uppercase tracking-tight mb-4">
            Integração de <span className="text-brand-yellow">Questões</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl">
            Sistema automatizado para criação de simulados via upload de editais,
            com análise por IA e integração com banco de 78.908 questões.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="blog-content">

          {/* Índice */}
          <nav className="bg-brand-card border border-white/10 rounded-sm p-6 mb-12">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-brand-yellow">01</span> Índice
            </h2>
            <ol className="space-y-2 text-gray-300">
              <li><a href="#visao-geral" className="hover:text-brand-yellow transition-colors">1. Visão Geral</a></li>
              <li><a href="#arquitetura" className="hover:text-brand-yellow transition-colors">2. Arquitetura dos Projetos</a></li>
              <li><a href="#supabase" className="hover:text-brand-yellow transition-colors">3. Projetos Supabase</a></li>
              <li><a href="#estrutura-dados" className="hover:text-brand-yellow transition-colors">4. Estrutura de Dados</a></li>
              <li><a href="#fluxo" className="hover:text-brand-yellow transition-colors">5. Fluxo de Criação de Simulado</a></li>
              <li><a href="#implementacao" className="hover:text-brand-yellow transition-colors">6. Implementação Detalhada</a></li>
              <li><a href="#ambiente" className="hover:text-brand-yellow transition-colors">7. Configurações de Ambiente</a></li>
              <li><a href="#migrations" className="hover:text-brand-yellow transition-colors">8. Migrations SQL</a></li>
              <li><a href="#checklist" className="hover:text-brand-yellow transition-colors">9. Checklist de Implementação</a></li>
              <li><a href="#consideracoes" className="hover:text-brand-yellow transition-colors">10. Considerações Técnicas</a></li>
            </ol>
          </nav>

          {/* Seção 1 */}
          <section id="visao-geral" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">01</span> Visão Geral
            </h2>

            <h3>Objetivo</h3>
            <p>
              Criar um sistema automatizado onde o administrador pode criar simulados/preparatórios
              fazendo upload de um edital de concurso. Um agente de IA (via n8n) interpretará o edital
              e selecionará automaticamente as questões relevantes do banco de dados externo
              (<strong>78.908 questões</strong>), disponibilizando-as no aplicativo de questões para os usuários.
            </p>

            <h3>Projetos Envolvidos</h3>
            <ul>
              <li><strong>site-ouse</strong> - Painel administrativo (este projeto)</li>
              <li><strong>Ouse-Questoes</strong> - App do usuário final</li>
              <li><strong>n8n</strong> - Automação e processamento via IA</li>
            </ul>
          </section>

          {/* Seção 2 */}
          <section id="arquitetura" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">02</span> Arquitetura dos Projetos
            </h2>

            <div className="bg-brand-darker border border-white/10 rounded-sm p-6 overflow-x-auto">
              <pre className="text-sm text-gray-300 whitespace-pre font-mono">
{`┌─────────────────────────────────────────────────────────────────────────────┐
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
└─────────────────────────────────────────────────────────────────────────────┘`}
              </pre>
            </div>
          </section>

          {/* Seção 3 */}
          <section id="supabase" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">03</span> Projetos Supabase
            </h2>

            <h3>Projeto Principal - ousepassar</h3>
            <table>
              <thead>
                <tr>
                  <th>Propriedade</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Project ID</strong></td>
                  <td><code>avlttxzppcywybiaxxzd</code></td>
                </tr>
                <tr>
                  <td><strong>URL</strong></td>
                  <td><code>https://avlttxzppcywybiaxxzd.supabase.co</code></td>
                </tr>
                <tr>
                  <td><strong>Região</strong></td>
                  <td><code>sa-east-1</code> (São Paulo)</td>
                </tr>
                <tr>
                  <td><strong>Status</strong></td>
                  <td><span className="text-green-400">ACTIVE_HEALTHY</span></td>
                </tr>
              </tbody>
            </table>

            <p><strong>Responsável por:</strong></p>
            <ul>
              <li>Dados de usuários (perfis, XP, moedas, streaks)</li>
              <li>Cursos/Simulados (definição e filtros)</li>
              <li>Respostas dos usuários</li>
              <li>Sistema de revisão espaçada</li>
              <li>Flashcards</li>
              <li>Sessões de estudo</li>
              <li>Blog e artigos (site-ouse)</li>
            </ul>

            <h3>Banco de Questões - Scrapping</h3>
            <table>
              <thead>
                <tr>
                  <th>Propriedade</th>
                  <th>Valor</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Project ID</strong></td>
                  <td><code>swzosaapqtyhmwdiwdje</code></td>
                </tr>
                <tr>
                  <td><strong>URL</strong></td>
                  <td><code>https://swzosaapqtyhmwdiwdje.supabase.co</code></td>
                </tr>
                <tr>
                  <td><strong>Região</strong></td>
                  <td><code>sa-east-1</code> (São Paulo)</td>
                </tr>
                <tr>
                  <td><strong>Total de Questões</strong></td>
                  <td><strong className="text-brand-yellow">78.908</strong></td>
                </tr>
              </tbody>
            </table>
          </section>

          {/* Seção 4 */}
          <section id="estrutura-dados" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">04</span> Estrutura de Dados
            </h2>

            <h3>Tabela <code>courses</code> (Projeto Principal)</h3>
            <p>Armazena os simulados/preparatórios e seus filtros de questões.</p>

            <pre>
              <code>{`CREATE TABLE courses (
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
);`}</code>
            </pre>

            <h4>Exemplo de <code>question_filters</code></h4>
            <pre>
              <code>{`{
  "materias": ["Direito Constitucional", "Direito Administrativo", "Direito Penal"],
  "bancas": ["CEBRASPE", "CESPE"],
  "anos": [2019, 2020, 2021, 2022, 2023, 2024],
  "orgaos": ["PRF", "PF"],
  "assuntos": ["Direitos Fundamentais", "Atos Administrativos"],
  "excludeIds": [],
  "limit": 2000
}`}</code>
            </pre>

            <h3>Tabela <code>questoes_concurso</code> (Banco de Questões)</h3>
            <pre>
              <code>{`CREATE TABLE questoes_concurso (
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
);`}</code>
            </pre>

            <h3>Nova Tabela: <code>editais</code></h3>
            <p>Armazena os editais enviados e o resultado da análise da IA:</p>
            <pre>
              <code>{`CREATE TABLE editais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT REFERENCES courses(id),

  -- Arquivo do edital
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,

  -- Status do processamento
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'error')),

  -- Resultado da análise da IA
  ai_analysis JSONB,
  suggested_filters JSONB,
  matched_questions_count INTEGER,

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
);`}</code>
            </pre>
          </section>

          {/* Seção 5 */}
          <section id="fluxo" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">05</span> Fluxo de Criação de Simulado
            </h2>

            <div className="space-y-6">
              {/* Etapa 1 */}
              <div className="bg-brand-card border border-white/10 rounded-sm p-6">
                <h4 className="text-brand-yellow mb-4">Etapa 1: Upload do Edital</h4>
                <ol>
                  <li>Admin acessa: <code>/admin/preparatorios/new</code></li>
                  <li>Preenche dados básicos (título, descrição, preço)</li>
                  <li>Seleciona tipo: "Simulado" ou "Preparatório"</li>
                  <li>Faz upload do PDF do edital</li>
                  <li>Sistema salva arquivo no Supabase Storage</li>
                  <li>Cria registro na tabela <code>editais</code> com status "pending"</li>
                  <li>Dispara webhook para n8n</li>
                </ol>
              </div>

              {/* Etapa 2 */}
              <div className="bg-brand-card border border-white/10 rounded-sm p-6">
                <h4 className="text-brand-yellow mb-4">Etapa 2: Processamento no N8N</h4>
                <p className="mb-4"><strong>Workflow:</strong> "Processar Edital de Concurso"</p>
                <ol>
                  <li>Webhook recebe notificação com ID do edital</li>
                  <li>Busca dados do edital no Supabase</li>
                  <li>Download do PDF do Storage</li>
                  <li>Extração de texto do PDF</li>
                  <li>Agente IA analisa o conteúdo:
                    <ul>
                      <li>Identifica órgão, banca, ano</li>
                      <li>Lista matérias/disciplinas do edital</li>
                      <li>Identifica cargos e especialidades</li>
                      <li>Mapeia assuntos específicos</li>
                    </ul>
                  </li>
                  <li>Consulta banco de questões para validar filtros</li>
                  <li>Gera <code>suggested_filters</code> otimizados</li>
                  <li>Conta questões que matcham os filtros</li>
                  <li>Atualiza registro do edital com resultados</li>
                  <li>Notifica admin que análise está pronta</li>
                </ol>
              </div>

              {/* Etapa 3 */}
              <div className="bg-brand-card border border-white/10 rounded-sm p-6">
                <h4 className="text-brand-yellow mb-4">Etapa 3: Aprovação do Admin</h4>
                <ol>
                  <li>Admin recebe notificação de análise concluída</li>
                  <li>Acessa página de revisão do simulado</li>
                  <li>Visualiza:
                    <ul>
                      <li>Resumo do edital interpretado pela IA</li>
                      <li>Filtros sugeridos</li>
                      <li>Quantidade de questões encontradas</li>
                      <li>Preview de algumas questões de exemplo</li>
                    </ul>
                  </li>
                  <li>Admin pode:
                    <ul>
                      <li>Aprovar filtros como estão</li>
                      <li>Ajustar filtros manualmente</li>
                      <li>Adicionar/remover matérias</li>
                      <li>Excluir questões específicas</li>
                      <li>Definir limite de questões</li>
                    </ul>
                  </li>
                  <li>Ao aprovar: cria/atualiza registro em <code>courses</code></li>
                </ol>
              </div>

              {/* Etapa 4 */}
              <div className="bg-brand-card border border-white/10 rounded-sm p-6">
                <h4 className="text-brand-yellow mb-4">Etapa 4: Disponível no App</h4>
                <ol>
                  <li>App Ouse-Questoes lista cursos ativos</li>
                  <li>Usuário seleciona o simulado</li>
                  <li>App busca <code>question_filters</code> do curso</li>
                  <li>Executa query no banco de questões externo com os filtros</li>
                  <li>Retorna questões para o usuário responder</li>
                  <li>Registra respostas em <code>user_answers</code></li>
                  <li>Atualiza progresso, XP, streaks</li>
                </ol>
              </div>
            </div>
          </section>

          {/* Seção 6 */}
          <section id="implementacao" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">06</span> Implementação Detalhada
            </h2>

            <h3>Site-Ouse (Painel Admin)</h3>

            <h4>Páginas a Criar/Modificar</h4>
            <table>
              <thead>
                <tr>
                  <th>Página</th>
                  <th>Caminho</th>
                  <th>Descrição</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Lista de Simulados</td>
                  <td><code>/admin/preparatorios</code></td>
                  <td>Listar todos os simulados com status</td>
                </tr>
                <tr>
                  <td>Novo Simulado</td>
                  <td><code>/admin/preparatorios/new</code></td>
                  <td>Criar simulado com upload de edital</td>
                </tr>
                <tr>
                  <td>Editar Simulado</td>
                  <td><code>/admin/preparatorios/edit/:id</code></td>
                  <td>Editar e aprovar filtros</td>
                </tr>
                <tr>
                  <td>Revisar Análise</td>
                  <td><code>/admin/preparatorios/:id/review</code></td>
                  <td>Revisar análise da IA</td>
                </tr>
              </tbody>
            </table>

            <h4>Componentes Necessários</h4>
            <pre>
              <code>{`// components/admin/SimuladoForm.tsx
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
// - Opção de excluir questões específicas`}</code>
            </pre>

            <h4>Service: simuladoService.ts</h4>
            <pre>
              <code>{`export interface Simulado {
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

// Funções do service
export async function createSimulado(data: CreateSimuladoInput): Promise<Simulado>;
export async function uploadEdital(simuladoId: string, file: File): Promise<Edital>;
export async function getEditalStatus(editalId: string): Promise<Edital>;
export async function approveFilters(simuladoId: string, filters: QuestionFilters): Promise<Simulado>;
export async function previewQuestions(filters: QuestionFilters, limit?: number): Promise<Question[]>;
export async function countMatchingQuestions(filters: QuestionFilters): Promise<number>;`}</code>
            </pre>

            <h3>N8N Workflow</h3>

            <h4>Diagrama do Workflow</h4>
            <div className="bg-brand-darker border border-white/10 rounded-sm p-6 overflow-x-auto">
              <pre className="text-sm text-gray-300 whitespace-pre font-mono">
{`┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
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
└─────────────┘`}
              </pre>
            </div>

            <h4>Prompt do Agente IA</h4>
            <pre>
              <code>{`# Agente Analisador de Editais de Concursos

## Contexto
Você é um especialista em concursos públicos brasileiros. Sua tarefa é analisar
editais de concursos e extrair informações estruturadas para criar filtros de
busca em um banco de questões.

## Banco de Questões Disponível
O banco possui questões com os seguintes campos para filtro:
- materia: Nome da disciplina (ex: "Direito Constitucional", "Português")
- assunto: Tópico específico dentro da matéria
- banca: Organizadora do concurso (ex: "CEBRASPE", "FCC", "FGV")
- orgao: Órgão do concurso (ex: "PRF", "PF", "TRT")
- ano: Ano da prova (2015-2024)

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
}`}</code>
            </pre>

            <h4>Queries para o Banco de Questões</h4>
            <pre>
              <code>{`-- Buscar matérias únicas disponíveis
SELECT DISTINCT materia FROM questoes_concurso ORDER BY materia;

-- Buscar bancas únicas disponíveis
SELECT DISTINCT banca FROM questoes_concurso WHERE banca IS NOT NULL ORDER BY banca;

-- Contar questões com filtros
SELECT COUNT(*) as total
FROM questoes_concurso
WHERE
  ($1::text[] IS NULL OR materia = ANY($1))
  AND ($2::text[] IS NULL OR banca = ANY($2))
  AND ($3::int[] IS NULL OR ano = ANY($3))
  AND ($4::text[] IS NULL OR orgao = ANY($4))
  AND ($5::text[] IS NULL OR assunto = ANY($5));

-- Buscar questões de exemplo
SELECT id, materia, assunto, banca, ano, enunciado
FROM questoes_concurso
WHERE
  ($1::text[] IS NULL OR materia = ANY($1))
  AND ($2::text[] IS NULL OR banca = ANY($2))
ORDER BY ano DESC, RANDOM()
LIMIT 10;`}</code>
            </pre>

            <h3>Ouse-Questoes (App)</h3>

            <h4>Service de Questões Externas</h4>
            <pre>
              <code>{`// services/externalQuestionsService.ts

export async function getQuestionsForCourse(
  filters: CourseQuestionFilters,
  options?: {
    limit?: number;
    offset?: number;
    randomize?: boolean;
    excludeAnswered?: number[];
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
  // ... demais filtros

  const { data, error } = await query;
  if (error) throw error;

  return options?.randomize ? shuffleArray(data) : data || [];
}`}</code>
            </pre>

            <h4>Hook: useSimuladoQuestions</h4>
            <pre>
              <code>{`// hooks/useSimuladoQuestions.ts

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

  // Carregar filtros do curso
  useEffect(() => {
    async function loadCourseFilters() {
      const { data, error } = await supabase
        .from('courses')
        .select('question_filters, questions_count')
        .eq('id', courseId)
        .single();

      if (error) throw error;
      setFilters(data.question_filters);
      setTotalCount(data.questions_count);
    }
    loadCourseFilters();
  }, [courseId]);

  // ... implementação completa no documento original
}`}</code>
            </pre>
          </section>

          {/* Seção 7 */}
          <section id="ambiente" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">07</span> Configurações de Ambiente
            </h2>

            <h3>Site-Ouse (.env.local)</h3>
            <pre>
              <code>{`# Supabase Principal
VITE_SUPABASE_URL=https://avlttxzppcywybiaxxzd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Banco de Questões (para preview no admin)
VITE_QUESTIONS_DB_URL=https://swzosaapqtyhmwdiwdje.supabase.co
VITE_QUESTIONS_DB_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# N8N Webhook
VITE_N8N_WEBHOOK_URL=https://n8n.ousepassar.com/webhook/processar-edital

# Google AI (já existe)
VITE_GEMINI_API_KEY=...`}</code>
            </pre>

            <h3>Ouse-Questoes (.env)</h3>
            <pre>
              <code>{`# Supabase Principal
VITE_SUPABASE_URL=https://avlttxzppcywybiaxxzd.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Banco de Questões Externo
VITE_QUESTIONS_DB_URL=https://swzosaapqtyhmwdiwdje.supabase.co
VITE_QUESTIONS_DB_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`}</code>
            </pre>

            <h3>N8N Credentials</h3>
            <pre>
              <code>{`{
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
}`}</code>
            </pre>
          </section>

          {/* Seção 8 */}
          <section id="migrations" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">08</span> Migrations SQL
            </h2>

            <h3>Criar Tabela de Editais</h3>
            <pre>
              <code>{`-- Migration: create_editais_table
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

CREATE POLICY "Admins can manage editais" ON editais
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');`}</code>
            </pre>

            <h3>Adicionar Tipo aos Courses</h3>
            <pre>
              <code>{`-- Migration: add_course_type
-- Projeto: ousepassar (avlttxzppcywybiaxxzd)

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS course_type TEXT DEFAULT 'preparatorio'
CHECK (course_type IN ('preparatorio', 'simulado'));

ALTER TABLE courses
ADD COLUMN IF NOT EXISTS edital_id UUID REFERENCES editais(id);

CREATE INDEX idx_courses_type ON courses(course_type);`}</code>
            </pre>

            <h3>Storage Bucket para Editais</h3>
            <pre>
              <code>{`-- Criar bucket para editais
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
USING (bucket_id = 'editais');`}</code>
            </pre>
          </section>

          {/* Seção 9 */}
          <section id="checklist" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">09</span> Checklist de Implementação
            </h2>

            <h3>Fase 1: Infraestrutura</h3>
            <ul>
              <li>Criar tabela <code>editais</code> no Supabase</li>
              <li>Adicionar coluna <code>course_type</code> na tabela <code>courses</code></li>
              <li>Criar bucket de storage para editais</li>
              <li>Configurar políticas de RLS</li>
            </ul>

            <h3>Fase 2: Site-Ouse (Admin)</h3>
            <ul>
              <li>Criar página de listagem de simulados</li>
              <li>Criar formulário de novo simulado com upload</li>
              <li>Implementar componente de upload de PDF</li>
              <li>Criar página de revisão de análise da IA</li>
              <li>Implementar edição manual de filtros</li>
              <li>Adicionar preview de questões</li>
              <li>Integrar com webhook do n8n</li>
            </ul>

            <h3>Fase 3: N8N Workflow</h3>
            <ul>
              <li>Criar workflow de processamento de edital</li>
              <li>Configurar extração de texto de PDF</li>
              <li>Implementar agente IA para análise</li>
              <li>Criar queries de validação no banco de questões</li>
              <li>Configurar notificações para admin</li>
            </ul>

            <h3>Fase 4: Ouse-Questoes (App)</h3>
            <ul>
              <li>Implementar <code>externalQuestionsService.ts</code></li>
              <li>Criar hook <code>useSimuladoQuestions</code></li>
              <li>Integrar listagem de cursos com filtro por tipo</li>
              <li>Implementar fluxo de questões do simulado</li>
              <li>Testar integração completa</li>
            </ul>

            <h3>Fase 5: Testes e Deploy</h3>
            <ul>
              <li>Testes de integração entre projetos</li>
              <li>Testes de carga no banco de questões</li>
              <li>Validação de filtros com editais reais</li>
              <li>Deploy em produção</li>
              <li>Monitoramento e ajustes</li>
            </ul>
          </section>

          {/* Seção 10 */}
          <section id="consideracoes" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">10</span> Considerações Técnicas
            </h2>

            <h3>Performance</h3>
            <ul>
              <li><strong>Índices no Banco de Questões:</strong> Garantir índices em <code>materia</code>, <code>banca</code>, <code>ano</code>, <code>orgao</code>, <code>assunto</code></li>
              <li><strong>Paginação:</strong> Sempre usar paginação ao buscar questões (máximo 100 por request)</li>
              <li><strong>Cache:</strong> Considerar cache de filtros de cursos no app</li>
              <li><strong>Lazy Loading:</strong> Carregar questões sob demanda conforme usuário avança</li>
            </ul>

            <h3>Segurança</h3>
            <ul>
              <li><strong>RLS:</strong> Row Level Security em todas as tabelas sensíveis</li>
              <li><strong>Storage:</strong> Bucket de editais deve ser privado</li>
              <li><strong>Service Keys:</strong> Usar service role key apenas no n8n (server-side)</li>
              <li><strong>Validação:</strong> Validar tipo de arquivo no upload (apenas PDF)</li>
            </ul>

            <h3>Escalabilidade</h3>
            <ul>
              <li><strong>Banco de Questões:</strong> Preparado para crescer (já tem 78.908 questões)</li>
              <li><strong>Filtros JSONB:</strong> Flexível para adicionar novos critérios</li>
              <li><strong>N8N:</strong> Pode processar múltiplos editais em paralelo</li>
            </ul>
          </section>

          {/* Footer */}
          <div className="border-t border-white/10 pt-8 mt-16">
            <blockquote>
              <p className="text-gray-400">
                <strong className="text-white">Nota:</strong> Este documento deve ser atualizado
                conforme o desenvolvimento avança e novas decisões são tomadas.
              </p>
            </blockquote>
            <p className="text-gray-500 text-sm mt-4">
              Última atualização: 27/11/2025 | Versão 1.0
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
