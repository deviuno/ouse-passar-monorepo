-- Script: Enfileirar questões inativas para processamento por IA
-- Banco: Questões (swzosaapqtyhmwdiwdje)
--
-- Este script encontra questões inativas que têm comentário
-- e as enfileira para processamento pelo agente de IA
--
-- Execute no Supabase Dashboard > SQL Editor

-- ============================================================================
-- 1. VERIFICAR QUANTAS QUESTÕES INATIVAS PODEM SER RECUPERADAS
-- ============================================================================

-- Contar questões inativas com comentário (candidatas à recuperação)
SELECT
    'Questões inativas COM comentário (candidatas)' as categoria,
    COUNT(*) as quantidade
FROM questoes_concurso
WHERE ativo = false
  AND comentario IS NOT NULL
  AND comentario != ''
  AND (gabarito IS NULL OR gabarito = '')
  AND enunciado IS NOT NULL
  AND enunciado != ''
  AND enunciado != 'deleted'

UNION ALL

-- Contar questões inativas sem comentário (não podem ser recuperadas)
SELECT
    'Questões inativas SEM comentário (irrecuperáveis)' as categoria,
    COUNT(*) as quantidade
FROM questoes_concurso
WHERE ativo = false
  AND (comentario IS NULL OR comentario = '')

UNION ALL

-- Contar questões inativas com enunciado deletado
SELECT
    'Questões com enunciado deletado (irrecuperáveis)' as categoria,
    COUNT(*) as quantidade
FROM questoes_concurso
WHERE enunciado = 'deleted' OR enunciado IS NULL OR enunciado = ''

UNION ALL

-- Total de questões inativas
SELECT
    'Total de questões inativas' as categoria,
    COUNT(*) as quantidade
FROM questoes_concurso
WHERE ativo = false;

-- ============================================================================
-- 2. ENFILEIRAR QUESTÕES INATIVAS PARA PROCESSAMENTO POR IA
-- ============================================================================

-- Inserir na fila de processamento (ignora duplicatas)
INSERT INTO questoes_pendentes_ia (questao_id, status, tentativas)
SELECT
    id as questao_id,
    'pendente' as status,
    0 as tentativas
FROM questoes_concurso
WHERE ativo = false
  AND comentario IS NOT NULL
  AND comentario != ''
  AND (gabarito IS NULL OR gabarito = '')
  AND enunciado IS NOT NULL
  AND enunciado != ''
  AND enunciado != 'deleted'
ON CONFLICT (questao_id) DO UPDATE SET
    status = 'pendente',
    tentativas = 0,
    erro = NULL,
    processed_at = NULL;

-- ============================================================================
-- 3. VERIFICAR RESULTADO
-- ============================================================================

SELECT
    'Questões enfileiradas para IA' as resultado,
    COUNT(*) as quantidade
FROM questoes_pendentes_ia
WHERE status = 'pendente';
