-- Migration: Add module blocking settings
-- Allows admin to enable/disable app modules and configure their behavior when blocked

-- Insert module settings into system_settings table
INSERT INTO system_settings (category, key, value, description) VALUES
-- Trilha (Home)
('modules', 'trilha_enabled', 'true', 'Habilita/desabilita acesso ao módulo Minhas Trilhas'),
('modules', 'trilha_block_behavior', '"disabled"', 'Comportamento quando bloqueado: hidden, disabled, modal'),

-- Praticar Questões
('modules', 'praticar_enabled', 'true', 'Habilita/desabilita acesso ao módulo Praticar Questões'),
('modules', 'praticar_block_behavior', '"disabled"', 'Comportamento quando bloqueado: hidden, disabled, modal'),

-- Simulados
('modules', 'simulados_enabled', 'true', 'Habilita/desabilita acesso ao módulo Simulados'),
('modules', 'simulados_block_behavior', '"disabled"', 'Comportamento quando bloqueado: hidden, disabled, modal'),

-- Estatísticas
('modules', 'estatisticas_enabled', 'true', 'Habilita/desabilita acesso ao módulo Estatísticas'),
('modules', 'estatisticas_block_behavior', '"disabled"', 'Comportamento quando bloqueado: hidden, disabled, modal'),

-- Loja
('modules', 'loja_enabled', 'true', 'Habilita/desabilita acesso ao módulo Loja'),
('modules', 'loja_block_behavior', '"disabled"', 'Comportamento quando bloqueado: hidden, disabled, modal')

ON CONFLICT (category, key) DO NOTHING;
