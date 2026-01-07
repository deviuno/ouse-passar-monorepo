-- Migration: Add FK columns to questoes_concurso
-- Phase 2: Add banca_id, orgao_id, cargo_id, materia_id, assunto_id columns

-- Add FK columns (nullable to allow gradual migration)
ALTER TABLE questoes_concurso
ADD COLUMN IF NOT EXISTS banca_id UUID REFERENCES bancas(id),
ADD COLUMN IF NOT EXISTS orgao_id UUID REFERENCES orgaos(id),
ADD COLUMN IF NOT EXISTS cargo_id UUID REFERENCES cargos(id),
ADD COLUMN IF NOT EXISTS materia_id UUID REFERENCES materias(id),
ADD COLUMN IF NOT EXISTS assunto_normalized_id UUID REFERENCES assuntos_normalized(id);

-- Indexes for FK columns
CREATE INDEX IF NOT EXISTS idx_questoes_banca_id ON questoes_concurso(banca_id);
CREATE INDEX IF NOT EXISTS idx_questoes_orgao_id ON questoes_concurso(orgao_id);
CREATE INDEX IF NOT EXISTS idx_questoes_cargo_id ON questoes_concurso(cargo_id);
CREATE INDEX IF NOT EXISTS idx_questoes_materia_id ON questoes_concurso(materia_id);
CREATE INDEX IF NOT EXISTS idx_questoes_assunto_normalized_id ON questoes_concurso(assunto_normalized_id);
