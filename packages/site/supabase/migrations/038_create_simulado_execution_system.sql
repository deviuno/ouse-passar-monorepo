-- Migration: Sistema de Execução de Simulados
-- Adiciona filtros de questões aos preparatórios e cria tabelas para simulados

-- 1. Adicionar campo question_filters aos preparatórios
ALTER TABLE preparatorios
ADD COLUMN IF NOT EXISTS question_filters JSONB DEFAULT '{}';

COMMENT ON COLUMN preparatorios.question_filters IS 'Filtros para geração de questões: {materias:[], bancas:[], orgaos:[], assuntos:[], anos:[]}';

-- 2. Criar tabela de simulados
CREATE TABLE IF NOT EXISTS simulados (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(200) NOT NULL,
    preparatorio_id UUID REFERENCES preparatorios(id) ON DELETE CASCADE,
    duracao_minutos INTEGER DEFAULT 180,
    total_questoes INTEGER DEFAULT 120,
    is_premium BOOLEAN DEFAULT false,
    preco DECIMAL(10,2),
    quantidade_simulados INTEGER DEFAULT 3, -- número de provas diferentes
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulados_preparatorio ON simulados(preparatorio_id);
CREATE INDEX IF NOT EXISTS idx_simulados_active ON simulados(is_active);

-- Trigger para updated_at
CREATE TRIGGER update_simulados_updated_at
    BEFORE UPDATE ON simulados
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 3. Criar tabela de tentativas de simulado (para salvar progresso)
CREATE TABLE IF NOT EXISTS simulado_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    simulado_id UUID NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
    variation_index INTEGER NOT NULL DEFAULT 0, -- qual prova (0, 1, 2...)
    question_ids INTEGER[] NOT NULL, -- IDs das questões nesta prova
    answers JSONB DEFAULT '{}', -- {questionId: selectedAlternative}
    current_index INTEGER DEFAULT 0, -- qual questão o usuário está
    time_remaining_seconds INTEGER, -- tempo restante
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulado_attempts_user ON simulado_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_simulado_attempts_simulado ON simulado_attempts(simulado_id);
CREATE INDEX IF NOT EXISTS idx_simulado_attempts_status ON simulado_attempts(status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_simulado_attempts_active ON simulado_attempts(user_id, simulado_id, variation_index)
    WHERE status = 'in_progress';

-- 4. Criar tabela de resultados de simulado
CREATE TABLE IF NOT EXISTS simulado_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    simulado_id UUID NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
    attempt_id UUID REFERENCES simulado_attempts(id) ON DELETE SET NULL,
    variation_index INTEGER DEFAULT 0,
    score DECIMAL(5,2) NOT NULL, -- porcentagem de acertos
    acertos INTEGER NOT NULL,
    erros INTEGER NOT NULL,
    total_questoes INTEGER NOT NULL,
    tempo_gasto INTEGER NOT NULL, -- segundos
    ranking_position INTEGER, -- posição no ranking (calculado posteriormente)
    is_manual BOOLEAN DEFAULT false, -- true se respondido via gabarito manual
    answers_detail JSONB, -- {questionId: {answer, correct, timeSpent}}
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_simulado_results_user ON simulado_results(user_id);
CREATE INDEX IF NOT EXISTS idx_simulado_results_simulado ON simulado_results(simulado_id);
CREATE INDEX IF NOT EXISTS idx_simulado_results_score ON simulado_results(score DESC);
CREATE INDEX IF NOT EXISTS idx_simulado_results_completed ON simulado_results(completed_at DESC);

-- 5. Tabela para armazenar as questões geradas para cada variação de prova
-- Isso garante que cada usuário recebe as mesmas questões para uma variação específica
CREATE TABLE IF NOT EXISTS simulado_variations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    simulado_id UUID NOT NULL REFERENCES simulados(id) ON DELETE CASCADE,
    variation_index INTEGER NOT NULL,
    question_ids INTEGER[] NOT NULL,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(simulado_id, variation_index)
);

CREATE INDEX IF NOT EXISTS idx_simulado_variations_simulado ON simulado_variations(simulado_id);

-- 6. RLS Policies
ALTER TABLE simulados ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulado_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulado_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE simulado_variations ENABLE ROW LEVEL SECURITY;

-- Simulados: leitura pública para ativos
CREATE POLICY "Simulados ativos são públicos" ON simulados
    FOR SELECT USING (is_active = true);

CREATE POLICY "Admin pode gerenciar simulados" ON simulados
    FOR ALL USING (true);

-- Attempts: usuário só vê suas próprias tentativas
CREATE POLICY "Usuarios veem suas tentativas" ON simulado_attempts
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios criam suas tentativas" ON simulado_attempts
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Usuarios atualizam suas tentativas" ON simulado_attempts
    FOR UPDATE USING (auth.uid() = user_id);

-- Results: usuário só vê seus próprios resultados
CREATE POLICY "Usuarios veem seus resultados" ON simulado_results
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios criam seus resultados" ON simulado_results
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Variations: leitura pública
CREATE POLICY "Variacoes são públicas" ON simulado_variations
    FOR SELECT USING (true);

CREATE POLICY "Admin pode gerenciar variacoes" ON simulado_variations
    FOR ALL USING (true);

-- 7. Configurações de simulado no system_settings
INSERT INTO public.system_settings (category, key, value, description) VALUES
    ('simulado', 'different_exams_per_user', '3', 'Número de provas diferentes por simulado'),
    ('simulado', 'questions_per_simulado', '120', 'Número de questões por prova'),
    ('simulado', 'time_limit_minutes', '180', 'Tempo limite em minutos'),
    ('simulado', 'max_attempts', '-1', 'Máximo de tentativas (-1 = ilimitado)')
ON CONFLICT (category, key) DO NOTHING;

-- 8. Criar simulado padrão para PRF (usando o preparatório existente)
INSERT INTO simulados (nome, preparatorio_id, duracao_minutos, total_questoes, is_premium, quantidade_simulados)
SELECT
    'Simulado PRF - Policia Rodoviaria Federal',
    id,
    180,
    120,
    false,
    3
FROM preparatorios
WHERE slug = 'prf'
ON CONFLICT DO NOTHING;
