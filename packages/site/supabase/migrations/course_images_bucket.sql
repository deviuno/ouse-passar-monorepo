-- Migration: Create course-images storage bucket
-- Run this in Supabase SQL Editor

-- Create the course-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'course-images',
  'course-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = true,
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "Public read access for course images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload course images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can update course images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete course images" ON storage.objects;
DROP POLICY IF EXISTS "Public upload for course images" ON storage.objects;
DROP POLICY IF EXISTS "Public update for course images" ON storage.objects;
DROP POLICY IF EXISTS "Public delete for course images" ON storage.objects;

-- Enable public access policy for course-images bucket
-- Allow anyone to read images
CREATE POLICY "Public read access for course images"
ON storage.objects FOR SELECT
USING (bucket_id = 'course-images');

-- Allow anyone to upload images (using anon key)
CREATE POLICY "Public upload for course images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'course-images');

-- Allow anyone to update images
CREATE POLICY "Public update for course images"
ON storage.objects FOR UPDATE
USING (bucket_id = 'course-images');

-- Allow anyone to delete images
CREATE POLICY "Public delete for course images"
ON storage.objects FOR DELETE
USING (bucket_id = 'course-images');
