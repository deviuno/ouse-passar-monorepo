// Shared types for gamification system
// These types are used by both questoes and site packages

export type LeagueTier = 'ferro' | 'bronze' | 'prata' | 'ouro' | 'diamante';

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

export interface LeagueTierConfig {
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

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  item_type: 'avatar' | 'theme' | 'powerup' | 'badge';
  price_coins: number;
  price_real: number | null;
  icon: string;
  value: string;
  metadata: Record<string, unknown>;
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
  notification_message: string;
  icon: string;
  is_active: boolean;
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

export interface UserStats {
  xp: number;
  streak: number;
  level: number;
  correctAnswers: number;
  totalAnswered: number;
  coins: number;
  avatarId: string;
}
