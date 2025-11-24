-- ====================================
-- CONFIGURAÇÃO DO SUPABASE STORAGE
-- Bucket: blog-images
-- ====================================

-- Nota: O bucket precisa ser criado manualmente via interface do Supabase
-- Dashboard → Storage → New bucket
-- Nome: blog-images
-- Public: ✅ Sim

-- ====================================
-- POLÍTICAS DE ACESSO (RLS Policies)
-- ====================================

-- 1. Permitir leitura pública (SELECT)
-- Qualquer pessoa pode visualizar as imagens
CREATE POLICY "Public Access - Read blog images"
ON storage.objects FOR SELECT
TO public
USING ( bucket_id = 'blog-images' );

-- 2. Permitir upload para usuários autenticados (INSERT)
-- Apenas usuários autenticados podem fazer upload
CREATE POLICY "Authenticated users can upload blog images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'blog-images' );

-- 3. Permitir remoção para usuários autenticados (DELETE)
-- Apenas usuários autenticados podem deletar
CREATE POLICY "Authenticated users can delete blog images"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'blog-images' );

-- 4. Permitir atualização para usuários autenticados (UPDATE)
-- Apenas usuários autenticados podem atualizar
CREATE POLICY "Authenticated users can update blog images"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'blog-images' );

-- ====================================
-- VERIFICAÇÃO
-- ====================================

-- Verificar se as políticas foram criadas
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
AND policyname LIKE '%blog%'
ORDER BY policyname;

-- ====================================
-- INSTRUÇÕES DE USO
-- ====================================

/*
PASSOS PARA CONFIGURAR:

1. Acesse o Supabase Dashboard:
   https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd

2. Crie o bucket manualmente:
   - Clique em "Storage" no menu lateral
   - Clique em "New bucket"
   - Nome: blog-images
   - Marque "Public bucket"
   - Clique em "Create bucket"

3. Execute este script SQL:
   - Clique em "SQL Editor" no menu lateral
   - Cole este script completo
   - Clique em "Run"

4. Verifique as políticas:
   - Volte para "Storage"
   - Clique no bucket "blog-images"
   - Vá na aba "Policies"
   - Você deve ver 4 políticas criadas

5. Teste o upload:
   - Acesse: http://localhost:5174/admin/articles/new
   - Faça upload de uma imagem
   - Verifique se aparece no Storage

ESTRUTURA DE PASTAS:
blog-images/
└── article-images/
    ├── {random}-{timestamp}.jpg
    ├── {random}-{timestamp}.png
    └── ...

TAMANHO MÁXIMO: 5MB (configurado no frontend)

TIPOS SUPORTADOS: JPG, PNG, WEBP, GIF
*/
