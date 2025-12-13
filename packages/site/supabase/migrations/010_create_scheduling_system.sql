-- Migration: Create Meeting Scheduling System
-- Creates tables for seller schedules, appointments (agendamentos), and round-robin state

-- ================================================
-- 1. VENDEDOR_SCHEDULES - Weekly availability for sellers
-- ================================================
CREATE TABLE IF NOT EXISTS vendedor_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    vendedor_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    dia_semana INTEGER NOT NULL CHECK (dia_semana >= 0 AND dia_semana <= 6), -- 0=Sunday, 6=Saturday
    is_active BOOLEAN DEFAULT false,
    manha_inicio TIME NULL,
    manha_fim TIME NULL,
    tarde_inicio TIME NULL,
    tarde_fim TIME NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(vendedor_id, dia_semana)
);

COMMENT ON TABLE vendedor_schedules IS 'Weekly availability schedule for each seller (vendedor)';
COMMENT ON COLUMN vendedor_schedules.dia_semana IS '0=Sunday, 1=Monday, ..., 6=Saturday';
COMMENT ON COLUMN vendedor_schedules.is_active IS 'Whether the seller works on this day';

-- ================================================
-- 2. AGENDAMENTOS - Scheduled meetings/appointments
-- ================================================
CREATE TABLE IF NOT EXISTS agendamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
    vendedor_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE RESTRICT,
    preparatorio_id UUID NOT NULL REFERENCES preparatorios(id) ON DELETE RESTRICT,
    data_hora TIMESTAMPTZ NOT NULL,
    duracao_minutos INTEGER DEFAULT 30,
    status VARCHAR(20) DEFAULT 'agendado' CHECK (status IN ('agendado', 'confirmado', 'realizado', 'cancelado', 'nao_compareceu')),
    notas TEXT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE agendamentos IS 'Scheduled planning consultation meetings';
COMMENT ON COLUMN agendamentos.status IS 'agendado=scheduled, confirmado=confirmed, realizado=completed, cancelado=cancelled, nao_compareceu=no-show';

-- ================================================
-- 3. ROUND_ROBIN_STATE - Track seller assignment rotation
-- ================================================
CREATE TABLE IF NOT EXISTS round_robin_state (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preparatorio_id UUID REFERENCES preparatorios(id) ON DELETE CASCADE,
    ultimo_vendedor_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(preparatorio_id)
);

COMMENT ON TABLE round_robin_state IS 'Tracks which seller was last assigned for round-robin distribution';

-- ================================================
-- 4. MODIFY LEADS TABLE - Add agendamento reference
-- ================================================
ALTER TABLE leads ADD COLUMN IF NOT EXISTS agendamento_id UUID REFERENCES agendamentos(id) ON DELETE SET NULL;

-- ================================================
-- 5. INDEXES for performance
-- ================================================
CREATE INDEX IF NOT EXISTS idx_agendamentos_vendedor_data ON agendamentos(vendedor_id, data_hora);
CREATE INDEX IF NOT EXISTS idx_agendamentos_lead ON agendamentos(lead_id);
CREATE INDEX IF NOT EXISTS idx_agendamentos_status ON agendamentos(status);
CREATE INDEX IF NOT EXISTS idx_agendamentos_data_hora ON agendamentos(data_hora);
CREATE INDEX IF NOT EXISTS idx_vendedor_schedules_vendedor ON vendedor_schedules(vendedor_id);

-- ================================================
-- 6. TRIGGERS for updated_at
-- ================================================
-- Trigger function (reuse if exists)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for vendedor_schedules
DROP TRIGGER IF EXISTS update_vendedor_schedules_updated_at ON vendedor_schedules;
CREATE TRIGGER update_vendedor_schedules_updated_at
    BEFORE UPDATE ON vendedor_schedules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for agendamentos
DROP TRIGGER IF EXISTS update_agendamentos_updated_at ON agendamentos;
CREATE TRIGGER update_agendamentos_updated_at
    BEFORE UPDATE ON agendamentos
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for round_robin_state
DROP TRIGGER IF EXISTS update_round_robin_state_updated_at ON round_robin_state;
CREATE TRIGGER update_round_robin_state_updated_at
    BEFORE UPDATE ON round_robin_state
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- 7. INSERT default schedules for existing vendedores
-- ================================================
INSERT INTO vendedor_schedules (vendedor_id, dia_semana, is_active, manha_inicio, manha_fim, tarde_inicio, tarde_fim)
SELECT
    au.id,
    d.dia,
    CASE WHEN d.dia IN (0, 6) THEN false ELSE true END, -- Sat/Sun disabled
    '08:00'::TIME,
    '12:00'::TIME,
    '14:00'::TIME,
    '18:00'::TIME
FROM admin_users au
CROSS JOIN (SELECT generate_series(0, 6) AS dia) d
WHERE au.role = 'vendedor' AND au.is_active = true
ON CONFLICT (vendedor_id, dia_semana) DO NOTHING;

-- ================================================
-- 8. ROW LEVEL SECURITY
-- ================================================
ALTER TABLE vendedor_schedules ENABLE ROW LEVEL SECURITY;
ALTER TABLE agendamentos ENABLE ROW LEVEL SECURITY;
ALTER TABLE round_robin_state ENABLE ROW LEVEL SECURITY;

-- Policies for vendedor_schedules
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendedor_schedules' AND policyname = 'vendedor_schedules_select_policy') THEN
        CREATE POLICY vendedor_schedules_select_policy ON vendedor_schedules FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendedor_schedules' AND policyname = 'vendedor_schedules_insert_policy') THEN
        CREATE POLICY vendedor_schedules_insert_policy ON vendedor_schedules FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendedor_schedules' AND policyname = 'vendedor_schedules_update_policy') THEN
        CREATE POLICY vendedor_schedules_update_policy ON vendedor_schedules FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'vendedor_schedules' AND policyname = 'vendedor_schedules_delete_policy') THEN
        CREATE POLICY vendedor_schedules_delete_policy ON vendedor_schedules FOR DELETE USING (true);
    END IF;
END $$;

-- Policies for agendamentos
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agendamentos' AND policyname = 'agendamentos_select_policy') THEN
        CREATE POLICY agendamentos_select_policy ON agendamentos FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agendamentos' AND policyname = 'agendamentos_insert_policy') THEN
        CREATE POLICY agendamentos_insert_policy ON agendamentos FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agendamentos' AND policyname = 'agendamentos_update_policy') THEN
        CREATE POLICY agendamentos_update_policy ON agendamentos FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'agendamentos' AND policyname = 'agendamentos_delete_policy') THEN
        CREATE POLICY agendamentos_delete_policy ON agendamentos FOR DELETE USING (true);
    END IF;
END $$;

-- Policies for round_robin_state
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'round_robin_state' AND policyname = 'round_robin_state_select_policy') THEN
        CREATE POLICY round_robin_state_select_policy ON round_robin_state FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'round_robin_state' AND policyname = 'round_robin_state_insert_policy') THEN
        CREATE POLICY round_robin_state_insert_policy ON round_robin_state FOR INSERT WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'round_robin_state' AND policyname = 'round_robin_state_update_policy') THEN
        CREATE POLICY round_robin_state_update_policy ON round_robin_state FOR UPDATE USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'round_robin_state' AND policyname = 'round_robin_state_delete_policy') THEN
        CREATE POLICY round_robin_state_delete_policy ON round_robin_state FOR DELETE USING (true);
    END IF;
END $$;
