-- Migration: Limpar questões fixas do preparatório PCSC
-- Motivo: As questões foram geradas com filtros incorretos (matérias/assuntos misturados)
-- Data: 2024-12-30
--
-- Esta migration limpa todas as questões fixas do preparatório PCSC para que
-- sejam regeneradas com os novos filtros corrigidos que respeitam a matéria da missão.

-- Deletar questões fixas do preparatório PCSC
DELETE FROM missao_questoes
WHERE missao_id IN (
  SELECT m.id
  FROM missoes m
  JOIN rodadas r ON m.rodada_id = r.id
  JOIN preparatorios p ON r.preparatorio_id = p.id
  WHERE p.slug = 'pcsc-2025-agente-de-policia-civil'
);

-- Log da operação (opcional - comentar se não quiser)
DO $$
DECLARE
  deleted_count INTEGER;
BEGIN
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RAISE NOTICE 'Questões fixas do PCSC deletadas: %', deleted_count;
END $$;
