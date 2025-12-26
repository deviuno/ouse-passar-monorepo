-- =====================================================
-- GURU INTEGRATION TABLES
-- Tabelas para integração com Digital Manager Guru
-- =====================================================

-- Tipos de produto
CREATE TYPE product_type AS ENUM (
  'planejador',
  '8_questoes',
  'simulados',
  'reta_final',
  'plataforma_completa'
);

-- Status do acesso ao produto
CREATE TYPE product_access_status AS ENUM (
  'active',      -- Acesso ativo
  'canceled',    -- Cancelado pelo usuário
  'refunded',    -- Reembolsado
  'chargeback',  -- Chargeback
  'expired',     -- Expirado (para assinaturas)
  'pending'      -- Aguardando confirmação
);

-- =====================================================
-- TABELA: user_products
-- Armazena os produtos que cada usuário tem acesso
-- =====================================================
CREATE TABLE IF NOT EXISTS user_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  preparatorio_id UUID NOT NULL REFERENCES preparatorios(id) ON DELETE CASCADE,
  product_type product_type NOT NULL,

  -- Status e datas
  status product_access_status NOT NULL DEFAULT 'pending',
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  revoked_at TIMESTAMPTZ,

  -- Dados da Guru
  guru_transaction_id TEXT,
  guru_subscription_id TEXT,
  guru_product_id TEXT,

  -- Metadados
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Índices únicos
  UNIQUE(user_id, preparatorio_id, product_type)
);

-- =====================================================
-- TABELA: guru_transactions
-- Log de todas as transações recebidas da Guru
-- =====================================================
CREATE TABLE IF NOT EXISTS guru_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificadores Guru
  guru_transaction_id TEXT NOT NULL,
  guru_product_id TEXT,
  guru_subscription_id TEXT,

  -- Evento
  event_type TEXT NOT NULL,
  event_timestamp TIMESTAMPTZ,

  -- Dados do cliente
  customer_email TEXT,
  customer_name TEXT,
  customer_doc TEXT,

  -- Dados financeiros
  amount DECIMAL(10,2),
  currency TEXT DEFAULT 'BRL',
  payment_method TEXT,

  -- Status
  status TEXT,

  -- Payload completo para debug
  raw_payload JSONB NOT NULL,

  -- Processamento
  processed BOOLEAN DEFAULT FALSE,
  processed_at TIMESTAMPTZ,
  processing_error TEXT,

  -- Referências locais (preenchidas após processamento)
  user_id UUID REFERENCES auth.users(id),
  preparatorio_id UUID REFERENCES preparatorios(id),
  user_product_id UUID REFERENCES user_products(id),

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_products_user_id ON user_products(user_id);
CREATE INDEX IF NOT EXISTS idx_user_products_preparatorio ON user_products(preparatorio_id);
CREATE INDEX IF NOT EXISTS idx_user_products_status ON user_products(status);
CREATE INDEX IF NOT EXISTS idx_user_products_guru_transaction ON user_products(guru_transaction_id);

CREATE INDEX IF NOT EXISTS idx_guru_transactions_transaction_id ON guru_transactions(guru_transaction_id);
CREATE INDEX IF NOT EXISTS idx_guru_transactions_email ON guru_transactions(customer_email);
CREATE INDEX IF NOT EXISTS idx_guru_transactions_event ON guru_transactions(event_type);
CREATE INDEX IF NOT EXISTS idx_guru_transactions_processed ON guru_transactions(processed);
CREATE INDEX IF NOT EXISTS idx_guru_transactions_guru_product ON guru_transactions(guru_product_id);

-- =====================================================
-- RLS POLICIES
-- =====================================================
ALTER TABLE user_products ENABLE ROW LEVEL SECURITY;
ALTER TABLE guru_transactions ENABLE ROW LEVEL SECURITY;

-- user_products: usuários podem ver seus próprios produtos
CREATE POLICY "Users can view own products" ON user_products
  FOR SELECT USING (auth.uid() = user_id);

-- user_products: service role pode tudo
CREATE POLICY "Service role full access user_products" ON user_products
  FOR ALL USING (auth.role() = 'service_role');

-- guru_transactions: apenas service role
CREATE POLICY "Service role full access guru_transactions" ON guru_transactions
  FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- FUNÇÃO: check_user_product_access
-- Verifica se usuário tem acesso a um produto específico
-- =====================================================
CREATE OR REPLACE FUNCTION check_user_product_access(
  p_user_id UUID,
  p_preparatorio_id UUID,
  p_product_type product_type
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_products
    WHERE user_id = p_user_id
      AND preparatorio_id = p_preparatorio_id
      AND product_type = p_product_type
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > NOW())
  );
END;
$$;

-- =====================================================
-- FUNÇÃO: grant_product_access
-- Concede acesso a um produto
-- =====================================================
CREATE OR REPLACE FUNCTION grant_product_access(
  p_user_id UUID,
  p_preparatorio_id UUID,
  p_product_type product_type,
  p_guru_transaction_id TEXT DEFAULT NULL,
  p_guru_subscription_id TEXT DEFAULT NULL,
  p_guru_product_id TEXT DEFAULT NULL,
  p_expires_at TIMESTAMPTZ DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_product_id UUID;
BEGIN
  INSERT INTO user_products (
    user_id,
    preparatorio_id,
    product_type,
    status,
    granted_at,
    expires_at,
    guru_transaction_id,
    guru_subscription_id,
    guru_product_id
  ) VALUES (
    p_user_id,
    p_preparatorio_id,
    p_product_type,
    'active',
    NOW(),
    p_expires_at,
    p_guru_transaction_id,
    p_guru_subscription_id,
    p_guru_product_id
  )
  ON CONFLICT (user_id, preparatorio_id, product_type)
  DO UPDATE SET
    status = 'active',
    granted_at = NOW(),
    expires_at = COALESCE(p_expires_at, user_products.expires_at),
    guru_transaction_id = COALESCE(p_guru_transaction_id, user_products.guru_transaction_id),
    guru_subscription_id = COALESCE(p_guru_subscription_id, user_products.guru_subscription_id),
    guru_product_id = COALESCE(p_guru_product_id, user_products.guru_product_id),
    revoked_at = NULL,
    updated_at = NOW()
  RETURNING id INTO v_product_id;

  RETURN v_product_id;
END;
$$;

-- =====================================================
-- FUNÇÃO: revoke_product_access
-- Revoga acesso a um produto
-- =====================================================
CREATE OR REPLACE FUNCTION revoke_product_access(
  p_user_id UUID,
  p_preparatorio_id UUID,
  p_product_type product_type,
  p_reason product_access_status DEFAULT 'canceled'
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE user_products
  SET
    status = p_reason,
    revoked_at = NOW(),
    updated_at = NOW()
  WHERE user_id = p_user_id
    AND preparatorio_id = p_preparatorio_id
    AND product_type = p_product_type
    AND status = 'active';

  RETURN FOUND;
END;
$$;

-- =====================================================
-- FUNÇÃO: find_preparatorio_by_guru_product
-- Encontra preparatório e tipo de produto pelo ID Guru
-- =====================================================
CREATE OR REPLACE FUNCTION find_preparatorio_by_guru_product(
  p_guru_product_id TEXT
)
RETURNS TABLE (
  preparatorio_id UUID,
  product_type product_type
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    p.id as preparatorio_id,
    CASE
      WHEN p.guru_product_id_planejador = p_guru_product_id THEN 'planejador'::product_type
      WHEN p.guru_product_id_8_questoes = p_guru_product_id THEN '8_questoes'::product_type
      WHEN p.guru_product_id_simulados = p_guru_product_id THEN 'simulados'::product_type
      WHEN p.guru_product_id_reta_final = p_guru_product_id THEN 'reta_final'::product_type
      WHEN p.guru_product_id_plataforma_completa = p_guru_product_id THEN 'plataforma_completa'::product_type
    END as product_type
  FROM preparatorios p
  WHERE p.guru_product_id_planejador = p_guru_product_id
     OR p.guru_product_id_8_questoes = p_guru_product_id
     OR p.guru_product_id_simulados = p_guru_product_id
     OR p.guru_product_id_reta_final = p_guru_product_id
     OR p.guru_product_id_plataforma_completa = p_guru_product_id;
END;
$$;

-- Comentários
COMMENT ON TABLE user_products IS 'Produtos adquiridos por usuários via Guru';
COMMENT ON TABLE guru_transactions IS 'Log de transações recebidas da Guru via webhook';
COMMENT ON FUNCTION check_user_product_access IS 'Verifica se usuário tem acesso ativo a um produto';
COMMENT ON FUNCTION grant_product_access IS 'Concede acesso a um produto para o usuário';
COMMENT ON FUNCTION revoke_product_access IS 'Revoga acesso a um produto';
COMMENT ON FUNCTION find_preparatorio_by_guru_product IS 'Encontra preparatório pelo ID do produto Guru';
