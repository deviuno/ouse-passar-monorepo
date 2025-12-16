-- =====================================================
-- SCHEMA SUPABASE - OUSE QUESTOES (ESTILO DUOLINGO)
-- =====================================================
-- Execute este script no SQL Editor do Supabase
-- =====================================================

-- Habilitar UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. TABELA DE ONBOARDING DO USUARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_onboarding (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  objetivo TEXT CHECK (objetivo IN ('passar_concurso', 'estudar', 'revisar')),
  concurso_alvo TEXT,
  nivel_conhecimento TEXT CHECK (nivel_conhecimento IN ('iniciante', 'intermediario', 'avancado')),
  meta_diaria INTEGER DEFAULT 30 CHECK (meta_diaria IN (15, 30, 60, 120)),
  materias_dominadas TEXT[],
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para user_onboarding
ALTER TABLE public.user_onboarding ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own onboarding" ON public.user_onboarding
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own onboarding" ON public.user_onboarding
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own onboarding" ON public.user_onboarding
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 2. TABELA DE PREPARATORIOS (CURSOS/CONCURSOS)
-- =====================================================
CREATE TABLE IF NOT EXISTS public.preparatorios (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  banca TEXT,
  orgao TEXT,
  ano_previsto INTEGER,
  edital_url TEXT,
  raio_x JSONB, -- { materias: [{materia, peso, percentual_prova, assuntos_prioritarios}] }
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para preparatorios (leitura publica)
ALTER TABLE public.preparatorios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active preparatorios" ON public.preparatorios
  FOR SELECT USING (is_active = true);

-- =====================================================
-- 3. TABELA DE MATERIAS DO PREPARATORIO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.preparatorio_materias (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  preparatorio_id UUID REFERENCES public.preparatorios(id) ON DELETE CASCADE NOT NULL,
  materia TEXT NOT NULL,
  peso INTEGER DEFAULT 1 CHECK (peso >= 1 AND peso <= 10),
  ordem INTEGER,
  total_assuntos INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.preparatorio_materias ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view materias" ON public.preparatorio_materias
  FOR SELECT USING (true);

-- =====================================================
-- 4. TABELA DE ASSUNTOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.assuntos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  materia_id UUID REFERENCES public.preparatorio_materias(id) ON DELETE CASCADE NOT NULL,
  nome TEXT NOT NULL,
  ordem INTEGER,
  nivel_dificuldade TEXT DEFAULT 'intermediario' CHECK (nivel_dificuldade IN ('iniciante', 'intermediario', 'avancado')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.assuntos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view assuntos" ON public.assuntos
  FOR SELECT USING (true);

-- =====================================================
-- 5. TABELA DE CONTEUDOS TEORICOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.conteudos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  assunto_id UUID REFERENCES public.assuntos(id) ON DELETE CASCADE NOT NULL,
  nivel TEXT NOT NULL CHECK (nivel IN ('iniciante', 'intermediario', 'avancado')),
  texto_content TEXT,
  audio_url TEXT,
  visual_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.conteudos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view conteudos" ON public.conteudos
  FOR SELECT USING (true);

-- =====================================================
-- 6. TABELA DE TRILHA DO USUARIO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.user_trails (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  preparatorio_id UUID REFERENCES public.preparatorios(id) ON DELETE CASCADE NOT NULL,
  nivel_usuario TEXT DEFAULT 'iniciante' CHECK (nivel_usuario IN ('iniciante', 'intermediario', 'avancado')),
  slot_a_materia_id UUID REFERENCES public.preparatorio_materias(id),
  slot_b_materia_id UUID REFERENCES public.preparatorio_materias(id),
  current_round INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, preparatorio_id)
);

-- RLS
ALTER TABLE public.user_trails ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own trails" ON public.user_trails
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own trails" ON public.user_trails
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own trails" ON public.user_trails
  FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 7. TABELA DE RODADAS DA TRILHA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trail_rounds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID REFERENCES public.user_trails(id) ON DELETE CASCADE NOT NULL,
  round_number INTEGER NOT NULL,
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'active', 'completed')),
  tipo TEXT DEFAULT 'normal' CHECK (tipo IN ('normal', 'revisao', 'simulado')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.trail_rounds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rounds" ON public.trail_rounds
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_trails WHERE id = trail_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can insert own rounds" ON public.trail_rounds
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_trails WHERE id = trail_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can update own rounds" ON public.trail_rounds
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.user_trails WHERE id = trail_id AND user_id = auth.uid())
  );

-- =====================================================
-- 8. TABELA DE MISSOES DA TRILHA
-- =====================================================
CREATE TABLE IF NOT EXISTS public.trail_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  round_id UUID REFERENCES public.trail_rounds(id) ON DELETE CASCADE NOT NULL,
  assunto_id UUID REFERENCES public.assuntos(id),
  materia_id UUID REFERENCES public.preparatorio_materias(id) NOT NULL,
  ordem INTEGER NOT NULL,
  status TEXT DEFAULT 'locked' CHECK (status IN ('locked', 'available', 'in_progress', 'completed', 'massification')),
  tipo TEXT DEFAULT 'normal' CHECK (tipo IN ('normal', 'revisao', 'simulado_rodada')),
  score DECIMAL(5,2),
  attempts INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- RLS
ALTER TABLE public.trail_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own missions" ON public.trail_missions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trail_rounds r
      JOIN public.user_trails t ON r.trail_id = t.id
      WHERE r.id = round_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert own missions" ON public.trail_missions
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.trail_rounds r
      JOIN public.user_trails t ON r.trail_id = t.id
      WHERE r.id = round_id AND t.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update own missions" ON public.trail_missions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.trail_rounds r
      JOIN public.user_trails t ON r.trail_id = t.id
      WHERE r.id = round_id AND t.user_id = auth.uid()
    )
  );

-- =====================================================
-- 9. TABELA DE RESPOSTAS POR MISSAO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.mission_answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  mission_id UUID REFERENCES public.trail_missions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question_id TEXT NOT NULL,
  selected_answer TEXT,
  is_correct BOOLEAN,
  time_spent INTEGER, -- segundos
  attempt_number INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.mission_answers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own answers" ON public.mission_answers
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own answers" ON public.mission_answers
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 10. TABELA DE POOL DE REVISAO
-- =====================================================
CREATE TABLE IF NOT EXISTS public.revision_pool (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trail_id UUID REFERENCES public.user_trails(id) ON DELETE CASCADE NOT NULL,
  materia_id UUID REFERENCES public.preparatorio_materias(id) ON DELETE CASCADE NOT NULL,
  added_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.revision_pool ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own revision pool" ON public.revision_pool
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.user_trails WHERE id = trail_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can modify own revision pool" ON public.revision_pool
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.user_trails WHERE id = trail_id AND user_id = auth.uid())
  );

-- =====================================================
-- 11. TABELA DE SIMULADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.simulados (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  nome TEXT NOT NULL,
  preparatorio_id UUID REFERENCES public.preparatorios(id),
  duracao_minutos INTEGER DEFAULT 180,
  total_questoes INTEGER,
  is_premium BOOLEAN DEFAULT false,
  preco DECIMAL(10,2),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.simulados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view simulados" ON public.simulados
  FOR SELECT USING (true);

-- =====================================================
-- 12. TABELA DE RESULTADOS DE SIMULADOS
-- =====================================================
CREATE TABLE IF NOT EXISTS public.simulado_results (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  simulado_id UUID REFERENCES public.simulados(id) ON DELETE CASCADE NOT NULL,
  score DECIMAL(5,2),
  tempo_gasto INTEGER, -- segundos
  ranking_position INTEGER,
  answers JSONB, -- {question_id, selected, correct, time_spent}[]
  completed_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE public.simulado_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own results" ON public.simulado_results
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own results" ON public.simulado_results
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 13. INDICES PARA PERFORMANCE
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_user_onboarding_user ON public.user_onboarding(user_id);
CREATE INDEX IF NOT EXISTS idx_preparatorio_materias_prep ON public.preparatorio_materias(preparatorio_id);
CREATE INDEX IF NOT EXISTS idx_assuntos_materia ON public.assuntos(materia_id);
CREATE INDEX IF NOT EXISTS idx_conteudos_assunto ON public.conteudos(assunto_id);
CREATE INDEX IF NOT EXISTS idx_user_trails_user ON public.user_trails(user_id);
CREATE INDEX IF NOT EXISTS idx_trail_rounds_trail ON public.trail_rounds(trail_id);
CREATE INDEX IF NOT EXISTS idx_trail_missions_round ON public.trail_missions(round_id);
CREATE INDEX IF NOT EXISTS idx_mission_answers_mission ON public.mission_answers(mission_id);
CREATE INDEX IF NOT EXISTS idx_mission_answers_user ON public.mission_answers(user_id);

-- =====================================================
-- 14. TRIGGERS PARA UPDATED_AT
-- =====================================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_onboarding_updated_at
  BEFORE UPDATE ON public.user_onboarding
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_preparatorios_updated_at
  BEFORE UPDATE ON public.preparatorios
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_trails_updated_at
  BEFORE UPDATE ON public.user_trails
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =====================================================
-- 15. DADOS INICIAIS DE EXEMPLO
-- =====================================================

-- Inserir preparatorio PRF
INSERT INTO public.preparatorios (id, nome, slug, banca, orgao, ano_previsto, raio_x, is_active)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'Policia Rodoviaria Federal',
  'prf',
  'CESPE/CEBRASPE',
  'PRF',
  2025,
  '{"materias": [
    {"materia": "Lingua Portuguesa", "peso": 9, "percentual_prova": 20, "assuntos_prioritarios": ["Interpretacao de Texto", "Concordancia", "Regencia"]},
    {"materia": "Raciocinio Logico", "peso": 7, "percentual_prova": 15, "assuntos_prioritarios": ["Proposicoes", "Argumentacao", "Probabilidade"]},
    {"materia": "Informatica", "peso": 5, "percentual_prova": 10, "assuntos_prioritarios": ["Seguranca", "Redes", "Sistemas Operacionais"]},
    {"materia": "Direito Constitucional", "peso": 8, "percentual_prova": 15, "assuntos_prioritarios": ["Direitos Fundamentais", "Organizacao do Estado"]},
    {"materia": "Direito Administrativo", "peso": 8, "percentual_prova": 15, "assuntos_prioritarios": ["Atos Administrativos", "Licitacoes", "Servidores"]},
    {"materia": "Direito Penal", "peso": 7, "percentual_prova": 10, "assuntos_prioritarios": ["Crimes contra a pessoa", "Crimes de transito"]},
    {"materia": "Legislacao de Transito", "peso": 10, "percentual_prova": 15, "assuntos_prioritarios": ["CTB", "Infracoes", "Penalidades"]}
  ]}'::jsonb,
  true
) ON CONFLICT (slug) DO NOTHING;

-- Inserir materias do PRF
INSERT INTO public.preparatorio_materias (id, preparatorio_id, materia, peso, ordem, total_assuntos)
VALUES
  ('b0000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000001', 'Lingua Portuguesa', 9, 1, 10),
  ('b0000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000001', 'Raciocinio Logico', 7, 2, 8),
  ('b0000000-0000-0000-0000-000000000003', 'a0000000-0000-0000-0000-000000000001', 'Informatica', 5, 3, 6),
  ('b0000000-0000-0000-0000-000000000004', 'a0000000-0000-0000-0000-000000000001', 'Direito Constitucional', 8, 4, 12),
  ('b0000000-0000-0000-0000-000000000005', 'a0000000-0000-0000-0000-000000000001', 'Direito Administrativo', 8, 5, 10)
ON CONFLICT DO NOTHING;

-- Inserir assuntos de Portugues
INSERT INTO public.assuntos (id, materia_id, nome, ordem, nivel_dificuldade)
VALUES
  ('c0000000-0000-0000-0000-000000000001', 'b0000000-0000-0000-0000-000000000001', 'Interpretacao de Texto', 1, 'intermediario'),
  ('c0000000-0000-0000-0000-000000000002', 'b0000000-0000-0000-0000-000000000001', 'Concordancia Verbal', 2, 'intermediario'),
  ('c0000000-0000-0000-0000-000000000003', 'b0000000-0000-0000-0000-000000000001', 'Concordancia Nominal', 3, 'intermediario'),
  ('c0000000-0000-0000-0000-000000000004', 'b0000000-0000-0000-0000-000000000001', 'Regencia Verbal', 4, 'avancado'),
  ('c0000000-0000-0000-0000-000000000005', 'b0000000-0000-0000-0000-000000000001', 'Crase', 5, 'avancado')
ON CONFLICT DO NOTHING;

-- Inserir assuntos de Raciocinio Logico
INSERT INTO public.assuntos (id, materia_id, nome, ordem, nivel_dificuldade)
VALUES
  ('c0000000-0000-0000-0000-000000000011', 'b0000000-0000-0000-0000-000000000002', 'Proposicoes Logicas', 1, 'iniciante'),
  ('c0000000-0000-0000-0000-000000000012', 'b0000000-0000-0000-0000-000000000002', 'Tabela Verdade', 2, 'intermediario'),
  ('c0000000-0000-0000-0000-000000000013', 'b0000000-0000-0000-0000-000000000002', 'Equivalencias', 3, 'intermediario'),
  ('c0000000-0000-0000-0000-000000000014', 'b0000000-0000-0000-0000-000000000002', 'Argumentacao', 4, 'avancado')
ON CONFLICT DO NOTHING;

-- =====================================================
-- FIM DO SCRIPT
-- =====================================================
