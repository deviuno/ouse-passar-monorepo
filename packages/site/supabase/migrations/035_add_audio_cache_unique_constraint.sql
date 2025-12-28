-- ============================================================================
-- ADICIONAR CONSTRAINT ÚNICA PARA CACHE DE ÁUDIO
-- ============================================================================
-- Isso permite usar upsert no cache de áudio e garante que não haja duplicatas

ALTER TABLE audio_cache
DROP CONSTRAINT IF EXISTS audio_cache_content_hash_audio_type_key;

ALTER TABLE audio_cache
ADD CONSTRAINT audio_cache_content_hash_audio_type_key
UNIQUE (content_hash, audio_type);
