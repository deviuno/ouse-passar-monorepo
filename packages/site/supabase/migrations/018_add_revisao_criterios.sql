-- =====================================================
-- Migration 018: Campo revisao_criterios para missões
-- =====================================================
-- Adiciona campo para definir quais tipos de questões
-- entrarão na revisão:
-- - erradas: questões que o aluno errou
-- - dificil: questões que acertou mas marcou como difícil
-- - medio: questões que acertou e marcou como médio
-- - facil: questões que acertou e marcou como fácil
-- =====================================================

-- Adicionar campo revisao_criterios como array de texto
ALTER TABLE missoes ADD COLUMN IF NOT EXISTS revisao_criterios TEXT[] DEFAULT ARRAY['erradas'];

-- Comentário para documentação
COMMENT ON COLUMN missoes.revisao_criterios IS 'Array de critérios para filtrar questões na revisão: erradas, dificil, medio, facil';

-- Notificar PostgREST para recarregar schema
NOTIFY pgrst, 'reload schema';
