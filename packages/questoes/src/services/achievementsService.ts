import { supabase } from '../../services/supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  requirement_type: string;
  requirement_value: number;
  xp_reward: number;
  coins_reward: number;
  is_active: boolean;
  is_hidden: boolean;
}

export interface UserStats {
  xp: number;
  coins: number;
  level: number;
  correctAnswers: number;
  totalAnswered: number;
  streak: number;
}

// ============================================================================
// ACHIEVEMENT CHECKING
// ============================================================================

/**
 * Get all active achievements from database
 */
export async function getAllAchievements(): Promise<Achievement[]> {
  const { data, error } = await (supabase as any)
    .from('achievements')
    .select('*')
    .eq('is_active', true)
    .order('requirement_value', { ascending: true });

  if (error) {
    console.error('[achievements] Error fetching achievements:', error.message);
    return [];
  }

  return data || [];
}

/**
 * Get user's unlocked achievement IDs
 */
export async function getUserUnlockedAchievements(userId: string): Promise<string[]> {
  const { data, error } = await (supabase as any)
    .from('user_achievements')
    .select('achievement_id')
    .eq('user_id', userId);

  if (error) {
    console.error('[achievements] Error fetching user achievements:', error.message);
    return [];
  }

  return (data || []).map((ua: any) => ua.achievement_id);
}

/**
 * Check if user meets achievement requirements
 */
function checkRequirement(
  achievement: Achievement,
  stats: UserStats,
  additionalData?: {
    pvpWins?: number;
    flashcardsReviewed?: number;
    subjectsMastered?: number;
  }
): boolean {
  const value = achievement.requirement_value;

  switch (achievement.requirement_type) {
    case 'questions_answered':
      return stats.totalAnswered >= value;

    case 'correct_answers':
      return stats.correctAnswers >= value;

    case 'streak_days':
      return stats.streak >= value;

    case 'level_reached':
      return stats.level >= value;

    case 'xp_earned':
      return stats.xp >= value;

    case 'coins_earned':
      return stats.coins >= value;

    case 'pvp_wins':
      return (additionalData?.pvpWins || 0) >= value;

    case 'flashcards_reviewed':
      return (additionalData?.flashcardsReviewed || 0) >= value;

    case 'subjects_mastered':
      return (additionalData?.subjectsMastered || 0) >= value;

    default:
      // Unknown requirement type
      return false;
  }
}

/**
 * Unlock an achievement for a user
 */
export async function unlockAchievement(
  userId: string,
  achievementId: string
): Promise<boolean> {
  const { error } = await (supabase as any)
    .from('user_achievements')
    .insert({
      user_id: userId,
      achievement_id: achievementId,
    });

  if (error) {
    // 23505 = unique constraint violation (already unlocked)
    if (error.code === '23505') {
      return false;
    }
    console.error('[achievements] Error unlocking achievement:', error.message);
    return false;
  }

  return true;
}

/**
 * Grant achievement rewards to user
 */
async function grantRewards(
  userId: string,
  xpReward: number,
  coinsReward: number
): Promise<void> {
  if (xpReward <= 0 && coinsReward <= 0) return;

  // Get current stats
  const { data: profile, error: fetchError } = await (supabase as any)
    .from('user_profiles')
    .select('xp, coins')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    console.error('[achievements] Error fetching profile for rewards:', fetchError?.message);
    return;
  }

  // Update with rewards
  const { error: updateError } = await (supabase as any)
    .from('user_profiles')
    .update({
      xp: profile.xp + xpReward,
      coins: profile.coins + coinsReward,
    })
    .eq('id', userId);

  if (updateError) {
    console.error('[achievements] Error granting rewards:', updateError.message);
  }
}

/**
 * Check and unlock all eligible achievements for a user
 * Returns list of newly unlocked achievements
 */
export async function checkAndUnlockAchievements(
  userId: string,
  stats: UserStats,
  additionalData?: {
    pvpWins?: number;
    flashcardsReviewed?: number;
    subjectsMastered?: number;
  }
): Promise<Achievement[]> {
  // Get all achievements and user's unlocked ones
  const [allAchievements, unlockedIds] = await Promise.all([
    getAllAchievements(),
    getUserUnlockedAchievements(userId),
  ]);

  const newlyUnlocked: Achievement[] = [];

  // Check each locked achievement
  for (const achievement of allAchievements) {
    // Skip already unlocked
    if (unlockedIds.includes(achievement.id)) {
      continue;
    }

    // Check if user meets requirements
    if (checkRequirement(achievement, stats, additionalData)) {
      // Unlock the achievement
      const success = await unlockAchievement(userId, achievement.id);

      if (success) {
        newlyUnlocked.push(achievement);

        // Grant rewards
        if (achievement.xp_reward > 0 || achievement.coins_reward > 0) {
          await grantRewards(userId, achievement.xp_reward, achievement.coins_reward);
        }

        console.log(`[achievements] Unlocked: ${achievement.name} for user ${userId}`);
      }
    }
  }

  return newlyUnlocked;
}

export default {
  getAllAchievements,
  getUserUnlockedAchievements,
  checkAndUnlockAchievements,
  unlockAchievement,
};
