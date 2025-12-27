import { supabase } from './supabaseClient';

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
