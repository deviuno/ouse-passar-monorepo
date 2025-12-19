-- Migration: Adicionar coluna questoes_por_missao na tabela user_trails
-- Esta coluna armazena a quantidade de questões por missão calculada
-- baseado na disponibilidade de tempo do usuário (20-60 questões)

-- Adicionar coluna à tabela user_trails
ALTER TABLE user_trails
ADD COLUMN IF NOT EXISTS questoes_por_missao INTEGER DEFAULT 20;

-- Adicionar constraint para garantir valores válidos
ALTER TABLE user_trails
ADD CONSTRAINT questoes_por_missao_range
CHECK (questoes_por_missao >= 20 AND questoes_por_missao <= 60);

-- Comentário na coluna
COMMENT ON COLUMN user_trails.questoes_por_missao IS 'Quantidade de questões por missão (20-60), calculada com base na disponibilidade de tempo do usuário';
