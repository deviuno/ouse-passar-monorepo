-- Migration: Create Weekly Planner System
-- Description: Adds weekly planner functionality for students to organize their activities

-- 1. Add wake/sleep time fields to leads table
ALTER TABLE leads ADD COLUMN IF NOT EXISTS hora_acordar TIME DEFAULT '06:00';
ALTER TABLE leads ADD COLUMN IF NOT EXISTS hora_dormir TIME DEFAULT '22:00';

COMMENT ON COLUMN leads.hora_acordar IS 'Hora que o aluno acorda (para calcular horários disponíveis)';
COMMENT ON COLUMN leads.hora_dormir IS 'Hora que o aluno dorme (para calcular horários disponíveis)';

-- 2. Create activity types table (default activities)
CREATE TABLE IF NOT EXISTS atividade_tipos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(20) NOT NULL,
    icone VARCHAR(50),
    is_default BOOLEAN DEFAULT false,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE atividade_tipos IS 'Tipos de atividade padrão do sistema (Estudar, Trabalho, etc)';

-- 3. Insert default activity types
INSERT INTO atividade_tipos (nome, descricao, cor, icone, is_default, ordem) VALUES
('Estudar', 'Tempo dedicado aos estudos para o concurso', '#FFB800', 'book-open', true, 1),
('Trabalho', 'Horário de trabalho ou compromissos profissionais', '#3B82F6', 'briefcase', true, 2),
('Atividade Física', 'Exercícios, academia, esportes', '#10B981', 'dumbbell', true, 3),
('Lazer', 'Tempo livre, descanso, hobbies', '#8B5CF6', 'coffee', true, 4)
ON CONFLICT DO NOTHING;

-- 4. Create user custom activity types table
CREATE TABLE IF NOT EXISTS atividade_tipos_usuario (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planejamento_id UUID NOT NULL REFERENCES planejamentos(id) ON DELETE CASCADE,
    nome VARCHAR(100) NOT NULL,
    descricao TEXT,
    cor VARCHAR(20) NOT NULL,
    icone VARCHAR(50),
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE atividade_tipos_usuario IS 'Atividades personalizadas criadas pelo usuário';

CREATE INDEX IF NOT EXISTS idx_atividade_tipos_usuario_planejamento
    ON atividade_tipos_usuario(planejamento_id);

-- 5. Create weekly planner slots table
CREATE TABLE IF NOT EXISTS planejador_semanal (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    planejamento_id UUID NOT NULL REFERENCES planejamentos(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6),
    hora_inicio TIME NOT NULL,
    atividade_tipo_id UUID REFERENCES atividade_tipos(id) ON DELETE SET NULL,
    atividade_usuario_id UUID REFERENCES atividade_tipos_usuario(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(planejamento_id, dia_semana, hora_inicio)
);

COMMENT ON TABLE planejador_semanal IS 'Slots de 15 minutos do planejador semanal do aluno';
COMMENT ON COLUMN planejador_semanal.dia_semana IS '0=Domingo, 1=Segunda, ..., 6=Sábado';
COMMENT ON COLUMN planejador_semanal.hora_inicio IS 'Horário de início do slot (ex: 06:00, 06:15, 06:30)';

CREATE INDEX IF NOT EXISTS idx_planejador_semanal_planejamento
    ON planejador_semanal(planejamento_id);

CREATE INDEX IF NOT EXISTS idx_planejador_semanal_dia
    ON planejador_semanal(planejamento_id, dia_semana);

-- 6. Enable RLS
ALTER TABLE atividade_tipos ENABLE ROW LEVEL SECURITY;
ALTER TABLE atividade_tipos_usuario ENABLE ROW LEVEL SECURITY;
ALTER TABLE planejador_semanal ENABLE ROW LEVEL SECURITY;

-- 7. Create policies (open for now, can be restricted later)
CREATE POLICY "atividade_tipos_select_policy" ON atividade_tipos
    FOR SELECT USING (true);

CREATE POLICY "atividade_tipos_usuario_policy" ON atividade_tipos_usuario
    FOR ALL USING (true);

CREATE POLICY "planejador_semanal_policy" ON planejador_semanal
    FOR ALL USING (true);

-- 8. Add hora_acordar and hora_dormir to planejamentos table as well
ALTER TABLE planejamentos ADD COLUMN IF NOT EXISTS hora_acordar TIME DEFAULT '06:00';
ALTER TABLE planejamentos ADD COLUMN IF NOT EXISTS hora_dormir TIME DEFAULT '22:00';

COMMENT ON COLUMN planejamentos.hora_acordar IS 'Hora que o aluno acorda';
COMMENT ON COLUMN planejamentos.hora_dormir IS 'Hora que o aluno dorme';
