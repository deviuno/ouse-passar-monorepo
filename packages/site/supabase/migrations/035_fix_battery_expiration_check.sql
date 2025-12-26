-- ============================================================================
-- CORRIGIR VERIFICAÇÃO DE EXPIRAÇÃO DA BATERIA ILIMITADA
-- A bateria ilimitada dura 12 meses a partir da compra
-- ============================================================================

-- 1. Adicionar configuração de duração padrão (12 meses)
INSERT INTO public.system_settings (category, key, value, description) VALUES
  ('battery', 'unlimited_duration_months', '12', 'Duração da bateria ilimitada em meses')
ON CONFLICT (category, key) DO NOTHING;

-- 2. Função auxiliar para verificar se bateria ilimitada expirou
CREATE OR REPLACE FUNCTION check_unlimited_battery_expired(
  p_has_unlimited BOOLEAN,
  p_expires_at TIMESTAMPTZ
)
RETURNS BOOLEAN AS $$
BEGIN
  -- Se não tem bateria ilimitada, retorna false
  IF NOT COALESCE(p_has_unlimited, false) THEN
    RETURN false;
  END IF;

  -- Se não tem data de expiração, considera não expirado (legacy)
  IF p_expires_at IS NULL THEN
    RETURN false;
  END IF;

  -- Verifica se expirou
  RETURN p_expires_at < NOW();
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- 3. Atualizar get_user_battery_status para verificar expiração
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
  v_is_premium BOOLEAN;
  v_expired BOOLEAN;
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

  -- Verificar se bateria ilimitada expirou
  v_expired := check_unlimited_battery_expired(
    v_trail.has_unlimited_battery,
    v_trail.unlimited_battery_expires_at
  );

  -- Se expirou, revogar bateria ilimitada
  IF v_expired THEN
    UPDATE user_trails
    SET has_unlimited_battery = false
    WHERE user_id = p_user_id
      AND preparatorio_id = p_preparatorio_id;

    v_trail.has_unlimited_battery := false;
  END IF;

  -- Determinar se é premium (bateria ilimitada válida)
  v_is_premium := COALESCE(v_trail.has_unlimited_battery, false) AND NOT v_expired;

  -- Verificar se precisa recarregar (novo dia)
  v_needs_recharge := v_trail.battery_last_recharge < CURRENT_DATE;
  v_battery_current := v_trail.battery_current;

  -- Se precisa recarregar e nao tem bateria ilimitada, recarregar
  IF v_needs_recharge AND NOT v_is_premium THEN
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
    'is_premium', v_is_premium,
    'has_unlimited_battery', v_is_premium,
    'unlimited_expires_at', v_trail.unlimited_battery_expires_at,
    'preparatorios_count', v_preps_count,
    'max_preparatorios_free', COALESCE((v_settings->>'max_preparatorios_free')::INTEGER, 1),
    'settings', v_settings
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Atualizar consume_battery para verificar expiração
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
  v_is_premium BOOLEAN;
  v_expired BOOLEAN;
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

  -- Verificar se bateria ilimitada expirou
  v_expired := check_unlimited_battery_expired(
    v_trail.has_unlimited_battery,
    v_trail.unlimited_battery_expires_at
  );

  -- Se expirou, revogar bateria ilimitada
  IF v_expired THEN
    UPDATE user_trails
    SET has_unlimited_battery = false
    WHERE user_id = p_user_id
      AND preparatorio_id = p_preparatorio_id;
  END IF;

  -- Determinar se é premium (bateria ilimitada válida)
  v_is_premium := COALESCE(v_trail.has_unlimited_battery, false) AND NOT v_expired;

  -- Usuario premium nao consome bateria
  IF v_is_premium THEN
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
      'cost', v_cost
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

-- 5. Atualizar grant_unlimited_battery para usar 12 meses por padrão
CREATE OR REPLACE FUNCTION grant_unlimited_battery(
  p_user_id UUID,
  p_preparatorio_id UUID,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS JSONB AS $$
DECLARE
  v_settings JSONB;
  v_duration_months INTEGER;
  v_expires_at TIMESTAMPTZ;
BEGIN
  -- Buscar configurações para duração padrão
  v_settings := get_battery_settings();
  v_duration_months := COALESCE((v_settings->>'unlimited_duration_months')::INTEGER, 12);

  -- Usar data fornecida ou calcular 12 meses a partir de agora
  v_expires_at := COALESCE(p_expires_at, NOW() + (v_duration_months || ' months')::INTERVAL);

  UPDATE user_trails
  SET has_unlimited_battery = true,
      unlimited_battery_expires_at = v_expires_at,
      battery_current = 9999 -- Dar energia "infinita"
  WHERE user_id = p_user_id
    AND preparatorio_id = p_preparatorio_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'user_trail_not_found');
  END IF;

  -- Registrar no historico
  INSERT INTO battery_history (user_id, preparatorio_id, action_type, cost, battery_before, battery_after, context)
  VALUES (p_user_id, p_preparatorio_id, 'admin_recharge', 0, 0, 9999,
          jsonb_build_object('granted_unlimited', true, 'expires_at', v_expires_at, 'duration_months', v_duration_months));

  RETURN jsonb_build_object(
    'success', true,
    'expires_at', v_expires_at,
    'duration_months', v_duration_months
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Atualizar check_can_add_preparatorio para verificar expiração
CREATE OR REPLACE FUNCTION check_can_add_preparatorio(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_settings JSONB;
  v_current_count INTEGER;
  v_max_allowed INTEGER;
  v_has_valid_premium BOOLEAN;
BEGIN
  -- Buscar configuracoes
  v_settings := get_battery_settings();
  v_max_allowed := COALESCE((v_settings->>'max_preparatorios_free')::INTEGER, 1);

  -- Verificar se tem algum preparatorio com bateria ilimitada VÁLIDA (não expirada)
  SELECT EXISTS (
    SELECT 1 FROM user_trails
    WHERE user_id = p_user_id
      AND has_unlimited_battery = true
      AND (unlimited_battery_expires_at IS NULL OR unlimited_battery_expires_at > NOW())
  ) INTO v_has_valid_premium;

  -- Premium pode adicionar ilimitado
  IF v_has_valid_premium THEN
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
    'max_allowed', v_max_allowed
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
