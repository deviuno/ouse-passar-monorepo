import { supabase } from './supabaseClient';

// ============================================
// TYPES
// ============================================

export interface LeagueRankingUser {
  rank: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  xp_earned: number;
  league_tier: string;
  isCurrentUser?: boolean;
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
}

export interface UserAchievement {
  achievement_id: string;
  unlocked_at: string;
  achievement: Achievement;
}

export type LeagueTier = 'ferro' | 'bronze' | 'prata' | 'ouro' | 'diamante';

export const LEAGUE_INFO: Record<LeagueTier, { name: string; color: string; icon: string }> = {
  ferro: { name: 'Liga Ferro', color: '#6B7280', icon: '🔩' },
  bronze: { name: 'Liga Bronze', color: '#CD7F32', icon: '🥉' },
  prata: { name: 'Liga Prata', color: '#C0C0C0', icon: '🥈' },
  ouro: { name: 'Liga Ouro', color: '#FFD700', icon: '🥇' },
  diamante: { name: 'Liga Diamante', color: '#B9F2FF', icon: '💎' },
};

// ============================================
// RANKING FUNCTIONS
// ============================================

export const getLeagueRanking = async (
  leagueTier: LeagueTier,
  currentUserId?: string,
  limit: number = 20
): Promise<LeagueRankingUser[]> => {
  const { data, error } = await supabase.rpc('get_league_ranking', {
    p_league_tier: leagueTier,
    p_limit: limit,
  });

  if (error) {
    console.error('Error fetching league ranking:', error);
    return [];
  }

  // Mark current user
  return (data || []).map((user: LeagueRankingUser) => ({
    ...user,
    isCurrentUser: user.user_id === currentUserId,
  }));
};

export const getUserRankPosition = async (
  userId: string,
  leagueTier: LeagueTier
): Promise<number | null> => {
  const ranking = await getLeagueRanking(leagueTier, userId, 100);
  const userPosition = ranking.find((u) => u.user_id === userId);
  return userPosition?.rank ?? null;
};

// ============================================
// WEEKLY XP FUNCTIONS
// ============================================

const getWeekStart = (): string => {
  const now = new Date();
  const day = now.getDay();
  const diff = now.getDate() - day + (day === 0 ? -6 : 1); // Adjust for Sunday
  const monday = new Date(now.setDate(diff));
  return monday.toISOString().split('T')[0];
};

export const addWeeklyXp = async (
  userId: string,
  xpToAdd: number,
  questionsAnswered: number = 1,
  correctAnswers: number = 0
): Promise<void> => {
  const weekStart = getWeekStart();

  // Upsert weekly XP
  const { error } = await supabase
    .from('weekly_xp')
    .upsert(
      {
        user_id: userId,
        week_start: weekStart,
        xp_earned: xpToAdd,
        questions_answered: questionsAnswered,
        correct_answers: correctAnswers,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,week_start',
      }
    )
    .select();

  if (error) {
    // If upsert fails, try to increment
    const { error: updateError } = await supabase.rpc('increment_weekly_xp', {
      p_user_id: userId,
      p_week_start: weekStart,
      p_xp: xpToAdd,
      p_questions: questionsAnswered,
      p_correct: correctAnswers,
    });

    if (updateError) {
      console.error('Error updating weekly XP:', updateError);
    }
  }
};

export const getUserWeeklyXp = async (userId: string): Promise<number> => {
  const weekStart = getWeekStart();

  const { data, error } = await supabase
    .from('weekly_xp')
    .select('xp_earned')
    .eq('user_id', userId)
    .eq('week_start', weekStart)
    .single();

  if (error || !data) {
    return 0;
  }

  return data.xp_earned;
};

// ============================================
// ACHIEVEMENTS FUNCTIONS
// ============================================

export const getAllAchievements = async (): Promise<Achievement[]> => {
  const { data, error } = await supabase
    .from('achievements')
    .select('*')
    .order('requirement_value', { ascending: true });

  if (error) {
    console.error('Error fetching achievements:', error);
    return [];
  }

  return data || [];
};

export const getUserAchievements = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user achievements:', error);
    return [];
  }

  return (data || []).map((ua) => ua.achievement_id);
};

export const getAchievementsWithStatus = async (
  userId: string
): Promise<(Achievement & { unlocked: boolean })[]> => {
  const [allAchievements, userAchievementIds] = await Promise.all([
    getAllAchievements(),
    getUserAchievements(userId),
  ]);

  return allAchievements.map((ach) => ({
    ...ach,
    unlocked: userAchievementIds.includes(ach.id),
  }));
};

export const unlockAchievement = async (
  userId: string,
  achievementId: string
): Promise<boolean> => {
  const { error } = await supabase.from('user_achievements').insert({
    user_id: userId,
    achievement_id: achievementId,
  });

  if (error) {
    // Might already be unlocked
    if (error.code === '23505') {
      return false; // Already exists
    }
    console.error('Error unlocking achievement:', error);
    return false;
  }

  return true;
};

// ============================================
// LEAGUE PROMOTION LOGIC
// ============================================

export const checkLeaguePromotion = async (
  userId: string,
  currentTier: LeagueTier
): Promise<LeagueTier | null> => {
  const tiers: LeagueTier[] = ['ferro', 'bronze', 'prata', 'ouro', 'diamante'];
  const currentIndex = tiers.indexOf(currentTier);

  if (currentIndex >= tiers.length - 1) {
    return null; // Already at max tier
  }

  // Get user's weekly XP and ranking
  const ranking = await getLeagueRanking(currentTier, userId, 50);
  const userRank = ranking.find((u) => u.user_id === userId);

  if (!userRank) {
    return null;
  }

  // Promote top 3 users at end of week (this would be called by a scheduled function)
  // For now, just return null - promotion logic handled separately
  return null;
};

export const getLeagueTierDisplay = (tier: LeagueTier): { name: string; color: string; icon: string } => {
  return LEAGUE_INFO[tier] || LEAGUE_INFO.ferro;
};

// ============================================
// WEEKLY RANKING (Direct Query)
// ============================================

export interface WeeklyRankingUser {
  rank: number;
  user_id: string;
  name: string;
  avatar_url: string | null;
  xp_earned: number;
  isCurrentUser?: boolean;
  trend: 'up' | 'down' | 'same';
}

export const fetchWeeklyRanking = async (
  currentUserId?: string,
  limit: number = 10
): Promise<WeeklyRankingUser[]> => {
  const weekStart = getWeekStart();

  // Fetch weekly XP with user profiles
  const { data, error } = await supabase
    .from('weekly_xp')
    .select(`
      user_id,
      xp_earned,
      user_profiles!inner (
        name,
        avatar_url
      )
    `)
    .eq('week_start', weekStart)
    .order('xp_earned', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching weekly ranking:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  // Transform and add ranks
  return data.map((item: any, index: number) => ({
    rank: index + 1,
    user_id: item.user_id,
    name: item.user_profiles?.name || 'Usuário',
    avatar_url: item.user_profiles?.avatar_url || null,
    xp_earned: item.xp_earned || 0,
    isCurrentUser: item.user_id === currentUserId,
    trend: 'same' as const, // Could be calculated with previous week data
  }));
};

// Fetch all-time ranking based on total XP from user_profiles
export const fetchAllTimeRanking = async (
  currentUserId?: string,
  limit: number = 10
): Promise<WeeklyRankingUser[]> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('id, name, avatar_url, xp')
    .order('xp', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('Error fetching all-time ranking:', error);
    return [];
  }

  if (!data || data.length === 0) {
    return [];
  }

  return data.map((user, index) => ({
    rank: index + 1,
    user_id: user.id,
    name: user.name || 'Usuário',
    avatar_url: user.avatar_url,
    xp_earned: user.xp || 0,
    isCurrentUser: user.id === currentUserId,
    trend: 'same' as const,
  }));
};
