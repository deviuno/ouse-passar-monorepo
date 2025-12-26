-- Migration to automatically sync app users (user_profiles) to admin_users as clientes
-- This ensures all users who register in the app appear in the admin panel

-- First, sync existing users from user_profiles to admin_users
-- Note: password_hash is set to a placeholder since actual auth is handled by Supabase Auth
-- Skip users whose email already exists in admin_users (to avoid conflicts)
INSERT INTO admin_users (id, email, password_hash, name, role, is_active, show_answers, avatar_url, created_at, updated_at)
SELECT
  up.id,
  up.email,
  'supabase_auth' as password_hash,  -- Placeholder - real auth is in auth.users
  up.name,
  'cliente' as role,
  true as is_active,
  false as show_answers,
  up.avatar_url,
  up.created_at,
  up.updated_at
FROM user_profiles up
WHERE NOT EXISTS (
  SELECT 1 FROM admin_users au WHERE au.id = up.id
)
AND NOT EXISTS (
  SELECT 1 FROM admin_users au WHERE au.email = up.email
);

-- Create function to sync user_profiles to admin_users
CREATE OR REPLACE FUNCTION sync_user_profile_to_admin_users()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert or update admin_users when user_profiles is created/updated
  -- Note: password_hash is set to a placeholder since actual auth is handled by Supabase Auth
  INSERT INTO admin_users (id, email, password_hash, name, role, is_active, show_answers, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    'supabase_auth',  -- Placeholder - real auth is in auth.users
    NEW.name,
    'cliente',
    true,
    false,
    NEW.avatar_url,
    NEW.created_at,
    NEW.updated_at
  )
  ON CONFLICT (id) DO UPDATE SET
    email = EXCLUDED.email,
    name = EXCLUDED.name,
    avatar_url = EXCLUDED.avatar_url,
    updated_at = EXCLUDED.updated_at;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on user_profiles
DROP TRIGGER IF EXISTS sync_user_profile_to_admin_users_trigger ON user_profiles;
CREATE TRIGGER sync_user_profile_to_admin_users_trigger
  AFTER INSERT OR UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION sync_user_profile_to_admin_users();

-- Add comment
COMMENT ON FUNCTION sync_user_profile_to_admin_users() IS 'Automatically syncs app users from user_profiles to admin_users as clientes';
