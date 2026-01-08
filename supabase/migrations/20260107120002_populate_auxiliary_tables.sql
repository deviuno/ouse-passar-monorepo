-- Migration: Populate auxiliary tables from existing data
-- Phase 3: Extract unique values from questoes_concurso

-- 3.1 Populate bancas
INSERT INTO bancas (nome)
SELECT DISTINCT banca
FROM questoes_concurso
WHERE banca IS NOT NULL AND banca != ''
ON CONFLICT (nome) DO NOTHING;

-- 3.2 Populate orgaos
INSERT INTO orgaos (nome)
SELECT DISTINCT orgao
FROM questoes_concurso
WHERE orgao IS NOT NULL AND orgao != ''
ON CONFLICT (nome) DO NOTHING;

-- 3.3 Populate cargos (full name as stored)
INSERT INTO cargos (nome)
SELECT DISTINCT cargo_area_especialidade_edicao
FROM questoes_concurso
WHERE cargo_area_especialidade_edicao IS NOT NULL
AND cargo_area_especialidade_edicao != ''
ON CONFLICT DO NOTHING;

-- 3.4 Populate materias from questoes_concurso
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

-- 3.5 Also populate from assuntos_taxonomia if it exists
DO $$
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'assuntos_taxonomia') THEN
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
  END IF;
END $$;
