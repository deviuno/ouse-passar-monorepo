-- ============================================
-- SISTEMA DE INDICACAO E AFILIADOS
-- ============================================

-- 0. Habilitar extensao unaccent (para remover acentos do username)
CREATE EXTENSION IF NOT EXISTS unaccent;

-- 1. Adicionar campo username em user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS username VARCHAR(50) UNIQUE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles(username);

-- 2. Adicionar campos de pontos e comissoes em user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS referral_points INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_referrals INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_commissions DECIMAL(10,2) DEFAULT 0;

-- 3. Funcao para gerar username unico
CREATE OR REPLACE FUNCTION generate_username(p_name TEXT, p_user_id UUID)
RETURNS TEXT AS $$
DECLARE
  v_base_username TEXT;
  v_username TEXT;
  v_counter INT := 0;
BEGIN
  -- Remove acentos e caracteres especiais
  v_base_username := lower(unaccent(COALESCE(p_name, 'user')));
  v_base_username := regexp_replace(v_base_username, '[^a-z0-9]', '', 'g');
  v_base_username := left(v_base_username, 40);

  -- Se ficou vazio, usa 'user'
  IF v_base_username = '' THEN
    v_base_username := 'user';
  END IF;

  v_username := v_base_username;

  -- Verifica unicidade e adiciona numero se necessario
  WHILE EXISTS (SELECT 1 FROM user_profiles WHERE username = v_username AND id != p_user_id) LOOP
    v_counter := v_counter + 1;
    v_username := v_base_username || v_counter::TEXT;
  END LOOP;

  RETURN v_username;
END;
$$ LANGUAGE plpgsql;

-- 4. Tabela de indicacoes
CREATE TABLE IF NOT EXISTS referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  referred_at TIMESTAMPTZ DEFAULT NOW(),
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'rewarded')),
  points_earned INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(referred_id)
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON referrals(status);

-- 5. Tabela de tracking de visitas
CREATE TABLE IF NOT EXISTS referral_tracking (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_username VARCHAR(50) NOT NULL,
  session_id TEXT,
  landing_page TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  converted_at TIMESTAMPTZ,
  converted_user_id UUID REFERENCES auth.users(id)
);

-- 6. Catalogo de recompensas
CREATE TABLE IF NOT EXISTS referral_reward_catalog (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  description TEXT,
  type VARCHAR(30) NOT NULL CHECK (type IN ('battery', 'product', 'discount', 'cash')),
  points_required INT NOT NULL,
  reward_value JSONB NOT NULL DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  sort_order INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Tabela de resgates
CREATE TABLE IF NOT EXISTS referral_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id),
  reward_id UUID NOT NULL REFERENCES referral_reward_catalog(id),
  points_spent INT NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- 8. Tabela de comissoes de afiliados
CREATE TABLE IF NOT EXISTS affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_id UUID NOT NULL REFERENCES auth.users(id),
  referred_id UUID NOT NULL REFERENCES auth.users(id),
  transaction_id UUID REFERENCES guru_transactions(id),
  sale_amount DECIMAL(10,2) NOT NULL,
  commission_rate DECIMAL(5,2) NOT NULL,
  commission_amount DECIMAL(10,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_affiliate ON affiliate_commissions(affiliate_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_commissions_status ON affiliate_commissions(status);

-- 9. Adicionar bateria bonus em user_trails
ALTER TABLE user_trails
ADD COLUMN IF NOT EXISTS bonus_battery INT DEFAULT 0;

-- 10. Funcao para adicionar bateria bonus
CREATE OR REPLACE FUNCTION add_bonus_battery(
  p_user_id UUID,
  p_preparatorio_id UUID,
  p_amount INT
)
RETURNS void AS $$
BEGIN
  UPDATE user_trails
  SET bonus_battery = COALESCE(bonus_battery, 0) + p_amount
  WHERE user_id = p_user_id AND preparatorio_id = p_preparatorio_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Funcao para criar indicacao
CREATE OR REPLACE FUNCTION create_referral(
  p_referrer_username TEXT,
  p_referred_id UUID
)
RETURNS UUID AS $$
DECLARE
  v_referrer_id UUID;
  v_referral_id UUID;
BEGIN
  -- Buscar ID do indicador pelo username
  SELECT id INTO v_referrer_id
  FROM user_profiles
  WHERE username = lower(p_referrer_username);

  IF v_referrer_id IS NULL THEN
    RETURN NULL;
  END IF;

  -- Verificar se ja existe indicacao
  IF EXISTS (SELECT 1 FROM referrals WHERE referred_id = p_referred_id) THEN
    RETURN NULL;
  END IF;

  -- Criar indicacao
  INSERT INTO referrals (referrer_id, referred_id, status)
  VALUES (v_referrer_id, p_referred_id, 'pending')
  RETURNING id INTO v_referral_id;

  RETURN v_referral_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Funcao para confirmar indicacao e dar recompensas
CREATE OR REPLACE FUNCTION confirm_referral(p_referred_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_referral RECORD;
  v_points_per_referral INT;
  v_battery_per_referral INT;
BEGIN
  -- Buscar indicacao pendente
  SELECT * INTO v_referral
  FROM referrals
  WHERE referred_id = p_referred_id AND status = 'pending';

  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;

  -- Buscar configuracoes
  SELECT COALESCE(
    (SELECT value::INT FROM system_settings WHERE category = 'affiliates' AND key = 'points_per_referral'),
    100
  ) INTO v_points_per_referral;

  SELECT COALESCE(
    (SELECT value::INT FROM system_settings WHERE category = 'affiliates' AND key = 'battery_reward_per_referral'),
    10
  ) INTO v_battery_per_referral;

  -- Atualizar indicacao
  UPDATE referrals
  SET status = 'confirmed',
      points_earned = v_points_per_referral
  WHERE id = v_referral.id;

  -- Dar pontos ao indicador
  UPDATE user_profiles
  SET referral_points = COALESCE(referral_points, 0) + v_points_per_referral,
      total_referrals = COALESCE(total_referrals, 0) + 1,
      updated_at = NOW()
  WHERE id = v_referral.referrer_id;

  -- Dar bateria bonus ao indicador (para todos os preparatorios dele)
  UPDATE user_trails
  SET bonus_battery = COALESCE(bonus_battery, 0) + v_battery_per_referral
  WHERE user_id = v_referral.referrer_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. Funcao para incrementar comissao de afiliado
CREATE OR REPLACE FUNCTION increment_affiliate_commission(
  p_affiliate_id UUID,
  p_amount DECIMAL(10,2)
)
RETURNS void AS $$
BEGIN
  UPDATE user_profiles
  SET total_commissions = COALESCE(total_commissions, 0) + p_amount,
      updated_at = NOW()
  WHERE id = p_affiliate_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 14. Funcao para cancelar comissao (reembolsos)
CREATE OR REPLACE FUNCTION cancel_affiliate_commission(p_transaction_id UUID)
RETURNS void AS $$
DECLARE
  v_commission RECORD;
BEGIN
  SELECT * INTO v_commission
  FROM affiliate_commissions
  WHERE transaction_id = p_transaction_id
    AND status IN ('pending', 'approved')
  LIMIT 1;

  IF FOUND THEN
    UPDATE affiliate_commissions
    SET status = 'cancelled',
        updated_at = NOW()
    WHERE id = v_commission.id;

    UPDATE user_profiles
    SET total_commissions = GREATEST(0, COALESCE(total_commissions, 0) - v_commission.commission_amount),
        updated_at = NOW()
    WHERE id = v_commission.affiliate_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 15. Configuracoes de afiliados em system_settings
INSERT INTO system_settings (category, key, value, description) VALUES
  ('affiliates', 'is_enabled', 'true', 'Sistema de afiliados ativo'),
  ('affiliates', 'points_per_referral', '100', 'Pontos ganhos por indicacao confirmada'),
  ('affiliates', 'commission_rate', '10', 'Porcentagem de comissao sobre vendas (%)'),
  ('affiliates', 'min_withdrawal', '50', 'Valor minimo para saque de comissoes (R$)'),
  ('affiliates', 'battery_reward_per_referral', '10', 'Bateria bonus por indicacao')
ON CONFLICT (category, key) DO NOTHING;

-- 16. Recompensas iniciais no catalogo
INSERT INTO referral_reward_catalog (name, description, type, points_required, reward_value, sort_order) VALUES
  ('Bateria Extra', 'Ganhe 5 baterias extras para responder mais questoes', 'battery', 50, '{"battery_amount": 5}', 1),
  ('Super Bateria', 'Ganhe 15 baterias extras para responder mais questoes', 'battery', 120, '{"battery_amount": 15}', 2),
  ('Mega Bateria', 'Ganhe 30 baterias extras para responder mais questoes', 'battery', 200, '{"battery_amount": 30}', 3)
ON CONFLICT DO NOTHING;

-- 17. RLS Policies
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_reward_catalog ENABLE ROW LEVEL SECURITY;
ALTER TABLE referral_redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_commissions ENABLE ROW LEVEL SECURITY;

-- Usuarios podem ver suas proprias indicacoes
CREATE POLICY "Users can view own referrals" ON referrals
  FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- Usuarios podem ver catalogo de recompensas ativo
CREATE POLICY "Anyone can view active rewards" ON referral_reward_catalog
  FOR SELECT USING (is_active = true);

-- Usuarios podem ver seus proprios resgates
CREATE POLICY "Users can view own redemptions" ON referral_redemptions
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own redemptions" ON referral_redemptions
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usuarios podem ver suas proprias comissoes
CREATE POLICY "Users can view own commissions" ON affiliate_commissions
  FOR SELECT USING (auth.uid() = affiliate_id);
