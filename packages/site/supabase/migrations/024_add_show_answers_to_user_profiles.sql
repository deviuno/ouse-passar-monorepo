-- Add show_answers field to user_profiles
-- This allows admins to enable/disable answer visibility for specific users
-- When enabled, users will see correct answers marked with a star during practice

ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS show_answers BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN user_profiles.show_answers IS 'When true, user sees correct answers marked during practice (admin feature)';
