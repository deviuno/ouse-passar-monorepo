-- Migration: Atualizar funções RPC get_distinct_* e get_filtered_* para filtrar apenas questões ativas
-- Banco: Questões (swzosaapqtyhmwdiwdje)
--
-- Esta migration atualiza as funções RPC de filtros DISTINCT para incluir filtro ativo = true
-- Execute APÓS a migration 001_add_ativo_column.sql
--
-- Execute no Supabase Dashboard > SQL Editor

-- ============================================================================
-- FUNÇÕES GET_DISTINCT_* (Opções sem filtros)
-- ============================================================================

-- 1. get_distinct_materias
CREATE OR REPLACE FUNCTION get_distinct_materias()
RETURNS TABLE(materia TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT qc.materia
    FROM questoes_concurso qc
    WHERE qc.materia IS NOT NULL
      AND qc.materia != ''
      AND qc.ativo = true
    ORDER BY qc.materia;
END;
$$;

-- 2. get_distinct_bancas
CREATE OR REPLACE FUNCTION get_distinct_bancas()
RETURNS TABLE(banca TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT qc.banca
    FROM questoes_concurso qc
    WHERE qc.banca IS NOT NULL
      AND qc.banca != ''
      AND qc.ativo = true
    ORDER BY qc.banca;
END;
$$;

-- 3. get_distinct_anos
CREATE OR REPLACE FUNCTION get_distinct_anos()
RETURNS TABLE(ano INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT qc.ano
    FROM questoes_concurso qc
    WHERE qc.ano IS NOT NULL
      AND qc.ativo = true
    ORDER BY qc.ano DESC;
END;
$$;

-- 4. get_distinct_orgaos
CREATE OR REPLACE FUNCTION get_distinct_orgaos()
RETURNS TABLE(orgao TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT qc.orgao
    FROM questoes_concurso qc
    WHERE qc.orgao IS NOT NULL
      AND qc.orgao != ''
      AND qc.ativo = true
    ORDER BY qc.orgao;
END;
$$;

-- 5. get_distinct_cargos
CREATE OR REPLACE FUNCTION get_distinct_cargos()
RETURNS TABLE(cargo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT qc.cargo_area_especialidade_edicao AS cargo
    FROM questoes_concurso qc
    WHERE qc.cargo_area_especialidade_edicao IS NOT NULL
      AND qc.cargo_area_especialidade_edicao != ''
      AND qc.ativo = true
    ORDER BY cargo;
END;
$$;

-- ============================================================================
-- FUNÇÕES GET_FILTERED_* (Opções com filtros dinâmicos)
-- ============================================================================

-- 1. get_filtered_materias
CREATE OR REPLACE FUNCTION get_filtered_materias(
    p_bancas TEXT[] DEFAULT NULL,
    p_anos INTEGER[] DEFAULT NULL,
    p_orgaos TEXT[] DEFAULT NULL,
    p_cargos TEXT[] DEFAULT NULL
)
RETURNS TABLE(materia TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT qc.materia
    FROM questoes_concurso qc
    WHERE qc.materia IS NOT NULL
      AND qc.materia != ''
      AND qc.ativo = true
      AND (p_bancas IS NULL OR qc.banca = ANY(p_bancas))
      AND (p_anos IS NULL OR qc.ano = ANY(p_anos))
      AND (p_orgaos IS NULL OR qc.orgao = ANY(p_orgaos))
      AND (p_cargos IS NULL OR qc.cargo_area_especialidade_edicao = ANY(p_cargos))
    ORDER BY qc.materia;
END;
$$;

-- 2. get_filtered_bancas
CREATE OR REPLACE FUNCTION get_filtered_bancas(
    p_materias TEXT[] DEFAULT NULL,
    p_anos INTEGER[] DEFAULT NULL,
    p_orgaos TEXT[] DEFAULT NULL,
    p_cargos TEXT[] DEFAULT NULL
)
RETURNS TABLE(banca TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT qc.banca
    FROM questoes_concurso qc
    WHERE qc.banca IS NOT NULL
      AND qc.banca != ''
      AND qc.ativo = true
      AND (p_materias IS NULL OR qc.materia = ANY(p_materias))
      AND (p_anos IS NULL OR qc.ano = ANY(p_anos))
      AND (p_orgaos IS NULL OR qc.orgao = ANY(p_orgaos))
      AND (p_cargos IS NULL OR qc.cargo_area_especialidade_edicao = ANY(p_cargos))
    ORDER BY qc.banca;
END;
$$;

-- 3. get_filtered_anos
CREATE OR REPLACE FUNCTION get_filtered_anos(
    p_materias TEXT[] DEFAULT NULL,
    p_bancas TEXT[] DEFAULT NULL,
    p_orgaos TEXT[] DEFAULT NULL,
    p_cargos TEXT[] DEFAULT NULL
)
RETURNS TABLE(ano INTEGER)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT qc.ano
    FROM questoes_concurso qc
    WHERE qc.ano IS NOT NULL
      AND qc.ativo = true
      AND (p_materias IS NULL OR qc.materia = ANY(p_materias))
      AND (p_bancas IS NULL OR qc.banca = ANY(p_bancas))
      AND (p_orgaos IS NULL OR qc.orgao = ANY(p_orgaos))
      AND (p_cargos IS NULL OR qc.cargo_area_especialidade_edicao = ANY(p_cargos))
    ORDER BY qc.ano DESC;
END;
$$;

-- 4. get_filtered_orgaos
CREATE OR REPLACE FUNCTION get_filtered_orgaos(
    p_materias TEXT[] DEFAULT NULL,
    p_bancas TEXT[] DEFAULT NULL,
    p_anos INTEGER[] DEFAULT NULL,
    p_cargos TEXT[] DEFAULT NULL
)
RETURNS TABLE(orgao TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT qc.orgao
    FROM questoes_concurso qc
    WHERE qc.orgao IS NOT NULL
      AND qc.orgao != ''
      AND qc.ativo = true
      AND (p_materias IS NULL OR qc.materia = ANY(p_materias))
      AND (p_bancas IS NULL OR qc.banca = ANY(p_bancas))
      AND (p_anos IS NULL OR qc.ano = ANY(p_anos))
      AND (p_cargos IS NULL OR qc.cargo_area_especialidade_edicao = ANY(p_cargos))
    ORDER BY qc.orgao;
END;
$$;

-- 5. get_filtered_cargos
CREATE OR REPLACE FUNCTION get_filtered_cargos(
    p_materias TEXT[] DEFAULT NULL,
    p_bancas TEXT[] DEFAULT NULL,
    p_anos INTEGER[] DEFAULT NULL,
    p_orgaos TEXT[] DEFAULT NULL
)
RETURNS TABLE(cargo TEXT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT DISTINCT qc.cargo_area_especialidade_edicao AS cargo
    FROM questoes_concurso qc
    WHERE qc.cargo_area_especialidade_edicao IS NOT NULL
      AND qc.cargo_area_especialidade_edicao != ''
      AND qc.ativo = true
      AND (p_materias IS NULL OR qc.materia = ANY(p_materias))
      AND (p_bancas IS NULL OR qc.banca = ANY(p_bancas))
      AND (p_anos IS NULL OR qc.ano = ANY(p_anos))
      AND (p_orgaos IS NULL OR qc.orgao = ANY(p_orgaos))
    ORDER BY cargo;
END;
$$;

-- ============================================================================
-- COMENTÁRIOS
-- ============================================================================

COMMENT ON FUNCTION get_distinct_materias() IS 'Retorna matérias únicas de questões ativas';
COMMENT ON FUNCTION get_distinct_bancas() IS 'Retorna bancas únicas de questões ativas';
COMMENT ON FUNCTION get_distinct_anos() IS 'Retorna anos únicos de questões ativas';
COMMENT ON FUNCTION get_distinct_orgaos() IS 'Retorna órgãos únicos de questões ativas';
COMMENT ON FUNCTION get_distinct_cargos() IS 'Retorna cargos únicos de questões ativas';

COMMENT ON FUNCTION get_filtered_materias(TEXT[], INTEGER[], TEXT[], TEXT[]) IS 'Retorna matérias únicas com filtros, apenas questões ativas';
COMMENT ON FUNCTION get_filtered_bancas(TEXT[], INTEGER[], TEXT[], TEXT[]) IS 'Retorna bancas únicas com filtros, apenas questões ativas';
COMMENT ON FUNCTION get_filtered_anos(TEXT[], TEXT[], TEXT[], TEXT[]) IS 'Retorna anos únicos com filtros, apenas questões ativas';
COMMENT ON FUNCTION get_filtered_orgaos(TEXT[], TEXT[], INTEGER[], TEXT[]) IS 'Retorna órgãos únicos com filtros, apenas questões ativas';
COMMENT ON FUNCTION get_filtered_cargos(TEXT[], TEXT[], INTEGER[], TEXT[]) IS 'Retorna cargos únicos com filtros, apenas questões ativas';

-- Verificação
SELECT 'Funções get_distinct_* e get_filtered_* atualizadas para filtrar ativo = true' as status;
