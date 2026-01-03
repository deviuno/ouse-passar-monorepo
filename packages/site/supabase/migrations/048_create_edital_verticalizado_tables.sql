-- Migration: Criar tabelas para Edital Verticalizado
-- Data: 2024-12-31
--
-- Estrutura:
-- - edital_verticalizado_items: Armazena blocos, matérias e tópicos do edital
-- - missao_edital_items: Vincula missões aos tópicos do edital

-- ==================== TABELA: edital_verticalizado_items ====================
-- Armazena os itens do edital verticalizado (blocos, matérias, tópicos)

CREATE TABLE IF NOT EXISTS edital_verticalizado_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preparatorio_id UUID REFERENCES preparatorios(id) ON DELETE CASCADE,
    tipo TEXT NOT NULL CHECK (tipo IN ('bloco', 'materia', 'topico')),
    titulo TEXT NOT NULL,
    ordem INTEGER NOT NULL DEFAULT 0,
    parent_id UUID REFERENCES edital_verticalizado_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_edital_vert_items_preparatorio
    ON edital_verticalizado_items(preparatorio_id);

CREATE INDEX IF NOT EXISTS idx_edital_vert_items_parent
    ON edital_verticalizado_items(parent_id);

CREATE INDEX IF NOT EXISTS idx_edital_vert_items_tipo
    ON edital_verticalizado_items(tipo);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_edital_vert_items_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_edital_vert_items_updated_at ON edital_verticalizado_items;
CREATE TRIGGER trigger_edital_vert_items_updated_at
    BEFORE UPDATE ON edital_verticalizado_items
    FOR EACH ROW
    EXECUTE FUNCTION update_edital_vert_items_updated_at();

-- Comentários
COMMENT ON TABLE edital_verticalizado_items IS 'Itens do edital verticalizado (blocos, matérias, tópicos)';
COMMENT ON COLUMN edital_verticalizado_items.tipo IS 'Tipo do item: bloco, materia ou topico';
COMMENT ON COLUMN edital_verticalizado_items.parent_id IS 'ID do item pai (para hierarquia)';
COMMENT ON COLUMN edital_verticalizado_items.ordem IS 'Ordem de exibição dentro do mesmo nível';

-- ==================== TABELA: missao_edital_items ====================
-- Vincula missões aos tópicos do edital verticalizado

CREATE TABLE IF NOT EXISTS missao_edital_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    missao_id UUID NOT NULL REFERENCES missoes(id) ON DELETE CASCADE,
    edital_item_id UUID NOT NULL REFERENCES edital_verticalizado_items(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(missao_id, edital_item_id)
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_missao_edital_items_missao
    ON missao_edital_items(missao_id);

CREATE INDEX IF NOT EXISTS idx_missao_edital_items_edital
    ON missao_edital_items(edital_item_id);

-- Comentários
COMMENT ON TABLE missao_edital_items IS 'Vincula missões aos tópicos do edital verticalizado';
COMMENT ON COLUMN missao_edital_items.missao_id IS 'ID da missão';
COMMENT ON COLUMN missao_edital_items.edital_item_id IS 'ID do item do edital (geralmente tópico)';

-- ==================== RLS ====================
-- Habilitar RLS
ALTER TABLE edital_verticalizado_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE missao_edital_items ENABLE ROW LEVEL SECURITY;

-- Políticas de leitura (todos autenticados podem ler)
CREATE POLICY "Authenticated users can read edital items"
    ON edital_verticalizado_items FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can read missao edital items"
    ON missao_edital_items FOR SELECT
    TO authenticated
    USING (true);

-- Políticas de escrita (todos autenticados podem inserir/atualizar/deletar)
CREATE POLICY "Authenticated users can insert edital items"
    ON edital_verticalizado_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update edital items"
    ON edital_verticalizado_items FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete edital items"
    ON edital_verticalizado_items FOR DELETE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can insert missao edital items"
    ON missao_edital_items FOR INSERT
    TO authenticated
    WITH CHECK (true);

CREATE POLICY "Authenticated users can update missao edital items"
    ON missao_edital_items FOR UPDATE
    TO authenticated
    USING (true);

CREATE POLICY "Authenticated users can delete missao edital items"
    ON missao_edital_items FOR DELETE
    TO authenticated
    USING (true);
