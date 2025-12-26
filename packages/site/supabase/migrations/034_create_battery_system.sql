-- ============================================================================
-- SISTEMA DE BATERIA PARA USUARIOS GRATUITOS
-- Bateria e POR PREPARATORIO - cada preparatorio tem sua propria bateria
-- ============================================================================

-- 1. Adicionar campos de bateria na tabela user_trails
ALTER TABLE user_trails
ADD COLUMN IF NOT EXISTS battery_current INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS battery_last_recharge DATE DEFAULT CURRENT_DATE,
ADD COLUMN IF NOT EXISTS has_unlimited_battery BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS unlimited_battery_expires_at TIMESTAMPTZ;

-- 2. Criar tabela de historico de bateria
CREATE TABLE IF NOT EXISTS battery_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preparatorio_id UUID NOT NULL REFERENCES preparatorios(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL,
  cost INTEGER NOT NULL DEFAULT 0,
  battery_before INTEGER NOT NULL,
  battery_after INTEGER NOT NULL,
  context JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indices para performance
CREATE INDEX IF NOT EXISTS idx_battery_history_user ON battery_history(user_id);
CREATE INDEX IF NOT EXISTS idx_battery_history_prep ON battery_history(preparatorio_id);
CREATE INDEX IF NOT EXISTS idx_battery_history_created ON battery_history(created_at);

-- 3. Inserir configuracoes de bateria na system_settings
INSERT INTO public.system_settings (category, key, value, description) VALUES
  ('battery', 'is_enabled', 'true', 'Habilitar sistema de bateria'),
  ('battery', 'max_battery', '100', 'Capacidade maxima da bateria'),
  ('battery', 'daily_recharge', '100', 'Quantidade recarregada diariamente'),
  ('battery', 'recharge_hour', '0', 'Hora da recarga (0-23)'),
  ('battery', 'cost_per_question', '2', 'Custo por questao respondida'),
  ('battery', 'cost_per_mission_start', '5', 'Custo por missao iniciada'),
  ('battery', 'cost_per_chat_message', '3', 'Custo por mensagem no chat'),
  ('battery', 'cost_per_notebook_create', '10', 'Custo por caderno criado'),
  ('battery', 'cost_per_practice_session', '5', 'Custo por sessao de pratica'),
  ('battery', 'max_preparatorios_free', '1', 'Maximo de preparatorios para usuarios gratuitos'),
  ('battery', 'chat_enabled_free', 'true', 'Chat habilitado para usuarios gratuitos'),
  ('battery', 'chat_requires_practice', 'true', 'Chat requer pratica primeiro'),
  ('battery', 'chat_min_questions', '10', 'Minimo de questoes para liberar chat'),
  ('battery', 'notebooks_enabled_free', 'true', 'Cadernos habilitados para usuarios gratuitos'),
  ('battery', 'notebooks_max_free', '3', 'Maximo de cadernos para usuarios gratuitos'),
  ('battery', 'practice_enabled_free', 'true', 'Pagina praticar habilitada para usuarios gratuitos'),
  ('battery', 'unlimited_checkout_url', 'null', 'URL de checkout para comprar bateria ilimitada'),
  ('battery', 'unlimited_price', '97', 'Preco da bateria ilimitada em reais')
ON CONFLICT (category, key) DO NOTHING;

-- 4. Funcao para buscar configuracoes de bateria
CREATE OR REPLACE FUNCTION get_battery_settings()
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT jsonb_object_agg(key, value)
  INTO result
  FROM public.system_settings
  WHERE category = 'battery';

  RETURN COALESCE(result, '{}'::JSONB);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Funcao para buscar status da bateria do usuario para um preparatorio
CREATE OR REPLACE FUNCTION get_user_battery_status(
  p_user_id UUID,
  p_preparatorio_id UUID
)
RETURNS JSONB AS $$
DECLARE
  v_trail RECORD;
  v_settings JSONB;
  v_preps_count INTEGER;
  v_needs_recharge BOOLEAN;
  v_battery_current INTEGER;
BEGIN
  -- Buscar configuracoes
  v_settings := get_battery_settings();

  -- Buscar trail do usuario
  SELECT * INTO v_trail
  FROM user_trails
  WHERE user_id = p_user_id
    AND preparatorio_id = p_preparatorio_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('error', 'user_trail_not_found');
  END IF;

  -- Verificar se precisa recarregar (novo dia)
  v_needs_recharge := v_trail.battery_last_recharge < CURRENT_DATE;
  v_battery_current := v_trail.battery_current;

  -- Se precisa recarregar e nao tem bateria ilimitada, recarregar
  IF v_needs_recharge AND NOT COALESCE(v_trail.has_unlimited_battery, false) THEN
    v_battery_current := COALESCE((v_settings->>'daily_recharge')::INTEGER, 100);

    UPDATE user_trails
    SET battery_current = v_battery_current,
        battery_last_recharge = CURRENT_DATE
    WHERE user_id = p_user_id
      AND preparatorio_id = p_preparatorio_id;
  END IF;

  -- Contar preparatorios do usuario
  SELECT COUNT(*) INTO v_preps_count
  FROM user_trails
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'battery_current', v_battery_current,
    'battery_max', COALESCE((v_settings->>'max_battery')::INTEGER, 100),
    'last_recharge', v_trail.battery_last_recharge,
    'needs_recharge', v_needs_recharge,
    'is_premium', COALESCE(v_trail.has_unlimited_battery, false),
    'has_unlimited_battery', COALESCE(v_trail.has_unlimited_battery, false),
    'unlimited_expires_at', v_trail.unlimited_battery_expires_at,
    'preparatorios_count', v_preps_count,
    'max_preparatorios_free', COALESCE((v_settings->>'max_preparatorios_free')::INTEGER, 1),
    'settings', v_settings
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Funcao para consumir bateria
CREATE OR REPLACE FUNCTION consume_battery(
  p_user_id UUID,
  p_preparatorio_id UUID,
  p_action_type VARCHAR(50),
  p_context JSONB DEFAULT '{}'
)
RETURNS JSONB AS $$
DECLARE
  v_trail RECORD;
  v_settings JSONB;
  v_cost INTEGER;
  v_battery_before INTEGER;
  v_battery_after INTEGER;
  v_cost_key VARCHAR(100);
BEGIN
  -- Buscar configuracoes
  v_settings := get_battery_settings();

  -- Buscar trail do usuario
  SELECT * INTO v_trail
  FROM user_trails
  WHERE user_id = p_user_id
    AND preparatorio_id = p_preparatorio_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_trail_not_found');
  END IF;

  -- Usuario premium nao consome bateria
  IF COALESCE(v_trail.has_unlimited_battery, false) THEN
    RETURN jsonb_build_object(
      'success', true,
      'is_premium', true,
      'battery_current', v_trail.battery_current
    );
  END IF;

  -- Determinar custo baseado no tipo de acao
  v_cost_key := 'cost_per_' || p_action_type;
  v_cost := COALESCE((v_settings->>v_cost_key)::INTEGER, 0);

  -- Se acao desconhecida, custo zero
  IF v_cost = 0 THEN
    v_cost := 1; -- Custo minimo padrao
  END IF;

  v_battery_before := v_trail.battery_current;

  -- Verificar se tem energia suficiente
  IF v_battery_before < v_cost THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'insufficient_battery',
      'battery_current', v_battery_before,
      'cost', v_cost,
      'checkout_url', v_settings->>'unlimited_checkout_url'
    );
  END IF;

  -- Consumir bateria
  v_battery_after := v_battery_before - v_cost;

  UPDATE user_trails
  SET battery_current = v_battery_after
  WHERE user_id = p_user_id
    AND preparatorio_id = p_preparatorio_id;

  -- Registrar no historico
  INSERT INTO battery_history (user_id, preparatorio_id, action_type, cost, battery_before, battery_after, context)
  VALUES (p_user_id, p_preparatorio_id, p_action_type, v_cost, v_battery_before, v_battery_after, p_context);

  RETURN jsonb_build_object(
    'success', true,
    'is_premium', false,
    'battery_before', v_battery_before,
    'battery_after', v_battery_after,
    'battery_current', v_battery_after,
    'cost', v_cost
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. Funcao para verificar se pode adicionar mais preparatorios
CREATE OR REPLACE FUNCTION check_can_add_preparatorio(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_settings JSONB;
  v_current_count INTEGER;
  v_max_allowed INTEGER;
  v_has_premium BOOLEAN;
BEGIN
  -- Buscar configuracoes
  v_settings := get_battery_settings();
  v_max_allowed := COALESCE((v_settings->>'max_preparatorios_free')::INTEGER, 1);

  -- Verificar se tem algum preparatorio com bateria ilimitada
  SELECT EXISTS (
    SELECT 1 FROM user_trails
    WHERE user_id = p_user_id
      AND has_unlimited_battery = true
  ) INTO v_has_premium;

  -- Premium pode adicionar ilimitado
  IF v_has_premium THEN
    RETURN jsonb_build_object(
      'can_add', true,
      'is_premium', true
    );
  END IF;

  -- Contar preparatorios atuais
  SELECT COUNT(*) INTO v_current_count
  FROM user_trails
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'can_add', v_current_count < v_max_allowed,
    'is_premium', false,
    'current_count', v_current_count,
    'max_allowed', v_max_allowed,
    'checkout_url', v_settings->>'unlimited_checkout_url'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Funcao para conceder bateria ilimitada
CREATE OR REPLACE FUNCTION grant_unlimited_battery(
  p_user_id UUID,
  p_preparatorio_id UUID,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
BEGIN
  UPDATE user_trails
  SET has_unlimited_battery = true,
      unlimited_battery_expires_at = p_expires_at
  WHERE user_id = p_user_id
    AND preparatorio_id = p_preparatorio_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_trail_not_found');
  END IF;

  -- Registrar no historico
  INSERT INTO battery_history (user_id, preparatorio_id, action_type, cost, battery_before, battery_after, context)
  VALUES (p_user_id, p_preparatorio_id, 'admin_recharge', 0, 0, 9999,
          jsonb_build_object('granted_unlimited', true, 'expires_at', p_expires_at));

  RETURN jsonb_build_object('success', true);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Funcao para recarregar todas as baterias (para cron job)
CREATE OR REPLACE FUNCTION recharge_all_batteries()
RETURNS INTEGER AS $$
DECLARE
  v_settings JSONB;
  v_daily_recharge INTEGER;
  v_count INTEGER;
BEGIN
  v_settings := get_battery_settings();
  v_daily_recharge := COALESCE((v_settings->>'daily_recharge')::INTEGER, 100);

  -- Recarregar apenas usuarios que nao sao premium e nao recarregaram hoje
  UPDATE user_trails
  SET battery_current = v_daily_recharge,
      battery_last_recharge = CURRENT_DATE
  WHERE battery_last_recharge < CURRENT_DATE
    AND (has_unlimited_battery = false OR has_unlimited_battery IS NULL);

  GET DIAGNOSTICS v_count = ROW_COUNT;

  RETURN v_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. RLS policies para battery_history
ALTER TABLE battery_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own battery history" ON battery_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert battery history" ON battery_history
  FOR INSERT WITH CHECK (true);
