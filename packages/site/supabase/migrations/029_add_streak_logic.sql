-- =====================================================
-- ADD STREAK LOGIC TO USER STATS
-- =====================================================
-- Adds last_practice_date column and updates increment_user_stats
-- to properly calculate streak based on consecutive days

-- Add last_practice_date column to track when user last practiced
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS last_practice_date DATE;

COMMENT ON COLUMN user_profiles.last_practice_date IS 'Date of last practice session for streak calculation';

-- Update increment_user_stats to handle streak logic
CREATE OR REPLACE FUNCTION increment_user_stats(
  p_user_id UUID,
  p_xp INTEGER DEFAULT 0,
  p_coins INTEGER DEFAULT 0,
  p_correct_answers INTEGER DEFAULT 0,
  p_total_answered INTEGER DEFAULT 0
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_xp INTEGER;
  v_xp_per_level INTEGER;
  v_level_formula TEXT;
  v_new_level INTEGER;
  v_last_practice DATE;
  v_today DATE := CURRENT_DATE;
  v_current_streak INTEGER;
  v_new_streak INTEGER;
BEGIN
  -- Get current user data
  SELECT xp + p_xp, streak, last_practice_date
  INTO v_new_xp, v_current_streak, v_last_practice
  FROM user_profiles
  WHERE id = p_user_id;

  -- Default streak to 0 if null
  IF v_current_streak IS NULL THEN
    v_current_streak := 0;
  END IF;

  -- Calculate new streak based on last practice date
  IF v_last_practice IS NULL THEN
    -- First time practicing
    v_new_streak := 1;
  ELSIF v_last_practice = v_today THEN
    -- Same day, keep current streak
    v_new_streak := v_current_streak;
  ELSIF v_last_practice = v_today - INTERVAL '1 day' THEN
    -- Consecutive day, increment streak
    v_new_streak := v_current_streak + 1;
  ELSE
    -- Skipped one or more days, reset streak
    v_new_streak := 1;
  END IF;

  -- Get gamification settings for level calculation
  SELECT xp_per_level, level_formula INTO v_xp_per_level, v_level_formula
  FROM gamification_settings
  WHERE id = 'main';

  -- Default to 1000 XP per level and linear formula if not configured
  IF v_xp_per_level IS NULL THEN
    v_xp_per_level := 1000;
  END IF;
  IF v_level_formula IS NULL THEN
    v_level_formula := 'linear';
  END IF;

  -- Calculate level based on formula
  IF v_level_formula = 'exponential' THEN
    -- Exponential: level = floor(log2(xp / xp_per_level + 1)) + 1
    v_new_level := FLOOR(LOG(2, (v_new_xp::FLOAT / v_xp_per_level) + 1)) + 1;
  ELSE
    -- Linear (default): level = floor(xp / xp_per_level) + 1
    v_new_level := FLOOR(v_new_xp::FLOAT / v_xp_per_level) + 1;
  END IF;

  -- Update user profile with all increments and streak
  UPDATE user_profiles
  SET
    xp = xp + p_xp,
    coins = coins + p_coins,
    correct_answers = correct_answers + p_correct_answers,
    total_answered = total_answered + p_total_answered,
    level = v_new_level,
    streak = v_new_streak,
    last_practice_date = v_today,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;
