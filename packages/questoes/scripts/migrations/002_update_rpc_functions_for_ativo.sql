-- Migration: Atualizar funções RPC para filtrar apenas questões ativas
-- Banco: Questões (swzosaapqtyhmwdiwdje)
--
-- Esta migration atualiza as funções RPC para incluir filtro ativo = true
-- Execute APÓS a migration 001_add_ativo_column.sql
--
-- Execute no Supabase Dashboard > SQL Editor

-- 1. Atualizar função get_all_filter_options para filtrar apenas questões ativas
CREATE OR REPLACE FUNCTION get_all_filter_options()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSON;
BEGIN
    SELECT json_build_object(
        'materias', COALESCE((
            SELECT json_agg(DISTINCT materia ORDER BY materia)
            FROM questoes_concurso
            WHERE materia IS NOT NULL
              AND materia != ''
              AND ativo = true
        ), '[]'::json),
        'bancas', COALESCE((
            SELECT json_agg(DISTINCT banca ORDER BY banca)
            FROM questoes_concurso
            WHERE banca IS NOT NULL
              AND banca != ''
              AND ativo = true
        ), '[]'::json),
        'orgaos', COALESCE((
            SELECT json_agg(DISTINCT orgao ORDER BY orgao)
            FROM questoes_concurso
            WHERE orgao IS NOT NULL
              AND orgao != ''
              AND ativo = true
        ), '[]'::json),
        'cargos', COALESCE((
            SELECT json_agg(DISTINCT cargo_area_especialidade_edicao ORDER BY cargo_area_especialidade_edicao)
            FROM questoes_concurso
            WHERE cargo_area_especialidade_edicao IS NOT NULL
              AND cargo_area_especialidade_edicao != ''
              AND ativo = true
        ), '[]'::json),
        'anos', COALESCE((
            SELECT json_agg(DISTINCT ano ORDER BY ano DESC)
            FROM questoes_concurso
            WHERE ano IS NOT NULL
              AND ativo = true
        ), '[]'::json)
    ) INTO result;

    RETURN result;
END;
$$;

-- 2. Atualizar função get_questions_count para filtrar apenas questões ativas
CREATE OR REPLACE FUNCTION get_questions_count(
    p_materias TEXT[] DEFAULT NULL,
    p_assuntos TEXT[] DEFAULT NULL,
    p_bancas TEXT[] DEFAULT NULL,
    p_orgaos TEXT[] DEFAULT NULL,
    p_anos INTEGER[] DEFAULT NULL,
    p_cargos TEXT[] DEFAULT NULL,
    p_apenas_revisadas BOOLEAN DEFAULT FALSE,
    p_apenas_com_comentario BOOLEAN DEFAULT FALSE
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    total INTEGER;
BEGIN
    SELECT COUNT(*)
    INTO total
    FROM questoes_concurso
    WHERE ativo = true  -- Apenas questões ativas
      AND (p_materias IS NULL OR materia = ANY(p_materias))
      AND (p_assuntos IS NULL OR assunto = ANY(p_assuntos))
      AND (p_bancas IS NULL OR banca = ANY(p_bancas))
      AND (p_orgaos IS NULL OR orgao = ANY(p_orgaos))
      AND (p_anos IS NULL OR ano = ANY(p_anos))
      AND (p_cargos IS NULL OR cargo_area_especialidade_edicao = ANY(p_cargos))
      AND (NOT p_apenas_revisadas OR questao_revisada IN ('true', 'sim'))
      AND (NOT p_apenas_com_comentario OR (comentario IS NOT NULL AND comentario != ''))
      AND enunciado IS NOT NULL
      AND enunciado != ''
      AND enunciado != 'deleted';

    RETURN COALESCE(total, 0);
END;
$$;

-- 3. Comentários nas funções
COMMENT ON FUNCTION get_all_filter_options() IS 'Retorna opções de filtro únicas (matérias, bancas, órgãos, cargos, anos) apenas de questões ativas';
COMMENT ON FUNCTION get_questions_count IS 'Conta questões com filtros opcionais, apenas questões ativas';

-- Verificação
SELECT 'get_all_filter_options e get_questions_count atualizados para filtrar ativo = true' as status;
