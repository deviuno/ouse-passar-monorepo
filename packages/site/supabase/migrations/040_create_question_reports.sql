-- Migration: Sistema de Reclamação de Questões
-- Permite que usuários reportem problemas em questões

-- Criar tabela de reports
CREATE TABLE IF NOT EXISTS question_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_id BIGINT NOT NULL,
  user_id UUID REFERENCES auth.users(id),

  -- Informações da questão (snapshot para histórico)
  question_materia TEXT,
  question_assunto TEXT,
  question_banca TEXT,
  question_ano INTEGER,

  -- Dados do report
  motivo TEXT NOT NULL CHECK (motivo IN (
    'resposta_errada',
    'questao_desatualizada',
    'enunciado_confuso',
    'alternativas_incorretas',
    'imagem_quebrada',
    'outro'
  )),
  descricao TEXT,

  -- Status e resolução
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN (
    'pendente',
    'em_analise',
    'resolvido',
    'rejeitado'
  )),
  admin_resposta TEXT,
  admin_id UUID REFERENCES auth.users(id),
  resolved_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_question_reports_status ON question_reports(status);
CREATE INDEX IF NOT EXISTS idx_question_reports_question_id ON question_reports(question_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_user_id ON question_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_question_reports_created_at ON question_reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_question_reports_motivo ON question_reports(motivo);

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_question_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_question_reports_updated_at ON question_reports;
CREATE TRIGGER trigger_question_reports_updated_at
  BEFORE UPDATE ON question_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_question_reports_updated_at();

-- RLS (Row Level Security)
ALTER TABLE question_reports ENABLE ROW LEVEL SECURITY;

-- Política: Usuários autenticados podem criar reports
CREATE POLICY "Users can create reports" ON question_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Política: Usuários podem ver seus próprios reports
CREATE POLICY "Users can view own reports" ON question_reports
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Política: Admins podem ver e gerenciar todos os reports
CREATE POLICY "Admins can manage all reports" ON question_reports
  FOR ALL
  TO authenticated
  USING (
    EXISTS (SELECT 1 FROM admin_users WHERE id = auth.uid())
  );

-- Comentários para documentação
COMMENT ON TABLE question_reports IS 'Armazena reclamações/reports de usuários sobre questões';
COMMENT ON COLUMN question_reports.motivo IS 'Tipo do problema: resposta_errada, questao_desatualizada, enunciado_confuso, alternativas_incorretas, imagem_quebrada, outro';
COMMENT ON COLUMN question_reports.status IS 'Status do report: pendente, em_analise, resolvido, rejeitado';
