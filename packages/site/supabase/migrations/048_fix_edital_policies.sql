-- Fix: Recriar políticas do edital verticalizado
-- Execute apenas este SQL para corrigir as políticas

-- Remover políticas existentes
DROP POLICY IF EXISTS "Authenticated users can read edital items" ON edital_verticalizado_items;
DROP POLICY IF EXISTS "Authenticated users can insert edital items" ON edital_verticalizado_items;
DROP POLICY IF EXISTS "Authenticated users can update edital items" ON edital_verticalizado_items;
DROP POLICY IF EXISTS "Authenticated users can delete edital items" ON edital_verticalizado_items;

DROP POLICY IF EXISTS "Authenticated users can read missao edital items" ON missao_edital_items;
DROP POLICY IF EXISTS "Authenticated users can insert missao edital items" ON missao_edital_items;
DROP POLICY IF EXISTS "Authenticated users can update missao edital items" ON missao_edital_items;
DROP POLICY IF EXISTS "Authenticated users can delete missao edital items" ON missao_edital_items;

-- Recriar políticas
CREATE POLICY "Authenticated users can read edital items"
    ON edital_verticalizado_items FOR SELECT
    TO authenticated
    USING (true);

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

CREATE POLICY "Authenticated users can read missao edital items"
    ON missao_edital_items FOR SELECT
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
