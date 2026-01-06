# Plano de Migração: Reestruturação de Matérias e Assuntos

## Objetivo

Reestruturar o banco de questões para separar matérias e assuntos em tabelas normalizadas, permitindo:
- Relacionamentos hierárquicos entre assuntos (até 3 níveis)
- Consistência de dados via FKs
- Melhor manutenção e expansão do banco
- Queries mais eficientes para filtros e relatórios

## Estrutura Atual

Atualmente, as questões têm campos de texto simples:
- `materia` (varchar) - Ex: "Língua Portuguesa"
- `assunto` (varchar) - Ex: "Interpretação de Texto"

Existe também a tabela `assuntos_taxonomia` com estrutura hierárquica, mas não está sendo usada como FK nas questões.

## Nova Estrutura Proposta

### Tabela: `materias`

```sql
CREATE TABLE materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL UNIQUE,
  descricao TEXT,
  cor VARCHAR(7), -- hex color para UI
  icone VARCHAR(100), -- nome do ícone
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
  materia_id UUID NOT NULL REFERENCES materias(id),
  parent_id UUID REFERENCES assuntos(id), -- para hierarquia
  nome VARCHAR(255) NOT NULL,
  slug VARCHAR(255) NOT NULL,
  nivel INT NOT NULL DEFAULT 1, -- 1, 2 ou 3
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
```

### Alteração na tabela `questoes_concurso`

```sql
-- Adicionar novas colunas FK
ALTER TABLE questoes_concurso
ADD COLUMN materia_id UUID REFERENCES materias(id),
ADD COLUMN assunto_id UUID REFERENCES assuntos(id);

-- Criar índices para as novas colunas
CREATE INDEX idx_questoes_materia_id ON questoes_concurso(materia_id);
CREATE INDEX idx_questoes_assunto_id ON questoes_concurso(assunto_id);
```

---

## Fases da Migração

### Fase 1: Criar Novas Tabelas (DDL)

```sql
-- Migration: create_materias_assuntos_tables

-- Tabela de matérias
CREATE TABLE IF NOT EXISTS materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome VARCHAR(255) NOT NULL,
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
CREATE INDEX IF NOT EXISTS idx_materias_slug ON materias(slug);
CREATE INDEX IF NOT EXISTS idx_materias_nome ON materias(nome);
CREATE INDEX IF NOT EXISTS idx_assuntos_materia ON assuntos(materia_id);
CREATE INDEX IF NOT EXISTS idx_assuntos_parent ON assuntos(parent_id);
CREATE INDEX IF NOT EXISTS idx_assuntos_slug ON assuntos(slug);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_materias_updated_at
  BEFORE UPDATE ON materias
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assuntos_updated_at
  BEFORE UPDATE ON assuntos
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Fase 2: Adicionar Colunas FK nas Questões

```sql
-- Migration: add_fk_columns_to_questoes

ALTER TABLE questoes_concurso
ADD COLUMN IF NOT EXISTS materia_id UUID REFERENCES materias(id),
ADD COLUMN IF NOT EXISTS assunto_id UUID REFERENCES assuntos(id);

CREATE INDEX IF NOT EXISTS idx_questoes_materia_id ON questoes_concurso(materia_id);
CREATE INDEX IF NOT EXISTS idx_questoes_assunto_id ON questoes_concurso(assunto_id);
```

### Fase 3: Popular Tabela de Matérias

```sql
-- Migration: populate_materias

-- Extrair matérias únicas das questões existentes
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
ON CONFLICT (slug) DO NOTHING;

-- Também inserir da taxonomia existente
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
ON CONFLICT (slug) DO NOTHING;
```

### Fase 4: Popular Tabela de Assuntos (Nível 1)

```sql
-- Migration: populate_assuntos_nivel_1

-- Inserir assuntos de nível 1 da taxonomia existente
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

-- Também extrair das questões (campo assunto)
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
```

### Fase 5: Popular Assuntos Níveis 2 e 3

```sql
-- Migration: populate_assuntos_niveis_2_3

-- Nível 2
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

-- Nível 3
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

### Fase 6: Migrar FKs nas Questões

```sql
-- Migration: update_questoes_fks

-- Atualizar materia_id
UPDATE questoes_concurso qc
SET materia_id = m.id
FROM materias m
WHERE qc.materia = m.nome
AND qc.materia_id IS NULL;

-- Atualizar assunto_id (busca o assunto correspondente na matéria)
UPDATE questoes_concurso qc
SET assunto_id = a.id
FROM assuntos a
JOIN materias m ON a.materia_id = m.id
WHERE qc.materia = m.nome
AND qc.assunto = a.nome
AND qc.assunto_id IS NULL;
```

### Fase 7: Criar Views de Compatibilidade

```sql
-- Migration: create_compatibility_views

-- View que mantém compatibilidade com código antigo
CREATE OR REPLACE VIEW questoes_concurso_v AS
SELECT
  qc.*,
  m.nome as materia_nome,
  m.slug as materia_slug,
  a.nome as assunto_nome,
  a.slug as assunto_slug,
  a.nivel as assunto_nivel,
  -- Caminho completo do assunto
  CASE
    WHEN a.nivel = 1 THEN a.nome
    WHEN a.nivel = 2 THEN (SELECT nome FROM assuntos WHERE id = a.parent_id) || ' > ' || a.nome
    WHEN a.nivel = 3 THEN (
      SELECT p1.nome || ' > ' || p2.nome || ' > ' || a.nome
      FROM assuntos p2
      JOIN assuntos p1 ON p2.parent_id = p1.id
      WHERE p2.id = a.parent_id
    )
  END as assunto_path
FROM questoes_concurso qc
LEFT JOIN materias m ON qc.materia_id = m.id
LEFT JOIN assuntos a ON qc.assunto_id = a.id;

-- View de hierarquia de assuntos
CREATE OR REPLACE VIEW assuntos_hierarchy AS
WITH RECURSIVE assunto_tree AS (
  -- Base: assuntos nível 1
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

  -- Recursivo: níveis 2 e 3
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

### Fase 8: Criar Functions Helper

```sql
-- Migration: create_helper_functions

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

### Fase 9: Validação e Limpeza

```sql
-- Queries de validação (rodar manualmente, não em migration)

-- Verificar questões sem materia_id
SELECT COUNT(*) as questoes_sem_materia
FROM questoes_concurso
WHERE materia IS NOT NULL AND materia_id IS NULL;

-- Verificar questões sem assunto_id
SELECT COUNT(*) as questoes_sem_assunto
FROM questoes_concurso
WHERE assunto IS NOT NULL AND assunto_id IS NULL;

-- Listar matérias não mapeadas
SELECT DISTINCT materia
FROM questoes_concurso
WHERE materia IS NOT NULL AND materia_id IS NULL;

-- Listar assuntos não mapeados
SELECT DISTINCT materia, assunto
FROM questoes_concurso
WHERE assunto IS NOT NULL AND assunto_id IS NULL;

-- Estatísticas gerais
SELECT
  (SELECT COUNT(*) FROM materias) as total_materias,
  (SELECT COUNT(*) FROM assuntos) as total_assuntos,
  (SELECT COUNT(*) FROM assuntos WHERE nivel = 1) as assuntos_n1,
  (SELECT COUNT(*) FROM assuntos WHERE nivel = 2) as assuntos_n2,
  (SELECT COUNT(*) FROM assuntos WHERE nivel = 3) as assuntos_n3,
  (SELECT COUNT(*) FROM questoes_concurso WHERE materia_id IS NOT NULL) as questoes_com_materia,
  (SELECT COUNT(*) FROM questoes_concurso WHERE assunto_id IS NOT NULL) as questoes_com_assunto;
```

---

## Rollback Plan

Se necessário reverter:

```sql
-- Remover colunas FK
ALTER TABLE questoes_concurso DROP COLUMN IF EXISTS materia_id;
ALTER TABLE questoes_concurso DROP COLUMN IF EXISTS assunto_id;

-- Remover views
DROP VIEW IF EXISTS questoes_concurso_v;
DROP VIEW IF EXISTS assuntos_hierarchy;

-- Remover functions
DROP FUNCTION IF EXISTS get_assuntos_by_materia;
DROP FUNCTION IF EXISTS count_questoes_by_materia;
DROP FUNCTION IF EXISTS count_questoes_by_assunto;

-- Remover tabelas (cuidado: perda de dados)
DROP TABLE IF EXISTS assuntos;
DROP TABLE IF EXISTS materias;
```

---

## Considerações Importantes

1. **Backup**: Fazer backup completo antes de iniciar
2. **Ambiente de Teste**: Testar todas as migrations em branch/ambiente de desenvolvimento
3. **Aplicação**: Atualizar código da aplicação para usar as novas FKs
4. **Transição Gradual**: Manter campos texto antigos até confirmar que tudo funciona
5. **Performance**: Monitorar queries após migração

---

## Timeline Sugerido

- [ ] Fase 1-2: Criar estrutura (sem impacto na aplicação)
- [ ] Fase 3-5: Popular dados (sem impacto)
- [ ] Fase 6: Migrar FKs (sem impacto)
- [ ] Fase 7-8: Views e functions (sem impacto)
- [ ] Teste: Validar dados migrados
- [ ] Atualizar código da aplicação para usar FKs
- [ ] Remover campos texto antigos (após período de estabilização)

---

## Próximos Passos

1. Revisar e aprovar este plano
2. Criar branch de desenvolvimento no Supabase
3. Executar migrations na branch
4. Validar dados migrados
5. Testar aplicação com novos relacionamentos
6. Merge para produção
