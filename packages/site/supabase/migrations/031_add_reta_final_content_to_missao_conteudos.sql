-- Migration: Add Reta Final content columns to missao_conteudos
-- These columns store the summarized version of content for the "Reta Final" mode

ALTER TABLE missao_conteudos
ADD COLUMN IF NOT EXISTS reta_final_content TEXT,
ADD COLUMN IF NOT EXISTS reta_final_audio_url TEXT,
ADD COLUMN IF NOT EXISTS reta_final_status VARCHAR(20) DEFAULT 'pending'
  CHECK (reta_final_status IN ('pending', 'generating', 'completed', 'failed'));

-- Add comment explaining the columns
COMMENT ON COLUMN missao_conteudos.reta_final_content IS 'Summarized content for Reta Final mode (last-minute study)';
COMMENT ON COLUMN missao_conteudos.reta_final_audio_url IS 'Audio URL for the summarized Reta Final content';
COMMENT ON COLUMN missao_conteudos.reta_final_status IS 'Status of Reta Final content generation: pending, generating, completed, failed';
