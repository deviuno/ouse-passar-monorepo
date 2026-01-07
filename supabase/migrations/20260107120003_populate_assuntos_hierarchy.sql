-- Migration: Populate assuntos hierarchy
-- Phase 4: Create hierarchical assuntos from taxonomia

-- 4.1 Assuntos level 1 from taxonomy
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assuntos_taxonomia') THEN
    INSERT INTO assuntos_normalized (materia_id, nome, slug, nivel)
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
  END IF;
END $$;

-- 4.2 Assuntos from questoes_concurso (level 1)
INSERT INTO assuntos_normalized (materia_id, nome, slug, nivel)
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

-- 4.3 Assuntos level 2 from taxonomy
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assuntos_taxonomia') THEN
    INSERT INTO assuntos_normalized (materia_id, parent_id, nome, slug, nivel)
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
    JOIN assuntos_normalized a1 ON a1.materia_id = m.id
      AND a1.nome = at.assunto_nivel_1
      AND a1.nivel = 1
    WHERE at.assunto_nivel_2 IS NOT NULL AND at.assunto_nivel_2 != ''
    ON CONFLICT (materia_id, slug) DO NOTHING;
  END IF;
END $$;

-- 4.4 Assuntos level 3 from taxonomy
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assuntos_taxonomia') THEN
    INSERT INTO assuntos_normalized (materia_id, parent_id, nome, slug, nivel)
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
    JOIN assuntos_normalized a1 ON a1.materia_id = m.id
      AND a1.nome = at.assunto_nivel_1
      AND a1.nivel = 1
    JOIN assuntos_normalized a2 ON a2.parent_id = a1.id
      AND a2.nome = at.assunto_nivel_2
      AND a2.nivel = 2
    WHERE at.assunto_nivel_3 IS NOT NULL AND at.assunto_nivel_3 != ''
    ON CONFLICT (materia_id, slug) DO NOTHING;
  END IF;
END $$;
