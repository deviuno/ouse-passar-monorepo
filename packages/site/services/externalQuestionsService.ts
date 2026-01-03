import { questionsDb, isQuestionsDbConfigured } from '../lib/questionsDb';

// ============================================================================
// TYPES
// ============================================================================

export interface ExternalQuestion {
  id: number;
  materia: string;
  assunto: string | null;
  concurso: string | null;
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
  cargo_area_especialidade_edicao: string | null;
  prova: string | null;
  ano: number | null;
  banca: string | null;
  imagens_enunciado: string | null;
  imagens_comentario: string[] | null;
  questao_revisada: string | null;
  created_at: string;
}

export interface QuestionFilters {
  materias?: string[];
  bancas?: string[];
  anos?: number[];
  orgaos?: string[];
  cargos?: string[];
  assuntos?: string[];
  escolaridade?: string[];
  modalidade?: string[];
  excludeIds?: number[];
  limit?: number;
}

// Opções estáticas para filtros
export const OPTIONS_MODALIDADE = [
  { value: 'Certo/Errado', label: 'Certo/Errado' },
  { value: 'Múltipla Escolha', label: 'Múltipla Escolha' },
];

export const OPTIONS_ESCOLARIDADE = [
  { value: 'Nível Médio', label: 'Nível Médio' },
  { value: 'Nível Superior', label: 'Nível Superior' },
];

export interface QuestionsStats {
  total: number;
  byMateria: Record<string, number>;
  byBanca: Record<string, number>;
  byAno: Record<number, number>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ============================================================================
// MAIN FUNCTIONS
// ============================================================================

/**
 * Check if external questions database is configured
 */
export function isExternalDbAvailable(): boolean {
  return isQuestionsDbConfigured();
}

/**
 * Get questions from external database based on filters
 */
export async function getQuestionsForFilters(
  filters: QuestionFilters,
  options?: {
    limit?: number;
    offset?: number;
    randomize?: boolean;
  }
): Promise<{ questions: ExternalQuestion[]; error?: string }> {
  if (!questionsDb) {
    return {
      questions: [],
      error: 'Banco de questões não configurado. Verifique VITE_QUESTIONS_DB_URL e VITE_QUESTIONS_DB_ANON_KEY.'
    };
  }

  try {
    let query = questionsDb
      .from('questoes_concurso')
      .select('*')
      .eq('ativo', true); // Apenas questões ativas

    // Apply filters
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

    if (filters.cargos && filters.cargos.length > 0) {
      query = query.in('cargo_area_especialidade_edicao', filters.cargos);
    }

    if (filters.assuntos && filters.assuntos.length > 0) {
      query = query.in('assunto', filters.assuntos);
    }

    if (filters.escolaridade && filters.escolaridade.length > 0) {
      query = query.in('escolaridade', filters.escolaridade);
    }

    if (filters.modalidade && filters.modalidade.length > 0) {
      query = query.in('modalidade', filters.modalidade);
    }

    if (filters.excludeIds && filters.excludeIds.length > 0) {
      query = query.not('id', 'in', `(${filters.excludeIds.join(',')})`);
    }

    // Pagination
    const limit = options?.limit || filters.limit || 20;
    const offset = options?.offset || 0;

    query = query
      .order('ano', { ascending: false })
      .range(offset, offset + limit - 1);

    const { data, error } = await query;

    if (error) throw error;

    let questions = data || [];

    // Randomize if requested
    if (options?.randomize && questions.length > 0) {
      questions = shuffleArray(questions);
    }

    return { questions };
  } catch (error: any) {
    console.error('Error fetching questions:', error);
    return { questions: [], error: error.message };
  }
}

/**
 * Count total questions matching filters
 */
export async function countQuestionsForFilters(
  filters: QuestionFilters
): Promise<{ count: number; error?: string }> {
  if (!questionsDb) {
    return {
      count: 0,
      error: 'Banco de questões não configurado.'
    };
  }

  try {
    let query = questionsDb
      .from('questoes_concurso')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true); // Apenas questões ativas

    // Apply filters
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

    if (filters.cargos && filters.cargos.length > 0) {
      query = query.in('cargo_area_especialidade_edicao', filters.cargos);
    }

    if (filters.assuntos && filters.assuntos.length > 0) {
      query = query.in('assunto', filters.assuntos);
    }

    if (filters.escolaridade && filters.escolaridade.length > 0) {
      query = query.in('escolaridade', filters.escolaridade);
    }

    if (filters.modalidade && filters.modalidade.length > 0) {
      query = query.in('modalidade', filters.modalidade);
    }

    if (filters.excludeIds && filters.excludeIds.length > 0) {
      query = query.not('id', 'in', `(${filters.excludeIds.join(',')})`);
    }

    const { count, error } = await query;

    if (error) throw error;

    return { count: count || 0 };
  } catch (error: any) {
    console.error('Error counting questions:', error);
    return { count: 0, error: error.message };
  }
}

/**
 * Get preview questions (sample for validation)
 */
export async function previewQuestions(
  filters: QuestionFilters,
  limit: number = 10
): Promise<{ questions: ExternalQuestion[]; total: number; error?: string }> {
  if (!questionsDb) {
    return {
      questions: [],
      total: 0,
      error: 'Banco de questões não configurado.'
    };
  }

  try {
    // Get count first
    const { count: total } = await countQuestionsForFilters(filters);

    // Get sample questions
    const { questions, error } = await getQuestionsForFilters(filters, {
      limit,
      randomize: true,
    });

    if (error) throw new Error(error);

    return { questions, total };
  } catch (error: any) {
    console.error('Error previewing questions:', error);
    return { questions: [], total: 0, error: error.message };
  }
}

/**
 * Get available filter options (unique values)
 * This returns ALL options without considering current selections
 * Uses RPC functions for efficient DISTINCT queries
 */
export async function getFilterOptions(): Promise<{
  materias: string[];
  bancas: string[];
  anos: number[];
  orgaos: string[];
  cargos: string[];
  error?: string;
}> {
  if (!questionsDb) {
    return {
      materias: [],
      bancas: [],
      anos: [],
      orgaos: [],
      cargos: [],
      error: 'Banco de questões não configurado.'
    };
  }

  try {
    // Use RPC functions for efficient DISTINCT queries
    const [materiasResult, bancasResult, anosResult, orgaosResult, cargosResult] = await Promise.all([
      questionsDb.rpc('get_distinct_materias'),
      questionsDb.rpc('get_distinct_bancas'),
      questionsDb.rpc('get_distinct_anos'),
      questionsDb.rpc('get_distinct_orgaos'),
      questionsDb.rpc('get_distinct_cargos'),
    ]);

    const materias = (materiasResult.data || []).map((d: { materia: string }) => d.materia);
    const bancas = (bancasResult.data || []).map((d: { banca: string }) => d.banca);
    const anos = (anosResult.data || []).map((d: { ano: number }) => d.ano);
    const orgaos = (orgaosResult.data || []).map((d: { orgao: string }) => d.orgao);
    const cargos = (cargosResult.data || []).map((d: { cargo: string }) => d.cargo);

    return { materias, bancas, anos, orgaos, cargos };
  } catch (error: any) {
    console.error('Error fetching filter options:', error);
    return {
      materias: [],
      bancas: [],
      anos: [],
      orgaos: [],
      cargos: [],
      error: error.message
    };
  }
}

/**
 * Get dynamic filter options based on current selections
 * Returns only options that have matching questions considering all other filters
 * Uses RPC functions for efficient DISTINCT queries with filters
 */
export async function getDynamicFilterOptions(currentFilters: QuestionFilters): Promise<{
  materias: string[];
  bancas: string[];
  anos: number[];
  orgaos: string[];
  cargos: string[];
  error?: string;
}> {
  if (!questionsDb) {
    return {
      materias: [],
      bancas: [],
      anos: [],
      orgaos: [],
      cargos: [],
      error: 'Banco de questões não configurado.'
    };
  }

  try {
    // Prepare filter arrays (null if empty to trigger default in RPC)
    const materiasFilter = currentFilters.materias && currentFilters.materias.length > 0 ? currentFilters.materias : null;
    const bancasFilter = currentFilters.bancas && currentFilters.bancas.length > 0 ? currentFilters.bancas : null;
    const anosFilter = currentFilters.anos && currentFilters.anos.length > 0 ? currentFilters.anos : null;
    const orgaosFilter = currentFilters.orgaos && currentFilters.orgaos.length > 0 ? currentFilters.orgaos : null;
    const cargosFilter = currentFilters.cargos && currentFilters.cargos.length > 0 ? currentFilters.cargos : null;

    // Use RPC functions with filters for efficient DISTINCT queries
    const [materiasResult, bancasResult, anosResult, orgaosResult, cargosResult] = await Promise.all([
      questionsDb.rpc('get_filtered_materias', {
        p_bancas: bancasFilter,
        p_anos: anosFilter,
        p_orgaos: orgaosFilter,
        p_cargos: cargosFilter
      }),
      questionsDb.rpc('get_filtered_bancas', {
        p_materias: materiasFilter,
        p_anos: anosFilter,
        p_orgaos: orgaosFilter,
        p_cargos: cargosFilter
      }),
      questionsDb.rpc('get_filtered_anos', {
        p_materias: materiasFilter,
        p_bancas: bancasFilter,
        p_orgaos: orgaosFilter,
        p_cargos: cargosFilter
      }),
      questionsDb.rpc('get_filtered_orgaos', {
        p_materias: materiasFilter,
        p_bancas: bancasFilter,
        p_anos: anosFilter,
        p_cargos: cargosFilter
      }),
      questionsDb.rpc('get_filtered_cargos', {
        p_materias: materiasFilter,
        p_bancas: bancasFilter,
        p_anos: anosFilter,
        p_orgaos: orgaosFilter
      }),
    ]);

    const materias = (materiasResult.data || []).map((d: { materia: string }) => d.materia);
    const bancas = (bancasResult.data || []).map((d: { banca: string }) => d.banca);
    const anos = (anosResult.data || []).map((d: { ano: number }) => d.ano);
    const orgaos = (orgaosResult.data || []).map((d: { orgao: string }) => d.orgao);
    const cargos = (cargosResult.data || []).map((d: { cargo: string }) => d.cargo);

    return { materias, bancas, anos, orgaos, cargos };
  } catch (error: any) {
    console.error('Error fetching dynamic filter options:', error);
    return {
      materias: [],
      bancas: [],
      anos: [],
      orgaos: [],
      cargos: [],
      error: error.message
    };
  }
}

/**
 * Get assuntos available for selected materias
 * Loads dynamically based on selected materias
 */
export async function getAssuntosByMaterias(
  materias: string[]
): Promise<{ assuntos: string[]; error?: string }> {
  if (!questionsDb) {
    return {
      assuntos: [],
      error: 'Banco de questões não configurado.'
    };
  }

  if (!materias || materias.length === 0) {
    return { assuntos: [] };
  }

  try {
    // Buscar em lotes pequenos para cada matéria e coletar assuntos únicos
    const assuntosSet = new Set<string>();

    for (const materia of materias) {
      const { data, error } = await questionsDb
        .from('questoes_concurso')
        .select('assunto')
        .eq('ativo', true) // Apenas questões ativas
        .eq('materia', materia)
        .not('assunto', 'is', null)
        .not('enunciado', 'is', null)
        .neq('enunciado', '')
        .neq('enunciado', 'deleted')
        .limit(1000);

      if (error) {
        console.error(`Erro ao buscar assuntos para ${materia}:`, error);
        continue;
      }

      (data || []).forEach(r => {
        if (r.assunto) assuntosSet.add(r.assunto);
      });
    }

    const uniqueAssuntos = Array.from(assuntosSet).sort();
    return { assuntos: uniqueAssuntos };
  } catch (error: any) {
    console.error('Erro ao buscar assuntos:', error);
    return { assuntos: [], error: error.message };
  }
}

/**
 * Get statistics about the questions database
 */
export async function getQuestionsStats(): Promise<{ stats: QuestionsStats | null; error?: string }> {
  if (!questionsDb) {
    return {
      stats: null,
      error: 'Banco de questões não configurado.'
    };
  }

  try {
    // Get total count - apenas questões ativas
    const { count: total } = await questionsDb
      .from('questoes_concurso')
      .select('id', { count: 'exact', head: true })
      .eq('ativo', true); // Apenas questões ativas

    // For detailed stats, we'd need to run aggregation queries
    // This is a simplified version
    const stats: QuestionsStats = {
      total: total || 0,
      byMateria: {},
      byBanca: {},
      byAno: {},
    };

    return { stats };
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    return { stats: null, error: error.message };
  }
}
