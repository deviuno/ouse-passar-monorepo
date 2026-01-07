-- Migration: Create auxiliary tables for database normalization
-- Phase 1: Create bancas, orgaos, cargos, materias, assuntos tables

-- Function for updated_at (if not exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Table: bancas
CREATE TABLE IF NOT EXISTS bancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  sigla VARCHAR(50),
  website VARCHAR(255),
  logo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: orgaos
CREATE TABLE IF NOT EXISTS orgaos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  sigla VARCHAR(50),
  nome_completo VARCHAR(500),
  uf CHAR(2),
  esfera VARCHAR(20),
  poder VARCHAR(20),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(nome)
);

-- Table: cargos
CREATE TABLE IF NOT EXISTS cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  area VARCHAR(255),
  especialidade VARCHAR(255),
  escolaridade VARCHAR(50),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: materias
CREATE TABLE IF NOT EXISTS materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  cor VARCHAR(7),
  icone VARCHAR(100),
  ordem INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table: assuntos (with hierarchy)
CREATE TABLE IF NOT EXISTS assuntos_normalized (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES assuntos_normalized(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  nivel INT NOT NULL DEFAULT 1,
  ordem INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(materia_id, slug),
  CONSTRAINT assuntos_normalized_nivel_check CHECK (nivel BETWEEN 1 AND 3)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_bancas_nome ON bancas(nome);
CREATE INDEX IF NOT EXISTS idx_bancas_sigla ON bancas(sigla);
CREATE INDEX IF NOT EXISTS idx_orgaos_nome ON orgaos(nome);
CREATE INDEX IF NOT EXISTS idx_orgaos_sigla ON orgaos(sigla);
CREATE INDEX IF NOT EXISTS idx_orgaos_uf ON orgaos(uf);
CREATE INDEX IF NOT EXISTS idx_cargos_nome ON cargos(nome);
CREATE INDEX IF NOT EXISTS idx_cargos_area ON cargos(area);
CREATE INDEX IF NOT EXISTS idx_materias_slug ON materias(slug);
CREATE INDEX IF NOT EXISTS idx_materias_nome ON materias(nome);
CREATE INDEX IF NOT EXISTS idx_assuntos_normalized_materia ON assuntos_normalized(materia_id);
CREATE INDEX IF NOT EXISTS idx_assuntos_normalized_parent ON assuntos_normalized(parent_id);
CREATE INDEX IF NOT EXISTS idx_assuntos_normalized_slug ON assuntos_normalized(slug);
CREATE INDEX IF NOT EXISTS idx_assuntos_normalized_nivel ON assuntos_normalized(nivel);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_bancas_updated_at ON bancas;
CREATE TRIGGER update_bancas_updated_at
  BEFORE UPDATE ON bancas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_orgaos_updated_at ON orgaos;
CREATE TRIGGER update_orgaos_updated_at
  BEFORE UPDATE ON orgaos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_cargos_updated_at ON cargos;
CREATE TRIGGER update_cargos_updated_at
  BEFORE UPDATE ON cargos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_materias_updated_at ON materias;
CREATE TRIGGER update_materias_updated_at
  BEFORE UPDATE ON materias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_assuntos_normalized_updated_at ON assuntos_normalized;
CREATE TRIGGER update_assuntos_normalized_updated_at
  BEFORE UPDATE ON assuntos_normalized
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE bancas ENABLE ROW LEVEL SECURITY;
ALTER TABLE orgaos ENABLE ROW LEVEL SECURITY;
ALTER TABLE cargos ENABLE ROW LEVEL SECURITY;
ALTER TABLE materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE assuntos_normalized ENABLE ROW LEVEL SECURITY;

-- Read access for all (these are reference tables)
CREATE POLICY "bancas_select_all" ON bancas FOR SELECT USING (true);
CREATE POLICY "orgaos_select_all" ON orgaos FOR SELECT USING (true);
CREATE POLICY "cargos_select_all" ON cargos FOR SELECT USING (true);
CREATE POLICY "materias_select_all" ON materias FOR SELECT USING (true);
CREATE POLICY "assuntos_normalized_select_all" ON assuntos_normalized FOR SELECT USING (true);
