-- Migration: 003_create_editais_storage
-- Description: Create storage bucket for editais PDFs
-- Project: ousepassar (avlttxzppcywybiaxxzd)
-- Date: 2025-11-27

-- Create bucket for editais (private)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'editais',
  'editais',
  false,
  10485760, -- 10MB limit
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  file_size_limit = 10485760,
  allowed_mime_types = ARRAY['application/pdf'];

-- Policy: Authenticated users can upload editais
CREATE POLICY "Authenticated users can upload editais"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'editais');

-- Policy: Authenticated users can read editais
CREATE POLICY "Authenticated users can read editais"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'editais');

-- Policy: Authenticated users can delete editais
CREATE POLICY "Authenticated users can delete editais"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'editais');

-- Policy: Allow service role full access (for n8n)
CREATE POLICY "Service role full access to editais"
ON storage.objects FOR ALL
TO service_role
USING (bucket_id = 'editais')
WITH CHECK (bucket_id = 'editais');
