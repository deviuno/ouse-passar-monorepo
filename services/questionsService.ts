import { supabase, DbQuestion } from './supabaseClient';
import { ParsedQuestion, Alternative } from '../types';

// Transform DB question to parsed question format used by the app
const transformQuestion = (dbQuestion: DbQuestion): ParsedQuestion => {
  let parsedAlternativas: Alternative[] = [];

  try {
    // alternativas is already JSONB, should be an array
    if (Array.isArray(dbQuestion.alternativas)) {
      parsedAlternativas = dbQuestion.alternativas;
    } else if (typeof dbQuestion.alternativas === 'string') {
      parsedAlternativas = JSON.parse(dbQuestion.alternativas);
    }
  } catch (e) {
    console.error(`Failed to parse alternatives for Q${dbQuestion.id}`, e);
  }

  return {
    id: dbQuestion.id,
    materia: dbQuestion.materia,
    assunto: dbQuestion.assunto || '',
    concurso: dbQuestion.concurso || '',
    enunciado: dbQuestion.enunciado,
    alternativas: JSON.stringify(dbQuestion.alternativas),
    parsedAlternativas,
    gabarito: dbQuestion.gabarito,
    comentario: dbQuestion.comentario,
    orgao: dbQuestion.orgao || '',
    banca: dbQuestion.banca || '',
    ano: dbQuestion.ano || 0,
    imagens_enunciado: dbQuestion.imagens_enunciado,
    imagens_comentario: dbQuestion.imagens_comentario?.join(',') || null,
    isPegadinha: dbQuestion.is_pegadinha,
    explicacaoPegadinha: dbQuestion.explicacao_pegadinha,
  };
};

// Fetch questions with optional filters
export const fetchQuestions = async (options?: {
  limit?: number;
  offset?: number;
  materia?: string;
  banca?: string;
  ano?: number;
  isPegadinha?: boolean;
  questionIds?: number[];
}): Promise<ParsedQuestion[]> => {
  let query = supabase
    .from('questoes_concurso')
    .select('*');

  if (options?.materia) {
    query = query.eq('materia', options.materia);
  }

  if (options?.banca) {
    query = query.eq('banca', options.banca);
  }

  if (options?.ano) {
    query = query.eq('ano', options.ano);
  }

  if (options?.isPegadinha !== undefined) {
    query = query.eq('is_pegadinha', options.isPegadinha);
  }

  if (options?.questionIds && options.questionIds.length > 0) {
    query = query.in('id', options.questionIds);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching questions:', error);
    throw error;
  }

  return (data || []).map(transformQuestion);
};

// Fetch a single question by ID
export const fetchQuestionById = async (id: number): Promise<ParsedQuestion | null> => {
  const { data, error } = await supabase
    .from('questoes_concurso')
    .select('*')
    .eq('id', id)
    .single();

  if (error) {
    console.error('Error fetching question:', error);
    return null;
  }

  return data ? transformQuestion(data) : null;
};

// Get distinct values for filters
export const fetchFilterOptions = async (): Promise<{
  materias: string[];
  bancas: string[];
  anos: number[];
}> => {
  const [materiasRes, bancasRes, anosRes] = await Promise.all([
    supabase.from('questoes_concurso').select('materia').order('materia'),
    supabase.from('questoes_concurso').select('banca').order('banca'),
    supabase.from('questoes_concurso').select('ano').order('ano', { ascending: false }),
  ]);

  const materias = [...new Set((materiasRes.data || []).map(r => r.materia).filter(Boolean))];
  const bancas = [...new Set((bancasRes.data || []).map(r => r.banca).filter(Boolean))];
  const anos = [...new Set((anosRes.data || []).map(r => r.ano).filter(Boolean))];

  return { materias, bancas, anos };
};

// Get total count of questions
export const getQuestionsCount = async (filters?: {
  materia?: string;
  banca?: string;
  ano?: number;
  isPegadinha?: boolean;
}): Promise<number> => {
  let query = supabase
    .from('questoes_concurso')
    .select('*', { count: 'exact', head: true });

  if (filters?.materia) query = query.eq('materia', filters.materia);
  if (filters?.banca) query = query.eq('banca', filters.banca);
  if (filters?.ano) query = query.eq('ano', filters.ano);
  if (filters?.isPegadinha !== undefined) query = query.eq('is_pegadinha', filters.isPegadinha);

  const { count, error } = await query;

  if (error) {
    console.error('Error counting questions:', error);
    return 0;
  }

  return count || 0;
};
