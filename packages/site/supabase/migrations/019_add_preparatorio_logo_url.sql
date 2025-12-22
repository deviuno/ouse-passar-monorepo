-- Migration: Add logo_url field to preparatorios table
-- Description: Adds a field to store the organization logo URL (square image)
-- This logo is different from imagem_capa (cover image) - it's a small square logo
-- that appears in headers and dropdowns

-- Add logo_url column
ALTER TABLE preparatorios
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN preparatorios.logo_url IS 'URL da logo quadrada do órgão (ex: logo PRF, logo Polícia Federal). Diferente de imagem_capa que é a capa decorativa.';
