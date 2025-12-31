-- Migration: Adicionar campo de observações de adaptações nos filtros de questões
-- Data: 2024-12-30
--
-- Este campo armazena as adaptações feitas pelo agente de IA ao traduzir
-- os nomes de matérias/assuntos do edital para os nomes do banco de questões.
-- Exemplo: "Adaptado 'Língua Portuguesa' para 'Português'"
--
-- Visível apenas para admin, não para o cliente final.

-- Adicionar coluna para observações de adaptações
ALTER TABLE missao_questao_filtros
ADD COLUMN IF NOT EXISTS adaptacoes_observacoes TEXT DEFAULT NULL;

-- Adicionar coluna para indicar se os filtros foram otimizados pelo agente
ALTER TABLE missao_questao_filtros
ADD COLUMN IF NOT EXISTS otimizado_por_ia BOOLEAN DEFAULT FALSE;

-- Adicionar coluna para armazenar os filtros originais (antes da otimização)
ALTER TABLE missao_questao_filtros
ADD COLUMN IF NOT EXISTS filtros_originais JSONB DEFAULT NULL;

-- Comentários nas colunas
COMMENT ON COLUMN missao_questao_filtros.adaptacoes_observacoes IS 'Observações sobre adaptações feitas pelo agente de IA nos termos de matéria/assunto';
COMMENT ON COLUMN missao_questao_filtros.otimizado_por_ia IS 'Indica se os filtros foram otimizados pelo agente de IA';
COMMENT ON COLUMN missao_questao_filtros.filtros_originais IS 'Backup dos filtros originais antes da otimização por IA';
