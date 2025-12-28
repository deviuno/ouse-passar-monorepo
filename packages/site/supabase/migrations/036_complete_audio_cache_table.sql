-- ============================================================================
-- CONFIGURAÇÃO COMPLETA DA TABELA AUDIO_CACHE
-- ============================================================================
-- Adiciona as colunas necessárias para o sistema de cache de áudio

-- Adicionar colunas se não existirem
DO $$
BEGIN
    -- content_hash: hash SHA-256 do título + conteúdo
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audio_cache' AND column_name = 'content_hash') THEN
        ALTER TABLE audio_cache ADD COLUMN content_hash TEXT;
    END IF;

    -- audio_type: 'explanation' ou 'podcast'
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audio_cache' AND column_name = 'audio_type') THEN
        ALTER TABLE audio_cache ADD COLUMN audio_type TEXT;
    END IF;

    -- audio_url: URL pública do áudio no Storage
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audio_cache' AND column_name = 'audio_url') THEN
        ALTER TABLE audio_cache ADD COLUMN audio_url TEXT;
    END IF;

    -- title: título do conteúdo (para referência)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'audio_cache' AND column_name = 'title') THEN
        ALTER TABLE audio_cache ADD COLUMN title TEXT;
    END IF;
END $$;

-- Criar índice para busca por hash + tipo
CREATE INDEX IF NOT EXISTS idx_audio_cache_content_hash
ON audio_cache(content_hash);

CREATE INDEX IF NOT EXISTS idx_audio_cache_type
ON audio_cache(audio_type);

-- Constraint única para evitar duplicatas (content_hash + audio_type)
ALTER TABLE audio_cache
DROP CONSTRAINT IF EXISTS audio_cache_content_hash_audio_type_key;

ALTER TABLE audio_cache
ADD CONSTRAINT audio_cache_content_hash_audio_type_key
UNIQUE (content_hash, audio_type);

-- ============================================================================
-- CRIAR BUCKET DE STORAGE PARA ÁUDIOS (se não existir)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('audio-cache', 'audio-cache', true)
ON CONFLICT (id) DO NOTHING;

-- Política para permitir leitura pública
DROP POLICY IF EXISTS "audio_cache_public_read" ON storage.objects;
CREATE POLICY "audio_cache_public_read" ON storage.objects
FOR SELECT
USING (bucket_id = 'audio-cache');

-- Política para permitir insert por usuários autenticados
DROP POLICY IF EXISTS "audio_cache_authenticated_insert" ON storage.objects;
CREATE POLICY "audio_cache_authenticated_insert" ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'audio-cache');

-- Política para permitir update por usuários autenticados
DROP POLICY IF EXISTS "audio_cache_authenticated_update" ON storage.objects;
CREATE POLICY "audio_cache_authenticated_update" ON storage.objects
FOR UPDATE
USING (bucket_id = 'audio-cache');
