-- Migration: 016_update_content_types
-- Descrição: Altera course_type para content_types[] (array) e atualiza tipos
-- Data: 2025-01-xx
--
-- Mudanças:
-- - 'simulado' -> 'questoes' (app Ouse Questões)
-- - Novo tipo 'plano' (app de planejamento)
-- - 'preparatorio' continua igual (futuro portal)
-- - Permitir múltiplos tipos por curso (multi-select)

-- 1. Adicionar nova coluna de array
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS content_types TEXT[] DEFAULT ARRAY['questoes'];

-- 2. Migrar dados existentes do course_type para content_types
UPDATE courses
SET content_types = CASE
    WHEN course_type = 'simulado' THEN ARRAY['questoes']
    WHEN course_type = 'preparatorio' THEN ARRAY['preparatorio']
    ELSE ARRAY['questoes']
END
WHERE content_types IS NULL OR content_types = ARRAY['questoes'];

-- 3. Criar constraint para validar valores permitidos
-- Nota: PostgreSQL não tem CHECK direto para arrays, usamos uma função
CREATE OR REPLACE FUNCTION check_valid_content_types(types TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
    -- Verifica se todos os valores do array estão na lista permitida
    RETURN types <@ ARRAY['plano', 'questoes', 'preparatorio'];
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Adicionar constraint usando a função
ALTER TABLE courses
ADD CONSTRAINT courses_content_types_check
CHECK (check_valid_content_types(content_types));

-- 4. Criar índice GIN para buscas eficientes em arrays
CREATE INDEX IF NOT EXISTS idx_courses_content_types ON courses USING GIN (content_types);

-- 5. Remover coluna antiga (opcional - pode manter para compatibilidade temporária)
-- Se quiser manter a coluna antiga comentada, descomente as linhas abaixo depois de testar
-- ALTER TABLE courses DROP COLUMN course_type;

-- 6. Comentário na tabela para documentação
COMMENT ON COLUMN courses.content_types IS 'Tipos de conteúdo disponíveis: plano (app planejamento), questoes (app Ouse Questões), preparatorio (portal futuro)';
