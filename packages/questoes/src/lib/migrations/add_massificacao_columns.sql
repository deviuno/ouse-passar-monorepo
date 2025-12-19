-- Adicionar colunas de massificação à tabela user_missao_progress
-- Executar este script no Supabase SQL Editor

-- Adicionar coluna para contar tentativas de massificação
ALTER TABLE user_missao_progress
ADD COLUMN IF NOT EXISTS massificacao_attempts INTEGER DEFAULT 0;

-- Adicionar coluna para armazenar IDs das questões (para refazer as mesmas)
ALTER TABLE user_missao_progress
ADD COLUMN IF NOT EXISTS questoes_ids TEXT[] DEFAULT '{}';

-- Adicionar coluna para última tentativa
ALTER TABLE user_missao_progress
ADD COLUMN IF NOT EXISTS last_attempt_at TIMESTAMPTZ;

-- Comentários nas colunas
COMMENT ON COLUMN user_missao_progress.massificacao_attempts IS 'Número de tentativas de massificação realizadas';
COMMENT ON COLUMN user_missao_progress.questoes_ids IS 'IDs das questões originais para repetir na massificação';
COMMENT ON COLUMN user_missao_progress.last_attempt_at IS 'Data/hora da última tentativa';

-- Verificar se o status needs_massificacao é válido
-- Se a coluna status usa um ENUM, precisa adicionar o novo valor
-- DO $$
-- BEGIN
--   ALTER TYPE mission_status ADD VALUE IF NOT EXISTS 'needs_massificacao';
-- EXCEPTION
--   WHEN duplicate_object THEN null;
-- END $$;

-- Se o status for TEXT, não precisa alterar nada
