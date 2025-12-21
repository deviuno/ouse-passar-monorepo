import { supabase } from './supabaseClient';

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
  score: number;
  tempo_gasto: number; // seconds
  ranking_position: number | null;
  completed_at: string;
  created_at: string;
}

export interface SimuladoWithUserData extends Simulado {
  isCompleted: boolean;
  userResult?: SimuladoResult;
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
