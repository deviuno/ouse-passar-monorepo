-- ============================================================================
-- MIGRATIONS: Integração de Questões - Ouse Passar
-- Execute este script no Supabase SQL Editor
-- Projeto: ousepassar (avlttxzppcywybiaxxzd)
-- Data: 2025-11-27
-- ============================================================================

-- ============================================================================
-- 001: CREATE COURSES TABLE
-- ============================================================================

-- Create courses table if not exists
CREATE TABLE IF NOT EXISTS courses (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  title TEXT NOT NULL,
  subtitle TEXT,
  description TEXT,
  icon TEXT,
  image_url TEXT,
  price NUMERIC(10,2),
  is_active BOOLEAN DEFAULT false,

  -- Type of course
  course_type TEXT DEFAULT 'simulado'
    CHECK (course_type IN ('preparatorio', 'simulado')),

  -- Integration with questions bank
  question_filters JSONB DEFAULT '{}',
  questions_count INTEGER DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_courses_is_active ON courses(is_active);
CREATE INDEX IF NOT EXISTS idx_courses_type ON courses(course_type);
CREATE INDEX IF NOT EXISTS idx_courses_created_at ON courses(created_at DESC);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Anyone can read active courses" ON courses;
DROP POLICY IF EXISTS "Authenticated users can manage courses" ON courses;

-- Policy: Anyone can read active courses
CREATE POLICY "Anyone can read active courses" ON courses
  FOR SELECT
  USING (is_active = true);

-- Policy: Authenticated users can manage courses (for admin)
CREATE POLICY "Authenticated users can manage courses" ON courses
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create updated_at trigger function if not exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS update_courses_updated_at ON courses;
CREATE TRIGGER update_courses_updated_at
  BEFORE UPDATE ON courses
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE courses IS 'Stores simulados and preparatórios with question filters';
COMMENT ON COLUMN courses.question_filters IS 'JSONB with filters: materias[], bancas[], anos[], orgaos[], assuntos[], excludeIds[], limit';
COMMENT ON COLUMN courses.questions_count IS 'Cached count of questions matching the filters';

-- ============================================================================
-- 002: CREATE EDITAIS TABLE
-- ============================================================================

-- Create editais table
CREATE TABLE IF NOT EXISTS editais (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id TEXT REFERENCES courses(id) ON DELETE CASCADE,

  -- File information
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_size INTEGER,
  file_type TEXT DEFAULT 'application/pdf',

  -- Processing status
  status TEXT DEFAULT 'pending'
    CHECK (status IN ('pending', 'processing', 'completed', 'error')),

  -- AI Analysis results
  ai_analysis JSONB,
  suggested_filters JSONB,
  matched_questions_count INTEGER,

  -- Extracted metadata from the edital
  concurso_nome TEXT,
  orgao TEXT,
  banca TEXT,
  ano INTEGER,
  cargos TEXT[],

  -- Processing logs
  processing_log TEXT,
  error_message TEXT,

  -- Timestamps
  uploaded_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  approved_at TIMESTAMPTZ,
  approved_by TEXT,

  -- N8N Integration
  n8n_execution_id TEXT,
  webhook_response JSONB
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_editais_course_id ON editais(course_id);
CREATE INDEX IF NOT EXISTS idx_editais_status ON editais(status);
CREATE INDEX IF NOT EXISTS idx_editais_uploaded_at ON editais(uploaded_at DESC);

-- Enable RLS
ALTER TABLE editais ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can manage editais" ON editais;
DROP POLICY IF EXISTS "Allow updates from n8n" ON editais;

-- Policy: Authenticated users can manage editais
CREATE POLICY "Authenticated users can manage editais" ON editais
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Policy: Allow public insert for n8n webhooks (with anon key)
CREATE POLICY "Allow updates from n8n" ON editais
  FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Add edital_id reference to courses
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS edital_id UUID REFERENCES editais(id);

-- Comments
COMMENT ON TABLE editais IS 'Stores uploaded editais and AI analysis results';
COMMENT ON COLUMN editais.ai_analysis IS 'Full AI analysis of the edital content';
COMMENT ON COLUMN editais.suggested_filters IS 'Question filters suggested by AI';
COMMENT ON COLUMN editais.n8n_execution_id IS 'N8N workflow execution ID for tracking';

-- ============================================================================
-- 003: CREATE EDITAIS STORAGE BUCKET
-- ============================================================================

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

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload editais" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read editais" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete editais" ON storage.objects;
DROP POLICY IF EXISTS "Service role full access to editais" ON storage.objects;

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

-- ============================================================================
-- 004: ADD BLOCK_SIZE TO COURSES
-- ============================================================================

-- Add block_size column to courses table
-- This controls how many questions appear per simulado block for students
ALTER TABLE courses
ADD COLUMN IF NOT EXISTS block_size INTEGER DEFAULT 20;

-- Comment
COMMENT ON COLUMN courses.block_size IS 'Number of questions per simulado block shown to students. Default is 20.';

-- ============================================================================
-- DONE! Migrations completed successfully.
-- ============================================================================
