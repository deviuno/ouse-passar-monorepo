-- =====================================================
-- Migration 015: Sistema de Conteúdo N8N
-- =====================================================
-- Esta migration cria as tabelas necessárias para a
-- integração com N8N para geração automática de
-- matérias, assuntos e conteúdo didático.
--
-- IMPORTANTE: Esta é uma estrutura PARALELA ao sistema
-- de rodadas/missões existente. Ambos coexistem.
-- =====================================================

-- Adicionar campos opcionais à tabela preparatorios (para dados do edital)
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS orgao VARCHAR(255);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS banca VARCHAR(100);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS nivel VARCHAR(50);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS cargo VARCHAR(255);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS requisitos TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS area_conhecimento_basico TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS area_conhecimento_especifico TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS data_prevista DATE;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS n8n_status VARCHAR(20) DEFAULT 'none';
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS n8n_error_message TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS n8n_processed_at TIMESTAMPTZ;

-- Comentários para documentação
COMMENT ON COLUMN preparatorios.orgao IS 'Órgão do concurso (ex: POLÍCIA FEDERAL)';
COMMENT ON COLUMN preparatorios.banca IS 'Banca organizadora (ex: CESPE, FGV)';
COMMENT ON COLUMN preparatorios.nivel IS 'Nível do cargo (NÍVEL SUPERIOR, NÍVEL MÉDIO)';
COMMENT ON COLUMN preparatorios.cargo IS 'Nome do cargo (ex: ADMINISTRADOR)';
COMMENT ON COLUMN preparatorios.n8n_status IS 'Status do processamento N8N: none, pending, processing, completed, error';

-- =====================================================
-- Tabela: preparatorio_materias
-- Armazena as matérias de um preparatório
-- =====================================================
CREATE TABLE IF NOT EXISTS preparatorio_materias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preparatorio_id UUID NOT NULL REFERENCES preparatorios(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    ordem INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_preparatorio_materias_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_preparatorio_materias_updated_at ON preparatorio_materias;
CREATE TRIGGER trigger_update_preparatorio_materias_updated_at
    BEFORE UPDATE ON preparatorio_materias
    FOR EACH ROW
    EXECUTE FUNCTION update_preparatorio_materias_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_preparatorio_materias_preparatorio
    ON preparatorio_materias(preparatorio_id);
CREATE INDEX IF NOT EXISTS idx_preparatorio_materias_ordem
    ON preparatorio_materias(preparatorio_id, ordem);

-- =====================================================
-- Tabela: assuntos
-- Armazena os assuntos/tópicos de cada matéria
-- =====================================================
CREATE TABLE IF NOT EXISTS assuntos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    materia_id UUID NOT NULL REFERENCES preparatorio_materias(id) ON DELETE CASCADE,
    nome VARCHAR(255) NOT NULL,
    descricao TEXT,
    sub_assuntos TEXT[], -- Array de subtópicos
    ordem INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_assuntos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_assuntos_updated_at ON assuntos;
CREATE TRIGGER trigger_update_assuntos_updated_at
    BEFORE UPDATE ON assuntos
    FOR EACH ROW
    EXECUTE FUNCTION update_assuntos_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_assuntos_materia
    ON assuntos(materia_id);
CREATE INDEX IF NOT EXISTS idx_assuntos_ordem
    ON assuntos(materia_id, ordem);

-- =====================================================
-- Tabela: conteudos
-- Armazena o conteúdo gerado (texto, áudio, imagem, mapa mental)
-- =====================================================
CREATE TABLE IF NOT EXISTS conteudos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assunto_id UUID NOT NULL REFERENCES assuntos(id) ON DELETE CASCADE,
    nivel_dificuldade VARCHAR(20) NOT NULL CHECK (nivel_dificuldade IN ('iniciante', 'intermediario', 'avancado')),

    -- Conteúdo textual
    texto TEXT,
    texto_resumo TEXT, -- Versão resumida para preview

    -- Áudio (podcast)
    audio_url TEXT,
    audio_duracao INTEGER, -- Duração em segundos

    -- Imagem de capa
    imagem_capa_url TEXT,

    -- Mapa mental
    mapa_mental_url TEXT,
    mapa_mental_data JSONB, -- Dados estruturados do mapa mental (se aplicável)

    -- Metadados de geração
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'generating', 'completed', 'error')),
    error_message TEXT,
    generation_started_at TIMESTAMPTZ,
    generation_completed_at TIMESTAMPTZ,

    -- Timestamps
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),

    -- Constraint única: apenas um conteúdo por assunto + nível
    UNIQUE(assunto_id, nivel_dificuldade)
);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_conteudos_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_conteudos_updated_at ON conteudos;
CREATE TRIGGER trigger_update_conteudos_updated_at
    BEFORE UPDATE ON conteudos
    FOR EACH ROW
    EXECUTE FUNCTION update_conteudos_updated_at();

-- Índices
CREATE INDEX IF NOT EXISTS idx_conteudos_assunto
    ON conteudos(assunto_id);
CREATE INDEX IF NOT EXISTS idx_conteudos_assunto_nivel
    ON conteudos(assunto_id, nivel_dificuldade);
CREATE INDEX IF NOT EXISTS idx_conteudos_status
    ON conteudos(status);

-- =====================================================
-- Row Level Security (RLS)
-- =====================================================

-- Habilitar RLS nas novas tabelas
ALTER TABLE preparatorio_materias ENABLE ROW LEVEL SECURITY;
ALTER TABLE assuntos ENABLE ROW LEVEL SECURITY;
ALTER TABLE conteudos ENABLE ROW LEVEL SECURITY;

-- Políticas para preparatorio_materias
DROP POLICY IF EXISTS "preparatorio_materias_select_policy" ON preparatorio_materias;
CREATE POLICY "preparatorio_materias_select_policy" ON preparatorio_materias
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "preparatorio_materias_all_policy" ON preparatorio_materias;
CREATE POLICY "preparatorio_materias_all_policy" ON preparatorio_materias
    FOR ALL USING (true);

-- Políticas para assuntos
DROP POLICY IF EXISTS "assuntos_select_policy" ON assuntos;
CREATE POLICY "assuntos_select_policy" ON assuntos
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "assuntos_all_policy" ON assuntos;
CREATE POLICY "assuntos_all_policy" ON assuntos
    FOR ALL USING (true);

-- Políticas para conteudos
DROP POLICY IF EXISTS "conteudos_select_policy" ON conteudos;
CREATE POLICY "conteudos_select_policy" ON conteudos
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "conteudos_all_policy" ON conteudos;
CREATE POLICY "conteudos_all_policy" ON conteudos
    FOR ALL USING (true);

-- =====================================================
-- Storage bucket para conteúdos (áudio, imagens)
-- =====================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('conteudos', 'conteudos', true)
ON CONFLICT (id) DO NOTHING;

-- Política de acesso público para leitura
DROP POLICY IF EXISTS "conteudos_public_read" ON storage.objects;
CREATE POLICY "conteudos_public_read" ON storage.objects
    FOR SELECT USING (bucket_id = 'conteudos');

-- Política para upload (usuários autenticados ou serviço)
DROP POLICY IF EXISTS "conteudos_authenticated_upload" ON storage.objects;
CREATE POLICY "conteudos_authenticated_upload" ON storage.objects
    FOR INSERT WITH CHECK (bucket_id = 'conteudos');

-- Política para delete (usuários autenticados ou serviço)
DROP POLICY IF EXISTS "conteudos_authenticated_delete" ON storage.objects;
CREATE POLICY "conteudos_authenticated_delete" ON storage.objects
    FOR DELETE USING (bucket_id = 'conteudos');
