-- Fix increment_user_stats RPC to use gamification_settings for level calculation
-- This allows the admin to configure XP per level and level formula

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
BEGIN
  -- Get the new total XP
  SELECT xp + p_xp INTO v_new_xp
  FROM user_profiles
  WHERE id = p_user_id;

  -- Get gamification settings
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

  -- Update user profile
  UPDATE user_profiles
  SET
    xp = xp + p_xp,
    coins = coins + p_coins,
    correct_answers = correct_answers + p_correct_answers,
    total_answered = total_answered + p_total_answered,
    level = v_new_level,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;
