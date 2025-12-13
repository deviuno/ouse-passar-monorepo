-- Migration: Add gender field to admin_users
-- This allows proper gender-based text formatting (e.g., "Seu Especialista" vs "Sua Especialista")

-- Add gender field to admin_users table
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS genero VARCHAR(20) DEFAULT 'feminino';

-- Add comment to explain the field
COMMENT ON COLUMN admin_users.genero IS 'Gender of the user for proper text formatting (masculino, feminino)';

-- Update existing sellers to have a default gender (can be changed later)
UPDATE admin_users SET genero = 'feminino' WHERE role = 'vendedor' AND genero IS NULL;
