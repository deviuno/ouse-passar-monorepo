-- ============================================================================
-- ATUALIZAR CHECK CONSTRAINT PARA INCLUIR NOVOS TIPOS DE AÇÃO DO CHAT
-- ============================================================================

-- Remover constraint antigo (se existir)
ALTER TABLE battery_history DROP CONSTRAINT IF EXISTS battery_history_action_type_check;

-- Adicionar novo constraint com todos os tipos de ação
ALTER TABLE battery_history ADD CONSTRAINT battery_history_action_type_check
CHECK (action_type IN (
  'question',
  'mission_start',
  'chat_message',
  'chat_audio',
  'chat_podcast',
  'chat_summary',
  'notebook_create',
  'practice_session',
  'recharge',
  'admin_recharge'
));
