import { questionsDb, ExternalQuestion, CourseQuestionFilters, QuestionsStats } from './questionsDbClient';

// Re-export types for convenience
export type { QuestionsStats } from './questionsDbClient';
import { ParsedQuestion, Alternative } from '../types';

/**
 * Serviço para buscar questões do Banco de Questões Externo (Projeto Scrapping)
 *
 * Este serviço permite:
 * - Buscar questões com filtros avançados
 * - Obter estatísticas do banco
 * - Listar matérias, bancas, anos disponíveis
 * - Criar seleções de questões para cursos
 */

// Transforma questão do banco externo para o formato da aplicação
const transformExternalQuestion = (q: ExternalQuestion): ParsedQuestion => {
  let parsedAlternativas: Alternative[] = [];

  try {
    if (typeof q.alternativas === 'string') {
      parsedAlternativas = JSON.parse(q.alternativas);
    } else if (Array.isArray(q.alternativas)) {
      parsedAlternativas = q.alternativas;
    }
  } catch (e) {
    console.error(`Failed to parse alternatives for external Q${q.id}`, e);
  }

  return {
    id: q.id,
    materia: q.materia,
    assunto: q.assunto || '',
    concurso: q.concurso || '',
    enunciado: q.enunciado,
    alternativas: typeof q.alternativas === 'string' ? q.alternativas : JSON.stringify(q.alternativas),
    parsedAlternativas,
    gabarito: q.gabarito || '',
    comentario: q.comentario,
    orgao: q.orgao || '',
    banca: q.banca || '',
    ano: q.ano || 0,
    imagens_enunciado: q.imagens_enunciado,
    imagens_comentario: q.imagens_comentario?.join(',') || null,
    isPegadinha: false, // Pode ser determinado por análise posterior
  };
};

/**
 * Busca questões do banco externo com filtros
 */
export const fetchExternalQuestions = async (
  filters: CourseQuestionFilters = {}
): Promise<ParsedQuestion[]> => {
  try {
    let query = questionsDb
      .from('questoes_concurso')
      .select('*');

    // Aplicar filtros de matérias
    if (filters.materias && filters.materias.length > 0) {
      query = query.in('materia', filters.materias);
    }

    // Aplicar filtros de bancas
    if (filters.bancas && filters.bancas.length > 0) {
      query = query.in('banca', filters.bancas);
    }

    // Aplicar filtros de anos
    if (filters.anos && filters.anos.length > 0) {
      query = query.in('ano', filters.anos);
    }

    // Aplicar filtros de órgãos
    if (filters.orgaos && filters.orgaos.length > 0) {
      query = query.in('orgao', filters.orgaos);
    }

    // Aplicar filtros de assuntos
    if (filters.assuntos && filters.assuntos.length > 0) {
      query = query.in('assunto', filters.assuntos);
    }

    // Excluir IDs específicos
    if (filters.excludeIds && filters.excludeIds.length > 0) {
      query = query.not('id', 'in', `(${filters.excludeIds.join(',')})`);
    }

    // Aplicar limite
    const limit = filters.limit || 1000;
    query = query.limit(limit);

    // Ordenar aleatoriamente para variedade (ou por ano desc para questões mais recentes)
    query = query.order('ano', { ascending: false, nullsFirst: false });

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching external questions:', error);
      throw error;
    }

    return (data || []).map(transformExternalQuestion);
  } catch (error) {
    console.error('Failed to fetch external questions:', error);
    return [];
  }
};

/**
 * Busca questões por IDs específicos
 */
export const fetchExternalQuestionsByIds = async (
  ids: number[]
): Promise<ParsedQuestion[]> => {
  if (ids.length === 0) return [];

  try {
    const { data, error } = await questionsDb
      .from('questoes_concurso')
      .select('*')
      .in('id', ids);

    if (error) {
      console.error('Error fetching external questions by IDs:', error);
      throw error;
    }

    return (data || []).map(transformExternalQuestion);
  } catch (error) {
    console.error('Failed to fetch external questions by IDs:', error);
    return [];
  }
};

/**
 * Busca uma única questão por ID
 */
export const fetchExternalQuestionById = async (
  id: number
): Promise<ParsedQuestion | null> => {
  try {
    const { data, error } = await questionsDb
      .from('questoes_concurso')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Error fetching external question:', error);
      return null;
    }

    return data ? transformExternalQuestion(data) : null;
  } catch (error) {
    console.error('Failed to fetch external question:', error);
    return null;
  }
};

/**
 * Obtém estatísticas do banco de questões
 */
export const getExternalQuestionsStats = async (): Promise<QuestionsStats> => {
  try {
    const { data, error } = await questionsDb
      .from('questoes_concurso')
      .select('id, materia, banca, ano');

    if (error) {
      console.error('Error fetching stats:', error);
      return { total: 0, materias: 0, bancas: 0, anos: 0 };
    }

    const materias = new Set(data?.map(q => q.materia).filter(Boolean));
    const bancas = new Set(data?.map(q => q.banca).filter(Boolean));
    const anos = new Set(data?.map(q => q.ano).filter(Boolean));

    return {
      total: data?.length || 0,
      materias: materias.size,
      bancas: bancas.size,
      anos: anos.size,
    };
  } catch (error) {
    console.error('Failed to get stats:', error);
    return { total: 0, materias: 0, bancas: 0, anos: 0 };
  }
};

/**
 * Lista todas as matérias disponíveis com contagem
 */
export const listAvailableMaterias = async (): Promise<{ materia: string; count: number }[]> => {
  try {
    const { data, error } = await questionsDb
      .from('questoes_concurso')
      .select('materia');

    if (error) throw error;

    // Contar por matéria
    const counts = new Map<string, number>();
    data?.forEach(q => {
      if (q.materia) {
        counts.set(q.materia, (counts.get(q.materia) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([materia, count]) => ({ materia, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Failed to list materias:', error);
    return [];
  }
};

/**
 * Lista todas as bancas disponíveis com contagem
 */
export const listAvailableBancas = async (): Promise<{ banca: string; count: number }[]> => {
  try {
    const { data, error } = await questionsDb
      .from('questoes_concurso')
      .select('banca');

    if (error) throw error;

    const counts = new Map<string, number>();
    data?.forEach(q => {
      if (q.banca) {
        counts.set(q.banca, (counts.get(q.banca) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([banca, count]) => ({ banca, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Failed to list bancas:', error);
    return [];
  }
};

/**
 * Lista todos os anos disponíveis com contagem
 */
export const listAvailableAnos = async (): Promise<{ ano: number; count: number }[]> => {
  try {
    const { data, error } = await questionsDb
      .from('questoes_concurso')
      .select('ano');

    if (error) throw error;

    const counts = new Map<number, number>();
    data?.forEach(q => {
      if (q.ano) {
        counts.set(q.ano, (counts.get(q.ano) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([ano, count]) => ({ ano, count }))
      .sort((a, b) => b.ano - a.ano);
  } catch (error) {
    console.error('Failed to list anos:', error);
    return [];
  }
};

/**
 * Lista órgãos disponíveis com contagem
 */
export const listAvailableOrgaos = async (): Promise<{ orgao: string; count: number }[]> => {
  try {
    const { data, error } = await questionsDb
      .from('questoes_concurso')
      .select('orgao');

    if (error) throw error;

    const counts = new Map<string, number>();
    data?.forEach(q => {
      if (q.orgao) {
        counts.set(q.orgao, (counts.get(q.orgao) || 0) + 1);
      }
    });

    return Array.from(counts.entries())
      .map(([orgao, count]) => ({ orgao, count }))
      .sort((a, b) => b.count - a.count);
  } catch (error) {
    console.error('Failed to list orgaos:', error);
    return [];
  }
};

/**
 * Conta quantas questões correspondem aos filtros
 */
export const countExternalQuestions = async (
  filters: Omit<CourseQuestionFilters, 'limit' | 'excludeIds'>
): Promise<number> => {
  try {
    let query = questionsDb
      .from('questoes_concurso')
      .select('id', { count: 'exact', head: true });

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

    const { count, error } = await query;

    if (error) throw error;

    return count || 0;
  } catch (error) {
    console.error('Failed to count questions:', error);
    return 0;
  }
};

/**
 * Busca questões aleatórias para simulados
 * Usa uma estratégia de paginação aleatória para melhor performance
 */
export const fetchRandomQuestions = async (
  filters: CourseQuestionFilters,
  count: number = 10
): Promise<ParsedQuestion[]> => {
  try {
    // Primeiro, conta o total de questões disponíveis
    const total = await countExternalQuestions(filters);

    if (total === 0) return [];

    // Gera um offset aleatório
    const maxOffset = Math.max(0, total - count);
    const randomOffset = Math.floor(Math.random() * maxOffset);

    let query = questionsDb
      .from('questoes_concurso')
      .select('*');

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

    const { data, error } = await query
      .range(randomOffset, randomOffset + count - 1);

    if (error) throw error;

    // Embaralha o resultado para mais aleatoriedade
    const shuffled = (data || []).sort(() => Math.random() - 0.5);

    return shuffled.map(transformExternalQuestion);
  } catch (error) {
    console.error('Failed to fetch random questions:', error);
    return [];
  }
};

// Mapeamento de bancas para nomes mais curtos (para exibição)
export const BANCA_SHORT_NAMES: Record<string, string> = {
  'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos': 'CEBRASPE',
  'Centro de Seleção e de Promoção de Eventos - UnB': 'CESPE/UnB',
  'Fundação Carlos Chagas': 'FCC',
  'Fundação Getúlio Vargas': 'FGV',
  'Fundação para o Vestibular da Universidade Estadual Paulista': 'VUNESP',
  'Instituto AOCP': 'AOCP',
  'Instituto Brasileiro de Formação e Capacitação': 'IBFC',
};

export const getShortBancaName = (banca: string): string => {
  return BANCA_SHORT_NAMES[banca] || banca;
};
