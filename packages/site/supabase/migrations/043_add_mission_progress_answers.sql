-- Adicionar campos para salvar progresso de missão em andamento
ALTER TABLE user_missao_progress
ADD COLUMN IF NOT EXISTS answers_json JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS current_question_index INTEGER DEFAULT 0;

COMMENT ON COLUMN user_missao_progress.answers_json IS 'JSON com respostas: {"questionId": {"letter": "A", "correct": true}}';
COMMENT ON COLUMN user_missao_progress.current_question_index IS 'Índice da questão atual (0-based)';
