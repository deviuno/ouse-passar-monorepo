// Service for fetching detailed user information for admin panel
import { supabase } from '../lib/supabase';

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  avatar_url?: string | null;
  role: string;
  is_active: boolean;
  show_answers: boolean;
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
  product_type: string; // 'Planejador', 'Simulado', 'Reta Final', 'Ouse Questões', etc.
  user_trail_id?: string;
  // Battery info (only for Ouse Questões)
  battery_current?: number;
  has_unlimited_battery?: boolean;
  bonus_battery?: number;
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
      .from('admin_users' as any)
      .select('id, email, name, role, is_active, show_answers, avatar_url, created_at, updated_at, created_by, last_login, password_hash')
      .eq('id', userId)
      .single();

    if (profileError) {
      console.error('[userDetailsService] Error fetching profile:', profileError);
      return { data: null, error: profileError.message };
    }

    if (!profile) {
      return { data: null, error: 'User not found' };
    }

    // Fetch user's products from multiple sources
    const preparatorios: UserPreparatorio[] = [];

    // 1. Planejador (from leads table)
    const { data: leads } = await supabase
      .from('leads')
      .select('id, created_at, planejamento_id')
      .eq('user_id', userId);

    if (leads && leads.length > 0) {
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
                product_type: 'Planejador',
              });
            }
          });
        }
      }
    }

    // 2. Courses (Simulados, Reta Final, Ouse Questões)
    const { data: userCourses } = await supabase
      .from('user_courses' as any)
      .select('id, course_id, purchased_at')
      .eq('user_id', userId);

    if (userCourses && userCourses.length > 0) {
      const courseIds = userCourses.map((uc: any) => uc.course_id);

      if (courseIds.length > 0) {
        const { data: courses } = await supabase
          .from('courses' as any)
          .select('id, title, image_url, course_type')
          .in('id', courseIds);

        if (courses) {
          courses.forEach((course: any) => {
            const userCourse = userCourses.find((uc: any) => uc.course_id === course.id);
            preparatorios.push({
              id: course.id,
              nome: course.title,
              slug: course.id,
              logo_url: course.image_url,
              purchased_at: (userCourse as any)?.purchased_at || new Date().toISOString(),
              status: 'active',
              product_type: course.course_type || 'Curso',
            });
          });
        }
      }
    }

    // 3. Store Items (produtos da loja com preparatório vinculado)
    const { data: storePurchases } = await supabase
      .from('store_purchases' as any)
      .select('id, item_id, created_at')
      .eq('user_id', userId);

    if (storePurchases && storePurchases.length > 0) {
      const itemIds = storePurchases.map((sp: any) => sp.item_id);

      if (itemIds.length > 0) {
        const { data: storeItems } = await supabase
          .from('store_items' as any)
          .select('id, name, image_url, product_type, preparatorio_id')
          .in('id', itemIds)
          .not('preparatorio_id', 'is', null);

        if (storeItems) {
          storeItems.forEach((item: any) => {
            const purchase = storePurchases.find((sp: any) => sp.item_id === item.id);
            preparatorios.push({
              id: item.id,
              nome: item.name,
              slug: item.id,
              logo_url: item.image_url,
              purchased_at: (purchase as any)?.created_at || new Date().toISOString(),
              status: 'active',
              product_type: item.product_type || 'Produto',
            });
          });
        }
      }
    }

    // 4. Ouse Questões (user_trails - matrículas no app de questões)
    const { data: userTrails } = await supabase
      .from('user_trails' as any)
      .select('id, preparatorio_id, created_at, is_reta_final, battery_current, has_unlimited_battery, bonus_battery')
      .eq('user_id', userId);

    if (userTrails && userTrails.length > 0) {
      const trailPreparatorioIds = [...new Set(userTrails.map((ut: any) => ut.preparatorio_id).filter(Boolean))];

      if (trailPreparatorioIds.length > 0) {
        const { data: trailPreparatorios } = await supabase
          .from('preparatorios')
          .select('id, nome, slug, logo_url')
          .in('id', trailPreparatorioIds);

        if (trailPreparatorios) {
          trailPreparatorios.forEach((prep: any) => {
            const trail = userTrails.find((ut: any) => ut.preparatorio_id === prep.id);
            preparatorios.push({
              id: prep.id,
              nome: prep.nome,
              slug: prep.slug,
              logo_url: prep.logo_url,
              purchased_at: (trail as any)?.created_at || new Date().toISOString(),
              status: 'active',
              product_type: (trail as any)?.is_reta_final ? 'Reta Final' : 'Ouse Questões',
              user_trail_id: (trail as any)?.id,
              // Battery info
              battery_current: (trail as any)?.battery_current,
              has_unlimited_battery: (trail as any)?.has_unlimited_battery ?? false,
              bonus_battery: (trail as any)?.bonus_battery ?? 0,
            });
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
      lastActivity: recentActivity.length > 0 ? recentActivity[0].timestamp : (profile as any).updated_at,
    };

    return {
      data: {
        profile: profile as unknown as UserProfile,
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

/**
 * Update user settings (is_active and show_answers)
 */
export async function updateUserSettings(
  userId: string,
  updates: {
    is_active?: boolean;
    show_answers?: boolean;
  }
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('admin_users')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[userDetailsService] Error updating settings:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Recharge battery for a user trail (Ouse Questões enrollment)
 * Sets battery_current to 100 (default max)
 */
export async function rechargeBattery(
  userTrailId: string
): Promise<{ success: boolean; newBattery?: number; error: string | null }> {
  try {
    const BATTERY_MAX = 100;

    // Update battery_current to max
    const { error: updateError } = await supabase
      .from('user_trails' as any)
      .update({
        battery_current: BATTERY_MAX,
        battery_last_recharge: new Date().toISOString().split('T')[0] // YYYY-MM-DD
      })
      .eq('id', userTrailId);

    if (updateError) {
      console.error('[userDetailsService] Error recharging battery:', updateError);
      return { success: false, error: updateError.message };
    }

    return { success: true, newBattery: BATTERY_MAX, error: null };
  } catch (err: any) {
    console.error('[userDetailsService] Exception:', err);
    return { success: false, error: err.message };
  }
}
