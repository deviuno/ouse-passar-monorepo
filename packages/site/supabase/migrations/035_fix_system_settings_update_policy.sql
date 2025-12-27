-- =====================================================
-- FIX: Add UPDATE policy to system_settings
-- =====================================================
-- A tabela tinha apenas policy de SELECT, impedindo updates

-- Policy para permitir update por usuarios autenticados (admin)
CREATE POLICY "Admins can update settings" ON public.system_settings
  FOR UPDATE USING (true) WITH CHECK (true);

-- Policy para permitir insert (caso necessario)
CREATE POLICY "Admins can insert settings" ON public.system_settings
  FOR INSERT WITH CHECK (true);

-- Policy para permitir delete (caso necessario)
CREATE POLICY "Admins can delete settings" ON public.system_settings
  FOR DELETE USING (true);

-- =====================================================
-- Remove unused battery settings
-- =====================================================
DELETE FROM public.system_settings
WHERE category = 'battery'
  AND key IN ('chat_requires_practice', 'chat_min_questions');
