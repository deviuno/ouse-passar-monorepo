-- Migration: Adicionar coluna 'ativo' para controle de questões válidas
-- Banco: Questões (swzosaapqtyhmwdiwdje)
--
-- Esta migration adiciona uma coluna 'ativo' para permitir filtrar questões inválidas
-- sem deletá-las permanentemente do banco.
--
-- Execute este script diretamente no Supabase Dashboard > SQL Editor
-- ou via CLI: psql -h <host> -U postgres -d postgres -f 001_add_ativo_column.sql

-- 1. Adicionar coluna 'ativo' com valor padrão true
ALTER TABLE questoes_concurso
ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT true;

-- 2. Criar índice para melhorar performance das queries filtradas
CREATE INDEX IF NOT EXISTS idx_questoes_ativo ON questoes_concurso(ativo) WHERE ativo = true;

-- 3. Criar índice composto para queries comuns (matéria + ativo)
CREATE INDEX IF NOT EXISTS idx_questoes_materia_ativo ON questoes_concurso(materia, ativo) WHERE ativo = true;

-- 4. Comentário na coluna
COMMENT ON COLUMN questoes_concurso.ativo IS 'Indica se a questão está ativa e deve aparecer no sistema. Questões com enunciado "deleted" ou sem gabarito válido devem ter ativo=false';

-- 5. Inativar questões com enunciado "deleted"
UPDATE questoes_concurso
SET ativo = false
WHERE enunciado = 'deleted';

-- 6. Inativar questões sem gabarito (NULL)
UPDATE questoes_concurso
SET ativo = false
WHERE gabarito IS NULL;

-- Verificação final
SELECT
  COUNT(*) FILTER (WHERE ativo = true) as questoes_ativas,
  COUNT(*) FILTER (WHERE ativo = false) as questoes_inativas,
  COUNT(*) FILTER (WHERE enunciado = 'deleted') as questoes_deleted,
  COUNT(*) FILTER (WHERE gabarito IS NULL) as questoes_sem_gabarito,
  COUNT(*) as total
FROM questoes_concurso;
