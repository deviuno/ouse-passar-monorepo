-- Migration: Update FK columns in questoes_concurso
-- Phase 5: Link existing questions to auxiliary tables

-- 5.1 Update banca_id
UPDATE questoes_concurso qc
SET banca_id = b.id
FROM bancas b
WHERE qc.banca = b.nome
AND qc.banca_id IS NULL;

-- 5.2 Update orgao_id
UPDATE questoes_concurso qc
SET orgao_id = o.id
FROM orgaos o
WHERE qc.orgao = o.nome
AND qc.orgao_id IS NULL;

-- 5.3 Update cargo_id
UPDATE questoes_concurso qc
SET cargo_id = c.id
FROM cargos c
WHERE qc.cargo_area_especialidade_edicao = c.nome
AND qc.cargo_id IS NULL;

-- 5.4 Update materia_id
UPDATE questoes_concurso qc
SET materia_id = m.id
FROM materias m
WHERE qc.materia = m.nome
AND qc.materia_id IS NULL;

-- 5.5 Update assunto_normalized_id
UPDATE questoes_concurso qc
SET assunto_normalized_id = a.id
FROM assuntos_normalized a
JOIN materias m ON a.materia_id = m.id
WHERE qc.materia = m.nome
AND qc.assunto = a.nome
AND qc.assunto_normalized_id IS NULL;
