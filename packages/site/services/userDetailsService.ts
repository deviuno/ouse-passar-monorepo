// Service for fetching detailed user information for admin panel
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserPreparatorio {
  id: string;
  nome: string;
  slug: string;
  logo_url?: string;
  purchased_at: string;
  status: string;
}

export interface UserActivity {
  id: string;
  type: 'mission_completed' | 'question_answered' | 'achievement_earned' | 'level_up';
  description: string;
  timestamp: string;
  metadata?: any;
}

export interface UserMissionProgress {
  mission_id: string;
  mission_title: string;
  preparatorio_nome: string;
  rodada_numero: number;
  status: 'not_started' | 'in_progress' | 'completed';
  score?: number;
  completed_at?: string;
}

export interface UserStats {
  totalMissions: number;
  completedMissions: number;
  completionRate: number;
  averageScore: number;
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number;
  lastActivity: string;
}

export interface UserDetailsData {
  profile: UserProfile;
  stats: UserStats;
  preparatorios: UserPreparatorio[];
  recentActivity: UserActivity[];
  missionProgress: UserMissionProgress[];
}

/**
 * Get complete user details for admin panel
 */
export async function getUserDetails(userId: string): Promise<{
  data: UserDetailsData | null;
  error: string | null;
}> {
  try {
    // Fetch user profile from admin_users
    const { data: profile, error: profileError } = await supabase
      .from('admin_users')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[userDetailsService] Error fetching profile:', profileError);
      return { data: null, error: profileError.message };
    }

    if (!profile) {
      return { data: null, error: 'User not found' };
    }

    // Fetch user's preparatorios (from leads table)
    const { data: leads, error: leadsError } = await supabase
      .from('leads')
      .select('id, created_at, planejamento_id')
      .eq('user_id', userId);

    const preparatorios: UserPreparatorio[] = [];

    if (leads && !leadsError && leads.length > 0) {
      // Get unique planejamento IDs
      const planejamentoIds = [...new Set(leads.map((l: any) => l.planejamento_id).filter(Boolean))];

      if (planejamentoIds.length > 0) {
        const { data: planejamentos } = await supabase
          .from('planejamentos')
          .select('id, preparatorio_id, preparatorios(id, nome, slug, logo_url)')
          .in('id', planejamentoIds);

        if (planejamentos) {
          planejamentos.forEach((planj: any) => {
            if (planj.preparatorios) {
              const lead = leads.find((l: any) => l.planejamento_id === planj.id);
              preparatorios.push({
                id: planj.preparatorios.id,
                nome: planj.preparatorios.nome,
                slug: planj.preparatorios.slug,
                logo_url: planj.preparatorios.logo_url,
                purchased_at: lead?.created_at || new Date().toISOString(),
                status: 'active',
              });
            }
          });
        }
      }
    }

    // Fetch mission progress (simplified - based on actual table structure)
    const { data: missionsExecutadas, error: missionsError } = await supabase
      .from('missoes_executadas')
      .select('user_id, planejamento_id, rodada_numero, missao_numero, completed_at')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false })
      .limit(20);

    const missionProgress: UserMissionProgress[] = [];
    if (missionsExecutadas && !missionsError) {
      missionsExecutadas.forEach((me: any) => {
        missionProgress.push({
          mission_id: `${me.planejamento_id}-${me.rodada_numero}-${me.missao_numero}`,
          mission_title: `Missão ${me.missao_numero}`,
          preparatorio_nome: 'Preparatório', // Will be populated if we join with planejamentos
          rodada_numero: me.rodada_numero,
          status: 'completed',
          score: undefined,
          completed_at: me.completed_at,
        });
      });
    }

    // Build recent activity from missions executed
    const recentActivity: UserActivity[] = [];

    if (missionsExecutadas && !missionsError) {
      missionsExecutadas.forEach((me: any) => {
        recentActivity.push({
          id: `mission_${me.planejamento_id}_${me.rodada_numero}_${me.missao_numero}`,
          type: 'mission_completed',
          description: `Completou Missão ${me.missao_numero} da Rodada ${me.rodada_numero}`,
          timestamp: me.completed_at,
        });
      });
    }

    // Calculate stats from mission data
    const totalMissions = missionProgress.length;
    const completedMissions = missionProgress.filter(m => m.status === 'completed').length;
    const completionRate = totalMissions > 0 ? Math.round((completedMissions / totalMissions) * 100) : 100;

    const scoresArray = missionProgress
      .filter(m => m.score !== undefined && m.score !== null)
      .map(m => m.score!);
    const averageScore = scoresArray.length > 0
      ? Math.round(scoresArray.reduce((a, b) => a + b, 0) / scoresArray.length)
      : 0;

    const stats: UserStats = {
      totalMissions,
      completedMissions,
      completionRate,
      averageScore,
      totalQuestions: 0, // Not available in current structure
      correctAnswers: 0, // Not available in current structure
      accuracy: 0, // Not available in current structure
      lastActivity: recentActivity.length > 0 ? recentActivity[0].timestamp : profile.updated_at,
    };

    return {
      data: {
        profile,
        stats,
        preparatorios,
        recentActivity: recentActivity.slice(0, 20),
        missionProgress,
      },
      error: null,
    };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { data: null, error: err.message };
  }
}

/**
 * Update user profile information (admin_users table)
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    name?: string;
    email?: string;
    is_active?: boolean;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[userDetailsService] Error updating profile:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { success: false, error: err.message };
  }
}
