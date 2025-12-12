-- =====================================================
-- MIGRAÇÃO: Adicionar avatar_url e configurar storage
-- Execute este SQL no dashboard do Supabase:
-- https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd/sql/new
-- =====================================================

-- Adicionar coluna avatar_url na tabela admin_users
ALTER TABLE admin_users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- Verificação
SELECT 'admin_users' as tabela, count(*) as registros FROM admin_users;

-- =====================================================
-- IMPORTANTE: Configurar Storage Bucket manualmente
-- =====================================================
--
-- Após executar este SQL, você precisa criar o bucket de storage manualmente:
--
-- 1. Vá para Storage no dashboard do Supabase
-- 2. Clique em "New bucket"
-- 3. Nome: profile-photos
-- 4. Marque como "Public bucket"
-- 5. Clique em "Create bucket"
--
-- Depois, configure as políticas de acesso:
-- 1. Clique no bucket "profile-photos"
-- 2. Vá em "Policies"
-- 3. Adicione as seguintes políticas:
--
-- Para SELECT (visualização pública):
-- Policy name: Allow public read access
-- Allowed operation: SELECT
-- Policy definition: true
--
-- Para INSERT (upload):
-- Policy name: Allow authenticated uploads
-- Allowed operation: INSERT
-- Policy definition: true
--
-- Para UPDATE (atualização):
-- Policy name: Allow authenticated updates
-- Allowed operation: UPDATE
-- Policy definition: true
--
-- Para DELETE (exclusão):
-- Policy name: Allow authenticated deletes
-- Allowed operation: DELETE
-- Policy definition: true
-- =====================================================
