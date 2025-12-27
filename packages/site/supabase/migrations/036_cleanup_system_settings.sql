-- ============================================================================
-- LIMPEZA DE CONFIGURAÇÕES NÃO UTILIZADAS
-- Remove configurações obsoletas do system_settings
-- ============================================================================

-- 1. Remover configurações de "general" que não são usadas no app
DELETE FROM public.system_settings
WHERE category = 'general'
  AND key IN ('allow_new_registrations', 'require_email_verification');

-- 2. Remover categoria "gamification" duplicada
-- (O sistema usa a tabela gamification_settings ao invés de system_settings)
DELETE FROM public.system_settings
WHERE category = 'gamification';

-- Confirmação
DO $$
BEGIN
  RAISE NOTICE 'Limpeza concluída:';
  RAISE NOTICE '- Removidas configurações general não utilizadas (allow_new_registrations, require_email_verification)';
  RAISE NOTICE '- Removida categoria gamification duplicada (usa tabela separada gamification_settings)';
END $$;
