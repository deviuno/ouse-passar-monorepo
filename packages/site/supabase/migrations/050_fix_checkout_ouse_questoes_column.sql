-- ============================================================================
-- Fix: Garantir que a coluna checkout_ouse_questoes existe
-- Corrige situação onde checkout_8_questoes pode existir ou não
-- ============================================================================

-- Se a coluna checkout_8_questoes existir, renomear para checkout_ouse_questoes
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'preparatorios'
        AND column_name = 'checkout_8_questoes'
    ) THEN
        ALTER TABLE preparatorios RENAME COLUMN checkout_8_questoes TO checkout_ouse_questoes;
        RAISE NOTICE 'Coluna checkout_8_questoes renomeada para checkout_ouse_questoes';
    END IF;
END $$;

-- Se a coluna checkout_ouse_questoes não existir, criar
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS checkout_ouse_questoes TEXT;

-- Garantir que as outras colunas de checkout também existem
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_8_questoes DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_8_questoes_desconto DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS guru_product_id_8_questoes TEXT;

-- Comentário
COMMENT ON COLUMN preparatorios.checkout_ouse_questoes IS 'URL de checkout para Ouse Questões (bateria ilimitada)';
