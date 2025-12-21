-- =====================================================
-- SYSTEM SETTINGS TABLE
-- =====================================================
-- Tabela para configuracoes do sistema

CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category TEXT NOT NULL, -- 'simulado', 'gamification', 'store', 'general', etc.
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(category, key)
);

-- RLS
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Allow read for authenticated users
CREATE POLICY "Anyone can read settings" ON public.system_settings
  FOR SELECT USING (true);

-- Insert default simulado settings
INSERT INTO public.system_settings (category, key, value, description) VALUES
  -- Simulado settings
  ('simulado', 'questions_per_simulado', '120', 'Quantidade padrao de questoes por simulado'),
  ('simulado', 'max_attempts', '-1', 'Quantidade maxima de tentativas (-1 = ilimitado)'),
  ('simulado', 'different_exams_per_user', '1', 'Quantidade de provas diferentes por usuario'),
  ('simulado', 'allow_chat', 'false', 'Permitir chat durante simulado'),
  ('simulado', 'time_limit_minutes', '180', 'Tempo limite em minutos'),
  ('simulado', 'show_answers_after', 'true', 'Mostrar respostas apos finalizar'),
  ('simulado', 'allow_review', 'true', 'Permitir revisar questoes antes de finalizar'),
  ('simulado', 'randomize_questions', 'true', 'Randomizar ordem das questoes'),
  ('simulado', 'randomize_options', 'true', 'Randomizar ordem das alternativas'),

  -- Gamification settings
  ('gamification', 'xp_per_correct_answer', '10', 'XP por resposta correta'),
  ('gamification', 'xp_per_mission_complete', '50', 'XP por missao completada'),
  ('gamification', 'coins_per_correct_answer', '5', 'Moedas por resposta correta'),
  ('gamification', 'streak_bonus_multiplier', '1.5', 'Multiplicador de bonus por ofensiva'),
  ('gamification', 'daily_goal_xp', '100', 'Meta diaria de XP padrao'),

  -- Store settings
  ('store', 'default_simulado_price_coins', '500', 'Preco padrao do simulado em moedas'),
  ('store', 'default_simulado_price_real', '29.90', 'Preco padrao do simulado em reais'),
  ('store', 'auto_create_simulado_product', 'true', 'Criar produto simulado automaticamente ao criar preparatorio'),

  -- General settings
  ('general', 'maintenance_mode', 'false', 'Modo de manutencao'),
  ('general', 'allow_new_registrations', 'true', 'Permitir novos cadastros'),
  ('general', 'require_email_verification', 'true', 'Exigir verificacao de email'),
  ('general', 'max_preparatorios_per_user', '5', 'Maximo de preparatorios por usuario'),

  -- Trail settings
  ('trail', 'questions_per_mission', '5', 'Questoes por missao'),
  ('trail', 'missions_per_round', '5', 'Missoes por rodada'),
  ('trail', 'min_score_to_pass', '70', 'Pontuacao minima para passar (%)'),
  ('trail', 'allow_retry', 'true', 'Permitir refazer missao'),
  ('trail', 'show_explanation', 'true', 'Mostrar explicacao das questoes')
ON CONFLICT (category, key) DO NOTHING;

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_system_settings_updated_at ON public.system_settings;
CREATE TRIGGER trigger_update_system_settings_updated_at
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();
