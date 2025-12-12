-- ======================================
-- Migration: Adicionar campos de vendas aos preparatorios
-- ======================================

-- Adicionar novos campos na tabela preparatorios
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS imagem_capa TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS preco_desconto DECIMAL(10,2);
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS checkout_url TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS descricao_curta TEXT;
ALTER TABLE preparatorios ADD COLUMN IF NOT EXISTS descricao_vendas TEXT;

-- Comentarios para documentacao
COMMENT ON COLUMN preparatorios.imagem_capa IS 'URL da imagem de capa do preparatorio para exibicao nos cards e pagina de vendas';
COMMENT ON COLUMN preparatorios.preco IS 'Preco cheio do preparatorio';
COMMENT ON COLUMN preparatorios.preco_desconto IS 'Preco com desconto (opcional)';
COMMENT ON COLUMN preparatorios.checkout_url IS 'URL para pagina de checkout/pagamento';
COMMENT ON COLUMN preparatorios.descricao_curta IS 'Descricao curta para cards (max 150 chars)';
COMMENT ON COLUMN preparatorios.descricao_vendas IS 'Descricao completa para pagina de vendas (markdown)';

-- ======================================
-- Storage Bucket para imagens
-- ======================================
-- Nota: Criar bucket 'preparatorios' no Supabase Dashboard ou via SQL:
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'preparatorios',
  'preparatorios',
  true,
  104857600, -- 100MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET file_size_limit = 104857600;

-- Politica para permitir leitura publica
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Imagens de preparatorios sao publicas' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Imagens de preparatorios sao publicas"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'preparatorios');
  END IF;
END $$;

-- Politica para permitir upload por usuarios autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios autenticados podem fazer upload preparatorios' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem fazer upload preparatorios"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'preparatorios' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Politica para permitir delete por usuarios autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios autenticados podem deletar preparatorios' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem deletar preparatorios"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'preparatorios' AND auth.role() = 'authenticated');
  END IF;
END $$;

-- Politica para permitir update por usuarios autenticados
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Usuarios autenticados podem atualizar preparatorios' AND tablename = 'objects'
  ) THEN
    CREATE POLICY "Usuarios autenticados podem atualizar preparatorios"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'preparatorios' AND auth.role() = 'authenticated');
  END IF;
END $$;
