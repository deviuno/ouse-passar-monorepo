// Questions Service - Busca questões do banco de questões externo
import { questionsDb } from './questionsDbClient';
import { ParsedQuestion, Alternative, RawQuestion } from '../types';

// Helper para retry com backoff exponencial
const withRetry = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;
      console.warn(`[withRetry] Tentativa ${attempt + 1}/${maxRetries} falhou:`, error);

      if (attempt < maxRetries - 1) {
        const delay = baseDelay * Math.pow(2, attempt);
        console.log(`[withRetry] Aguardando ${delay}ms antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
};

// Cache simples para opções de filtro
let filterOptionsCache: {
  data: { materias: string[]; bancas: string[]; orgaos: string[]; cargos: string[]; anos: number[] } | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

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
  console.log('[fetchQuestions] Buscando questões com filtros:', filters);

  return withRetry(async () => {
    let query = questionsDb
      .from('questoes_concurso')
      .select('*')
      // Filtro oculto: excluir questões deletadas ou sem enunciado
      .not('enunciado', 'is', null)
      .neq('enunciado', '')
      .neq('enunciado', 'deleted');

    if (filters?.materias && filters.materias.length > 0) {
      query = query.in('materia', filters.materias);
    }

    if (filters?.assuntos && filters.assuntos.length > 0) {
      query = query.in('assunto', filters.assuntos);
    }

    if (filters?.bancas && filters.bancas.length > 0) {
      query = query.in('banca', filters.bancas);
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
    // Filtro oculto: excluir questões deletadas
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
// Usa query direta otimizada para evitar timeout
export const fetchAssuntosByMaterias = async (materias: string[]): Promise<string[]> => {
  if (!materias || materias.length === 0) return [];

  try {
    // Buscar em lotes pequenos para cada matéria e coletar assuntos únicos
    const assuntosSet = new Set<string>();

    for (const materia of materias) {
      const { data, error } = await questionsDb
        .from('questoes_concurso')
        .select('assunto')
        .eq('materia', materia)
        .not('assunto', 'is', null)
        // Filtro oculto: excluir questões deletadas
        .not('enunciado', 'is', null)
        .neq('enunciado', '')
        .neq('enunciado', 'deleted')
        .limit(1000); // Limitar para evitar timeout

      if (error) {
        console.error(`Erro ao buscar assuntos para ${materia}:`, error);
        continue;
      }

      (data || []).forEach(r => assuntosSet.add(r.assunto));
    }

    const uniqueAssuntos = Array.from(assuntosSet).sort();
    console.log('[fetchAssuntosByMaterias] Carregados:', uniqueAssuntos.length, 'assuntos para', materias.length, 'materias');
    return uniqueAssuntos;
  } catch (error) {
    console.error('Erro ao buscar assuntos:', error);
    return [];
  }
};

// Conta total de questões (com filtros opcionais)
// Com retry automático
export const getQuestionsCount = async (filters?: Omit<QuestionFilters, 'limit' | 'offset' | 'shuffle'>): Promise<number> => {
  return withRetry(async () => {
    let query = questionsDb
      .from('questoes_concurso')
      .select('*', { count: 'exact', head: true })
      // Filtro oculto: excluir questões deletadas ou sem enunciado
      .not('enunciado', 'is', null)
      .neq('enunciado', '')
      .neq('enunciado', 'deleted');

    if (filters?.materias && filters.materias.length > 0) {
      query = query.in('materia', filters.materias);
    }

    if (filters?.assuntos && filters.assuntos.length > 0) {
      query = query.in('assunto', filters.assuntos);
    }

    if (filters?.bancas && filters.bancas.length > 0) {
      query = query.in('banca', filters.bancas);
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

    const { count, error } = await query;

    if (error) {
      console.error('[getQuestionsCount] Erro ao contar questões:', error);
      throw error; // Lança erro para acionar retry
    }

    console.log('[getQuestionsCount] Total:', count);
    return count || 0;
  });
};

export const questionsService = {
  fetchQuestions,
  fetchQuestionById,
  fetchFilterOptions,
  fetchAssuntosByMaterias,
  getQuestionsCount,
  parseRawQuestion,
  OPTIONS_ESCOLARIDADE,
  OPTIONS_MODALIDADE,
  OPTIONS_DIFICULDADE,
};

export default questionsService;
