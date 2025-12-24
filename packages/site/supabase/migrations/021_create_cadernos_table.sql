-- Create cadernos table for saving question filters
CREATE TABLE IF NOT EXISTS cadernos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  filters JSONB NOT NULL DEFAULT '{}',
  questions_count INTEGER DEFAULT 0,
  is_favorite BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE cadernos ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own cadernos" ON cadernos
  FOR ALL
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_cadernos_user_id ON cadernos(user_id);
CREATE INDEX IF NOT EXISTS idx_cadernos_created_at ON cadernos(created_at DESC);