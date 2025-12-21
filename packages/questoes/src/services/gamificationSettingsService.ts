import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface GamificationSettings {
  id: string;
  xp_per_correct_answer: number;
  xp_per_correct_hard_mode: number;
  xp_per_pvp_win: number;
  xp_per_pvp_loss: number;
  xp_per_flashcard_review: number;
  xp_per_flashcard_remembered: number;
  coins_per_correct_answer: number;
  coins_per_correct_hard_mode: number;
  coins_per_pvp_win: number;
  coins_per_pvp_loss: number;
  xp_per_level: number;
  level_formula: 'linear' | 'exponential';
  daily_goal_questions: number;
  daily_goal_xp_bonus: number;
  daily_goal_coins_bonus: number;
  streak_freeze_cost: number;
  streak_7_day_xp_bonus: number;
  streak_30_day_xp_bonus: number;
  league_promotion_top: number;
  league_demotion_bottom: number;
  league_reset_day: string;
  is_gamification_enabled: boolean;
  show_xp_animations: boolean;
  show_level_up_modal: boolean;
}

// Default settings (fallback when DB is unavailable)
const DEFAULT_SETTINGS: GamificationSettings = {
  id: 'main',
  xp_per_correct_answer: 50,
  xp_per_correct_hard_mode: 100,
  xp_per_pvp_win: 200,
  xp_per_pvp_loss: 20,
  xp_per_flashcard_review: 10,
  xp_per_flashcard_remembered: 20,
  coins_per_correct_answer: 10,
  coins_per_correct_hard_mode: 20,
  coins_per_pvp_win: 50,
  coins_per_pvp_loss: 5,
  xp_per_level: 1000,
  level_formula: 'linear',
  daily_goal_questions: 20,
  daily_goal_xp_bonus: 100,
  daily_goal_coins_bonus: 20,
  streak_freeze_cost: 50,
  streak_7_day_xp_bonus: 500,
  streak_30_day_xp_bonus: 2000,
  league_promotion_top: 3,
  league_demotion_bottom: 3,
  league_reset_day: 'sunday',
  is_gamification_enabled: true,
  show_xp_animations: true,
  show_level_up_modal: true,
};

// Cache for settings to avoid multiple DB calls
let settingsCache: GamificationSettings | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// ============================================================================
// API
// ============================================================================

/**
 * Get gamification settings from database with caching
 */
export async function getGamificationSettings(): Promise<GamificationSettings> {
  // Check cache first
  const now = Date.now();
  if (settingsCache && (now - cacheTimestamp) < CACHE_DURATION) {
    return settingsCache;
  }

  try {
    const { data, error } = await (supabase as any)
      .from('gamification_settings')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error) {
      console.warn('[gamificationSettings] Error fetching settings, using defaults:', error.message);
      return DEFAULT_SETTINGS;
    }

    if (!data) {
      console.warn('[gamificationSettings] No settings found, using defaults');
      return DEFAULT_SETTINGS;
    }

    // Update cache
    settingsCache = data as GamificationSettings;
    cacheTimestamp = now;

    return settingsCache;
  } catch (error: any) {
    console.error('[gamificationSettings] Exception:', error.message);
    return DEFAULT_SETTINGS;
  }
}

/**
 * Calculate XP reward based on action and settings
 */
export async function calculateXpReward(
  action: 'correct_answer' | 'correct_hard_mode' | 'pvp_win' | 'pvp_loss' | 'flashcard_review' | 'flashcard_remembered'
): Promise<number> {
  const settings = await getGamificationSettings();

  switch (action) {
    case 'correct_answer':
      return settings.xp_per_correct_answer;
    case 'correct_hard_mode':
      return settings.xp_per_correct_hard_mode;
    case 'pvp_win':
      return settings.xp_per_pvp_win;
    case 'pvp_loss':
      return settings.xp_per_pvp_loss;
    case 'flashcard_review':
      return settings.xp_per_flashcard_review;
    case 'flashcard_remembered':
      return settings.xp_per_flashcard_remembered;
    default:
      return 0;
  }
}

/**
 * Calculate coins reward based on action and settings
 */
export async function calculateCoinsReward(
  action: 'correct_answer' | 'correct_hard_mode' | 'pvp_win' | 'pvp_loss'
): Promise<number> {
  const settings = await getGamificationSettings();

  switch (action) {
    case 'correct_answer':
      return settings.coins_per_correct_answer;
    case 'correct_hard_mode':
      return settings.coins_per_correct_hard_mode;
    case 'pvp_win':
      return settings.coins_per_pvp_win;
    case 'pvp_loss':
      return settings.coins_per_pvp_loss;
    default:
      return 0;
  }
}

/**
 * Calculate user level based on total XP and settings
 */
export async function calculateLevel(totalXp: number): Promise<number> {
  const settings = await getGamificationSettings();

  if (settings.level_formula === 'exponential') {
    // Exponential formula: level = floor(log2(xp / xp_per_level + 1)) + 1
    return Math.floor(Math.log2(totalXp / settings.xp_per_level + 1)) + 1;
  }

  // Linear formula: level = floor(xp / xp_per_level) + 1
  return Math.floor(totalXp / settings.xp_per_level) + 1;
}

/**
 * Invalidate cache to force reload on next call
 */
export function invalidateSettingsCache(): void {
  settingsCache = null;
  cacheTimestamp = 0;
}

export default {
  getGamificationSettings,
  calculateXpReward,
  calculateCoinsReward,
  calculateLevel,
  invalidateSettingsCache,
};
