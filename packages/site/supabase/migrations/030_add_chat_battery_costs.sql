-- ============================================================================
-- ADICIONAR CUSTOS DE BATERIA PARA FUNCIONALIDADES DO CHAT
-- ============================================================================

-- Inserir novas configurações de custo de bateria para o chat
INSERT INTO public.system_settings (category, key, value, description) VALUES
  ('battery', 'cost_per_chat_audio', '5', 'Custo por gerar áudio no chat'),
  ('battery', 'cost_per_chat_podcast', '10', 'Custo por gerar podcast no chat'),
  ('battery', 'cost_per_chat_summary', '5', 'Custo por gerar resumo rápido no chat')
ON CONFLICT (category, key) DO NOTHING;
