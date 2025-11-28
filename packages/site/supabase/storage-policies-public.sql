-- ====================================
-- POLÍTICAS RLS PARA STORAGE (PÚBLICO)
-- Bucket: blog-images
-- ====================================
--
-- IMPORTANTE: Esta configuração permite uploads públicos.
-- A validação de autenticação é feita na camada da aplicação.
-- Isso é necessário porque o app usa AuthContext customizado,
-- não Supabase Auth.
--

-- Primeiro, remover políticas existentes
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update" ON storage.objects;
DROP POLICY IF EXISTS "Public Access - Read blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete blog images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update blog images" ON storage.objects;

-- ====================================
-- NOVAS POLÍTICAS (PERMISSIVAS)
-- ====================================

-- 1. Leitura pública (qualquer um pode ver as imagens)
CREATE POLICY "Public read access for blog images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- 2. Upload público (qualquer um pode fazer upload)
-- Nota: A validação de autenticação é feita no frontend
CREATE POLICY "Public upload for blog images"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'blog-images'
  AND (storage.foldername(name))[1] = 'article-images'
);

-- 3. Delete público (qualquer um pode deletar)
-- Nota: A validação de autenticação é feita no frontend
CREATE POLICY "Public delete for blog images"
ON storage.objects FOR DELETE
TO public
USING (
  bucket_id = 'blog-images'
  AND (storage.foldername(name))[1] = 'article-images'
);

-- 4. Update público (para casos de substituição)
CREATE POLICY "Public update for blog images"
ON storage.objects FOR UPDATE
TO public
USING (
  bucket_id = 'blog-images'
  AND (storage.foldername(name))[1] = 'article-images'
);

-- ====================================
-- VERIFICAÇÃO
-- ====================================

-- Ver todas as políticas criadas
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- ====================================
-- INSTRUÇÕES
-- ====================================
--
-- 1. Copie este SQL completo
-- 2. Vá em: https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd/sql/new
-- 3. Cole e execute (Run / F5)
-- 4. Teste o upload em: http://localhost:5174/admin/articles/new
--
-- SEGURANÇA:
-- - O bucket aceita uploads públicos
-- - A aplicação valida autenticação via AuthContext
-- - Apenas a pasta 'article-images' é permitida
-- - Recomendado: implementar Supabase Auth futuramente
--
