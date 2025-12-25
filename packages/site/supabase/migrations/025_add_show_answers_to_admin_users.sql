-- Add show_answers field to admin_users
-- This allows admins to enable/disable answer visibility for specific users
-- When enabled, users will see correct answers marked with a star during practice

ALTER TABLE admin_users
ADD COLUMN IF NOT EXISTS show_answers BOOLEAN DEFAULT false;

-- Add comment
COMMENT ON COLUMN admin_users.show_answers IS 'When true, user sees correct answers marked during practice (admin feature)';
