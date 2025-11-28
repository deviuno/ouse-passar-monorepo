-- INSERTs de Categorias para Blog de Concursos Públicos
-- Execute estes comandos no Supabase SQL Editor

-- Categorias principais para concursos
INSERT INTO public.categories (name, slug, description) VALUES
  ('Estudos e Técnicas', 'estudos-e-tecnicas', 'Métodos de estudo, técnicas de memorização e produtividade para concurseiros'),
  ('Análise de Editais', 'analise-de-editais', 'Análises detalhadas de editais e estratégias específicas por concurso'),
  ('Carreiras Policiais', 'carreiras-policiais', 'Conteúdo focado em concursos para polícias (Federal, Civil, Militar, Rodoviária)'),
  ('Carreiras Jurídicas', 'carreiras-juridicas', 'Tribunais, Ministério Público, OAB e outras carreiras do direito'),
  ('Carreiras Fiscais', 'carreiras-fiscais', 'Receita Federal, Auditor Fiscal e concursos da área tributária'),
  ('Área Administrativa', 'area-administrativa', 'Concursos administrativos de prefeituras, estados e União'),
  ('Preparação Física', 'preparacao-fisica', 'TAF, preparação física e saúde para concursos com testes físicos'),
  ('Mentalidade e Motivação', 'mentalidade-e-motivacao', 'Mindset, controle emocional e motivação para a jornada do concurseiro'),
  ('Legislação', 'legislacao', 'Análises de leis, jurisprudências e atualizações legislativas'),
  ('Português e Redação', 'portugues-e-redacao', 'Gramática, interpretação de texto e técnicas de redação'),
  ('Raciocínio Lógico', 'raciocinio-logico', 'RLM, matemática e raciocínio quantitativo'),
  ('Informática', 'informatica', 'Informática básica, sistemas operacionais e segurança da informação'),
  ('Direito Constitucional', 'direito-constitucional', 'Constituição Federal e direitos fundamentais'),
  ('Direito Administrativo', 'direito-administrativo', 'Princípios, atos administrativos e licitações'),
  ('Atualidades', 'atualidades', 'Notícias relevantes para provas e acontecimentos importantes'),
  ('Dicas de Prova', 'dicas-de-prova', 'Estratégias para o dia da prova e como lidar com diferentes bancas'),
  ('Pós-Edital', 'pos-edital', 'O que fazer depois que o edital sai e como otimizar os estudos'),
  ('Revisão', 'revisao', 'Técnicas e cronogramas de revisão para fixação do conteúdo'),
  ('Saúde e Bem-Estar', 'saude-e-bem-estar', 'Cuidados com a saúde física e mental durante a preparação'),
  ('Recursos Didáticos', 'recursos-didaticos', 'PDFs, resumos, mapas mentais e materiais complementares')
ON CONFLICT (slug) DO NOTHING;

-- Categorias por matéria específica
INSERT INTO public.categories (name, slug, description) VALUES
  ('Matemática', 'matematica', 'Conteúdos de matemática básica e avançada para concursos'),
  ('Direito Penal', 'direito-penal', 'Crimes, penas e legislação penal'),
  ('Direito Processual Penal', 'direito-processual-penal', 'Processo penal e procedimentos judiciais'),
  ('Direito Civil', 'direito-civil', 'Código Civil, obrigações e contratos'),
  ('Estatística', 'estatistica', 'Probabilidade, estatística descritiva e inferencial')
ON CONFLICT (slug) DO NOTHING;

-- Categorias por banca examinadora
INSERT INTO public.categories (name, slug, description) VALUES
  ('Banca Cebraspe', 'banca-cebraspe', 'Análises e dicas específicas para a banca Cebraspe (ex-Cespe)'),
  ('Banca FGV', 'banca-fgv', 'Análises e dicas específicas para a banca FGV'),
  ('Banca FCC', 'banca-fcc', 'Análises e dicas específicas para a banca FCC'),
  ('Banca Vunesp', 'banca-vunesp', 'Análises e dicas específicas para a banca Vunesp')
ON CONFLICT (slug) DO NOTHING;

-- Verificar categorias inseridas
-- SELECT * FROM public.categories ORDER BY name;
