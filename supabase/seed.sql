-- Supabase Seed File
-- Este arquivo é executado quando um branch de preview é criado
-- NÃO é executado em produção

-- ===========================================
-- DADOS DE TESTE PARA AMBIENTE DE DESENVOLVIMENTO
-- ===========================================

-- Inserir preparatório de teste
INSERT INTO preparatorios (id, nome, slug, descricao, banca, is_active, created_at)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'Preparatório Teste', 'teste', 'Preparatório para testes de desenvolvimento', 'CEBRASPE', true, NOW())
ON CONFLICT (id) DO NOTHING;

-- Inserir algumas questões de teste
INSERT INTO questoes_concurso (id, materia, assunto, enunciado, alternativas, gabarito, banca, orgao, ano, ativo)
VALUES
  (999001, 'Língua Portuguesa', 'Interpretação de Texto',
   'Considere o texto a seguir para responder à questão. [TEXTO DE TESTE] Com base no texto, é correto afirmar que:',
   '[{"letter": "A", "text": "Alternativa A - correta"}, {"letter": "B", "text": "Alternativa B - incorreta"}, {"letter": "C", "text": "Alternativa C - incorreta"}, {"letter": "D", "text": "Alternativa D - incorreta"}, {"letter": "E", "text": "Alternativa E - incorreta"}]',
   'A', 'CEBRASPE', 'Órgão Teste', 2024, true),
  (999002, 'Direito Constitucional', 'Direitos Fundamentais',
   'Sobre os direitos e garantias fundamentais previstos na Constituição Federal, assinale a alternativa correta:',
   '[{"letter": "A", "text": "Alternativa A - incorreta"}, {"letter": "B", "text": "Alternativa B - correta"}, {"letter": "C", "text": "Alternativa C - incorreta"}, {"letter": "D", "text": "Alternativa D - incorreta"}, {"letter": "E", "text": "Alternativa E - incorreta"}]',
   'B', 'CEBRASPE', 'Órgão Teste', 2024, true),
  (999003, 'Raciocínio Lógico', 'Proposições Lógicas',
   'Considere as seguintes proposições: P: "Todo concurseiro estuda muito." Q: "Alguns concurseiros passam no primeiro concurso." A negação de P é:',
   '[{"letter": "A", "text": "Nenhum concurseiro estuda muito"}, {"letter": "B", "text": "Algum concurseiro não estuda muito"}, {"letter": "C", "text": "Todo concurseiro não estuda muito"}, {"letter": "D", "text": "Alternativa D"}, {"letter": "E", "text": "Alternativa E"}]',
   'B', 'FCC', 'Órgão Teste', 2024, true)
ON CONFLICT (id) DO NOTHING;

-- Inserir bancas de teste na nova tabela (quando existir)
-- INSERT INTO bancas (nome, sigla) VALUES
--   ('Centro Brasileiro de Pesquisa em Avaliação e Seleção e de Promoção de Eventos', 'CEBRASPE'),
--   ('Fundação Carlos Chagas', 'FCC')
-- ON CONFLICT DO NOTHING;

-- System settings para desenvolvimento
INSERT INTO system_settings (key, value, category, description)
VALUES
  ('dev_mode', 'true', 'development', 'Modo de desenvolvimento ativo')
ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value;

-- ===========================================
-- FIM DOS DADOS DE TESTE
-- ===========================================

-- Nota: Dados de produção (questões reais, usuários, etc.)
-- NÃO são copiados para branches de preview por segurança.
