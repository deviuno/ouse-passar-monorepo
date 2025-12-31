-- Fix RLS policies for user_missao_progress table
-- The table exists but RLS is blocking access (406 Not Acceptable error)

-- First, ensure RLS is enabled
ALTER TABLE IF EXISTS user_missao_progress ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can view own progress" ON user_missao_progress;
DROP POLICY IF EXISTS "Users can insert own progress" ON user_missao_progress;
DROP POLICY IF EXISTS "Users can update own progress" ON user_missao_progress;
DROP POLICY IF EXISTS "Users can delete own progress" ON user_missao_progress;

-- Create policies for authenticated users to manage their own progress
CREATE POLICY "Users can view own progress"
    ON user_missao_progress FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress"
    ON user_missao_progress FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own progress"
    ON user_missao_progress FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own progress"
    ON user_missao_progress FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- Also add study_mode column if it doesn't exist
ALTER TABLE user_missao_progress
ADD COLUMN IF NOT EXISTS study_mode TEXT DEFAULT 'zen';

COMMENT ON COLUMN user_missao_progress.study_mode IS 'Modo de estudo: zen (com ajuda) ou hard (sem ajuda)';
