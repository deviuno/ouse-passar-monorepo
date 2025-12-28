-- Fix: Corrigir política RLS para admins gerenciarem reports
-- O painel admin não usa Supabase Auth, então precisamos de políticas públicas

-- Remover políticas antigas
DROP POLICY IF EXISTS "Admins can manage all reports" ON question_reports;

-- Adicionar política pública para leitura (igual admin_users)
-- O painel admin faz autenticação via tabela admin_users, não via Supabase Auth
DROP POLICY IF EXISTS "Public read access for admin" ON question_reports;
CREATE POLICY "Public read access for admin" ON question_reports
  FOR SELECT
  TO public
  USING (true);

-- Adicionar política pública para update
DROP POLICY IF EXISTS "Public update access for admin" ON question_reports;
CREATE POLICY "Public update access for admin" ON question_reports
  FOR UPDATE
  TO public
  USING (true);
