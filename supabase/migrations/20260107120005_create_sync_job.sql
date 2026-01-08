-- Migration: Create sync job for new questions
-- Phase 9: Function to sync FKs for new questions

-- Function that syncs FKs for questions without FK populated
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
  -- Create new bancas
  INSERT INTO bancas (nome)
  SELECT DISTINCT banca FROM questoes_concurso
  WHERE banca IS NOT NULL AND banca != ''
  AND banca NOT IN (SELECT nome FROM bancas)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_bancas = ROW_COUNT;

  -- Create new orgaos
  INSERT INTO orgaos (nome)
  SELECT DISTINCT orgao FROM questoes_concurso
  WHERE orgao IS NOT NULL AND orgao != ''
  AND orgao NOT IN (SELECT nome FROM orgaos)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_orgaos = ROW_COUNT;

  -- Create new cargos
  INSERT INTO cargos (nome)
  SELECT DISTINCT cargo_area_especialidade_edicao FROM questoes_concurso
  WHERE cargo_area_especialidade_edicao IS NOT NULL
  AND cargo_area_especialidade_edicao != ''
  AND cargo_area_especialidade_edicao NOT IN (SELECT nome FROM cargos)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_cargos = ROW_COUNT;

  -- Create new materias
  INSERT INTO materias (nome, slug)
  SELECT DISTINCT
    materia,
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(UNACCENT(materia), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g'))
  FROM questoes_concurso
  WHERE materia IS NOT NULL AND materia != ''
  AND materia NOT IN (SELECT nome FROM materias)
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_materias = ROW_COUNT;

  -- Create new assuntos (level 1)
  INSERT INTO assuntos_normalized (materia_id, nome, slug, nivel)
  SELECT DISTINCT
    m.id,
    qc.assunto,
    LOWER(REGEXP_REPLACE(REGEXP_REPLACE(UNACCENT(qc.assunto), '[^a-zA-Z0-9\s-]', '', 'g'), '\s+', '-', 'g')),
    1
  FROM questoes_concurso qc
  JOIN materias m ON m.nome = qc.materia
  WHERE qc.assunto IS NOT NULL AND qc.assunto != ''
  AND NOT EXISTS (
    SELECT 1 FROM assuntos_normalized a
    WHERE a.materia_id = m.id AND a.nome = qc.assunto
  )
  ON CONFLICT DO NOTHING;
  GET DIAGNOSTICS v_assuntos = ROW_COUNT;

  -- Update FKs in questions
  UPDATE questoes_concurso qc SET banca_id = b.id FROM bancas b WHERE qc.banca = b.nome AND qc.banca_id IS NULL;
  UPDATE questoes_concurso qc SET orgao_id = o.id FROM orgaos o WHERE qc.orgao = o.nome AND qc.orgao_id IS NULL;
  UPDATE questoes_concurso qc SET cargo_id = c.id FROM cargos c WHERE qc.cargo_area_especialidade_edicao = c.nome AND qc.cargo_id IS NULL;
  UPDATE questoes_concurso qc SET materia_id = m.id FROM materias m WHERE qc.materia = m.nome AND qc.materia_id IS NULL;
  UPDATE questoes_concurso qc SET assunto_normalized_id = a.id FROM assuntos_normalized a JOIN materias m ON a.materia_id = m.id WHERE qc.materia = m.nome AND qc.assunto = a.nome AND qc.assunto_normalized_id IS NULL;

  SELECT COUNT(*) INTO v_questoes FROM questoes_concurso WHERE banca_id IS NOT NULL OR materia_id IS NOT NULL;

  RETURN QUERY SELECT v_bancas, v_orgaos, v_cargos, v_materias, v_assuntos, v_questoes;
END;
$$ LANGUAGE plpgsql;

-- Comment for documentation
COMMENT ON FUNCTION sync_questoes_fks() IS 'Syncs FK columns in questoes_concurso with auxiliary tables. Run periodically or after importing new questions.';
