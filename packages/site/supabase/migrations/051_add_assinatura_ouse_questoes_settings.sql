-- Migration: Adicionar configurações da Assinatura Ouse Questões
-- A assinatura Ouse Questões é uma assinatura anual da plataforma que dá acesso
-- ao módulo "Praticar Questões" (não é vinculada a um preparatório específico)

-- Configurações da assinatura na aba Geral
INSERT INTO system_settings (category, key, value, description) VALUES
-- Preço
('assinatura', 'assinatura_preco', '"97.00"', 'Preço da assinatura anual Ouse Questões em R$'),
('assinatura', 'assinatura_preco_desconto', '"0"', 'Preço com desconto (0 = sem desconto)'),
-- Duração
('assinatura', 'assinatura_duracao_meses', '12', 'Duração da assinatura em meses (padrão: 12)'),
-- Checkout
('assinatura', 'assinatura_checkout_url', '""', 'URL de checkout do Guru para a assinatura'),
('assinatura', 'assinatura_guru_product_id', '""', 'ID do produto no Guru Manager')
ON CONFLICT (category, key) DO NOTHING;

-- Adicionar comentários
COMMENT ON TABLE system_settings IS 'Configurações globais do sistema, incluindo gamificação, bateria, módulos e assinatura';
