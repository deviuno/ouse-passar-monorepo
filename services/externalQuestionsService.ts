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
  assuntos?: string[];
  excludeIds?: number[];
  limit?: number;
}

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
      .select('*');

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

    if (filters.assuntos && filters.assuntos.length > 0) {
      query = query.in('assunto', filters.assuntos);
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
      .select('id', { count: 'exact', head: true });

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

    if (filters.assuntos && filters.assuntos.length > 0) {
      query = query.in('assunto', filters.assuntos);
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
 */
export async function getFilterOptions(): Promise<{
  materias: string[];
  bancas: string[];
  anos: number[];
  orgaos: string[];
  error?: string;
}> {
  if (!questionsDb) {
    return {
      materias: [],
      bancas: [],
      anos: [],
      orgaos: [],
      error: 'Banco de questões não configurado.'
    };
  }

  try {
    // Get unique materias
    const { data: materiasData } = await questionsDb
      .from('questoes_concurso')
      .select('materia')
      .not('materia', 'is', null)
      .limit(1000);

    // Get unique bancas
    const { data: bancasData } = await questionsDb
      .from('questoes_concurso')
      .select('banca')
      .not('banca', 'is', null)
      .limit(1000);

    // Get unique anos
    const { data: anosData } = await questionsDb
      .from('questoes_concurso')
      .select('ano')
      .not('ano', 'is', null)
      .limit(1000);

    // Get unique orgaos
    const { data: orgaosData } = await questionsDb
      .from('questoes_concurso')
      .select('orgao')
      .not('orgao', 'is', null)
      .limit(1000);

    // Extract unique values
    const materias = [...new Set((materiasData || []).map(d => d.materia))].sort();
    const bancas = [...new Set((bancasData || []).map(d => d.banca))].sort();
    const anos = [...new Set((anosData || []).map(d => d.ano))].sort((a, b) => b - a);
    const orgaos = [...new Set((orgaosData || []).map(d => d.orgao))].sort();

    return { materias, bancas, anos, orgaos };
  } catch (error: any) {
    console.error('Error fetching filter options:', error);
    return {
      materias: [],
      bancas: [],
      anos: [],
      orgaos: [],
      error: error.message
    };
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
    // Get total count
    const { count: total } = await questionsDb
      .from('questoes_concurso')
      .select('id', { count: 'exact', head: true });

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
