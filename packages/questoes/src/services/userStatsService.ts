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
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('[userStatsService] Updating stats for user:', userId, increments);

    // Build the update object with increments
    const updates: Record<string, number> = {};

    if (increments.xp) updates.xp = increments.xp;
    if (increments.coins) updates.coins = increments.coins;
    if (increments.correctAnswers) updates.correct_answers = increments.correctAnswers;
    if (increments.totalAnswered) updates.total_answered = increments.totalAnswered;

    // Use Supabase RPC to increment stats atomically
    const { data, error } = await supabase.rpc('increment_user_stats', {
      p_user_id: userId,
      p_xp: increments.xp || 0,
      p_coins: increments.coins || 0,
      p_correct_answers: increments.correctAnswers || 0,
      p_total_answered: increments.totalAnswered || 0,
    });

    if (error) {
      console.error('[userStatsService] Error updating stats:', error);

      // Fallback to direct update if RPC doesn't exist
      console.log('[userStatsService] Trying fallback update method...');
      const { error: updateError } = await supabase
        .from('user_profiles')
        .update({
          xp: supabase.raw(`xp + ${increments.xp || 0}`),
          coins: supabase.raw(`coins + ${increments.coins || 0}`),
          correct_answers: supabase.raw(`correct_answers + ${increments.correctAnswers || 0}`),
          total_answered: supabase.raw(`total_answered + ${increments.totalAnswered || 0}`),
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (updateError) {
        console.error('[userStatsService] Fallback update also failed:', updateError);
        return { success: false, error: updateError.message };
      }
    }

    console.log('[userStatsService] Stats updated successfully');
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
      .select('xp, coins, streak, level, correct_answers, total_answered, avatar_id')
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
