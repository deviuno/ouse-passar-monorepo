-- Migration: 001_create_courses_table
-- Description: Create courses table for simulados and preparatórios
-- Project: ousepassar (avlttxzppcywybiaxxzd)
-- Date: 2025-11-27

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
