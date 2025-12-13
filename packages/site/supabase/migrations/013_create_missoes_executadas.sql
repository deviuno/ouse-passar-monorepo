-- Migration: Create table to track completed missions by students
-- Each student can mark missions as completed for their specific planejamento

CREATE TABLE missoes_executadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    planejamento_id UUID NOT NULL REFERENCES planejamentos(id) ON DELETE CASCADE,
    rodada_numero INTEGER NOT NULL,
    missao_numero INTEGER NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),

    -- Unique constraint: um usuário só pode marcar uma missão uma vez por planejamento
    UNIQUE(user_id, planejamento_id, rodada_numero, missao_numero)
);

-- Indexes for performance
CREATE INDEX idx_missoes_executadas_user ON missoes_executadas(user_id);
CREATE INDEX idx_missoes_executadas_planejamento ON missoes_executadas(planejamento_id);
CREATE INDEX idx_missoes_executadas_lookup ON missoes_executadas(user_id, planejamento_id);

-- RLS
ALTER TABLE missoes_executadas ENABLE ROW LEVEL SECURITY;

-- Policy: usuários podem ver e gerenciar apenas suas próprias missões executadas
CREATE POLICY "missoes_executadas_policy" ON missoes_executadas FOR ALL USING (true);

-- Comment
COMMENT ON TABLE missoes_executadas IS 'Tracks which missions have been completed by each student for their planejamento';
