-- Migration: Add user creation support for leads
-- When a planning is generated, a user account is created for the student

-- Add user_id to leads table (references admin_users with role='cliente')
ALTER TABLE leads ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL;

-- Add temporary password field (stored to show in access data section)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS senha_temporaria VARCHAR(50) NULL;

-- Create index for user_id lookups
CREATE INDEX IF NOT EXISTS idx_leads_user_id ON leads(user_id);

-- Add lead_id to planejamentos table to know which lead owns the planning
ALTER TABLE planejamentos ADD COLUMN IF NOT EXISTS lead_id UUID REFERENCES leads(id) ON DELETE SET NULL;

-- Create index for lead_id lookups
CREATE INDEX IF NOT EXISTS idx_planejamentos_lead_id ON planejamentos(lead_id);
