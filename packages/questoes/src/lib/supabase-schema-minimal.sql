-- =====================================================
-- SCHEMA MINIMO PARA FUNCIONAR O APP
-- Execute no SQL Editor do Supabase (App Principal)
-- Projeto: avlttxzppcywybiaxxzd
-- =====================================================

-- 1. TABELA DE ONBOARDING DO USUARIO
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  objetivo TEXT,
  concurso_alvo TEXT,
  nivel_conhecimento TEXT,
  meta_diaria INTEGER DEFAULT 30,
  materias_dominadas TEXT[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para user_onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own onboarding" ON public.user_onboarding;
CREATE POLICY "Users can view own onboarding" ON public.user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own onboarding" ON public.user_onboarding;
CREATE POLICY "Users can insert own onboarding" ON public.user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own onboarding" ON public.user_onboarding;
CREATE POLICY "Users can update own onboarding" ON public.user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

-- 2. TABELA DE PREPARATORIOS
CREATE TABLE IF NOT EXISTS public.preparatorios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  banca TEXT,
  orgao TEXT,
  ano_previsto INTEGER,
  edital_url TEXT,
  raio_x JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.preparatorios ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active preparatorios" ON public.preparatorios;
CREATE POLICY "Anyone can view active preparatorios" ON public.preparatorios
  FOR SELECT USING (is_active = true);

-- 3. TABELA DE MATERIAS DO PREPARATORIO
CREATE TABLE IF NOT EXISTS public.preparatorio_materias (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  preparatorio_id UUID REFERENCES public.preparatorios(id) ON DELETE CASCADE NOT NULL,
  materia TEXT NOT NULL,
  peso INTEGER DEFAULT 1,
  ordem INTEGER,
  total_assuntos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.preparatorio_materias ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view materias" ON public.preparatorio_materias;
CREATE POLICY "Anyone can view materias" ON public.preparatorio_materias
  FOR SELECT USING (true);

-- 4. TABELA DE ASSUNTOS
CREATE TABLE IF NOT EXISTS public.assuntos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  materia_id UUID REFERENCES public.preparatorio_materias(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  ordem INTEGER,
  nivel_dificuldade TEXT DEFAULT 'intermediario',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assuntos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view assuntos" ON public.assuntos;
CREATE POLICY "Anyone can view assuntos" ON public.assuntos
  FOR SELECT USING (true);

-- 5. TABELA DE TRILHA DO USUARIO
CREATE TABLE IF NOT EXISTS public.user_trails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preparatorio_id UUID REFERENCES public.preparatorios(id) ON DELETE CASCADE NOT NULL,
  nivel_usuario TEXT DEFAULT 'iniciante',
  slot_a_materia_id UUID,
  slot_b_materia_id UUID,
  current_round INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preparatorio_id)
);

ALTER TABLE public.user_trails ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own trails" ON public.user_trails;
CREATE POLICY "Users can view own trails" ON public.user_trails
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own trails" ON public.user_trails;
CREATE POLICY "Users can insert own trails" ON public.user_trails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own trails" ON public.user_trails;
CREATE POLICY "Users can update own trails" ON public.user_trails
  FOR UPDATE USING (auth.uid() = user_id);

-- 6. TABELA DE RODADAS
CREATE TABLE IF NOT EXISTS public.trail_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trail_id UUID REFERENCES public.user_trails(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  status TEXT DEFAULT 'locked',
  tipo TEXT DEFAULT 'normal',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.trail_rounds ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own rounds" ON public.trail_rounds;
CREATE POLICY "Users can manage own rounds" ON public.trail_rounds
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_trails WHERE id = trail_id AND user_id = auth.uid())
  );

-- 7. TABELA DE MISSOES
CREATE TABLE IF NOT EXISTS public.trail_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES public.trail_rounds(id) ON DELETE CASCADE NOT NULL,
  assunto_id UUID,
  materia_id UUID,
  ordem INTEGER NOT NULL,
  status TEXT DEFAULT 'locked',
  tipo TEXT DEFAULT 'normal',
  score DECIMAL(5,2),
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

ALTER TABLE public.trail_missions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own missions" ON public.trail_missions;
CREATE POLICY "Users can manage own missions" ON public.trail_missions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.trail_rounds r
      JOIN public.user_trails t ON r.trail_id = t.id
      WHERE r.id = round_id AND t.user_id = auth.uid()
    )
  );

-- 8. DADOS INICIAIS - PRF
INSERT INTO public.preparatorios (id, nome, slug, banca, orgao, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Policia Rodoviaria Federal',
  'prf',
  'CESPE/CEBRASPE',
  'PRF',
  true
) ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.preparatorio_materias (preparatorio_id, materia, peso, ordem)
VALUES
  ('a0000000-0000-0000-0000-000000000001', 'Lingua Portuguesa', 9, 1),
  ('a0000000-0000-0000-0000-000000000001', 'Raciocinio Logico', 7, 2),
  ('a0000000-0000-0000-0000-000000000001', 'Informatica', 5, 3),
  ('a0000000-0000-0000-0000-000000000001', 'Direito Constitucional', 8, 4),
  ('a0000000-0000-0000-0000-000000000001', 'Direito Administrativo', 8, 5)
ON CONFLICT DO NOTHING;

-- FIM
