-- ============================================================================
-- Renomear campo checkout_8_questoes para checkout_ouse_questoes
-- ============================================================================

ALTER TABLE preparatorios
RENAME COLUMN checkout_8_questoes TO checkout_ouse_questoes;
