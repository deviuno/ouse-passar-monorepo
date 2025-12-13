-- Migration: Fix leads.planejamento_id foreign key constraint
-- Problem: leads.planejamento_id references planejamentos_prf but we now use planejamentos table
-- Solution: Remove the FK constraint since we manage the relationship in code

-- Drop the existing foreign key constraint
ALTER TABLE leads DROP CONSTRAINT IF EXISTS leads_planejamento_id_fkey;

-- Add comment explaining the change
COMMENT ON COLUMN leads.planejamento_id IS 'ID do planejamento gerado. Pode referenciar planejamentos_prf (legado) ou planejamentos (novo sistema dinâmico).';
