// Service for persisting user stats to Supabase
import { supabase } from './supabaseClient';
import { UserStats } from '../types';
import { calculateLevel } from './gamificationSettingsService';

/**
 * Update user stats in Supabase
 * This should be called whenever stats change to persist them to the database
 */
export async function updateUserStats(
  userId: string,
  increments: {
    xp?: number;
    coins?: number;
    correctAnswers?: number;
    totalAnswered?: number;
  }
): Promise<{ success: boolean; error?: string; newStats?: { xp: number; coins: number } }> {
  try {
    console.log('[userStatsService] Updating stats for user:', userId, increments);

    // Use Supabase RPC to increment stats atomically
    const { error } = await supabase.rpc('increment_user_stats', {
      p_user_id: userId,
      p_xp: increments.xp || 0,
      p_coins: increments.coins || 0,
      p_correct_answers: increments.correctAnswers || 0,
      p_total_answered: increments.totalAnswered || 0,
    });

    if (error) {
      console.error('[userStatsService] RPC error:', error);

      // Fallback: fetch current values and update with new totals
      console.log('[userStatsService] Trying fallback update method...');

      // First, get current stats
      const { data: currentProfile, error: fetchError } = await supabase
        .from('user_profiles')
        .select('xp, coins, correct_answers, total_answered')
        .eq('id', userId)
        .single();

      if (fetchError || !currentProfile) {
        console.error('[userStatsService] Failed to fetch current stats:', fetchError);
        return { success: false, error: fetchError?.message || 'User not found' };
      }

      // Calculate new values
      const newXp = (currentProfile.xp || 0) + (increments.xp || 0);
      const newCoins = (currentProfile.coins || 0) + (increments.coins || 0);
      const newCorrectAnswers = (currentProfile.correct_answers || 0) + (increments.correctAnswers || 0);
      const newTotalAnswered = (currentProfile.total_answered || 0) + (increments.totalAnswered || 0);

      // Calculate new level
      const newLevel = Math.floor(newXp / 1000) + 1;

      // Update with absolute values
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          xp: newXp,
          coins: newCoins,
          correct_answers: newCorrectAnswers,
          total_answered: newTotalAnswered,
          level: newLevel,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[userStatsService] Fallback update failed:', updateError);
        return { success: false, error: updateError.message };
      }

      console.log('[userStatsService] Stats updated via fallback. New XP:', newXp, 'New Coins:', newCoins);
      return { success: true, newStats: { xp: newXp, coins: newCoins } };
    }

    console.log('[userStatsService] Stats updated successfully via RPC');
    return { success: true };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('[userStatsService] Exception updating stats:', errorMessage);
    return { success: false, error: errorMessage };
  }
}

/**
 * Fetch current user stats from Supabase
 */
export async function getUserStats(userId: string): Promise<UserStats | null> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('xp, coins, streak, level, correct_answers, total_answered, avatar_id, last_practice_date')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[userStatsService] Error fetching stats:', error);
      return null;
    }

    return {
      xp: data.xp || 0,
      coins: data.coins || 0,
      streak: data.streak || 0,
      level: data.level || 1,
      correctAnswers: data.correct_answers || 0,
      totalAnswered: data.total_answered || 0,
      avatarId: data.avatar_id,
      lastPracticeDate: data.last_practice_date || null,
    };
  } catch (err) {
    console.error('[userStatsService] Exception fetching stats:', err);
    return null;
  }
}

/**
 * Calculate and update user level based on XP
 * Uses gamification settings to determine level formula
 */
export async function updateUserLevel(userId: string, currentXP: number): Promise<void> {
  const newLevel = await calculateLevel(currentXP);

  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({ level: newLevel, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) {
      console.error('[userStatsService] Error updating level:', error);
    } else {
      console.log(`[userStatsService] Level updated to ${newLevel} for user ${userId}`);
    }
  } catch (err) {
    console.error('[userStatsService] Exception updating level:', err);
  }
}
