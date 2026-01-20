// Questions Service - Busca questões do banco de questões externo
import { questionsDb } from './questionsDbClient';
import { ParsedQuestion, Alternative, RawQuestion } from '../types';

// Helper para retry com backoff exponencial
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 4,
  baseDelay: number = 2000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const startTime = Date.now();
      const result = await fn();
      const elapsed = Date.now() - startTime;
      if (attempt > 0) {
        console.log(`[withRetry] ✅ Sucesso na tentativa ${attempt + 1} após ${elapsed}ms`);
      }
      return result;
    } catch (error) {
      lastError = error as Error;
      const errorMessage = lastError?.message || String(error);
      const isTimeout = errorMessage.includes('abort') || errorMessage.includes('timeout') || errorMessage.includes('57014');

      console.warn(`[withRetry] Tentativa ${attempt + 1}/${maxRetries} falhou:`, {
        error: errorMessage,
        isTimeout,
        attempt: attempt + 1,
      });

      if (attempt < maxRetries - 1) {
        // Delay maior para timeouts
        const multiplier = isTimeout ? 1.5 : 1;
        const delay = Math.round(baseDelay * Math.pow(2, attempt) * multiplier);
        console.log(`[withRetry] Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  console.error(`[withRetry] ❌ Todas as ${maxRetries} tentativas falharam`);
  throw lastError;
};

// Cache simples para opções de filtro
let filterOptionsCache: {
  data: { materias: string[]; bancas: string[]; orgaos: string[]; cargos: string[]; anos: number[] } | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Mapeamento de nomes curtos de bancas para nomes completos no banco
const BANCA_NAME_MAP: Record<string, string> = {
  'CEBRASPE': 'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos',
  'Cebraspe': 'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos',
  'CESPE': 'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos',
  'CESPE/CEBRASPE': 'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos',
  'FCC': 'Fundação Carlos Chagas',
  'FGV': 'Fundação Getúlio Vargas',
  'VUNESP': 'Fundação para o Vestibular da Universidade Estadual Paulista',
  'IDECAN': 'Instituto de Desenvolvimento Educacional, Cultural e Assistencial Nacional',
  'AOCP': 'Instituto AOCP',
  'IBFC': 'Instituto Brasileiro de Formação e Capacitação',
  'IADES': 'Instituto Brasileiro de Apoio e Desenvolvimento Executivo',
  'FUNIVERSA': 'Fundação Universa',
  'FUMARC': 'Fundação Mariana Resende Costa',
  'UFG': 'Instituto Verbena da Universidade Federal de Goiás',
  'IBADE': 'IBADE', // Já é o nome correto
};

// Normaliza nome de banca para o formato do banco de dados
const normalizeBancaName = (banca: string): string => {
  return BANCA_NAME_MAP[banca] || banca;
};

// Tipo para questão do banco de dados
export interface DbQuestion {
  id: number;
  materia: string;
  assunto: string | null;
  concurso: string | null;
  enunciado: string;
  alternativas: { letter: string; text: string }[] | string;
  gabarito: string;
  comentario: string | null;
  orgao: string | null;
  cargo_area_especialidade_edicao: string | null;
  prova: string | null;
  ano: number | null;
  banca: string | null;
  imagens_enunciado: string | null;
  imagens_comentario: string[] | null;
  questao_revisada: string | null;
  is_pegadinha?: boolean;
  explicacao_pegadinha?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Transforma questão do banco para o formato usado pelo app
const transformQuestion = (dbQuestion: DbQuestion): ParsedQuestion => {
  let parsedAlternativas: Alternative[] = [];

  try {
    if (Array.isArray(dbQuestion.alternativas)) {
      parsedAlternativas = dbQuestion.alternativas;
    } else if (typeof dbQuestion.alternativas === 'string') {
      parsedAlternativas = JSON.parse(dbQuestion.alternativas);
    }
  } catch (e) {
    console.error(`Erro ao parsear alternativas da questão ${dbQuestion.id}`, e);
  }

  return {
    id: dbQuestion.id,
    materia: dbQuestion.materia,
    assunto: dbQuestion.assunto || '',
    concurso: dbQuestion.concurso || '',
    enunciado: dbQuestion.enunciado,
    alternativas: typeof dbQuestion.alternativas === 'string'
      ? dbQuestion.alternativas
      : JSON.stringify(dbQuestion.alternativas),
    parsedAlternativas,
    gabarito: dbQuestion.gabarito,
    comentario: dbQuestion.comentario,
    orgao: dbQuestion.orgao || '',
    banca: dbQuestion.banca || '',
    ano: dbQuestion.ano || 0,
    imagens_enunciado: dbQuestion.imagens_enunciado,
    imagens_comentario: dbQuestion.imagens_comentario?.join(',') || null,
    isPegadinha: dbQuestion.is_pegadinha || false,
    explicacaoPegadinha: dbQuestion.explicacao_pegadinha,
  };
};

// Transforma RawQuestion (mock) para ParsedQuestion
export const parseRawQuestion = (raw: RawQuestion): ParsedQuestion => {
  let parsedAlternativas: Alternative[] = [];
  try {
    parsedAlternativas = JSON.parse(raw.alternativas);
  } catch {
    parsedAlternativas = [];
  }
  return {
    ...raw,
    parsedAlternativas,
    isPegadinha: !!raw.explicacaoPegadinha,
  };
};

// Interface para filtros
export interface QuestionFilters {
  materias?: string[];
  assuntos?: string[];
  bancas?: string[];
  orgaos?: string[];
  cargos?: string[];
  anos?: number[];
  dificuldade?: string[];
  modalidade?: string[];
  escolaridade?: string[];
  apenasRevisadas?: boolean;
  apenasComComentario?: boolean;
  limit?: number;
  offset?: number;
  shuffle?: boolean;
}

export const OPTIONS_DIFICULDADE = [
  { value: 'Muito Fácil', label: 'Muito Fácil' },
  { value: 'Fácil', label: 'Fácil' },
  { value: 'Média', label: 'Média' },
  { value: 'Difícil', label: 'Difícil' },
  { value: 'Muito Difícil', label: 'Muito Difícil' },
];

export const OPTIONS_MODALIDADE = [
  { value: 'Certo/Errado', label: 'Certo/Errado' },
  { value: 'Múltipla Escolha', label: 'Múltipla Escolha' },
];

export const OPTIONS_ESCOLARIDADE = [
  { value: 'Nível Médio', label: 'Nível Médio' },
  { value: 'Nível Superior', label: 'Nível Superior' },
];


// Busca questões com filtros opcionais
// Com retry automático
export const fetchQuestions = async (filters?: QuestionFilters): Promise<ParsedQuestion[]> => {
  console.log('[fetchQuestions2] Buscando questões com filtros:', filters);

  return withRetry(async () => {
    let query = questionsDb
      .from('questoes_concurso')
      .select('*')
      // Filtro oculto: apenas questões ativas e válidas
      .eq('ativo', true)
      .not('enunciado', 'is', null)
      .neq('enunciado', '')
      .neq('enunciado', 'deleted');

    console.log("Filtrando por materia", filters?.materias);
    if (filters?.materias && filters.materias.length > 0) {
      // Usar match exato com .in() - os valores vêm do banco de dados
      // (via dropdown ou configuração do edital)
      query = query.in('materia', filters?.materias);
    }

    if (filters?.assuntos && filters.assuntos.length > 0) {
      // Usar match exato com .in() - os valores vêm do banco de dados
      // (via dropdown ou configuração do edital)
      query = query.in('assunto', filters.assuntos);
    }

    if (filters?.bancas && filters.bancas.length > 0) {
      // Normalizar nomes de bancas para o formato do banco
      const normalizedBancas = filters.bancas.map(normalizeBancaName);
      console.log('[fetchQuestions] Bancas normalizadas:', filters.bancas, '->', normalizedBancas);
      query = query.in('banca', normalizedBancas);
    }

    if (filters?.orgaos && filters.orgaos.length > 0) {
      query = query.in('orgao', filters.orgaos);
    }

    if (filters?.anos && filters.anos.length > 0) {
      query = query.in('ano', filters.anos);
    }

    if (filters?.cargos && filters.cargos.length > 0) {
      query = query.in('cargo_area_especialidade_edicao', filters.cargos);
    }

    if (filters?.apenasRevisadas) {
      query = query.or('questao_revisada.eq.true,questao_revisada.eq.sim');
    }

    if (filters?.apenasComComentario) {
      query = query.not('comentario', 'is', null).neq('comentario', '');
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 10) - 1);
    }

    const { data, error } = await query;

    if (error) {
      console.error('[fetchQuestions] Erro ao buscar questões:', error);
      throw error;
    }

    let questions = (data || []).map(transformQuestion);

    // Embaralhar se solicitado
    if (filters?.shuffle) {
      questions = questions.sort(() => Math.random() - 0.5);
    }

    console.log('[fetchQuestions] Retornando', questions.length, 'questões');
    return questions;
  });
};

// Busca uma questão por ID
export const fetchQuestionById = async (id: number): Promise<ParsedQuestion | null> => {
  const { data, error } = await questionsDb
    .from('questoes_concurso')
    .select('*')
    .eq('id', id)
    // Filtro oculto: apenas questões ativas e válidas
    .eq('ativo', true)
    .not('enunciado', 'is', null)
    .neq('enunciado', '')
    .neq('enunciado', 'deleted')
    .single();

  if (error) {
    console.error('Erro ao buscar questão:', error);
    return null;
  }

  return data ? transformQuestion(data) : null;
};

// Busca múltiplas questões por IDs
export const fetchQuestionsByIds = async (ids: number[]): Promise<ParsedQuestion[]> => {
  if (!ids || ids.length === 0) return [];

  console.log('[fetchQuestionsByIds] Buscando questões por IDs:', ids.length, 'questões');

  return withRetry(async () => {
    const { data, error } = await questionsDb
      .from('questoes_concurso')
      .select('*')
      .in('id', ids)
      // Filtro oculto: apenas questões ativas e válidas
      .eq('ativo', true)
      .not('enunciado', 'is', null)
      .neq('enunciado', '')
      .neq('enunciado', 'deleted');

    if (error) {
      console.error('[fetchQuestionsByIds] Erro ao buscar questões:', error);
      throw error;
    }

    const questions = (data || []).map(transformQuestion);

    // Reordenar para manter a ordem original dos IDs
    const questionsMap = new Map(questions.map(q => [q.id, q]));
    const orderedQuestions = ids
      .map(id => questionsMap.get(id))
      .filter((q): q is ParsedQuestion => q !== undefined);

    console.log('[fetchQuestionsByIds] Retornando', orderedQuestions.length, 'questões');
    return orderedQuestions;
  });
};

// Busca opções de filtro disponíveis (valores distintos)
// Usa função RPC do Postgres para performance otimizada
// Com cache e retry automático
export const fetchFilterOptions = async (): Promise<{
  materias: string[];
  bancas: string[];
  orgaos: string[];
  cargos: string[];
  anos: number[];
}> => {
  // Verificar cache
  const now = Date.now();
  if (filterOptionsCache.data && (now - filterOptionsCache.timestamp) < CACHE_TTL) {
    console.log('[fetchFilterOptions] Usando cache');
    return filterOptionsCache.data;
  }

  console.log('[fetchFilterOptions] Buscando opções de filtro do banco...');

  const result = await withRetry(async () => {
    const { data, error } = await questionsDb.rpc('get_all_filter_options');

    if (error) {
      console.error('[fetchFilterOptions] Erro ao buscar opções de filtro:', error);
      throw error;
    }

    if (!data) {
      throw new Error('Nenhum dado retornado pela função get_all_filter_options');
    }

    return {
      materias: (data?.materias || []) as string[],
      bancas: (data?.bancas || []) as string[],
      orgaos: (data?.orgaos || []) as string[],
      cargos: (data?.cargos || []) as string[],
      anos: (data?.anos || []) as number[],
    };
  });

  console.log('[fetchFilterOptions] Carregados:', {
    materias: result.materias.length,
    bancas: result.bancas.length,
    orgaos: result.orgaos.length,
    cargos: result.cargos.length,
    anos: result.anos.length,
  });

  // Atualizar cache
  filterOptionsCache = { data: result, timestamp: now };

  return result;
};

// Busca assuntos disponíveis para uma ou mais matérias
// Usa RPC para obter assuntos únicos de forma eficiente
export const fetchAssuntosByMaterias = async (materias: string[]): Promise<string[]> => {
  if (!materias || materias.length === 0) return [];

  try {
    // Usar RPC para obter assuntos únicos de forma otimizada
    const { data, error } = await questionsDb.rpc('get_unique_assuntos_by_materias', {
      p_materias: materias
    });

    if (error) {
      console.warn('[fetchAssuntosByMaterias] RPC não disponível, usando fallback:', error.message);
      // Fallback: buscar diretamente (pode ser mais lento)
      return await fetchAssuntosByMateriasFallback(materias);
    }

    const assuntos = (data || []).map((r: { assunto: string }) => r.assunto).sort();
    console.log('[fetchAssuntosByMaterias] Carregados:', assuntos.length, 'assuntos para', materias.length, 'materias');
    return assuntos;
  } catch (error) {
    console.error('Erro ao buscar assuntos:', error);
    return await fetchAssuntosByMateriasFallback(materias);
  }
};

// Fallback: busca assuntos sem RPC (mais lento mas funciona)
const fetchAssuntosByMateriasFallback = async (materias: string[]): Promise<string[]> => {
  const assuntosSet = new Set<string>();

  // Processar em lotes de 5 matérias para não sobrecarregar
  const batchSize = 5;
  for (let i = 0; i < materias.length; i += batchSize) {
    const batch = materias.slice(i, i + batchSize);

    const promises = batch.map(async (materia) => {
      const { data, error } = await questionsDb
        .from('questoes_concurso')
        .select('assunto')
        .eq('materia', materia)
        .not('assunto', 'is', null)
        .eq('ativo', true)
        .not('enunciado', 'is', null)
        .neq('enunciado', '')
        .neq('enunciado', 'deleted');

      if (error) {
        console.error(`Erro ao buscar assuntos para ${materia}:`, error);
        return [];
      }
      return data || [];
    });

    const results = await Promise.all(promises);
    results.flat().forEach(r => assuntosSet.add(r.assunto));
  }

  const uniqueAssuntos = Array.from(assuntosSet).sort();
  console.log('[fetchAssuntosByMateriasFallback] Carregados:', uniqueAssuntos.length, 'assuntos');
  return uniqueAssuntos;
};

// Tipo para nó da taxonomia hierárquica
export interface TaxonomyNode {
  id: number;
  codigo: string;
  nome: string;
  nivel: number;
  ordem: number;
  materia: string;
  parent_id: number | null;
  filhos: TaxonomyNode[];
  assuntos_originais?: string[];
}

// URL base do Mastra API (com fallback para produção)
const getMastraApiUrl = (path: string): string => {
  // Se VITE_MASTRA_URL está definido, usar
  if (import.meta.env.VITE_MASTRA_URL) {
    return `${import.meta.env.VITE_MASTRA_URL}${path}`;
  }

  // Em produção (hostname não é localhost), usar VPS
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return `http://72.61.217.225:4000${path}`;
  }

  // Desenvolvimento local
  return `http://localhost:4000${path}`;
};

// Busca toda a taxonomia de todas as matérias (para dropdown global)
export const fetchAllTaxonomia = async (): Promise<Map<string, TaxonomyNode[]>> => {
  try {
    const API_URL = getMastraApiUrl('/api/taxonomia/all');

    const response = await fetch(API_URL);
    if (!response.ok) {
      console.error('[fetchAllTaxonomia] Erro na resposta:', response.status);
      return new Map();
    }

    const data = await response.json();
    if (!data.success) {
      console.error('[fetchAllTaxonomia] API retornou erro:', data.error);
      return new Map();
    }

    // Converter objeto para Map
    const result = new Map<string, TaxonomyNode[]>();
    for (const [materia, nodes] of Object.entries(data.taxonomiaByMateria)) {
      result.set(materia, nodes as TaxonomyNode[]);
    }

    console.log('[fetchAllTaxonomia] Taxonomia carregada:', result.size, 'matérias,', data.totalNodes, 'nós');
    return result;
  } catch (error) {
    console.error('[fetchAllTaxonomia] Erro:', error);
    return new Map();
  }
};

// Busca taxonomia hierárquica para uma matéria
export const fetchTaxonomiaByMateria = async (materia: string): Promise<TaxonomyNode[]> => {
  if (!materia) return [];

  try {
    const API_URL = getMastraApiUrl(`/api/taxonomia/${encodeURIComponent(materia)}`);

    const response = await fetch(API_URL);
    if (!response.ok) {
      console.error('[fetchTaxonomiaByMateria] Erro na resposta:', response.status, API_URL);
      return [];
    }

    const data = await response.json();
    if (!data.success) {
      console.error('[fetchTaxonomiaByMateria] API retornou erro:', data.error);
      return [];
    }

    console.log('[fetchTaxonomiaByMateria] Taxonomia carregada para', materia, ':', data.totalNodes, 'nós');
    return data.taxonomia || [];
  } catch (error) {
    console.error('[fetchTaxonomiaByMateria] Erro:', error);
    return [];
  }
};

// Busca taxonomia para múltiplas matérias
export const fetchTaxonomiaByMaterias = async (materias: string[]): Promise<Map<string, TaxonomyNode[]>> => {
  const result = new Map<string, TaxonomyNode[]>();

  if (!materias || materias.length === 0) return result;

  // Buscar em paralelo para todas as matérias
  const promises = materias.map(async (materia) => {
    const taxonomia = await fetchTaxonomiaByMateria(materia);
    return { materia, taxonomia };
  });

  const results = await Promise.all(promises);

  for (const { materia, taxonomia } of results) {
    result.set(materia, taxonomia);
  }

  console.log('[fetchTaxonomiaByMaterias] Carregadas taxonomias para', result.size, 'matérias');
  return result;
};

// Extrai todos os assuntos originais de uma árvore de taxonomia
export const extractAssuntosFromTaxonomy = (nodes: TaxonomyNode[]): string[] => {
  const assuntos: string[] = [];

  const extractRecursive = (nodeList: TaxonomyNode[]) => {
    for (const node of nodeList) {
      if (node.assuntos_originais && node.assuntos_originais.length > 0) {
        assuntos.push(...node.assuntos_originais);
      }
      if (node.filhos && node.filhos.length > 0) {
        extractRecursive(node.filhos);
      }
    }
  };

  extractRecursive(nodes);
  return [...new Set(assuntos)]; // Remove duplicatas
};

// Conta total de questões (com filtros opcionais)
// Usa função RPC otimizada para evitar timeout
// Com retry automático
export const getQuestionsCount = async (filters?: Omit<QuestionFilters, 'limit' | 'offset' | 'shuffle'>): Promise<number> => {
  return withRetry(async () => {
    // Preparar parâmetros para a função RPC
    const params: {
      p_materias?: string[];
      p_assuntos?: string[];
      p_bancas?: string[];
      p_orgaos?: string[];
      p_anos?: number[];
      p_cargos?: string[];
      p_apenas_revisadas?: boolean;
      p_apenas_com_comentario?: boolean;
    } = {};

    if (filters?.materias && filters.materias.length > 0) {
      params.p_materias = filters.materias;
    }

    if (filters?.assuntos && filters.assuntos.length > 0) {
      params.p_assuntos = filters.assuntos;
    }

    if (filters?.bancas && filters.bancas.length > 0) {
      // Normalizar nomes de bancas para o formato do banco
      params.p_bancas = filters.bancas.map(normalizeBancaName);
    }

    if (filters?.orgaos && filters.orgaos.length > 0) {
      params.p_orgaos = filters.orgaos;
    }

    if (filters?.anos && filters.anos.length > 0) {
      params.p_anos = filters.anos;
    }

    if (filters?.cargos && filters.cargos.length > 0) {
      params.p_cargos = filters.cargos;
    }

    if (filters?.apenasRevisadas) {
      params.p_apenas_revisadas = true;
    }

    if (filters?.apenasComComentario) {
      params.p_apenas_com_comentario = true;
    }

    const { data, error } = await questionsDb.rpc('get_questions_count', params);

    if (error) {
      console.error('[getQuestionsCount] Erro ao contar questões:', error);
      throw error; // Lança erro para acionar retry
    }

    console.log('[getQuestionsCount] Total:', data);
    return data || 0;
  });
};

export const questionsService = {
  fetchQuestions,
  fetchQuestionById,
  fetchQuestionsByIds,
  fetchFilterOptions,
  fetchAssuntosByMaterias,
  fetchTaxonomiaByMateria,
  fetchTaxonomiaByMaterias,
  extractAssuntosFromTaxonomy,
  getQuestionsCount,
  parseRawQuestion,
  OPTIONS_ESCOLARIDADE,
  OPTIONS_MODALIDADE,
  OPTIONS_DIFICULDADE,
};

export default questionsService;
