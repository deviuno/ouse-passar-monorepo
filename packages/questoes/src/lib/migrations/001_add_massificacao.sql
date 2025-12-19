-- =====================================================
-- MIGRATION: Adicionar campos de massificação
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Adicionar novo tipo 'massificacao' ao constraint de tipo
ALTER TABLE public.trail_missions
DROP CONSTRAINT IF EXISTS trail_missions_tipo_check;

ALTER TABLE public.trail_missions
ADD CONSTRAINT trail_missions_tipo_check
CHECK (tipo IN ('normal', 'revisao', 'simulado_rodada', 'massificacao'));

-- Adicionar campos para massificação
ALTER TABLE public.trail_missions
ADD COLUMN IF NOT EXISTS massificacao_de UUID REFERENCES public.trail_missions(id) ON DELETE SET NULL;

ALTER TABLE public.trail_missions
ADD COLUMN IF NOT EXISTS tentativa_massificacao INTEGER DEFAULT 0;

ALTER TABLE public.trail_missions
ADD COLUMN IF NOT EXISTS questoes_ids TEXT[]; -- IDs das questões para repetir exatamente as mesmas

-- Índice para buscar missões de massificação
CREATE INDEX IF NOT EXISTS idx_trail_missions_massificacao_de
ON public.trail_missions(massificacao_de)
WHERE massificacao_de IS NOT NULL;

-- Comentários para documentação
COMMENT ON COLUMN public.trail_missions.massificacao_de IS 'ID da missão original que gerou esta massificação';
COMMENT ON COLUMN public.trail_missions.tentativa_massificacao IS 'Número da tentativa de massificação (1, 2, 3...)';
COMMENT ON COLUMN public.trail_missions.questoes_ids IS 'IDs das questões originais para repetir exatamente as mesmas';

-- =====================================================
-- Tabela de estatísticas de massificação
-- =====================================================
CREATE TABLE IF NOT EXISTS public.massificacao_stats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  missao_original_id UUID REFERENCES public.trail_missions(id) ON DELETE CASCADE NOT NULL,
  missao_massificacao_id UUID REFERENCES public.trail_missions(id) ON DELETE CASCADE NOT NULL,
  tentativa INTEGER NOT NULL,
  score_original DECIMAL(5,2) NOT NULL,
  score_massificacao DECIMAL(5,2),
  passou BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS para massificacao_stats
ALTER TABLE public.massificacao_stats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own massificacao stats" ON public.massificacao_stats
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own massificacao stats" ON public.massificacao_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own massificacao stats" ON public.massificacao_stats
  FOR UPDATE USING (auth.uid() = user_id);

-- Índices
CREATE INDEX IF NOT EXISTS idx_massificacao_stats_user ON public.massificacao_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_massificacao_stats_missao_original ON public.massificacao_stats(missao_original_id);
