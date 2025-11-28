-- Migration: 002_create_editais_table
-- Description: Create editais table for PDF uploads and AI analysis
-- Project: ousepassar (avlttxzppcywybiaxxzd)
-- Date: 2025-11-27

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
