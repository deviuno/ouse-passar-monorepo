-- =====================================================
-- MIGRAÇÃO: Atualizar tabela de leads
-- Execute este SQL no dashboard do Supabase:
-- https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd/sql/new
-- =====================================================

-- Adicionar campo "é concursado"
ALTER TABLE leads ADD COLUMN IF NOT EXISTS e_concursado BOOLEAN DEFAULT false;

-- PASSO 1: Primeiro alterar o tipo das colunas para INTEGER (para suportar valores maiores)
ALTER TABLE leads ALTER COLUMN horas_domingo TYPE INTEGER USING COALESCE(horas_domingo, 0)::INTEGER;
ALTER TABLE leads ALTER COLUMN horas_segunda TYPE INTEGER USING COALESCE(horas_segunda, 0)::INTEGER;
ALTER TABLE leads ALTER COLUMN horas_terca TYPE INTEGER USING COALESCE(horas_terca, 0)::INTEGER;
ALTER TABLE leads ALTER COLUMN horas_quarta TYPE INTEGER USING COALESCE(horas_quarta, 0)::INTEGER;
ALTER TABLE leads ALTER COLUMN horas_quinta TYPE INTEGER USING COALESCE(horas_quinta, 0)::INTEGER;
ALTER TABLE leads ALTER COLUMN horas_sexta TYPE INTEGER USING COALESCE(horas_sexta, 0)::INTEGER;
ALTER TABLE leads ALTER COLUMN horas_sabado TYPE INTEGER USING COALESCE(horas_sabado, 0)::INTEGER;

-- PASSO 2: Agora multiplicar por 60 para converter horas em minutos
UPDATE leads SET
  horas_domingo = horas_domingo * 60,
  horas_segunda = horas_segunda * 60,
  horas_terca = horas_terca * 60,
  horas_quarta = horas_quarta * 60,
  horas_quinta = horas_quinta * 60,
  horas_sexta = horas_sexta * 60,
  horas_sabado = horas_sabado * 60;

-- PASSO 3: Renomear colunas de horas para minutos
ALTER TABLE leads RENAME COLUMN horas_domingo TO minutos_domingo;
ALTER TABLE leads RENAME COLUMN horas_segunda TO minutos_segunda;
ALTER TABLE leads RENAME COLUMN horas_terca TO minutos_terca;
ALTER TABLE leads RENAME COLUMN horas_quarta TO minutos_quarta;
ALTER TABLE leads RENAME COLUMN horas_quinta TO minutos_quinta;
ALTER TABLE leads RENAME COLUMN horas_sexta TO minutos_sexta;
ALTER TABLE leads RENAME COLUMN horas_sabado TO minutos_sabado;

-- Criar coluna para múltiplas dificuldades (array)
ALTER TABLE leads ADD COLUMN IF NOT EXISTS principais_dificuldades lead_difficulty[] DEFAULT '{}';

-- Migrar dados existentes de principal_dificuldade para o array
UPDATE leads
SET principais_dificuldades = ARRAY[principal_dificuldade]
WHERE principal_dificuldade IS NOT NULL AND principais_dificuldades = '{}';

-- Verificação
SELECT 'leads' as tabela, count(*) as registros FROM leads;
