-- Adicionar coluna description na tabela cadernos
ALTER TABLE cadernos ADD COLUMN IF NOT EXISTS description TEXT;

-- Comentário na coluna
COMMENT ON COLUMN cadernos.description IS 'Descrição opcional do caderno de questões';
