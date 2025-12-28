-- =====================================================
-- RODADAS SETTINGS
-- =====================================================
-- Configurações para geração automática de rodadas

-- Inserir configurações padrão para rodadas
INSERT INTO public.system_settings (category, key, value, description) VALUES
  -- Configurações de tópicos por missão
  ('rodadas', 'topicos_por_missao_isolados', '2', 'Quantidade máxima de tópicos isolados (sem sub-entradas) por missão'),
  ('rodadas', 'topicos_por_missao_com_subtopicos', '3', 'Quantidade máxima de tópicos com sub-entradas por missão'),

  -- Configurações de revisão de matérias finalizadas
  ('rodadas', 'revisao_questoes_base', '25', 'Quantidade base de questões na primeira revisão de uma matéria finalizada'),
  ('rodadas', 'revisao_questoes_decremento', '5', 'Quantidade de questões a decrementar por rodada na revisão'),
  ('rodadas', 'revisao_questoes_minimo', '5', 'Quantidade mínima de questões por matéria na revisão'),

  -- Configurações de estrutura da rodada
  ('rodadas', 'materias_por_rodada', '5', 'Quantidade de matérias diferentes por rodada'),
  ('rodadas', 'missoes_extras_repeticao', '2', 'Quantidade de missões extras que repetem as matérias mais relevantes')
ON CONFLICT (category, key) DO NOTHING;
