-- Migration: Atualizar templates de email para refletir renomeação de produtos
-- "Ouse Questões" (produto por preparatório) -> "Turma de Elite"
-- Nova assinatura da plataforma -> "Assinatura Ouse Questões"

-- 1. Atualizar o template existente de ouse_questoes para turma_elite
UPDATE email_templates
SET
  produto = 'turma_elite',
  nome_produto = 'Turma de Elite',
  assunto = 'Bem-vindo à Turma de Elite!',
  corpo_html = '<h1>Olá, {{nome}}!</h1><p>Seja bem-vindo à <strong>Turma de Elite</strong> do Ouse Passar!</p><p>Agora você tem acesso às trilhas de estudos personalizadas para o seu preparatório. Com missões diárias e questões selecionadas, você vai evoluir constantemente!</p><p>Comece agora sua jornada rumo à aprovação!</p><p>Bons estudos,<br>Equipe Ouse Passar</p>',
  corpo_texto = 'Olá, {{nome}}!\n\nSeja bem-vindo à Turma de Elite do Ouse Passar!\n\nAgora você tem acesso às trilhas de estudos personalizadas para o seu preparatório. Com missões diárias e questões selecionadas, você vai evoluir constantemente!\n\nComece agora sua jornada rumo à aprovação!\n\nBons estudos,\nEquipe Ouse Passar',
  updated_at = NOW()
WHERE produto = 'ouse_questoes';

-- 2. Adicionar template para a Assinatura Ouse Questões (assinatura anual da plataforma)
INSERT INTO email_templates (produto, nome_produto, assunto, corpo_html, corpo_texto, variaveis_disponiveis, ativo)
VALUES (
  'assinatura_ouse_questoes',
  'Assinatura Ouse Questões',
  'Bem-vindo à Assinatura Ouse Questões!',
  '<h1>Olá, {{nome}}!</h1><p>Seja bem-vindo à <strong>Assinatura Ouse Questões</strong>!</p><p>Agora você tem acesso ilimitado ao módulo "Praticar Questões" por 12 meses! Milhares de questões de concursos disponíveis para você treinar.</p><p>Pratique todos os dias e veja sua evolução!</p><p>Bons estudos,<br>Equipe Ouse Passar</p>',
  'Olá, {{nome}}!\n\nSeja bem-vindo à Assinatura Ouse Questões!\n\nAgora você tem acesso ilimitado ao módulo "Praticar Questões" por 12 meses! Milhares de questões de concursos disponíveis para você treinar.\n\nPratique todos os dias e veja sua evolução!\n\nBons estudos,\nEquipe Ouse Passar',
  '["nome", "email", "produto"]'::jsonb,
  true
)
ON CONFLICT (produto) DO NOTHING;
