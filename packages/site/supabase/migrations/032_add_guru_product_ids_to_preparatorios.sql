-- ======================================
-- Migration: Adicionar campos de produtos por tipo e IDs da Guru
-- ======================================

-- Campos para o produto "Planejador"
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_planejador DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_planejador_desconto DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS checkout_planejador TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS guru_product_id_planejador TEXT;

-- Campos para o produto "8 Questoes" (Ouse Questoes)
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_8_questoes DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_8_questoes_desconto DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS checkout_8_questoes TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS guru_product_id_8_questoes TEXT;

-- Campos para o produto "Simulados"
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_simulados DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_simulados_desconto DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS checkout_simulados TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS guru_product_id_simulados TEXT;

-- Campos para o produto "Reta Final"
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_reta_final DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_reta_final_desconto DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS checkout_reta_final TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS guru_product_id_reta_final TEXT;

-- Campos para o produto "Plataforma Completa"
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_plataforma_completa DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_plataforma_completa_desconto DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS checkout_plataforma_completa TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS guru_product_id_plataforma_completa TEXT;

-- Comentarios para documentacao
COMMENT ON COLUMN preparatorios.guru_product_id_planejador IS 'ID do produto na plataforma Guru para Planejador';
COMMENT ON COLUMN preparatorios.guru_product_id_8_questoes IS 'ID do produto na plataforma Guru para Ouse Questoes';
COMMENT ON COLUMN preparatorios.guru_product_id_simulados IS 'ID do produto na plataforma Guru para Simulados';
COMMENT ON COLUMN preparatorios.guru_product_id_reta_final IS 'ID do produto na plataforma Guru para Reta Final';
COMMENT ON COLUMN preparatorios.guru_product_id_plataforma_completa IS 'ID do produto na plataforma Guru para Plataforma Completa';

-- Indice para busca rapida pelo ID do produto Guru
CREATE INDEX IF NOT EXISTS idx_preparatorios_guru_planejador ON preparatorios(guru_product_id_planejador) WHERE guru_product_id_planejador IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_preparatorios_guru_8_questoes ON preparatorios(guru_product_id_8_questoes) WHERE guru_product_id_8_questoes IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_preparatorios_guru_simulados ON preparatorios(guru_product_id_simulados) WHERE guru_product_id_simulados IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_preparatorios_guru_reta_final ON preparatorios(guru_product_id_reta_final) WHERE guru_product_id_reta_final IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_preparatorios_guru_plataforma_completa ON preparatorios(guru_product_id_plataforma_completa) WHERE guru_product_id_plataforma_completa IS NOT NULL;
