-- =====================================================
-- Migration 017: Sistema Manual de Montagem de Missões
-- =====================================================
-- Esta migration adiciona campos necessários para o
-- sistema híbrido de criação de preparatório onde
-- o usuário monta manualmente as missões selecionando
-- tópicos de cada matéria.
-- =====================================================

-- 1. Adicionar campo para rastrear tópicos usados nas missões
-- Isso permite saber quais assuntos já foram designados
ALTER TABLE missoes ADD COLUMN IF NOT EXISTS assuntos_ids UUID[] DEFAULT '{}';

-- 2. Adicionar campo para subtipo de revisão (Parte 1, Parte 2, etc.)
ALTER TABLE missoes ADD COLUMN IF NOT EXISTS revisao_parte INTEGER DEFAULT NULL;

-- 3. Criar índice GIN para busca eficiente de tópicos usados
CREATE INDEX IF NOT EXISTS idx_missoes_assuntos_ids ON missoes USING GIN (assuntos_ids);

-- 4. Adicionar campo para status de montagem no preparatório
-- Isso permite saber se o preparatório está em processo de montagem manual
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS montagem_status TEXT DEFAULT 'pendente';

-- Adicionar constraint para valores válidos
DO $$
BEGIN
    -- Remove constraint se existir (para poder recriá-la)
    ALTER TABLE preparatorios DROP CONSTRAINT IF EXISTS preparatorios_montagem_status_check;

    -- Adiciona constraint
    ALTER TABLE preparatorios ADD CONSTRAINT preparatorios_montagem_status_check
        CHECK (montagem_status IN ('pendente', 'em_andamento', 'concluida'));
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 5. Adicionar campo materia_id para vincular missão à matéria do edital
ALTER TABLE missoes ADD COLUMN IF NOT EXISTS materia_id UUID REFERENCES preparatorio_materias(id) ON DELETE SET NULL;

-- Índice para buscar missões por matéria
CREATE INDEX IF NOT EXISTS idx_missoes_materia_id ON missoes(materia_id);

-- 6. Atualizar enum missao_tipo para incluir novos tipos
-- Primeiro, vamos verificar se os novos tipos já existem
DO $$
BEGIN
    -- Adicionar novos tipos ao enum se não existirem
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'estudo' AND enumtypid = 'missao_tipo'::regtype) THEN
        ALTER TYPE missao_tipo ADD VALUE 'estudo';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'tecnicas' AND enumtypid = 'missao_tipo'::regtype) THEN
        ALTER TYPE missao_tipo ADD VALUE 'tecnicas';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'simulado' AND enumtypid = 'missao_tipo'::regtype) THEN
        ALTER TYPE missao_tipo ADD VALUE 'simulado';
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN invalid_parameter_value THEN NULL;
END $$;

-- 7. Comentários para documentação
COMMENT ON COLUMN missoes.assuntos_ids IS 'Array de IDs de assuntos/tópicos vinculados a esta missão';
COMMENT ON COLUMN missoes.revisao_parte IS 'Número da parte para missões de revisão extras (1, 2, 3...)';
COMMENT ON COLUMN missoes.materia_id IS 'ID da matéria do edital verticalizado vinculada a esta missão';
COMMENT ON COLUMN preparatorios.montagem_status IS 'Status da montagem manual: pendente, em_andamento, concluida';

-- 8. Função para obter tópicos já usados em um preparatório
CREATE OR REPLACE FUNCTION get_topicos_usados(p_preparatorio_id UUID)
RETURNS UUID[] AS $$
DECLARE
    result UUID[] := '{}';
BEGIN
    SELECT COALESCE(array_agg(DISTINCT unnested), '{}')
    INTO result
    FROM (
        SELECT unnest(m.assuntos_ids) as unnested
        FROM missoes m
        INNER JOIN rodadas r ON m.rodada_id = r.id
        WHERE r.preparatorio_id = p_preparatorio_id
          AND m.assuntos_ids IS NOT NULL
          AND array_length(m.assuntos_ids, 1) > 0
    ) t;

    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- 9. View para facilitar consulta de matérias com contagem de tópicos disponíveis
CREATE OR REPLACE VIEW vw_materias_com_topicos_disponiveis AS
SELECT
    pm.id as materia_id,
    pm.preparatorio_id,
    pm.materia as materia_nome,
    pm.ordem,
    COUNT(a.id) as total_topicos,
    COUNT(a.id) FILTER (
        WHERE NOT (a.id = ANY(COALESCE(get_topicos_usados(pm.preparatorio_id), '{}')))
    ) as topicos_disponiveis
FROM preparatorio_materias pm
LEFT JOIN assuntos a ON a.materia_id = pm.id
GROUP BY pm.id, pm.preparatorio_id, pm.materia, pm.ordem
ORDER BY pm.ordem;

-- 10. Função para contar missões por matéria em uma rodada
CREATE OR REPLACE FUNCTION get_missoes_count_por_materia(p_rodada_id UUID)
RETURNS TABLE(materia_id UUID, count BIGINT) AS $$
BEGIN
    RETURN QUERY
    SELECT m.materia_id, COUNT(*)::BIGINT
    FROM missoes m
    WHERE m.rodada_id = p_rodada_id
      AND m.materia_id IS NOT NULL
    GROUP BY m.materia_id;
END;
$$ LANGUAGE plpgsql;

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';
