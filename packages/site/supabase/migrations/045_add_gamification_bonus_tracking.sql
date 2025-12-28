-- Migration: Add gamification bonus tracking columns
-- Tracks daily goal progress and streak milestone bonuses

-- Add columns to track daily questions and bonuses
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS questions_answered_today INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_questions_date DATE,
ADD COLUMN IF NOT EXISTS daily_goal_claimed_date DATE,
ADD COLUMN IF NOT EXISTS streak_7_bonus_claimed BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS streak_30_bonus_claimed BOOLEAN DEFAULT FALSE;

-- Create function to reset daily questions count and check for bonuses
CREATE OR REPLACE FUNCTION check_and_award_bonuses(
  p_user_id UUID,
  p_questions_increment INTEGER DEFAULT 1
)
RETURNS TABLE(
  daily_goal_bonus_awarded BOOLEAN,
  daily_goal_xp INTEGER,
  daily_goal_coins INTEGER,
  streak_7_bonus_awarded BOOLEAN,
  streak_7_xp INTEGER,
  streak_30_bonus_awarded BOOLEAN,
  streak_30_xp INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_questions_today INTEGER;
  v_streak INTEGER;
  v_daily_goal_questions INTEGER;
  v_daily_goal_xp INTEGER;
  v_daily_goal_coins INTEGER;
  v_streak_7_xp INTEGER;
  v_streak_30_xp INTEGER;
  v_daily_goal_claimed DATE;
  v_streak_7_claimed BOOLEAN;
  v_streak_30_claimed BOOLEAN;
  v_last_questions_date DATE;
BEGIN
  -- Get gamification settings
  SELECT
    COALESCE(daily_goal_questions, 50),
    COALESCE(daily_goal_xp_bonus, 100),
    COALESCE(daily_goal_coins_bonus, 50),
    COALESCE(streak_7_day_xp_bonus, 200),
    COALESCE(streak_30_day_xp_bonus, 500)
  INTO
    v_daily_goal_questions,
    v_daily_goal_xp,
    v_daily_goal_coins,
    v_streak_7_xp,
    v_streak_30_xp
  FROM gamification_settings
  WHERE id = 'main';

  -- Use defaults if no settings found
  IF v_daily_goal_questions IS NULL THEN
    v_daily_goal_questions := 50;
    v_daily_goal_xp := 100;
    v_daily_goal_coins := 50;
    v_streak_7_xp := 200;
    v_streak_30_xp := 500;
  END IF;

  -- Get current user stats
  SELECT
    questions_answered_today,
    last_questions_date,
    streak,
    daily_goal_claimed_date,
    streak_7_bonus_claimed,
    streak_30_bonus_claimed
  INTO
    v_questions_today,
    v_last_questions_date,
    v_streak,
    v_daily_goal_claimed,
    v_streak_7_claimed,
    v_streak_30_claimed
  FROM user_profiles
  WHERE id = p_user_id;

  -- Reset questions count if it's a new day
  IF v_last_questions_date IS NULL OR v_last_questions_date < v_today THEN
    v_questions_today := 0;
  END IF;

  -- Increment questions count
  v_questions_today := COALESCE(v_questions_today, 0) + p_questions_increment;

  -- Initialize return values
  daily_goal_bonus_awarded := FALSE;
  daily_goal_xp := 0;
  daily_goal_coins := 0;
  streak_7_bonus_awarded := FALSE;
  streak_7_xp := 0;
  streak_30_bonus_awarded := FALSE;
  streak_30_xp := 0;

  -- Check daily goal bonus
  IF v_questions_today >= v_daily_goal_questions AND (v_daily_goal_claimed IS NULL OR v_daily_goal_claimed < v_today) THEN
    daily_goal_bonus_awarded := TRUE;
    daily_goal_xp := v_daily_goal_xp;
    daily_goal_coins := v_daily_goal_coins;
    v_daily_goal_claimed := v_today;
  END IF;

  -- Check streak 7 bonus (one-time)
  IF v_streak >= 7 AND NOT COALESCE(v_streak_7_claimed, FALSE) THEN
    streak_7_bonus_awarded := TRUE;
    streak_7_xp := v_streak_7_xp;
    v_streak_7_claimed := TRUE;
  END IF;

  -- Check streak 30 bonus (one-time)
  IF v_streak >= 30 AND NOT COALESCE(v_streak_30_claimed, FALSE) THEN
    streak_30_bonus_awarded := TRUE;
    streak_30_xp := v_streak_30_xp;
    v_streak_30_claimed := TRUE;
  END IF;

  -- Update user profile with new tracking values
  UPDATE user_profiles
  SET
    questions_answered_today = v_questions_today,
    last_questions_date = v_today,
    daily_goal_claimed_date = v_daily_goal_claimed,
    streak_7_bonus_claimed = v_streak_7_claimed,
    streak_30_bonus_claimed = v_streak_30_claimed,
    -- Also add bonus XP and coins if earned
    xp = xp + daily_goal_xp + streak_7_xp + streak_30_xp,
    coins = coins + daily_goal_coins
  WHERE id = p_user_id;

  RETURN NEXT;
END;
$$;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION check_and_award_bonuses(UUID, INTEGER) TO authenticated;

-- Add comment
COMMENT ON FUNCTION check_and_award_bonuses IS 'Checks and awards daily goal and streak milestone bonuses';
