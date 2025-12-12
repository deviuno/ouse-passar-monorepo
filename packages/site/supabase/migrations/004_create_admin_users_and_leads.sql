-- =====================================================
-- MIGRAÇÃO: Sistema de Usuários Administrativos e Leads
-- Execute este SQL no dashboard do Supabase:
-- https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd/sql/new
-- =====================================================

-- Criar enum para tipos de usuário (se não existir)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('admin', 'vendedor', 'cliente');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para dificuldades do lead (se não existir)
DO $$ BEGIN
    CREATE TYPE lead_difficulty AS ENUM ('tempo', 'nao_saber_por_onde_comecar', 'organizacao', 'falta_de_material', 'outros');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para sexo (se não existir)
DO $$ BEGIN
    CREATE TYPE lead_gender AS ENUM ('masculino', 'feminino', 'outro', 'prefiro_nao_dizer');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Criar enum para nível de escolaridade (se não existir)
DO $$ BEGIN
    CREATE TYPE education_level AS ENUM ('fundamental_incompleto', 'fundamental_completo', 'medio_incompleto', 'medio_completo', 'superior_incompleto', 'superior_completo', 'pos_graduacao', 'mestrado', 'doutorado');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- =====================================================
-- TABELA: admin_users
-- Usuários administrativos (admin e vendedores)
-- =====================================================

CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'vendedor',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES admin_users(id),
  last_login TIMESTAMP WITH TIME ZONE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_role ON admin_users(role);
CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON admin_users(is_active);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_admin_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_admin_users_updated_at ON admin_users;
CREATE TRIGGER trigger_admin_users_updated_at
  BEFORE UPDATE ON admin_users
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_updated_at();

-- Inserir usuário admin padrão (apenas se não existir)
INSERT INTO admin_users (email, password_hash, name, role)
VALUES ('admin@ousepassar.com', '123456', 'Administrador', 'admin')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- TABELA: leads
-- Informações dos leads/prospects
-- =====================================================

CREATE TABLE IF NOT EXISTS leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Informações pessoais
  nome VARCHAR(255) NOT NULL,
  sexo lead_gender,
  email VARCHAR(255),
  telefone VARCHAR(20),

  -- Informações sobre o concurso
  concurso_almejado VARCHAR(255) NOT NULL,
  nivel_escolaridade education_level,

  -- Situação atual
  trabalha BOOLEAN DEFAULT false,
  possui_curso_concurso BOOLEAN DEFAULT false,
  qual_curso TEXT,

  -- Rotina de estudos (horas por dia)
  horas_domingo DECIMAL(3,1) DEFAULT 0,
  horas_segunda DECIMAL(3,1) DEFAULT 0,
  horas_terca DECIMAL(3,1) DEFAULT 0,
  horas_quarta DECIMAL(3,1) DEFAULT 0,
  horas_quinta DECIMAL(3,1) DEFAULT 0,
  horas_sexta DECIMAL(3,1) DEFAULT 0,
  horas_sabado DECIMAL(3,1) DEFAULT 0,

  -- Dificuldades
  principal_dificuldade lead_difficulty,
  dificuldade_outros TEXT,

  -- Relacionamentos
  vendedor_id UUID REFERENCES admin_users(id),
  planejamento_id UUID REFERENCES planejamentos_prf(id),

  -- Metadados
  status VARCHAR(50) DEFAULT 'novo',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para leads
CREATE INDEX IF NOT EXISTS idx_leads_vendedor_id ON leads(vendedor_id);
CREATE INDEX IF NOT EXISTS idx_leads_status ON leads(status);
CREATE INDEX IF NOT EXISTS idx_leads_created_at ON leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_leads_concurso ON leads(concurso_almejado);

-- Trigger para atualizar updated_at em leads
CREATE OR REPLACE FUNCTION update_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leads_updated_at ON leads;
CREATE TRIGGER trigger_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_leads_updated_at();

-- =====================================================
-- RLS POLICIES
-- =====================================================

-- Habilitar RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Políticas para admin_users
DROP POLICY IF EXISTS "Anyone can read admin_users" ON admin_users;
CREATE POLICY "Anyone can read admin_users" ON admin_users
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert admin_users" ON admin_users;
CREATE POLICY "Anyone can insert admin_users" ON admin_users
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update admin_users" ON admin_users;
CREATE POLICY "Anyone can update admin_users" ON admin_users
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete admin_users" ON admin_users;
CREATE POLICY "Anyone can delete admin_users" ON admin_users
  FOR DELETE USING (true);

-- Políticas para leads
DROP POLICY IF EXISTS "Anyone can read leads" ON leads;
CREATE POLICY "Anyone can read leads" ON leads
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert leads" ON leads;
CREATE POLICY "Anyone can insert leads" ON leads
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update leads" ON leads;
CREATE POLICY "Anyone can update leads" ON leads
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Anyone can delete leads" ON leads;
CREATE POLICY "Anyone can delete leads" ON leads
  FOR DELETE USING (true);

-- =====================================================
-- VERIFICAÇÃO
-- =====================================================

-- Verificar se as tabelas foram criadas
SELECT 'admin_users' as tabela, count(*) as registros FROM admin_users
UNION ALL
SELECT 'leads' as tabela, count(*) as registros FROM leads;
