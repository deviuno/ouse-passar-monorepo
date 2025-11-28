import { supabase } from '../lib/supabase';

// Cast supabase to any to allow querying tables not yet in the TypeScript schema
// These gamification tables will be created via SQL migration
const db = supabase as any;

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
  srs_interval_easy: number;
  srs_interval_medium: number;
  srs_interval_hard: number;
  srs_progression_steps: number[];
  is_gamification_enabled: boolean;
  show_xp_animations: boolean;
  show_level_up_modal: boolean;
}

export interface Level {
  id: number;
  level_number: number;
  title: string;
  min_xp: number;
  icon: string;
  color: string;
  rewards_xp: number;
  rewards_coins: number;
  is_active: boolean;
}

export interface LeagueTier {
  id: string;
  name: string;
  display_order: number;
  icon: string;
  color: string;
  bg_color: string;
  min_xp_to_enter: number | null;
  promotion_bonus_xp: number;
  promotion_bonus_coins: number;
  is_active: boolean;
}

export interface XpAction {
  id: string;
  name: string;
  description: string;
  xp_reward: number;
  coins_reward: number;
  study_mode: string | null;
  requires_correct_answer: boolean;
  multiplier_enabled: boolean;
  multiplier_value: number;
  is_active: boolean;
}

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  item_type: 'avatar' | 'theme' | 'powerup' | 'badge';
  price_coins: number;
  price_real: number | null;
  icon: string;
  value: string | null;
  metadata: Record<string, any> | null;
  is_active: boolean;
  is_featured: boolean;
  available_from: string | null;
  available_until: string | null;
  max_purchases: number | null;
  required_level: number | null;
  required_achievement_id: string | null;
  display_order: number;
}

export interface StreakReward {
  id: number;
  days_required: number;
  xp_reward: number;
  coins_reward: number;
  badge_id: string | null;
  special_reward_type: string | null;
  special_reward_id: string | null;
  notification_message: string | null;
  icon: string;
  is_active: boolean;
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
  coins_reward: number;
  is_active: boolean;
  is_hidden: boolean;
  display_order: number;
  unlock_message: string | null;
}

export interface DailyChallenge {
  id: string;
  name: string;
  description: string;
  challenge_type: string;
  target_value: number;
  xp_reward: number;
  coins_reward: number;
  subject_filter: string | null;
  study_mode_filter: string | null;
  is_active: boolean;
  weight: number;
}

// ============================================================================
// GAMIFICATION SETTINGS
// ============================================================================

export async function getGamificationSettings(): Promise<{ settings: GamificationSettings | null; error?: string }> {
  try {
    const { data, error } = await db
      .from('gamification_settings')
      .select('*')
      .eq('id', 'main')
      .single();

    if (error) throw error;

    return { settings: data };
  } catch (error: any) {
    console.error('Error fetching gamification settings:', error);
    return { settings: null, error: error.message };
  }
}

export async function updateGamificationSettings(
  settings: Partial<GamificationSettings>
): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('gamification_settings')
      .update(settings)
      .eq('id', 'main');

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating gamification settings:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// LEVELS
// ============================================================================

export async function getLevels(): Promise<{ levels: Level[]; error?: string }> {
  try {
    const { data, error } = await db
      .from('levels')
      .select('*')
      .order('level_number', { ascending: true });

    if (error) throw error;

    return { levels: data || [] };
  } catch (error: any) {
    console.error('Error fetching levels:', error);
    return { levels: [], error: error.message };
  }
}

export async function createLevel(level: Omit<Level, 'id'>): Promise<{ level: Level | null; error?: string }> {
  try {
    const { data, error } = await db
      .from('levels')
      .insert(level)
      .select()
      .single();

    if (error) throw error;

    return { level: data };
  } catch (error: any) {
    console.error('Error creating level:', error);
    return { level: null, error: error.message };
  }
}

export async function updateLevel(id: number, level: Partial<Level>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('levels')
      .update(level)
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating level:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteLevel(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('levels')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting level:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// LEAGUE TIERS
// ============================================================================

export async function getLeagueTiers(): Promise<{ tiers: LeagueTier[]; error?: string }> {
  try {
    const { data, error } = await db
      .from('league_tiers')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { tiers: data || [] };
  } catch (error: any) {
    console.error('Error fetching league tiers:', error);
    return { tiers: [], error: error.message };
  }
}

export async function createLeagueTier(tier: LeagueTier): Promise<{ tier: LeagueTier | null; error?: string }> {
  try {
    const { data, error } = await db
      .from('league_tiers')
      .insert(tier)
      .select()
      .single();

    if (error) throw error;

    return { tier: data };
  } catch (error: any) {
    console.error('Error creating league tier:', error);
    return { tier: null, error: error.message };
  }
}

export async function updateLeagueTier(id: string, tier: Partial<LeagueTier>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('league_tiers')
      .update(tier)
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating league tier:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteLeagueTier(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('league_tiers')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting league tier:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// XP ACTIONS
// ============================================================================

export async function getXpActions(): Promise<{ actions: XpAction[]; error?: string }> {
  try {
    const { data, error } = await db
      .from('xp_actions')
      .select('*')
      .order('id', { ascending: true });

    if (error) throw error;

    return { actions: data || [] };
  } catch (error: any) {
    console.error('Error fetching XP actions:', error);
    return { actions: [], error: error.message };
  }
}

export async function createXpAction(action: XpAction): Promise<{ action: XpAction | null; error?: string }> {
  try {
    const { data, error } = await db
      .from('xp_actions')
      .insert(action)
      .select()
      .single();

    if (error) throw error;

    return { action: data };
  } catch (error: any) {
    console.error('Error creating XP action:', error);
    return { action: null, error: error.message };
  }
}

export async function updateXpAction(id: string, action: Partial<XpAction>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('xp_actions')
      .update(action)
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating XP action:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteXpAction(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('xp_actions')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting XP action:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// STORE ITEMS
// ============================================================================

export async function getStoreItems(): Promise<{ items: StoreItem[]; error?: string }> {
  try {
    const { data, error } = await db
      .from('store_items')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { items: data || [] };
  } catch (error: any) {
    console.error('Error fetching store items:', error);
    return { items: [], error: error.message };
  }
}

export async function createStoreItem(item: Omit<StoreItem, 'id'>): Promise<{ item: StoreItem | null; error?: string }> {
  try {
    const { data, error } = await db
      .from('store_items')
      .insert(item)
      .select()
      .single();

    if (error) throw error;

    return { item: data };
  } catch (error: any) {
    console.error('Error creating store item:', error);
    return { item: null, error: error.message };
  }
}

export async function updateStoreItem(id: string, item: Partial<StoreItem>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('store_items')
      .update(item)
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating store item:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteStoreItem(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('store_items')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting store item:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// ACHIEVEMENTS
// ============================================================================

export async function getAchievements(): Promise<{ achievements: Achievement[]; error?: string }> {
  try {
    const { data, error } = await db
      .from('achievements')
      .select('*')
      .order('display_order', { ascending: true });

    if (error) throw error;

    return { achievements: data || [] };
  } catch (error: any) {
    console.error('Error fetching achievements:', error);
    return { achievements: [], error: error.message };
  }
}

export async function createAchievement(achievement: Achievement): Promise<{ achievement: Achievement | null; error?: string }> {
  try {
    const { data, error } = await db
      .from('achievements')
      .insert(achievement)
      .select()
      .single();

    if (error) throw error;

    return { achievement: data };
  } catch (error: any) {
    console.error('Error creating achievement:', error);
    return { achievement: null, error: error.message };
  }
}

export async function updateAchievement(id: string, achievement: Partial<Achievement>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('achievements')
      .update(achievement)
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating achievement:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteAchievement(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('achievements')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting achievement:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// STREAK REWARDS
// ============================================================================

export async function getStreakRewards(): Promise<{ rewards: StreakReward[]; error?: string }> {
  try {
    const { data, error } = await db
      .from('streak_rewards')
      .select('*')
      .order('days_required', { ascending: true });

    if (error) throw error;

    return { rewards: data || [] };
  } catch (error: any) {
    console.error('Error fetching streak rewards:', error);
    return { rewards: [], error: error.message };
  }
}

export async function createStreakReward(reward: Omit<StreakReward, 'id'>): Promise<{ reward: StreakReward | null; error?: string }> {
  try {
    const { data, error } = await db
      .from('streak_rewards')
      .insert(reward)
      .select()
      .single();

    if (error) throw error;

    return { reward: data };
  } catch (error: any) {
    console.error('Error creating streak reward:', error);
    return { reward: null, error: error.message };
  }
}

export async function updateStreakReward(id: number, reward: Partial<StreakReward>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('streak_rewards')
      .update(reward)
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating streak reward:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteStreakReward(id: number): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('streak_rewards')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting streak reward:', error);
    return { success: false, error: error.message };
  }
}

// ============================================================================
// DAILY CHALLENGES
// ============================================================================

export async function getDailyChallenges(): Promise<{ challenges: DailyChallenge[]; error?: string }> {
  try {
    const { data, error } = await db
      .from('daily_challenges')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw error;

    return { challenges: data || [] };
  } catch (error: any) {
    console.error('Error fetching daily challenges:', error);
    return { challenges: [], error: error.message };
  }
}

export async function createDailyChallenge(challenge: Omit<DailyChallenge, 'id'>): Promise<{ challenge: DailyChallenge | null; error?: string }> {
  try {
    const { data, error } = await db
      .from('daily_challenges')
      .insert(challenge)
      .select()
      .single();

    if (error) throw error;

    return { challenge: data };
  } catch (error: any) {
    console.error('Error creating daily challenge:', error);
    return { challenge: null, error: error.message };
  }
}

export async function updateDailyChallenge(id: string, challenge: Partial<DailyChallenge>): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('daily_challenges')
      .update(challenge)
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error updating daily challenge:', error);
    return { success: false, error: error.message };
  }
}

export async function deleteDailyChallenge(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await db
      .from('daily_challenges')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error deleting daily challenge:', error);
    return { success: false, error: error.message };
  }
}
