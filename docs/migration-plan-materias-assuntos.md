# Plano de Migração: Normalização do Banco de Questões

## Objetivo

Reestruturar o banco de questões para normalizar campos repetitivos em tabelas auxiliares, permitindo:
- Consistência de dados via FKs
- Relacionamentos hierárquicos entre assuntos (até 3 níveis)
- Armazenamento de metadados (siglas, UF, esfera, etc.)
- Melhor manutenção e expansão do banco
- Queries mais eficientes para filtros e relatórios
- Economia de storage (~65% nos campos normalizados)

---

## Análise de Dados Atual

| Campo | Valores Únicos | Registros | Tamanho Médio | Total MB | Normalizar? |
|-------|---------------|-----------|---------------|----------|-------------|
| banca | 96 | 107.271 | 44 chars | 4.5 MB | ✅ Alta |
| orgao | 194 | 107.347 | 41 chars | 4.1 MB | ✅ Alta |
| cargo_area | 2.308 | 107.236 | 57 chars | 5.8 MB | ⚠️ Média |
| materia | 137 | 169.938 | - | - | ✅ Alta |
| assunto | 6.977 | 114.772 | - | - | ✅ Alta |
| ano | 30 | 107.268 | 4 bytes | - | ❌ Não |

**Total tabela questoes_concurso:** 382 MB (169.938 registros)

---

## Estrutura Atual vs Nova

### Atual (campos texto)
```
questoes_concurso (
  banca TEXT,
  orgao TEXT,
  cargo_area_especialidade_edicao TEXT,
  materia TEXT,
  assunto TEXT,
  ...
)
```

### Nova (normalizada)
```
questoes_concurso (
  -- Campos texto mantidos temporariamente
  banca TEXT,
  orgao TEXT,
  cargo_area_especialidade_edicao TEXT,
  materia TEXT,
  assunto TEXT,

  -- Novos campos FK (preenchidos por job)
  banca_id UUID REFERENCES bancas(id),
  orgao_id UUID REFERENCES orgaos(id),
  cargo_id UUID REFERENCES cargos(id),
  materia_id UUID REFERENCES materias(id),
  assunto_id UUID REFERENCES assuntos(id),
  ...
)
```

---

## Estratégia: Migração Híbrida

**Por que híbrida?**
- Coleta de questões continua funcionando normalmente
- Zero mudanças no scraper durante a migração
- Job em background preenche os FKs automaticamente
- Campos texto removidos apenas após estabilização

**Fluxo:**
```
1. Scraper salva questão com texto (como sempre)
   ↓
2. Job detecta registros sem FK preenchido
   ↓
3. Job busca/cria entrada na tabela auxiliar
   ↓
4. Job atualiza o FK na questão
```

---

## Novas Tabelas Auxiliares

### Tabela: `bancas`

```sql
CREATE TABLE bancas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  sigla VARCHAR(50),
  website VARCHAR(255),
  logo_url VARCHAR(500),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_bancas_nome ON bancas(nome);
CREATE INDEX idx_bancas_sigla ON bancas(sigla);
```

**Exemplo de dados:**
| nome | sigla |
|------|-------|
| Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos | CEBRASPE |
| Fundação Carlos Chagas | FCC |
| Fundação Getúlio Vargas | FGV |

### Tabela: `orgaos`

```sql
CREATE TABLE orgaos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  sigla VARCHAR(50),
  nome_completo VARCHAR(500),        -- nome por extenso
  uf CHAR(2),                         -- UF se estadual/municipal
  esfera VARCHAR(20),                 -- federal, estadual, municipal
  poder VARCHAR(20),                  -- executivo, legislativo, judiciario
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(sigla, uf)
);

CREATE INDEX idx_orgaos_nome ON orgaos(nome);
CREATE INDEX idx_orgaos_sigla ON orgaos(sigla);
CREATE INDEX idx_orgaos_uf ON orgaos(uf);
```

**Exemplo de dados:**
| nome | sigla | nome_completo | uf | esfera |
|------|-------|---------------|-----|--------|
| PF - Polícia Federal | PF | Polícia Federal | NULL | federal |
| PC SP - Polícia Civil do Estado de São Paulo | PC | Polícia Civil | SP | estadual |

### Tabela: `cargos`

```sql
CREATE TABLE cargos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  area VARCHAR(255),
  especialidade VARCHAR(255),
  escolaridade VARCHAR(50),           -- fundamental, medio, superior
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_cargos_nome ON cargos(nome);
CREATE INDEX idx_cargos_area ON cargos(area);
CREATE INDEX idx_cargos_escolaridade ON cargos(escolaridade);
```

### Tabela: `materias`

```sql
CREATE TABLE materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL UNIQUE,
  slug VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  cor VARCHAR(7),                     -- hex color para UI
  icone VARCHAR(100),                 -- nome do ícone
  ordem INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_materias_slug ON materias(slug);
CREATE INDEX idx_materias_nome ON materias(nome);
```

### Tabela: `assuntos`

```sql
CREATE TABLE assuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES assuntos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  nivel INT NOT NULL DEFAULT 1,       -- 1, 2 ou 3
  ordem INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(materia_id, slug),
  CONSTRAINT assuntos_nivel_check CHECK (nivel BETWEEN 1 AND 3)
);

CREATE INDEX idx_assuntos_materia ON assuntos(materia_id);
CREATE INDEX idx_assuntos_parent ON assuntos(parent_id);
CREATE INDEX idx_assuntos_slug ON assuntos(slug);
CREATE INDEX idx_assuntos_nivel ON assuntos(nivel);
```

---

## Fases da Migração

### Fase 0: Backup de Segurança

**EXECUTAR ANTES DE QUALQUER ALTERAÇÃO**

```sql
-- Criar schema para backups
CREATE SCHEMA IF NOT EXISTS backups;

-- Backup da tabela principal (~382 MB, ~30 segundos)
CREATE TABLE backups.questoes_concurso_20250106 AS
SELECT * FROM questoes_concurso;

-- Backup da taxonomia existente
CREATE TABLE backups.assuntos_taxonomia_20250106 AS
SELECT * FROM assuntos_taxonomia;

-- Backup do mapeamento
CREATE TABLE backups.assuntos_mapeamento_20250106 AS
SELECT * FROM assuntos_mapeamento;

-- Verificar backups
SELECT
  'questoes_concurso' as tabela,
  (SELECT COUNT(*) FROM questoes_concurso) as original,
  (SELECT COUNT(*) FROM backups.questoes_concurso_20250106) as backup
UNION ALL
SELECT
  'assuntos_taxonomia',
  (SELECT COUNT(*) FROM assuntos_taxonomia),
  (SELECT COUNT(*) FROM backups.assuntos_taxonomia_20250106)
UNION ALL
SELECT
  'assuntos_mapeamento',
  (SELECT COUNT(*) FROM assuntos_mapeamento),
  (SELECT COUNT(*) FROM backups.assuntos_mapeamento_20250106);
```

**Rollback (se necessário):**
```sql
-- Restaurar tabela principal
TRUNCATE questoes_concurso;
INSERT INTO questoes_concurso SELECT * FROM backups.questoes_concurso_20250106;
```

---

### Fase 1: Criar Tabelas Auxiliares (DDL)

```sql
-- Migration: 001_create_auxiliary_tables

-- Função para updated_at (se não existir)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Tabela de bancas
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

-- Tabela de órgãos
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

-- Tabela de cargos
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

-- Tabela de matérias
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

-- Tabela de assuntos com hierarquia
CREATE TABLE IF NOT EXISTS assuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id UUID NOT NULL REFERENCES materias(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES assuntos(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  nivel INT NOT NULL DEFAULT 1,
  ordem INT DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(materia_id, slug),
  CONSTRAINT assuntos_nivel_check CHECK (nivel BETWEEN 1 AND 3)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_bancas_nome ON bancas(nome);
CREATE INDEX IF NOT EXISTS idx_bancas_sigla ON bancas(sigla);
CREATE INDEX IF NOT EXISTS idx_orgaos_nome ON orgaos(nome);
CREATE INDEX IF NOT EXISTS idx_orgaos_sigla ON orgaos(sigla);
CREATE INDEX IF NOT EXISTS idx_orgaos_uf ON orgaos(uf);
CREATE INDEX IF NOT EXISTS idx_cargos_nome ON cargos(nome);
CREATE INDEX IF NOT EXISTS idx_cargos_area ON cargos(area);
CREATE INDEX IF NOT EXISTS idx_materias_slug ON materias(slug);
CREATE INDEX IF NOT EXISTS idx_materias_nome ON materias(nome);
CREATE INDEX IF NOT EXISTS idx_assuntos_materia ON assuntos(materia_id);
CREATE INDEX IF NOT EXISTS idx_assuntos_parent ON assuntos(parent_id);
CREATE INDEX IF NOT EXISTS idx_assuntos_slug ON assuntos(slug);
CREATE INDEX IF NOT EXISTS idx_assuntos_nivel ON assuntos(nivel);

-- Triggers para updated_at
CREATE TRIGGER update_bancas_updated_at
  BEFORE UPDATE ON bancas
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orgaos_updated_at
  BEFORE UPDATE ON orgaos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cargos_updated_at
  BEFORE UPDATE ON cargos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_materias_updated_at
  BEFORE UPDATE ON materias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assuntos_updated_at
  BEFORE UPDATE ON assuntos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

---

### Fase 2: Adicionar Colunas FK nas Questões

```sql
-- Migration: 002_add_fk_columns_to_questoes

ALTER TABLE questoes_concurso
ADD COLUMN IF NOT EXISTS banca_id UUID REFERENCES bancas(id),
ADD COLUMN IF NOT EXISTS orgao_id UUID REFERENCES orgaos(id),
ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES cargos(id),
ADD COLUMN IF NOT EXISTS materia_id UUID REFERENCES materias(id),
ADD COLUMN IF NOT EXISTS assunto_id UUID REFERENCES assuntos(id);

CREATE INDEX IF NOT EXISTS idx_questoes_banca_id ON questoes_concurso(banca_id);
CREATE INDEX IF NOT EXISTS idx_questoes_orgao_id ON questoes_concurso(orgao_id);
CREATE INDEX IF NOT EXISTS idx_questoes_cargo_id ON questoes_concurso(cargo_id);
CREATE INDEX IF NOT EXISTS idx_questoes_materia_id ON questoes_concurso(materia_id);
CREATE INDEX IF NOT EXISTS idx_questoes_assunto_id ON questoes_concurso(assunto_id);
```

---

### Fase 3: Popular Tabelas Auxiliares

```sql
-- Migration: 003_populate_auxiliary_tables

-- 3.1 Popular bancas
INSERT INTO bancas (nome)
SELECT DISTINCT banca
FROM questoes_concurso
WHERE banca IS NOT NULL AND banca != ''
ON CONFLICT (nome) DO NOTHING;

-- 3.2 Popular órgãos
INSERT INTO orgaos (nome)
SELECT DISTINCT orgao
FROM questoes_concurso
WHERE orgao IS NOT NULL AND orgao != ''
ON CONFLICT (nome) DO NOTHING;

-- 3.3 Popular cargos (simplificado - nome completo)
INSERT INTO cargos (nome)
SELECT DISTINCT cargo_area_especialidade_edicao
FROM questoes_concurso
WHERE cargo_area_especialidade_edicao IS NOT NULL
AND cargo_area_especialidade_edicao != ''
ON CONFLICT DO NOTHING;

-- 3.4 Popular matérias
INSERT INTO materias (nome, slug)
SELECT DISTINCT
  materia,
  LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(
      UNACCENT(materia),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  ))
FROM questoes_concurso
WHERE materia IS NOT NULL AND materia != ''
ON CONFLICT (nome) DO NOTHING;

-- Também da taxonomia existente
INSERT INTO materias (nome, slug)
SELECT DISTINCT
  materia,
  LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(
      UNACCENT(materia),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  ))
FROM assuntos_taxonomia
WHERE materia IS NOT NULL AND materia != ''
ON CONFLICT (nome) DO NOTHING;
```

---

### Fase 4: Popular Assuntos (Hierarquia)

```sql
-- Migration: 004_populate_assuntos_hierarchy

-- 4.1 Assuntos nível 1 (da taxonomia)
INSERT INTO assuntos (materia_id, nome, slug, nivel)
SELECT DISTINCT
  m.id,
  at.assunto_nivel_1,
  LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(
      UNACCENT(at.assunto_nivel_1),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )),
  1
FROM assuntos_taxonomia at
JOIN materias m ON m.nome = at.materia
WHERE at.assunto_nivel_1 IS NOT NULL AND at.assunto_nivel_1 != ''
ON CONFLICT (materia_id, slug) DO NOTHING;

-- 4.2 Assuntos das questões (nível 1)
INSERT INTO assuntos (materia_id, nome, slug, nivel)
SELECT DISTINCT
  m.id,
  qc.assunto,
  LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(
      UNACCENT(qc.assunto),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )),
  1
FROM questoes_concurso qc
JOIN materias m ON m.nome = qc.materia
WHERE qc.assunto IS NOT NULL AND qc.assunto != ''
ON CONFLICT (materia_id, slug) DO NOTHING;

-- 4.3 Assuntos nível 2
INSERT INTO assuntos (materia_id, parent_id, nome, slug, nivel)
SELECT DISTINCT
  m.id,
  a1.id,
  at.assunto_nivel_2,
  LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(
      UNACCENT(at.assunto_nivel_2),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )),
  2
FROM assuntos_taxonomia at
JOIN materias m ON m.nome = at.materia
JOIN assuntos a1 ON a1.materia_id = m.id
  AND a1.nome = at.assunto_nivel_1
  AND a1.nivel = 1
WHERE at.assunto_nivel_2 IS NOT NULL AND at.assunto_nivel_2 != ''
ON CONFLICT (materia_id, slug) DO NOTHING;

-- 4.4 Assuntos nível 3
INSERT INTO assuntos (materia_id, parent_id, nome, slug, nivel)
SELECT DISTINCT
  m.id,
  a2.id,
  at.assunto_nivel_3,
  LOWER(REGEXP_REPLACE(
    REGEXP_REPLACE(
      UNACCENT(at.assunto_nivel_3),
      '[^a-zA-Z0-9\s-]', '', 'g'
    ),
    '\s+', '-', 'g'
  )),
  3
FROM assuntos_taxonomia at
JOIN materias m ON m.nome = at.materia
JOIN assuntos a1 ON a1.materia_id = m.id
  AND a1.nome = at.assunto_nivel_1
  AND a1.nivel = 1
JOIN assuntos a2 ON a2.parent_id = a1.id
  AND a2.nome = at.assunto_nivel_2
  AND a2.nivel = 2
WHERE at.assunto_nivel_3 IS NOT NULL AND at.assunto_nivel_3 != ''
ON CONFLICT (materia_id, slug) DO NOTHING;
```

---

### Fase 5: Migrar FKs nas Questões

```sql
-- Migration: 005_update_questoes_fks

-- 5.1 Atualizar banca_id
UPDATE questoes_concurso qc
SET banca_id = b.id
FROM bancas b
WHERE qc.banca = b.nome
AND qc.banca_id IS NULL;

-- 5.2 Atualizar orgao_id
UPDATE questoes_concurso qc
SET orgao_id = o.id
FROM orgaos o
WHERE qc.orgao = o.nome
AND qc.orgao_id IS NULL;

-- 5.3 Atualizar cargo_id
UPDATE questoes_concurso qc
SET cargo_id = c.id
FROM cargos c
WHERE qc.cargo_area_especialidade_edicao = c.nome
AND qc.cargo_id IS NULL;

-- 5.4 Atualizar materia_id
UPDATE questoes_concurso qc
SET materia_id = m.id
FROM materias m
WHERE qc.materia = m.nome
AND qc.materia_id IS NULL;

-- 5.5 Atualizar assunto_id
UPDATE questoes_concurso qc
SET assunto_id = a.id
FROM assuntos a
JOIN materias m ON a.materia_id = m.id
WHERE qc.materia = m.nome
AND qc.assunto = a.nome
AND qc.assunto_id IS NULL;
```

---

### Fase 6: Popular Metadados (Siglas, UF, etc.)

```sql
-- Migration: 006_populate_metadata

-- 6.1 Siglas das bancas conhecidas
UPDATE bancas SET sigla = 'CEBRASPE' WHERE nome = 'Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos';
UPDATE bancas SET sigla = 'CESPE' WHERE nome = 'Centro de Seleção e de Promoção de Eventos - UnB';
UPDATE bancas SET sigla = 'FCC' WHERE nome = 'Fundação Carlos Chagas';
UPDATE bancas SET sigla = 'FGV' WHERE nome = 'Fundação Getúlio Vargas';
UPDATE bancas SET sigla = 'VUNESP' WHERE nome = 'Fundação para o Vestibular da Universidade Estadual Paulista';
UPDATE bancas SET sigla = 'AOCP' WHERE nome = 'Instituto AOCP';
UPDATE bancas SET sigla = 'IBFC' WHERE nome = 'Instituto Brasileiro de Formação e Capacitação';
UPDATE bancas SET sigla = 'IDECAN' WHERE nome = 'Instituto de Desenvolvimento Educacional, Cultural e Assistencial Nacional';
UPDATE bancas SET sigla = 'MB' WHERE nome = 'Marinha do Brasil';
UPDATE bancas SET sigla = 'DEAER' WHERE nome = 'Diretoria de Ensino da Aeronáutica';
UPDATE bancas SET sigla = 'DECEX' WHERE nome = 'Departamento de Educação e Cultura do Exército';
-- ... adicionar mais conforme necessário

-- 6.2 Extrair sigla dos órgãos (padrão "SIGLA - Nome")
UPDATE orgaos
SET
  sigla = SPLIT_PART(nome, ' - ', 1),
  nome_completo = SPLIT_PART(nome, ' - ', 2)
WHERE nome LIKE '% - %';

-- 6.3 Detectar UF dos órgãos estaduais
UPDATE orgaos SET uf = 'SP', esfera = 'estadual' WHERE nome LIKE '%SP%' AND nome LIKE '%Estado de São Paulo%';
UPDATE orgaos SET uf = 'MG', esfera = 'estadual' WHERE nome LIKE '%MG%' AND nome LIKE '%Minas Gerais%';
UPDATE orgaos SET uf = 'RJ', esfera = 'estadual' WHERE nome LIKE '%RJ%' AND nome LIKE '%Rio de Janeiro%';
UPDATE orgaos SET uf = 'DF', esfera = 'estadual' WHERE nome LIKE '%DF%' AND nome LIKE '%Distrito Federal%';
-- ... adicionar mais conforme necessário

-- 6.4 Marcar órgãos federais
UPDATE orgaos SET esfera = 'federal'
WHERE nome IN (
  'PF - Polícia Federal',
  'PRF - Polícia Rodoviária Federal',
  'Marinha - Marinha do Brasil'
);
```

---

### Fase 7: Criar Views de Compatibilidade

```sql
-- Migration: 007_create_compatibility_views

-- View principal com todos os dados
CREATE OR REPLACE VIEW questoes_concurso_v AS
SELECT
  qc.id,
  qc.enunciado,
  qc.alternativas,
  qc.gabarito,
  qc.comentario,
  qc.ano,
  qc.prova,
  qc.is_pegadinha,
  qc.explicacao_pegadinha,
  qc.ativo,
  qc.created_at,
  qc.updated_at,
  -- Dados normalizados
  b.id as banca_id,
  b.nome as banca,
  b.sigla as banca_sigla,
  o.id as orgao_id,
  o.nome as orgao,
  o.sigla as orgao_sigla,
  o.uf as orgao_uf,
  o.esfera as orgao_esfera,
  c.id as cargo_id,
  c.nome as cargo,
  c.area as cargo_area,
  c.escolaridade as cargo_escolaridade,
  m.id as materia_id,
  m.nome as materia,
  m.slug as materia_slug,
  a.id as assunto_id,
  a.nome as assunto,
  a.slug as assunto_slug,
  a.nivel as assunto_nivel
FROM questoes_concurso qc
LEFT JOIN bancas b ON qc.banca_id = b.id
LEFT JOIN orgaos o ON qc.orgao_id = o.id
LEFT JOIN cargos c ON qc.cargo_id = c.id
LEFT JOIN materias m ON qc.materia_id = m.id
LEFT JOIN assuntos a ON qc.assunto_id = a.id;

-- View de hierarquia de assuntos
CREATE OR REPLACE VIEW assuntos_hierarchy AS
WITH RECURSIVE assunto_tree AS (
  SELECT
    id,
    materia_id,
    parent_id,
    nome,
    slug,
    nivel,
    nome as path,
    ARRAY[id] as ancestors
  FROM assuntos
  WHERE parent_id IS NULL

  UNION ALL

  SELECT
    a.id,
    a.materia_id,
    a.parent_id,
    a.nome,
    a.slug,
    a.nivel,
    at.path || ' > ' || a.nome,
    at.ancestors || a.id
  FROM assuntos a
  JOIN assunto_tree at ON a.parent_id = at.id
)
SELECT
  at.*,
  m.nome as materia_nome,
  m.slug as materia_slug
FROM assunto_tree at
JOIN materias m ON at.materia_id = m.id;
```

---

### Fase 8: Criar Functions Helper

```sql
-- Migration: 008_create_helper_functions

-- Função para buscar assuntos por matéria (com hierarquia)
CREATE OR REPLACE FUNCTION get_assuntos_by_materia(p_materia_id UUID)
RETURNS TABLE (
  id UUID,
  nome VARCHAR,
  slug VARCHAR,
  nivel INT,
  parent_id UUID,
  path TEXT
) AS $$
WITH RECURSIVE assunto_tree AS (
  SELECT
    a.id,
    a.nome,
    a.slug,
    a.nivel,
    a.parent_id,
    a.nome::TEXT as path
  FROM assuntos a
  WHERE a.materia_id = p_materia_id AND a.parent_id IS NULL

  UNION ALL

  SELECT
    a.id,
    a.nome,
    a.slug,
    a.nivel,
    a.parent_id,
    at.path || ' > ' || a.nome
  FROM assuntos a
  JOIN assunto_tree at ON a.parent_id = at.id
)
SELECT * FROM assunto_tree ORDER BY path;
$$ LANGUAGE SQL;

-- Função para contar questões por banca
CREATE OR REPLACE FUNCTION count_questoes_by_banca()
RETURNS TABLE (
  banca_id UUID,
  banca_nome VARCHAR,
  banca_sigla VARCHAR,
  total_questoes BIGINT
) AS $$
SELECT
  b.id,
  b.nome,
  b.sigla,
  COUNT(qc.id)
FROM bancas b
LEFT JOIN questoes_concurso qc ON qc.banca_id = b.id
GROUP BY b.id, b.nome, b.sigla
ORDER BY COUNT(qc.id) DESC;
$$ LANGUAGE SQL;

-- Função para contar questões por matéria
CREATE OR REPLACE FUNCTION count_questoes_by_materia()
RETURNS TABLE (
  materia_id UUID,
  materia_nome VARCHAR,
  total_questoes BIGINT
) AS $$
SELECT
  m.id,
  m.nome,
  COUNT(qc.id)
FROM materias m
LEFT JOIN questoes_concurso qc ON qc.materia_id = m.id
GROUP BY m.id, m.nome
ORDER BY COUNT(qc.id) DESC;
$$ LANGUAGE SQL;

-- Função para contar questões por assunto
CREATE OR REPLACE FUNCTION count_questoes_by_assunto(p_materia_id UUID DEFAULT NULL)
RETURNS TABLE (
  assunto_id UUID,
  assunto_nome VARCHAR,
  materia_nome VARCHAR,
  nivel INT,
  total_questoes BIGINT
) AS $$
SELECT
  a.id,
  a.nome,
  m.nome,
  a.nivel,
  COUNT(qc.id)
FROM assuntos a
JOIN materias m ON a.materia_id = m.id
LEFT JOIN questoes_concurso qc ON qc.assunto_id = a.id
WHERE (p_materia_id IS NULL OR a.materia_id = p_materia_id)
GROUP BY a.id, a.nome, m.nome, a.nivel
ORDER BY COUNT(qc.id) DESC;
$$ LANGUAGE SQL;
```

---

### Fase 9: Job de Sincronização (para novas questões)

```sql
-- Migration: 009_create_sync_job

-- Função que sincroniza FKs de questões sem FK preenchido
CREATE OR REPLACE FUNCTION sync_questoes_fks()
RETURNS TABLE (
  bancas_criadas INT,
  orgaos_criados INT,
  cargos_criados INT,
  materias_criadas INT,
  assuntos_criados INT,
  questoes_atualizadas INT
) AS $$
DECLARE
  v_bancas INT := 0;
  v_orgaos INT := 0;
  v_cargos INT := 0;
  v_materias INT := 0;
  v_assuntos INT := 0;
  v_questoes INT := 0;
BEGIN
  -- Criar bancas novas
  INSERT INTO bancas (nome)
  SELECT DISTINCT banca FROM questoes_concurso
  WHERE banca IS NOT NULL AND banca != ''
  AND banca NOT IN (SELECT nome FROM bancas)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_bancas = ROW_COUNT;

  -- Criar órgãos novos
  INSERT INTO orgaos (nome)
  SELECT DISTINCT orgao FROM questoes_concurso
  WHERE orgao IS NOT NULL AND orgao != ''
  AND orgao NOT IN (SELECT nome FROM orgaos)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_orgaos = ROW_COUNT;

  -- Criar cargos novos
  INSERT INTO cargos (nome)
  SELECT DISTINCT cargo_area_especialidade_edicao FROM questoes_concurso
  WHERE cargo_area_especialidade_edicao IS NOT NULL
  AND cargo_area_especialidade_edicao != ''
  AND cargo_area_especialidade_edicao NOT IN (SELECT nome FROM cargos)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_cargos = ROW_COUNT;

  -- Criar matérias novas
  INSERT INTO materias (nome, slug)
  SELECT DISTINCT
    materia,
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(UNACCENT(materia), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
  FROM questoes_concurso
  WHERE materia IS NOT NULL AND materia != ''
  AND materia NOT IN (SELECT nome FROM materias)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_materias = ROW_COUNT;

  -- Criar assuntos novos (nível 1)
  INSERT INTO assuntos (materia_id, nome, slug, nivel)
  SELECT DISTINCT
    m.id,
    qc.assunto,
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(UNACCENT(qc.assunto), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')),
    1
  FROM questoes_concurso qc
  JOIN materias m ON m.nome = qc.materia
  WHERE qc.assunto IS NOT NULL AND qc.assunto != ''
  AND NOT EXISTS (
    SELECT 1 FROM assuntos a
    WHERE a.materia_id = m.id AND a.nome = qc.assunto
  )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_assuntos = ROW_COUNT;

  -- Atualizar FKs nas questões
  UPDATE questoes_concurso qc SET banca_id = b.id FROM bancas b WHERE qc.banca = b.nome AND qc.banca_id IS NULL;
  UPDATE questoes_concurso qc SET orgao_id = o.id FROM orgaos o WHERE qc.orgao = o.nome AND qc.orgao_id IS NULL;
  UPDATE questoes_concurso qc SET cargo_id = c.id FROM cargos c WHERE qc.cargo_area_especialidade_edicao = c.nome AND qc.cargo_id IS NULL;
  UPDATE questoes_concurso qc SET materia_id = m.id FROM materias m WHERE qc.materia = m.nome AND qc.materia_id IS NULL;
  UPDATE questoes_concurso qc SET assunto_id = a.id FROM assuntos a JOIN materias m ON a.materia_id = m.id WHERE qc.materia = m.nome AND qc.assunto = a.nome AND qc.assunto_id IS NULL;

  SELECT COUNT(*) INTO v_questoes FROM questoes_concurso WHERE banca_id IS NOT NULL OR materia_id IS NOT NULL;

  RETURN QUERY SELECT v_bancas, v_orgaos, v_cargos, v_materias, v_assuntos, v_questoes;
END;
$$ LANGUAGE plpgsql;

-- Executar manualmente ou via cron
-- SELECT * FROM sync_questoes_fks();
```

---

### Fase 10: Validação

```sql
-- Queries de validação (rodar após cada fase)

-- Verificar tabelas auxiliares
SELECT 'bancas' as tabela, COUNT(*) as total FROM bancas
UNION ALL SELECT 'orgaos', COUNT(*) FROM orgaos
UNION ALL SELECT 'cargos', COUNT(*) FROM cargos
UNION ALL SELECT 'materias', COUNT(*) FROM materias
UNION ALL SELECT 'assuntos', COUNT(*) FROM assuntos;

-- Verificar preenchimento de FKs
SELECT
  COUNT(*) as total_questoes,
  COUNT(banca_id) as com_banca_id,
  COUNT(orgao_id) as com_orgao_id,
  COUNT(cargo_id) as com_cargo_id,
  COUNT(materia_id) as com_materia_id,
  COUNT(assunto_id) as com_assunto_id,
  ROUND(COUNT(banca_id)::numeric / COUNT(*)::numeric * 100, 2) as pct_banca,
  ROUND(COUNT(materia_id)::numeric / COUNT(*)::numeric * 100, 2) as pct_materia
FROM questoes_concurso;

-- Listar registros não mapeados
SELECT 'banca' as campo, banca as valor, COUNT(*) as qtd
FROM questoes_concurso
WHERE banca IS NOT NULL AND banca_id IS NULL
GROUP BY banca
ORDER BY qtd DESC
LIMIT 10;

-- Verificar integridade das hierarquias
SELECT
  nivel,
  COUNT(*) as total,
  COUNT(parent_id) as com_parent
FROM assuntos
GROUP BY nivel
ORDER BY nivel;
```

---

## Rollback Plan

Se necessário reverter completamente:

```sql
-- 1. Remover colunas FK das questões
ALTER TABLE questoes_concurso
DROP COLUMN IF EXISTS banca_id,
DROP COLUMN IF EXISTS orgao_id,
DROP COLUMN IF EXISTS cargo_id,
DROP COLUMN IF EXISTS materia_id,
DROP COLUMN IF EXISTS assunto_id;

-- 2. Remover views
DROP VIEW IF EXISTS questoes_concurso_v;
DROP VIEW IF EXISTS assuntos_hierarchy;

-- 3. Remover functions
DROP FUNCTION IF EXISTS get_assuntos_by_materia;
DROP FUNCTION IF EXISTS count_questoes_by_banca;
DROP FUNCTION IF EXISTS count_questoes_by_materia;
DROP FUNCTION IF EXISTS count_questoes_by_assunto;
DROP FUNCTION IF EXISTS sync_questoes_fks;

-- 4. Remover tabelas auxiliares
DROP TABLE IF EXISTS assuntos;
DROP TABLE IF EXISTS materias;
DROP TABLE IF EXISTS cargos;
DROP TABLE IF EXISTS orgaos;
DROP TABLE IF EXISTS bancas;

-- 5. Restaurar do backup (se necessário)
-- TRUNCATE questoes_concurso;
-- INSERT INTO questoes_concurso SELECT * FROM backups.questoes_concurso_20250106;
```

---

## Checklist de Execução

- [ ] **Fase 0:** Criar backups de segurança
- [ ] **Fase 1:** Criar tabelas auxiliares (bancas, orgaos, cargos, materias, assuntos)
- [ ] **Fase 2:** Adicionar colunas FK em questoes_concurso
- [ ] **Fase 3:** Popular tabelas auxiliares com dados existentes
- [ ] **Fase 4:** Popular hierarquia de assuntos
- [ ] **Fase 5:** Migrar FKs nas questões existentes
- [ ] **Fase 6:** Popular metadados (siglas, UF, esfera)
- [ ] **Fase 7:** Criar views de compatibilidade
- [ ] **Fase 8:** Criar functions helper
- [ ] **Fase 9:** Criar job de sincronização
- [ ] **Fase 10:** Validar migração
- [ ] Atualizar código da aplicação para usar FKs
- [ ] Monitorar por 1-2 semanas
- [ ] Remover campos texto antigos (opcional)
- [ ] Remover backups após estabilização

---

## Próximos Passos

1. Revisar e aprovar este plano
2. Executar Fase 0 (backup)
3. Executar Fases 1-10 em sequência
4. Validar dados migrados
5. Atualizar código frontend/backend
6. Monitorar e ajustar

---

*Última atualização: 2025-01-06*
