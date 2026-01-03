import { supabase } from './supabaseClient';
import { questionsDb } from './questionsDbClient';
import { fetchQuestions, QuestionFilters } from './questionsService';
import { ParsedQuestion } from '../types';

// Cache for system settings
let cachedSimuladoSettings: {
  different_exams_per_user: number;
  questions_per_simulado: number;
  time_limit_minutes: number;
  max_attempts: number;
} | null = null;

// Get simulado settings from system_settings
export async function getSimuladoSettings(): Promise<{
  different_exams_per_user: number;
  questions_per_simulado: number;
  time_limit_minutes: number;
  max_attempts: number;
}> {
  if (cachedSimuladoSettings) {
    return cachedSimuladoSettings;
  }

  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('category', 'simulado');

    if (error) {
      console.error('Error fetching simulado settings:', error);
      return {
        different_exams_per_user: 3,
        questions_per_simulado: 120,
        time_limit_minutes: 180,
        max_attempts: -1,
      };
    }

    const settingsMap = new Map(data?.map(s => [s.key, s.value]) || []);

    cachedSimuladoSettings = {
      different_exams_per_user: parseInt(String(settingsMap.get('different_exams_per_user') || '3'), 10),
      questions_per_simulado: parseInt(String(settingsMap.get('questions_per_simulado') || '120'), 10),
      time_limit_minutes: parseInt(String(settingsMap.get('time_limit_minutes') || '180'), 10),
      max_attempts: parseInt(String(settingsMap.get('max_attempts') || '-1'), 10),
    };

    return cachedSimuladoSettings;
  } catch (error) {
    console.error('Error in getSimuladoSettings:', error);
    return {
      different_exams_per_user: 3,
      questions_per_simulado: 120,
      time_limit_minutes: 180,
      max_attempts: -1,
    };
  }
}

export interface Simulado {
  id: string;
  nome: string;
  preparatorio_id: string | null;
  duracao_minutos: number;
  total_questoes: number;
  is_premium: boolean;
  preco: number | null;
  created_at: string;
  preparatorio?: {
    id: string;
    nome: string;
    slug: string;
    logo_url: string | null;
    imagem_capa: string | null;
  };
}

export interface SimuladoResult {
  id: string;
  user_id: string;
  simulado_id: string;
  variation_index?: number;
  score: number;
  acertos?: number;
  erros?: number;
  total_questoes?: number;
  tempo_gasto: number; // seconds
  ranking_position: number | null;
  is_manual?: boolean; // true if answered via manual gabarito
  completed_at: string;
  created_at: string;
}

export interface SimuladoAttempt {
  id: string;
  user_id: string;
  simulado_id: string;
  variation_index: number;
  question_ids: string[];
  answers: Record<string, string>;
  current_index: number;
  time_remaining_seconds: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  started_at: string;
  completed_at: string | null;
}

export interface SimuladoWithUserData extends Simulado {
  isCompleted: boolean;
  userResult?: SimuladoResult;
  activeAttempt?: SimuladoAttempt;
  quantidade_simulados?: number;
}

export interface ProvaStatus {
  variationIndex: number;
  label: string;
  isCompleted: boolean;
  isInProgress: boolean;
  result?: SimuladoResult;
  attempt?: SimuladoAttempt;
}

// Get all simulados
export async function getSimulados(): Promise<Simulado[]> {
  try {
    const { data, error } = await supabase
      .from('simulados')
      .select(`
        *,
        preparatorio:preparatorios (
          id,
          nome,
          slug,
          logo_url,
          imagem_capa
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching simulados:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getSimulados:', error);
    return [];
  }
}

// Get user's simulado results
export async function getUserSimuladoResults(userId: string): Promise<SimuladoResult[]> {
  try {
    const { data, error } = await supabase
      .from('simulado_results')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching simulado results:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserSimuladoResults:', error);
    return [];
  }
}

// Get simulados with user progress
export async function getSimuladosWithUserData(userId: string): Promise<SimuladoWithUserData[]> {
  try {
    const [simulados, results] = await Promise.all([
      getSimulados(),
      getUserSimuladoResults(userId),
    ]);

    // Create a map of simulado results by simulado_id
    const resultsMap = new Map<string, SimuladoResult>();
    results.forEach(result => {
      // Keep only the best (most recent) result per simulado
      if (!resultsMap.has(result.simulado_id) ||
          new Date(result.completed_at) > new Date(resultsMap.get(result.simulado_id)!.completed_at)) {
        resultsMap.set(result.simulado_id, result);
      }
    });

    // Combine simulados with user data
    return simulados.map(simulado => ({
      ...simulado,
      isCompleted: resultsMap.has(simulado.id),
      userResult: resultsMap.get(simulado.id),
    }));
  } catch (error) {
    console.error('Error in getSimuladosWithUserData:', error);
    return [];
  }
}

// Get user's best ranking across all simulados
export async function getUserBestRanking(userId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('simulado_results')
      .select('ranking_position')
      .eq('user_id', userId)
      .not('ranking_position', 'is', null)
      .order('ranking_position', { ascending: true })
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // No rows found
      console.error('Error fetching best ranking:', error);
      return null;
    }

    return data?.ranking_position || null;
  } catch (error) {
    console.error('Error in getUserBestRanking:', error);
    return null;
  }
}

// Get user's simulado statistics
export async function getUserSimuladoStats(userId: string): Promise<{
  totalCompleted: number;
  averageScore: number;
  bestRanking: number | null;
}> {
  try {
    const results = await getUserSimuladoResults(userId);

    if (results.length === 0) {
      return {
        totalCompleted: 0,
        averageScore: 0,
        bestRanking: null,
      };
    }

    const totalCompleted = results.length;
    const averageScore = results.reduce((acc, r) => acc + r.score, 0) / results.length;
    const bestRanking = results
      .filter(r => r.ranking_position !== null)
      .reduce((best, r) => {
        if (r.ranking_position === null) return best;
        return best === null ? r.ranking_position : Math.min(best, r.ranking_position);
      }, null as number | null);

    return {
      totalCompleted,
      averageScore: Math.round(averageScore),
      bestRanking,
    };
  } catch (error) {
    console.error('Error in getUserSimuladoStats:', error);
    return {
      totalCompleted: 0,
      averageScore: 0,
      bestRanking: null,
    };
  }
}

// Start a simulado attempt
export async function startSimulado(userId: string, simuladoId: string): Promise<{
  success: boolean;
  attemptId?: string;
  error?: string;
}> {
  try {
    // For now, just return success - the actual implementation would
    // create an attempt record and return the questions
    return {
      success: true,
      attemptId: 'temp-' + Date.now(),
    };
  } catch (error: any) {
    console.error('Error starting simulado:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

// Submit simulado result
export async function submitSimuladoResult(
  userId: string,
  simuladoId: string,
  score: number,
  tempoGasto: number
): Promise<{
  success: boolean;
  result?: SimuladoResult;
  error?: string;
}> {
  try {
    const { data, error } = await supabase
      .from('simulado_results')
      .insert({
        user_id: userId,
        simulado_id: simuladoId,
        score,
        tempo_gasto: tempoGasto,
        completed_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error('Error submitting simulado result:', error);
      return { success: false, error: error.message };
    }

    return { success: true, result: data };
  } catch (error: any) {
    console.error('Error in submitSimuladoResult:', error);
    return { success: false, error: error.message };
  }
}

// Get a single simulado by ID
export async function getSimuladoById(simuladoId: string): Promise<SimuladoWithUserData | null> {
  try {
    const { data, error } = await supabase
      .from('simulados')
      .select(`
        *,
        preparatorio:preparatorios (
          id,
          nome,
          slug,
          logo_url,
          imagem_capa
        )
      `)
      .eq('id', simuladoId)
      .single();

    if (error) {
      console.error('Error fetching simulado:', error);
      return null;
    }

    return {
      ...data,
      isCompleted: false,
      quantidade_simulados: data.quantidade_simulados || 1,
    };
  } catch (error) {
    console.error('Error in getSimuladoById:', error);
    return null;
  }
}

// Get user's attempts for a specific simulado
export async function getUserSimuladoAttempts(
  userId: string,
  simuladoId: string
): Promise<SimuladoAttempt[]> {
  try {
    const { data, error } = await supabase
      .from('simulado_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('simulado_id', simuladoId)
      .order('started_at', { ascending: false });

    if (error) {
      console.error('Error fetching simulado attempts:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserSimuladoAttempts:', error);
    return [];
  }
}

// Get user's results for a specific simulado (all variations)
export async function getUserSimuladoResultsBySimulado(
  userId: string,
  simuladoId: string
): Promise<SimuladoResult[]> {
  try {
    const { data, error } = await supabase
      .from('simulado_results')
      .select('*')
      .eq('user_id', userId)
      .eq('simulado_id', simuladoId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('Error fetching simulado results:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error in getUserSimuladoResultsBySimulado:', error);
    return [];
  }
}

// Get status of all provas in a simulado package
export async function getSimuladoProvasStatus(
  userId: string,
  simuladoId: string,
  quantidadeSimulados: number
): Promise<ProvaStatus[]> {
  try {
    const [attempts, results] = await Promise.all([
      getUserSimuladoAttempts(userId, simuladoId),
      getUserSimuladoResultsBySimulado(userId, simuladoId),
    ]);

    // Create status for each variation
    const provas: ProvaStatus[] = [];
    for (let i = 0; i < quantidadeSimulados; i++) {
      const variationAttempts = attempts.filter(a => a.variation_index === i);
      const variationResults = results.filter(r => {
        // Find the attempt that generated this result
        const attempt = attempts.find(a =>
          a.variation_index === i &&
          a.status === 'completed'
        );
        return attempt !== undefined;
      });

      const activeAttempt = variationAttempts.find(a => a.status === 'in_progress');
      const completedAttempt = variationAttempts.find(a => a.status === 'completed');

      provas.push({
        variationIndex: i,
        label: `Prova ${i + 1}`,
        isCompleted: !!completedAttempt,
        isInProgress: !!activeAttempt,
        result: variationResults[0],
        attempt: activeAttempt || completedAttempt,
      });
    }

    return provas;
  } catch (error) {
    console.error('Error in getSimuladoProvasStatus:', error);
    return [];
  }
}

// Get simulado with full details for detail page
export async function getSimuladoWithDetails(
  userId: string,
  simuladoId: string
): Promise<{
  simulado: SimuladoWithUserData | null;
  provas: ProvaStatus[];
  stats: { completed: number; total: number; averageScore: number };
  settings: { different_exams_per_user: number; questions_per_simulado: number; time_limit_minutes: number };
}> {
  try {
    // Fetch simulado and settings in parallel
    const [simulado, settings] = await Promise.all([
      getSimuladoById(simuladoId),
      getSimuladoSettings(),
    ]);

    if (!simulado) {
      return {
        simulado: null,
        provas: [],
        stats: { completed: 0, total: 0, averageScore: 0 },
        settings: { different_exams_per_user: 3, questions_per_simulado: 120, time_limit_minutes: 180 },
      };
    }

    // Use different_exams_per_user from admin settings
    const quantidade = settings.different_exams_per_user;
    const provas = await getSimuladoProvasStatus(userId, simuladoId, quantidade);

    // Calculate stats
    const completed = provas.filter(p => p.isCompleted).length;
    const resultsWithScores = provas.filter(p => p.result?.score !== undefined);
    const averageScore = resultsWithScores.length > 0
      ? Math.round(resultsWithScores.reduce((acc, p) => acc + (p.result?.score || 0), 0) / resultsWithScores.length)
      : 0;

    return {
      simulado: {
        ...simulado,
        // Override with settings values
        total_questoes: settings.questions_per_simulado,
        duracao_minutos: settings.time_limit_minutes,
        quantidade_simulados: quantidade,
      },
      provas,
      stats: { completed, total: quantidade, averageScore },
      settings: {
        different_exams_per_user: settings.different_exams_per_user,
        questions_per_simulado: settings.questions_per_simulado,
        time_limit_minutes: settings.time_limit_minutes,
      },
    };
  } catch (error) {
    console.error('Error in getSimuladoWithDetails:', error);
    return {
      simulado: null,
      provas: [],
      stats: { completed: 0, total: 0, averageScore: 0 },
      settings: { different_exams_per_user: 3, questions_per_simulado: 120, time_limit_minutes: 180 },
    };
  }
}

// ==============================
// PROVA GENERATION & EXECUTION
// ==============================

// Interface for preparatorio with filters
interface RaioXDistribuicao {
  materia: string;
  quantidade: number;
  percentual: number;
}

interface RaioXData {
  total_questoes?: number;
  tipo_predominante?: 'multipla_escolha' | 'certo_errado';
  banca_identificada?: string | null;
  distribuicao?: RaioXDistribuicao[];
  prova_anterior?: {
    total_questoes: number;
    tipo_predominante: 'multipla_escolha' | 'certo_errado';
    banca_identificada: string | null;
    distribuicao: RaioXDistribuicao[];
    analisado_em: string;
  };
}

interface PreparatorioWithFilters {
  id: string;
  nome: string;
  banca: string | null;
  orgao: string | null;
  question_filters: QuestionFilters | null;
  raio_x: RaioXData | null;
}

// Get preparatorio filters and raio_x for a simulado
export async function getPreparatorioFiltersWithRaioX(simuladoId: string): Promise<{
  filters: QuestionFilters | null;
  raioX: RaioXData | null;
  preparatorioNome: string | null;
}> {
  try {
    // Get simulado with preparatorio data including raio_x
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados')
      .select(`
        preparatorio_id,
        preparatorio:preparatorios (
          id,
          nome,
          banca,
          orgao,
          question_filters,
          raio_x
        )
      `)
      .eq('id', simuladoId)
      .single();

    if (simuladoError || !simulado?.preparatorio) {
      console.error('Error fetching simulado preparatorio:', simuladoError);
      return { filters: null, raioX: null, preparatorioNome: null };
    }

    const prep = simulado.preparatorio as unknown as PreparatorioWithFilters;

    // Build filters
    let filters: QuestionFilters | null = null;

    // If preparatorio has explicit question_filters, use them
    if (prep.question_filters && Object.keys(prep.question_filters).length > 0) {
      filters = prep.question_filters;
    } else {
      // Otherwise, build filters from preparatorio data
      filters = {};
      if (prep.banca) filters.bancas = [prep.banca];
      if (prep.orgao) filters.orgaos = [prep.orgao];
    }

    return {
      filters,
      raioX: prep.raio_x || null,
      preparatorioNome: prep.nome,
    };
  } catch (error) {
    console.error('Error fetching preparatorio filters:', error);
    return { filters: null, raioX: null, preparatorioNome: null };
  }
}

// Get preparatorio filters for a simulado (legacy function for backwards compatibility)
export async function getPreparatorioFilters(simuladoId: string): Promise<QuestionFilters | null> {
  try {
    // Get simulado with preparatorio data
    const { data: simulado, error: simuladoError } = await supabase
      .from('simulados')
      .select(`
        preparatorio_id,
        preparatorio:preparatorios (
          id,
          nome,
          banca,
          orgao,
          question_filters
        )
      `)
      .eq('id', simuladoId)
      .single();

    if (simuladoError || !simulado?.preparatorio) {
      console.error('Error fetching simulado preparatorio:', simuladoError);
      return null;
    }

    const prep = simulado.preparatorio as unknown as PreparatorioWithFilters;

    // If preparatorio has explicit question_filters, use them
    if (prep.question_filters && Object.keys(prep.question_filters).length > 0) {
      return prep.question_filters;
    }

    // Otherwise, build filters from preparatorio data
    const filters: QuestionFilters = {};

    if (prep.banca) {
      filters.bancas = [prep.banca];
    }

    if (prep.orgao) {
      filters.orgaos = [prep.orgao];
    }

    // Also get materias from missoes of this preparatorio
    const { data: missoes, error: missoesError } = await supabase
      .from('missoes')
      .select(`
        materia,
        rodada:rodadas!inner (
          preparatorio_id
        )
      `)
      .eq('rodada.preparatorio_id', prep.id)
      .not('materia', 'is', null);

    if (!missoesError && missoes && missoes.length > 0) {
      const uniqueMaterias = [...new Set(missoes.map(m => m.materia).filter(Boolean))];
      if (uniqueMaterias.length > 0) {
        filters.materias = uniqueMaterias as string[];
      }
    }

    return Object.keys(filters).length > 0 ? filters : null;
  } catch (error) {
    console.error('Error in getPreparatorioFilters:', error);
    return null;
  }
}

// Fetch questions based on Raio-X distribution
async function fetchQuestionsWithDistribution(
  distribuicao: RaioXDistribuicao[],
  baseFilters: QuestionFilters,
  totalQuestionsNeeded: number
): Promise<ParsedQuestion[]> {
  const questions: ParsedQuestion[] = [];
  const usedIds = new Set<number>();

  // Calculate the total from distribution
  const totalFromDistribuicao = distribuicao.reduce((sum, d) => sum + d.quantidade, 0);

  // Scale distribution if needed to match totalQuestionsNeeded
  const scaleFactor = totalQuestionsNeeded / totalFromDistribuicao;

  console.log('[fetchQuestionsWithDistribution] Starting distribution-based fetch');
  console.log(`[fetchQuestionsWithDistribution] Scale factor: ${scaleFactor.toFixed(2)} (${totalFromDistribuicao} -> ${totalQuestionsNeeded})`);

  for (const item of distribuicao) {
    // Scale the quantity proportionally
    const targetQuantity = Math.round(item.quantidade * scaleFactor);
    if (targetQuantity === 0) continue;

    console.log(`[fetchQuestionsWithDistribution] Fetching ${targetQuantity} questions for "${item.materia}"`);

    const materiaQuestions = await fetchQuestions({
      ...baseFilters,
      materias: [item.materia],
      limit: targetQuantity * 2, // Fetch extra to account for duplicates
      shuffle: true,
    });

    // Filter out already used questions
    const newQuestions = materiaQuestions.filter(q => !usedIds.has(q.id));

    // Take up to targetQuantity
    const selected = newQuestions.slice(0, targetQuantity);
    selected.forEach(q => usedIds.add(q.id));
    questions.push(...selected);

    if (selected.length < targetQuantity) {
      console.warn(`[fetchQuestionsWithDistribution] Materia "${item.materia}": only found ${selected.length}/${targetQuantity} questions`);
    }
  }

  console.log(`[fetchQuestionsWithDistribution] Total fetched: ${questions.length}/${totalQuestionsNeeded}`);

  // If we still need more questions (due to rounding or insufficient questions per materia),
  // fetch additional questions with base filters
  if (questions.length < totalQuestionsNeeded) {
    const remaining = totalQuestionsNeeded - questions.length;
    console.log(`[fetchQuestionsWithDistribution] Fetching ${remaining} additional questions`);

    const additionalQuestions = await fetchQuestions({
      ...baseFilters,
      limit: remaining * 2,
      shuffle: true,
    });

    const newAdditional = additionalQuestions.filter(q => !usedIds.has(q.id));
    questions.push(...newAdditional.slice(0, remaining));
  }

  // Shuffle the final result to mix materias
  return shuffleArray(questions);
}

// Simple array shuffle (Fisher-Yates)
function shuffleArray<T>(array: T[]): T[] {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// Get or generate prova questions for a specific variation
export async function getProvaQuestions(
  simuladoId: string,
  variationIndex: number,
  questionsCount: number
): Promise<{ questionIds: number[]; questions: ParsedQuestion[] } | null> {
  try {
    // First, check if we already have generated questions for this variation
    const { data: existingList } = await supabase
      .from('simulado_variations')
      .select('question_ids')
      .eq('simulado_id', simuladoId)
      .eq('variation_index', variationIndex)
      .limit(1);

    const existing = existingList?.[0];

    if (existing?.question_ids && existing.question_ids.length > 0) {
      console.log('[getProvaQuestions] Using existing variation with', existing.question_ids.length, 'questions');
      // Fetch the actual questions by their IDs (from questions database)
      const { data: questionsData } = await questionsDb
        .from('questoes_concurso')
        .select('*')
        .in('id', existing.question_ids)
        .eq('ativo', true); // Apenas questões ativas

      if (questionsData && questionsData.length > 0) {
        return {
          questionIds: existing.question_ids,
          questions: questionsData as ParsedQuestion[],
        };
      }
    }

    // Get preparatorio filters AND raio_x data
    const { filters, raioX, preparatorioNome } = await getPreparatorioFiltersWithRaioX(simuladoId);
    let questions: ParsedQuestion[] = [];

    // Extract distribution from raio_x (check both structures)
    const distribuicao = raioX?.prova_anterior?.distribuicao || raioX?.distribuicao;

    // If we have Raio-X distribution, use it for proportional question selection
    if (distribuicao && distribuicao.length > 0 && filters) {
      console.log('[getProvaQuestions] Using Raio-X distribution for question selection');
      questions = await fetchQuestionsWithDistribution(distribuicao, filters, questionsCount);
    } else if (filters && Object.keys(filters).length > 0) {
      // Fallback to regular filter-based fetch
      console.log('[getProvaQuestions] Using standard filters (no Raio-X):', filters);
      questions = await fetchQuestions({
        ...filters,
        limit: questionsCount * 2,
        shuffle: true,
      });
      console.log(`[getProvaQuestions] Found ${questions.length} questions with filters`);
    }

    // If not enough questions with full filters, try with just banca
    if (questions.length < questionsCount && filters?.bancas?.length) {
      console.log('[getProvaQuestions] Not enough, trying with just banca...');
      const bancaQuestions = await fetchQuestions({
        bancas: filters.bancas,
        limit: questionsCount * 2,
        shuffle: true,
      });

      // Add new questions (avoid duplicates)
      const existingIds = new Set(questions.map(q => q.id));
      const newQuestions = bancaQuestions.filter(q => !existingIds.has(q.id));
      questions = [...questions, ...newQuestions];
      console.log(`[getProvaQuestions] Total after banca fallback: ${questions.length}`);
    }

    // IMPORTANT: Do NOT remove all filters as fallback
    // If we still don't have enough questions, return what we have with a warning
    if (questions.length < questionsCount) {
      console.warn(`[getProvaQuestions] AVISO: Questões insuficientes para o preparatório "${preparatorioNome || simuladoId}".`);
      console.warn(`[getProvaQuestions] Encontradas: ${questions.length}, Necessárias: ${questionsCount}`);
      console.warn(`[getProvaQuestions] Filtros utilizados:`, filters);

      // If we have at least SOME questions, proceed with what we have
      if (questions.length > 0) {
        console.warn(`[getProvaQuestions] Continuando com ${questions.length} questões disponíveis.`);
      } else {
        // No questions at all - this is a critical error
        console.error('[getProvaQuestions] ERRO CRÍTICO: Nenhuma questão encontrada para os filtros do preparatório!');
        console.error('[getProvaQuestions] Verifique se existem questões no banco com os filtros configurados.');
        return null;
      }
    }

    // Take the required number (or all if less)
    const selectedQuestions = questions.slice(0, Math.min(questionsCount, questions.length));
    const questionIds = selectedQuestions.map(q => q.id);

    // Store the variation for consistency (ignore errors - table might not exist yet)
    try {
      const { error: insertError } = await supabase
        .from('simulado_variations')
        .insert({
          simulado_id: simuladoId,
          variation_index: variationIndex,
          question_ids: questionIds,
        });

      if (insertError) {
        console.warn('Error storing variation (non-fatal):', insertError.message);
      }
    } catch (e) {
      console.warn('Could not store variation:', e);
    }

    return {
      questionIds,
      questions: selectedQuestions,
    };
  } catch (error) {
    console.error('Error in getProvaQuestions:', error);
    return null;
  }
}

// Start or resume a simulado attempt
export async function startOrResumeSimuladoAttempt(
  userId: string,
  simuladoId: string,
  variationIndex: number
): Promise<{
  success: boolean;
  attempt?: SimuladoAttempt;
  questions?: ParsedQuestion[];
  error?: string;
}> {
  try {
    const settings = await getSimuladoSettings();

    // Check for existing in-progress attempt (use maybeSingle to avoid 406 errors)
    const { data: existingAttempts, error: attemptError } = await supabase
      .from('simulado_attempts')
      .select('*')
      .eq('user_id', userId)
      .eq('simulado_id', simuladoId)
      .eq('variation_index', variationIndex)
      .eq('status', 'in_progress')
      .limit(1);

    const existingAttempt = existingAttempts?.[0];

    if (!attemptError && existingAttempt) {
      console.log('[startOrResumeSimuladoAttempt] Resuming existing attempt:', existingAttempt.id);
      // Resume existing attempt
      const provaData = await getProvaQuestions(
        simuladoId,
        variationIndex,
        settings.questions_per_simulado
      );

      if (!provaData) {
        return { success: false, error: 'Erro ao carregar questoes' };
      }

      return {
        success: true,
        attempt: existingAttempt,
        questions: provaData.questions,
      };
    }

    console.log('[startOrResumeSimuladoAttempt] Creating new attempt...');

    // Generate new prova questions
    const provaData = await getProvaQuestions(
      simuladoId,
      variationIndex,
      settings.questions_per_simulado
    );

    if (!provaData) {
      return { success: false, error: 'Erro ao gerar questoes para a prova' };
    }

    // Create new attempt
    const { data: newAttempts, error: createError } = await supabase
      .from('simulado_attempts')
      .insert({
        user_id: userId,
        simulado_id: simuladoId,
        variation_index: variationIndex,
        question_ids: provaData.questionIds,
        answers: {},
        current_index: 0,
        time_remaining_seconds: settings.time_limit_minutes * 60,
        status: 'in_progress',
      })
      .select();

    const newAttempt = newAttempts?.[0];

    if (createError || !newAttempt) {
      console.error('Error creating attempt:', createError);
      return { success: false, error: createError?.message || 'Erro ao criar tentativa' };
    }

    console.log('[startOrResumeSimuladoAttempt] Created attempt:', newAttempt.id);

    return {
      success: true,
      attempt: newAttempt,
      questions: provaData.questions,
    };
  } catch (error: any) {
    console.error('Error in startOrResumeSimuladoAttempt:', error);
    return { success: false, error: error.message };
  }
}

// Save simulado attempt progress
export async function saveSimuladoProgress(
  attemptId: string,
  updates: {
    answers?: Record<string, string>;
    current_index?: number;
    time_remaining_seconds?: number;
  }
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('simulado_attempts')
      .update(updates)
      .eq('id', attemptId);

    if (error) {
      console.error('Error saving progress:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in saveSimuladoProgress:', error);
    return false;
  }
}

// Complete a simulado attempt
export async function completeSimuladoAttempt(
  userId: string,
  attemptId: string,
  answers: Record<string, string>,
  questions: ParsedQuestion[],
  timeSpent: number
): Promise<{
  success: boolean;
  result?: SimuladoResult;
  error?: string;
}> {
  try {
    // Calculate results
    let acertos = 0;
    let erros = 0;
    const answersDetail: Record<string, { answer: string; correct: boolean }> = {};

    questions.forEach(q => {
      const userAnswer = answers[String(q.id)];
      const isCorrect = userAnswer === q.gabarito;

      answersDetail[String(q.id)] = {
        answer: userAnswer || '',
        correct: isCorrect,
      };

      if (userAnswer) {
        if (isCorrect) {
          acertos++;
        } else {
          erros++;
        }
      }
    });

    const totalQuestoes = questions.length;
    const score = totalQuestoes > 0 ? (acertos / totalQuestoes) * 100 : 0;

    // Get attempt to get simulado_id and variation_index
    const { data: attempt, error: attemptError } = await supabase
      .from('simulado_attempts')
      .select('simulado_id, variation_index')
      .eq('id', attemptId)
      .single();

    if (attemptError || !attempt) {
      return { success: false, error: 'Tentativa nao encontrada' };
    }

    // Update attempt status
    const { error: updateError } = await supabase
      .from('simulado_attempts')
      .update({
        status: 'completed',
        answers,
        completed_at: new Date().toISOString(),
      })
      .eq('id', attemptId);

    if (updateError) {
      console.error('Error updating attempt:', updateError);
    }

    // Create result
    const { data: result, error: resultError } = await supabase
      .from('simulado_results')
      .insert({
        user_id: userId,
        simulado_id: attempt.simulado_id,
        attempt_id: attemptId,
        variation_index: attempt.variation_index,
        score: Math.round(score * 100) / 100,
        acertos,
        erros,
        total_questoes: totalQuestoes,
        tempo_gasto: timeSpent,
        is_manual: false,
        answers_detail: answersDetail,
      })
      .select()
      .single();

    if (resultError) {
      console.error('Error creating result:', resultError);
      return { success: false, error: resultError.message };
    }

    return { success: true, result };
  } catch (error: any) {
    console.error('Error in completeSimuladoAttempt:', error);
    return { success: false, error: error.message };
  }
}

// Abandon a simulado attempt
export async function abandonSimuladoAttempt(attemptId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('simulado_attempts')
      .update({
        status: 'abandoned',
        completed_at: new Date().toISOString(),
      })
      .eq('id', attemptId);

    if (error) {
      console.error('Error abandoning attempt:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in abandonSimuladoAttempt:', error);
    return false;
  }
}
