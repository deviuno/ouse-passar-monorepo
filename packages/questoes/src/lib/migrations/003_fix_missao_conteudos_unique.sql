-- =====================================================
-- FIX: Adicionar constraint UNIQUE em missao_id
-- =====================================================
-- O conteúdo de uma missão é gerado UMA VEZ e compartilhado
-- entre todos os usuários. Sem essa constraint, múltiplos
-- registros podem ser criados para a mesma missão.
-- =====================================================

-- 1. Primeiro, remover duplicatas mantendo apenas o mais antigo com status 'completed'
-- Se não houver completed, mantém o mais antigo
WITH duplicates AS (
  SELECT
    id,
    missao_id,
    status,
    created_at,
    ROW_NUMBER() OVER (
      PARTITION BY missao_id
      ORDER BY
        CASE WHEN status = 'completed' THEN 0 ELSE 1 END,
        created_at ASC
    ) as rn
  FROM missao_conteudos
)
DELETE FROM missao_conteudos
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 2. Adicionar constraint UNIQUE na coluna missao_id
-- Isso garante que apenas um conteúdo existe por missão
ALTER TABLE missao_conteudos
ADD CONSTRAINT missao_conteudos_missao_id_unique UNIQUE (missao_id);

-- 3. Criar índice para performance (se não existir)
CREATE INDEX IF NOT EXISTS idx_missao_conteudos_missao_id
ON missao_conteudos(missao_id);

CREATE INDEX IF NOT EXISTS idx_missao_conteudos_status
ON missao_conteudos(status);

-- 4. Comentário na tabela para documentação
COMMENT ON CONSTRAINT missao_conteudos_missao_id_unique ON missao_conteudos IS
'Garante que cada missão tem apenas um conteúdo. O conteúdo é gerado pelo primeiro usuário e compartilhado com todos.';
