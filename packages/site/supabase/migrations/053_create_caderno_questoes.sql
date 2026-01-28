-- Create junction table for saved questions in cadernos (notebooks)
-- This allows users to save specific questions to notebooks
-- in addition to the filter-based functionality

CREATE TABLE IF NOT EXISTS caderno_questoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  caderno_id UUID NOT NULL REFERENCES cadernos(id) ON DELETE CASCADE,
  questao_id BIGINT NOT NULL,
  nota TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(caderno_id, questao_id)
);

-- Indexes for performance
CREATE INDEX idx_caderno_questoes_caderno ON caderno_questoes(caderno_id);
CREATE INDEX idx_caderno_questoes_questao ON caderno_questoes(questao_id);

-- Add saved_questions_count column to cadernos table
ALTER TABLE cadernos ADD COLUMN IF NOT EXISTS saved_questions_count INTEGER DEFAULT 0;

-- Enable RLS
ALTER TABLE caderno_questoes ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only manage caderno_questoes for their own cadernos
CREATE POLICY "Users manage own caderno_questoes" ON caderno_questoes
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM cadernos WHERE id = caderno_id AND user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM cadernos WHERE id = caderno_id AND user_id = auth.uid()));

-- Trigger function to automatically update saved_questions_count
CREATE OR REPLACE FUNCTION update_caderno_saved_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE cadernos SET saved_questions_count = saved_questions_count + 1 WHERE id = NEW.caderno_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE cadernos SET saved_questions_count = saved_questions_count - 1 WHERE id = OLD.caderno_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
CREATE TRIGGER trg_caderno_saved_count
  AFTER INSERT OR DELETE ON caderno_questoes
  FOR EACH ROW EXECUTE FUNCTION update_caderno_saved_count();
