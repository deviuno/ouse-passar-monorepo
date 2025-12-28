-- Tabela para armazenar questões fixas de cada missão
-- Todas os usuários veem as mesmas questões por missão
CREATE TABLE IF NOT EXISTS missao_questoes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  missao_id UUID NOT NULL REFERENCES missoes(id) ON DELETE CASCADE,
  questao_id BIGINT NOT NULL, -- ID da questão no banco externo
  ordem INTEGER NOT NULL, -- Ordem da questão na missão (1, 2, 3...)
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Cada missão tem cada questão apenas uma vez, com ordem única
  UNIQUE(missao_id, questao_id),
  UNIQUE(missao_id, ordem)
);

-- Índice para busca rápida por missão
CREATE INDEX IF NOT EXISTS idx_missao_questoes_missao_id ON missao_questoes(missao_id);

-- Comentários
COMMENT ON TABLE missao_questoes IS 'Questões fixas associadas a cada missão. Todos os usuários veem as mesmas questões.';
COMMENT ON COLUMN missao_questoes.missao_id IS 'ID da missão';
COMMENT ON COLUMN missao_questoes.questao_id IS 'ID da questão no banco externo (questoes_concurso)';
COMMENT ON COLUMN missao_questoes.ordem IS 'Ordem de exibição da questão (1-based)';

-- RLS: Todos podem ver as questões das missões
ALTER TABLE missao_questoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view missao_questoes" ON missao_questoes
  FOR SELECT TO public USING (true);

-- Usuários autenticados podem inserir/atualizar (para salvar questões fixas)
CREATE POLICY "Authenticated users can insert missao_questoes" ON missao_questoes
  FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Authenticated users can update missao_questoes" ON missao_questoes
  FOR UPDATE TO authenticated USING (true) WITH CHECK (true);

-- Service role pode fazer tudo
CREATE POLICY "Service can manage missao_questoes" ON missao_questoes
  FOR ALL TO service_role USING (true) WITH CHECK (true);
