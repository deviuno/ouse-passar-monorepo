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
            <span className="text-gray-500 text-sm">v2.0 - 27/11/2025</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white font-display uppercase tracking-tight mb-4">
            Integração de <span className="text-brand-yellow">Questões</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-3xl">
            Sistema completo para criação de simulados via upload de editais (IA) ou configuração manual,
            com integração entre painel admin e app de questões usando banco de 78.908 questões.
          </p>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="blog-content">

          {/* Índice */}
          <nav className="bg-brand-card border border-white/10 rounded-sm p-6 mb-12">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="text-brand-yellow">00</span> Índice
            </h2>
            <ol className="space-y-2 text-gray-300">
              <li><a href="#visao-geral" className="hover:text-brand-yellow transition-colors">1. Visão Geral</a></li>
              <li><a href="#arquitetura" className="hover:text-brand-yellow transition-colors">2. Arquitetura dos Projetos</a></li>
              <li><a href="#supabase" className="hover:text-brand-yellow transition-colors">3. Projetos Supabase</a></li>
              <li><a href="#estrutura-dados" className="hover:text-brand-yellow transition-colors">4. Estrutura de Dados</a></li>
              <li><a href="#implementado" className="hover:text-brand-yellow transition-colors">5. O Que Já Foi Implementado</a></li>
              <li><a href="#fluxo" className="hover:text-brand-yellow transition-colors">6. Fluxos de Criação de Simulado</a></li>
              <li><a href="#app-integracao" className="hover:text-brand-yellow transition-colors">7. Integração no App Ouse Questões</a></li>
              <li><a href="#ambiente" className="hover:text-brand-yellow transition-colors">8. Configurações de Ambiente</a></li>
              <li><a href="#migrations" className="hover:text-brand-yellow transition-colors">9. Migrations SQL</a></li>
              <li><a href="#checklist" className="hover:text-brand-yellow transition-colors">10. Checklist de Implementação</a></li>
            </ol>
          </nav>

          {/* Seção 1 */}
          <section id="visao-geral" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">01</span> Visão Geral
            </h2>

            <h3>Objetivo</h3>
            <p>
              Sistema que permite criar simulados de duas formas:
            </p>
            <ul>
              <li><strong>Via Edital (IA):</strong> Upload de PDF do edital, análise automática por IA via n8n</li>
              <li><strong>Manual:</strong> Seleção direta de filtros (matérias, bancas, anos, órgãos) com preview em tempo real</li>
            </ul>
            <p>
              Os simulados criados no painel admin ficam disponíveis no app Ouse Questões,
              que busca questões do banco externo (<strong>78.908 questões</strong>) baseado nos filtros configurados.
            </p>

            <h3>Projetos Envolvidos</h3>
            <ul>
              <li><strong>site-ouse</strong> - Painel administrativo (este projeto) - <span className="text-green-400">IMPLEMENTADO</span></li>
              <li><strong>Ouse-Questoes</strong> - App do usuário final - <span className="text-yellow-400">PRECISA INTEGRAÇÃO</span></li>
              <li><strong>n8n</strong> - Automação e processamento via IA - <span className="text-gray-400">FUTURO</span></li>
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
│  │  ✅ Blog/Artigos     │     │  ⚠️ Simulados        │                     │
│  │  ✅ Simulados Admin  │     │  ⚠️ Questões         │                     │
│  │  ✅ Upload Editais   │     │  - Flashcards        │                     │
│  │  ✅ Filtros Manuais  │     │  - Revisão           │                     │
│  │  ✅ Preview Questões │     │  - Gamificação       │                     │
│  └──────────┬───────────┘     └──────────┬───────────┘                     │
│             │                            │                                  │
│             │         ┌──────────────────┤                                  │
│             │         │                  │                                  │
│             ▼         ▼                  ▼                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                     SUPABASE - ousepassar                           │   │
│  │                   (avlttxzppcywybiaxxzd)                            │   │
│  │                                                                     │   │
│  │  Tabelas: courses, editais, user_profiles, user_answers...         │   │
│  │  Storage: editais (PDFs), course-images (capas)                    │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│             │                            │                                  │
│             │                            ▼                                  │
│             │         ┌─────────────────────────────────────────────┐      │
│             │         │     SUPABASE - Banco de Questões            │      │
│             │         │       (swzosaapqtyhmwdiwdje)                │      │
│             │         │                                             │      │
│             │         │  Tabela: questoes_concurso (78.908 questões)│      │
│             │         └─────────────────────────────────────────────┘      │
│             │                                                               │
│             ▼                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         N8N (Futuro)                               │   │
│  │                                                                     │   │
│  │  - Agente IA para interpretação de editais                         │   │
│  │  - Geração automática de filtros                                   │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘

✅ = Implementado    ⚠️ = Precisa Integração    - = Existente`}
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
              </tbody>
            </table>

            <p><strong>Responsável por:</strong></p>
            <ul>
              <li>Cursos/Simulados (tabela <code>courses</code>)</li>
              <li>Editais enviados (tabela <code>editais</code>)</li>
              <li>Dados de usuários</li>
              <li>Respostas dos usuários</li>
              <li>Blog e artigos</li>
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
                  <td><strong>Total de Questões</strong></td>
                  <td><strong className="text-brand-yellow">78.908</strong></td>
                </tr>
              </tbody>
            </table>

            <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 mt-6">
              <p className="text-red-400 font-bold mb-2">⚠️ IMPORTANTE</p>
              <p className="text-gray-300">
                O app Ouse Questões precisa se conectar a <strong>DOIS</strong> projetos Supabase:
                o principal (cursos/usuários) e o de questões (banco de 78k questões).
              </p>
            </div>
          </section>

          {/* Seção 4 */}
          <section id="estrutura-dados" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">04</span> Estrutura de Dados
            </h2>

            <h3>Tabela <code>courses</code> (Projeto Principal)</h3>
            <pre>
              <code>{`CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  icon TEXT,
  image_url TEXT,                        -- Imagem de capa do simulado
  price DECIMAL(10,2),
  is_active BOOLEAN DEFAULT false,
  course_type TEXT DEFAULT 'simulado',   -- 'simulado' ou 'preparatorio'
  question_filters JSONB DEFAULT '{}',   -- Filtros para buscar questões
  questions_count INTEGER DEFAULT 0,
  edital_id UUID REFERENCES editais(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);`}</code>
            </pre>

            <h4>Estrutura do campo <code>question_filters</code></h4>
            <pre>
              <code>{`{
  "materias": ["Direito Constitucional", "Português", "Raciocínio Lógico"],
  "bancas": ["CESPE", "CEBRASPE"],
  "anos": [2022, 2023, 2024],
  "orgaos": ["PRF", "PF"],
  "assuntos": ["Direitos Fundamentais"],
  "limit": 100
}`}</code>
            </pre>

            <h3>Tabela <code>editais</code> (Projeto Principal)</h3>
            <pre>
              <code>{`CREATE TABLE editais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id),
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT,
  status TEXT DEFAULT 'pending',
    -- 'pending', 'processing', 'analyzed', 'approved', 'error'
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
);`}</code>
            </pre>

            <h3>Tabela <code>questoes_concurso</code> (Banco de Questões)</h3>
            <pre>
              <code>{`CREATE TABLE questoes_concurso (
  id SERIAL PRIMARY KEY,
  materia TEXT,
  assunto TEXT,
  concurso TEXT,
  enunciado TEXT,           -- Pode conter HTML
  alternativas JSONB,       -- {"a": "...", "b": "...", "c": "...", "d": "...", "e": "..."}
  gabarito TEXT,            -- 'a', 'b', 'c', 'd' ou 'e'
  comentario TEXT,          -- Pode conter HTML
  orgao TEXT,
  cargo_area_especialidade_edicao TEXT,
  prova TEXT,
  ano INTEGER,
  banca TEXT,
  imagens_enunciado TEXT,
  imagens_comentario TEXT[],
  questao_revisada TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);`}</code>
            </pre>
          </section>

          {/* Seção 5 - Implementado */}
          <section id="implementado" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">05</span> O Que Já Foi Implementado
            </h2>

            <h3>Site-Ouse (Painel Admin)</h3>

            <h4>Páginas Criadas</h4>
            <table>
              <thead>
                <tr>
                  <th>Página</th>
                  <th>Rota</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>Lista de Preparatórios</td>
                  <td><code>/admin/preparatorios</code></td>
                  <td><span className="text-green-400">✅</span></td>
                </tr>
                <tr>
                  <td>Novo Preparatório</td>
                  <td><code>/admin/preparatorios/new</code></td>
                  <td><span className="text-green-400">✅</span></td>
                </tr>
                <tr>
                  <td>Editar Preparatório</td>
                  <td><code>/admin/preparatorios/edit/:id</code></td>
                  <td><span className="text-green-400">✅</span></td>
                </tr>
              </tbody>
            </table>

            <h4>Componentes Criados</h4>
            <ul>
              <li><code>EditalUploader.tsx</code> - Upload de PDF com drag-and-drop ou URL</li>
              <li><code>ManualFilterSelector.tsx</code> - Seleção manual de filtros com busca</li>
              <li><code>FilterReview.tsx</code> - Revisão e edição de filtros</li>
              <li><code>QuestionPreview.tsx</code> - Preview de questões em tempo real</li>
              <li><code>CourseImageUpload.tsx</code> - Upload de imagem de capa</li>
            </ul>

            <h4>Services Criados</h4>
            <ul>
              <li><code>simuladoService.ts</code> - CRUD de cursos e editais, webhook n8n</li>
              <li><code>externalQuestionsService.ts</code> - Busca questões do banco externo</li>
            </ul>

            <h4>Funcionalidades</h4>
            <ul>
              <li>✅ Criar simulado via upload de edital (aguardando n8n)</li>
              <li>✅ Criar simulado com filtros manuais (funcional agora)</li>
              <li>✅ Preview de questões correspondentes aos filtros</li>
              <li>✅ Contador de questões em tempo real</li>
              <li>✅ Upload de imagem de capa</li>
              <li>✅ Ativar/desativar simulados</li>
              <li>✅ Dashboard com estatísticas de preparatórios</li>
            </ul>

            <h4>Storage Buckets</h4>
            <ul>
              <li><code>editais</code> - PDFs de editais (privado)</li>
              <li><code>course-images</code> - Imagens de capa (público)</li>
            </ul>
          </section>

          {/* Seção 6 */}
          <section id="fluxo" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">06</span> Fluxos de Criação de Simulado
            </h2>

            <div className="space-y-6">
              {/* Modo Manual */}
              <div className="bg-green-500/10 border border-green-500/30 rounded-sm p-6">
                <h4 className="text-green-400 mb-4">🟢 Modo Manual (Funcional Agora)</h4>
                <ol>
                  <li>Admin acessa <code>/admin/preparatorios/new</code></li>
                  <li>Preenche título, descrição, preço</li>
                  <li>Faz upload de imagem de capa (opcional)</li>
                  <li>Seleciona modo "Manual"</li>
                  <li>Seleciona matérias, bancas, anos, órgãos desejados</li>
                  <li>Sistema mostra quantidade de questões em tempo real</li>
                  <li>Sistema mostra preview das questões</li>
                  <li>Define limite de questões (opcional)</li>
                  <li>Clica em "Criar Simulado"</li>
                  <li>Simulado é criado e ativado automaticamente</li>
                </ol>
              </div>

              {/* Modo Edital */}
              <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-6">
                <h4 className="text-yellow-400 mb-4">🟡 Modo Via Edital (Aguardando N8N)</h4>
                <ol>
                  <li>Admin acessa <code>/admin/preparatorios/new</code></li>
                  <li>Preenche título, descrição, preço</li>
                  <li>Seleciona modo "Via Edital"</li>
                  <li>Faz upload do PDF do edital</li>
                  <li>Sistema envia para n8n processar</li>
                  <li>IA analisa o edital e sugere filtros</li>
                  <li>Admin revisa e aprova filtros</li>
                  <li>Simulado é ativado</li>
                </ol>
                <p className="text-yellow-400/70 text-sm mt-4">
                  * Este fluxo depende da configuração do workflow n8n
                </p>
              </div>
            </div>
          </section>

          {/* Seção 7 - App Integration */}
          <section id="app-integracao" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">07</span> Integração no App Ouse Questões
            </h2>

            <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-6 mb-6">
              <h4 className="text-red-400 font-bold mb-2">⚠️ PROBLEMA IDENTIFICADO</h4>
              <p className="text-gray-300">
                O app Ouse Questões <strong>NÃO está buscando simulados do Supabase</strong>.
                Os dados parecem estar hardcoded. Quando alteramos o nome no Supabase,
                o app continua mostrando o nome antigo.
              </p>
            </div>

            <h3>O que o App Precisa Fazer</h3>

            <h4>1. Configurar Dois Clientes Supabase</h4>
            <pre>
              <code>{`// lib/supabase.ts
import { createClient } from '@supabase/supabase-js';

// Cliente principal (cursos, usuários)
export const supabase = createClient(
  'https://avlttxzppcywybiaxxzd.supabase.co',
  'SUA_ANON_KEY_PRINCIPAL'
);

// Cliente do banco de questões
export const questionsDb = createClient(
  'https://swzosaapqtyhmwdiwdje.supabase.co',
  'SUA_ANON_KEY_QUESTOES'
);`}</code>
            </pre>

            <h4>2. Buscar Simulados Ativos</h4>
            <pre>
              <code>{`// services/coursesService.ts

export interface Course {
  id: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  image_url: string | null;
  price: number | null;
  is_active: boolean;
  course_type: 'simulado' | 'preparatorio';
  question_filters: QuestionFilters;
  questions_count: number;
}

export interface QuestionFilters {
  materias?: string[];
  bancas?: string[];
  anos?: number[];
  orgaos?: string[];
  assuntos?: string[];
  limit?: number;
}

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
}`}</code>
            </pre>

            <h4>3. Buscar Questões do Banco Externo</h4>
            <pre>
              <code>{`// services/questionsService.ts

export interface Question {
  id: number;
  materia: string;
  assunto: string | null;
  enunciado: string;        // PODE CONTER HTML!
  alternativas: {
    a?: string;
    b?: string;
    c?: string;
    d?: string;
    e?: string;
  };
  gabarito: string | null;
  comentario: string | null; // PODE CONTER HTML!
  orgao: string | null;
  ano: number | null;
  banca: string | null;
}

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
}`}</code>
            </pre>

            <h4>4. Fluxo de Uso no App</h4>
            <pre>
              <code>{`// Exemplo de uso em uma tela

// 1. Carregar lista de simulados
const simulados = await getActiveSimulados();

// 2. Usuário seleciona um simulado
const simulado = await getSimuladoById(simuladoId);

// 3. Carregar questões do simulado
const questions = await getQuestionsForSimulado(
  simulado.question_filters,
  { randomize: true }
);

// 4. Exibir questões para o usuário responder
// IMPORTANTE: enunciado e alternativas podem conter HTML!`}</code>
            </pre>

            <h4>5. Checklist do App</h4>
            <ul>
              <li>☐ Configurar variáveis de ambiente com URLs e chaves dos dois Supabase</li>
              <li>☐ Criar cliente Supabase para projeto principal</li>
              <li>☐ Criar cliente Supabase para projeto de questões</li>
              <li>☐ Implementar <code>getActiveSimulados()</code></li>
              <li>☐ Implementar <code>getSimuladoById()</code></li>
              <li>☐ Implementar <code>getQuestionsForSimulado()</code></li>
              <li>☐ Atualizar tela de listagem para usar dados do Supabase</li>
              <li>☐ Atualizar tela de simulado para carregar questões dinamicamente</li>
              <li>☐ Renderizar HTML nos campos enunciado/alternativas/comentário</li>
              <li>☐ Exibir imagem de capa (<code>image_url</code>)</li>
              <li>☐ Exibir preço ou "Gratuito"</li>
              <li>☐ <strong>Remover dados hardcoded/mockados</strong></li>
            </ul>
          </section>

          {/* Seção 8 */}
          <section id="ambiente" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">08</span> Configurações de Ambiente
            </h2>

            <h3>Site-Ouse (.env.local)</h3>
            <pre>
              <code>{`# Supabase Principal
VITE_SUPABASE_URL=https://avlttxzppcywybiaxxzd.supabase.co
VITE_SUPABASE_ANON_KEY=sua_chave_anon

# Banco de Questões (para preview no admin)
VITE_QUESTIONS_DB_URL=https://swzosaapqtyhmwdiwdje.supabase.co
VITE_QUESTIONS_DB_ANON_KEY=sua_chave_anon_questoes

# N8N Webhook (quando configurado)
VITE_N8N_WEBHOOK_URL=https://n8n.ousepassar.com/webhook/processar-edital

# Google AI
VITE_GEMINI_API_KEY=sua_chave_gemini`}</code>
            </pre>

            <h3>Ouse-Questoes (.env)</h3>
            <pre>
              <code>{`# Supabase Principal (cursos, usuários)
SUPABASE_URL=https://avlttxzppcywybiaxxzd.supabase.co
SUPABASE_ANON_KEY=sua_chave_anon

# Banco de Questões Externo
QUESTIONS_DB_URL=https://swzosaapqtyhmwdiwdje.supabase.co
QUESTIONS_DB_ANON_KEY=sua_chave_anon_questoes`}</code>
            </pre>

            <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-4 mt-6">
              <p className="text-blue-400 font-bold mb-2">💡 Como Obter as Chaves</p>
              <ol className="text-gray-300 text-sm">
                <li>Acesse <a href="https://supabase.com/dashboard" className="text-brand-yellow">supabase.com/dashboard</a></li>
                <li>Selecione o projeto</li>
                <li>Vá em Settings → API</li>
                <li>Copie a <code>anon</code> key (pública)</li>
              </ol>
            </div>
          </section>

          {/* Seção 9 */}
          <section id="migrations" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">09</span> Migrations SQL
            </h2>

            <p>As migrations já foram executadas no Supabase principal. Documentadas aqui para referência:</p>

            <h3>Bucket de Imagens de Cursos</h3>
            <pre>
              <code>{`-- Criar bucket course-images (já executado)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO NOTHING;

-- Policies de acesso público
CREATE POLICY "Public read access for course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

CREATE POLICY "Authenticated users can upload course images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-images' AND auth.role() = 'authenticated');`}</code>
            </pre>
          </section>

          {/* Seção 10 */}
          <section id="checklist" className="mb-16">
            <h2 className="flex items-center gap-3">
              <span className="text-brand-yellow">10</span> Checklist de Implementação
            </h2>

            <h3>Site-Ouse (Admin) - <span className="text-green-400">CONCLUÍDO</span></h3>
            <ul>
              <li>✅ Tabelas <code>courses</code> e <code>editais</code> no Supabase</li>
              <li>✅ Storage buckets configurados</li>
              <li>✅ Página de listagem de simulados</li>
              <li>✅ Criação via edital (estrutura pronta)</li>
              <li>✅ Criação via filtros manuais (funcional)</li>
              <li>✅ Preview de questões em tempo real</li>
              <li>✅ Upload de imagem de capa</li>
              <li>✅ Dashboard com estatísticas</li>
            </ul>

            <h3>Ouse-Questoes (App) - <span className="text-yellow-400">PENDENTE</span></h3>
            <ul>
              <li>☐ Configurar dois clientes Supabase</li>
              <li>☐ Remover dados mockados/hardcoded</li>
              <li>☐ Buscar simulados da tabela <code>courses</code></li>
              <li>☐ Buscar questões da tabela <code>questoes_concurso</code></li>
              <li>☐ Aplicar filtros do <code>question_filters</code></li>
              <li>☐ Exibir imagem de capa dos simulados</li>
              <li>☐ Renderizar HTML nos campos de questão</li>
            </ul>

            <h3>N8N (Futuro)</h3>
            <ul>
              <li>☐ Workflow de processamento de edital</li>
              <li>☐ Agente IA para análise</li>
              <li>☐ Integração com webhook</li>
            </ul>
          </section>

          {/* Footer */}
          <div className="border-t border-white/10 pt-8 mt-16">
            <blockquote>
              <p className="text-gray-400">
                <strong className="text-white">Próximo passo:</strong> Integrar o app Ouse Questões
                com o Supabase para buscar simulados e questões dinamicamente.
              </p>
            </blockquote>
            <p className="text-gray-500 text-sm mt-4">
              Última atualização: 27/11/2025 | Versão 2.0
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};
