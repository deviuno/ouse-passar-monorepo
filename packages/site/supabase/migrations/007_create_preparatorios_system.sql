-- Migration: Sistema de Preparatorios Dinamicos
-- Cria tabelas para gerenciar preparatorios, rodadas e missoes de forma dinamica

-- Enum para tipo de missao
CREATE TYPE missao_tipo AS ENUM ('padrao', 'revisao', 'acao');

-- Tabela de Preparatorios
CREATE TABLE preparatorios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(50) NOT NULL UNIQUE,
    descricao TEXT,
    icone VARCHAR(50) DEFAULT 'book',
    cor VARCHAR(20) DEFAULT '#3B82F6',
    is_active BOOLEAN DEFAULT true,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Rodadas
CREATE TABLE rodadas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preparatorio_id UUID NOT NULL REFERENCES preparatorios(id) ON DELETE CASCADE,
    numero INTEGER NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    nota TEXT,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(preparatorio_id, numero)
);

-- Tabela de Missoes
CREATE TABLE missoes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rodada_id UUID NOT NULL REFERENCES rodadas(id) ON DELETE CASCADE,
    numero VARCHAR(20) NOT NULL,
    tipo missao_tipo NOT NULL DEFAULT 'padrao',
    materia VARCHAR(100),
    assunto TEXT,
    instrucoes TEXT,
    tema TEXT,
    acao TEXT,
    extra TEXT[],
    obs TEXT,
    ordem INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Mensagens de Incentivo por Preparatorio
CREATE TABLE mensagens_incentivo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preparatorio_id UUID NOT NULL REFERENCES preparatorios(id) ON DELETE CASCADE,
    mensagem TEXT NOT NULL,
    ordem INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de Planejamentos Gerados (nova)
CREATE TABLE planejamentos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    preparatorio_id UUID NOT NULL REFERENCES preparatorios(id),
    nome_aluno VARCHAR(200) NOT NULL,
    email VARCHAR(200),
    mensagem_incentivo TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_rodadas_preparatorio ON rodadas(preparatorio_id);
CREATE INDEX idx_missoes_rodada ON missoes(rodada_id);
CREATE INDEX idx_mensagens_preparatorio ON mensagens_incentivo(preparatorio_id);
CREATE INDEX idx_planejamentos_preparatorio ON planejamentos(preparatorio_id);
CREATE INDEX idx_preparatorios_slug ON preparatorios(slug);
CREATE INDEX idx_preparatorios_active ON preparatorios(is_active);

-- Triggers para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_preparatorios_updated_at
    BEFORE UPDATE ON preparatorios
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rodadas_updated_at
    BEFORE UPDATE ON rodadas
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_missoes_updated_at
    BEFORE UPDATE ON missoes
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies
ALTER TABLE preparatorios ENABLE ROW LEVEL SECURITY;
ALTER TABLE rodadas ENABLE ROW LEVEL SECURITY;
ALTER TABLE missoes ENABLE ROW LEVEL SECURITY;
ALTER TABLE mensagens_incentivo ENABLE ROW LEVEL SECURITY;
ALTER TABLE planejamentos ENABLE ROW LEVEL SECURITY;

-- Policy para leitura publica de preparatorios ativos
CREATE POLICY "Preparatorios ativos sao publicos" ON preparatorios
    FOR SELECT USING (is_active = true);

CREATE POLICY "Rodadas de preparatorios ativos sao publicas" ON rodadas
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM preparatorios WHERE id = rodadas.preparatorio_id AND is_active = true)
    );

CREATE POLICY "Missoes de preparatorios ativos sao publicas" ON missoes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM rodadas r
            JOIN preparatorios p ON p.id = r.preparatorio_id
            WHERE r.id = missoes.rodada_id AND p.is_active = true
        )
    );

CREATE POLICY "Mensagens de preparatorios ativos sao publicas" ON mensagens_incentivo
    FOR SELECT USING (
        is_active = true AND
        EXISTS (SELECT 1 FROM preparatorios WHERE id = mensagens_incentivo.preparatorio_id AND is_active = true)
    );

CREATE POLICY "Planejamentos sao acessiveis pelo email" ON planejamentos
    FOR SELECT USING (true);

-- Policy para admin (todas as operacoes)
CREATE POLICY "Admin pode gerenciar preparatorios" ON preparatorios
    FOR ALL USING (true);

CREATE POLICY "Admin pode gerenciar rodadas" ON rodadas
    FOR ALL USING (true);

CREATE POLICY "Admin pode gerenciar missoes" ON missoes
    FOR ALL USING (true);

CREATE POLICY "Admin pode gerenciar mensagens" ON mensagens_incentivo
    FOR ALL USING (true);

CREATE POLICY "Admin pode gerenciar planejamentos" ON planejamentos
    FOR ALL USING (true);

-- ======================================
-- DADOS INICIAIS: Preparatorio PRF
-- ======================================

-- Inserir o preparatorio PRF
INSERT INTO preparatorios (id, nome, slug, descricao, icone, cor, is_active, ordem)
VALUES (
    'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
    'PRF - Policia Rodoviaria Federal',
    'prf',
    'Planejamento completo para o concurso da Policia Rodoviaria Federal com 16 rodadas e 184 missoes.',
    'shield',
    '#1E40AF',
    true,
    1
);

-- Inserir mensagens de incentivo do PRF
INSERT INTO mensagens_incentivo (preparatorio_id, mensagem, ordem, is_active) VALUES
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sua dedicacao vai te levar longe! Siga firme no planejamento.', 1, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cada missao concluida e um passo mais perto da sua aprovacao!', 2, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Disciplina e constancia sao as chaves do sucesso. Voce consegue!', 3, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'O esforco de hoje e a vitoria de amanha. Continue firme!', 4, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Acredite no seu potencial. A farda da PRF espera por voce!', 5, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Nao desista! Os melhores resultados vem para quem persiste.', 6, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Sua determinacao e sua maior arma. Use-a todos os dias!', 7, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Lembre-se: a dor do treinamento e temporaria, a gloria da aprovacao e permanente!', 8, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Voce esta no caminho certo. Confie no processo!', 9, true),
('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Cada hora de estudo te aproxima do seu objetivo. Siga em frente!', 10, true);

-- ======================================
-- RODADA 1
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000001', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 1, '1a RODADA (Missoes 1 a 10)', 1);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, ordem) VALUES
('11000000-0000-0000-0000-000000000001', '1', 'padrao', 'Direito Constitucional', 'Direitos e deveres individuais e coletivos', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 5o da Constituicao Federal', NULL, NULL, 1),
('11000000-0000-0000-0000-000000000001', '2', 'padrao', 'Portugues', '5.1 Emprego das classes de palavras. 5.2 Relacoes de coordenacao entre oracoes e entre termos da oracao. 5.3 Relacoes de subordinacao entre oracoes e entre termos da oracao.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 2),
('11000000-0000-0000-0000-000000000001', '3', 'padrao', 'Informatica', 'Conceito de internet e intranet', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 3),
('11000000-0000-0000-0000-000000000001', '4', 'padrao', 'Legislacao de Transito', 'CTB: Disposicoes preliminares. Vias e Velocidades', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 1 ao 4 e 60 ao 63 do CTB.', NULL, NULL, 4),
('11000000-0000-0000-0000-000000000001', '5', 'padrao', 'Raciocinio Logico', 'Teoria de Conjuntos', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 5),
('11000000-0000-0000-0000-000000000001', '6', 'padrao', 'Legislacao de Transito', 'CTB: Normas Gerais de Circulacao e Conduta. Da conducao de veiculos por motoristas profissionais', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 26 ao 67-E do CTB.', NULL, NULL, 6),
('11000000-0000-0000-0000-000000000001', '7', 'padrao', 'Direito Constitucional', 'Direitos sociais', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 6o ao 11o da Constituicao Federal', NULL, NULL, 7),
('11000000-0000-0000-0000-000000000001', '8', 'revisao', NULL, NULL, NULL, 'REVISAO OUSE PASSAR', NULL, 8),
('11000000-0000-0000-0000-000000000001', '9', 'acao', NULL, NULL, NULL, NULL, 'APLICAR AS TECNICAS OUSE PASSAR', 9),
('11000000-0000-0000-0000-000000000001', '10', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO', 10);

-- ======================================
-- RODADA 2
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000002', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 2, '2a RODADA (Missoes 11 a 20)', 2);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, ordem) VALUES
('11000000-0000-0000-0000-000000000002', '11', 'padrao', 'Direito Constitucional', 'Nacionalidade', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura dos artigos 12o e 13o da Constituicao Federal', NULL, NULL, 1),
('11000000-0000-0000-0000-000000000002', '12', 'padrao', 'Informatica', 'Conceitos e modos de utilizacao de tecnologias, ferramentas, aplicativos e procedimentos associados a internet/intranet. 2.1 Ferramentas e aplicativos comerciais de navegacao, de correio eletronico, de grupos de discussao, de busca, de pesquisa, de redes sociais e ferramentas colaborativas.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 2),
('11000000-0000-0000-0000-000000000002', '13', 'padrao', 'Portugues', 'Dominio da ortografia oficial.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 3),
('11000000-0000-0000-0000-000000000002', '14', 'padrao', 'Legislacao de Transito', 'CTB: Sistema Nacional de Transito', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 5o ao 25-A do CTB.', NULL, NULL, 4),
('11000000-0000-0000-0000-000000000002', '15', 'padrao', 'Raciocinio Logico', 'Porcentagem', 'Estudar a teoria pontual e resolver 44 questoes', NULL, NULL, 5),
('11000000-0000-0000-0000-000000000002', '16', 'padrao', 'Legislacao de Transito', 'CTB: Pedestres e Condutores de Veiculo nao Motorizados', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 68 ao 71 do CTB.', NULL, NULL, 6),
('11000000-0000-0000-0000-000000000002', '17', 'padrao', 'Direito Constitucional', '3 Poder Executivo. 3.1 Forma e sistema de governo. 3.2 Chefia de Estado e chefia de governo. 3.3 Atribuicoes e responsabilidades do presidente da Republica.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 76o ao 86o da Constituicao Federal', NULL, NULL, 7),
('11000000-0000-0000-0000-000000000002', '18', 'revisao', NULL, NULL, NULL, 'REVISAO OUSE PASSAR e APLICAR AS TECNICAS OUSE PASSAR', NULL, 8),
('11000000-0000-0000-0000-000000000002', '19', 'acao', NULL, NULL, NULL, NULL, 'PRODUZIR UMA DISCURSIVA', 9),
('11000000-0000-0000-0000-000000000002', '20', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO', 10);

-- ======================================
-- RODADA 3
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000003', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 3, '3a RODADA (Missoes 21 a 30)', 3);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, ordem) VALUES
('11000000-0000-0000-0000-000000000003', '21', 'padrao', 'Direito Constitucional', 'Direitos Politicos e Partidos Politicos', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 14o ao 17o da Constituicao Federal', NULL, NULL, 1),
('11000000-0000-0000-0000-000000000003', '22', 'padrao', 'Raciocinio Logico', 'Taxas de Variacao de grandeza. Razao e Proporcao com aplicacoes.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 2),
('11000000-0000-0000-0000-000000000003', '23', 'padrao', 'Legislacao de Transito', 'CTB: Cidadao. Educacao para o Transito.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 72 ao 79 do CTB.', NULL, NULL, 3),
('11000000-0000-0000-0000-000000000003', '24', 'padrao', 'Legislacao de Transito', 'CTB: Sinalizacao de Transito + Res. 160', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 80 ao 90 do CTB.', NULL, NULL, 4),
('11000000-0000-0000-0000-000000000003', '25', 'padrao', 'Portugues', 'Dominio dos mecanismos de coesao textual. Emprego de elementos de referenciacao, substituicao e repeticao, de conectores e de outros elementos de sequenciacao textual. Emprego de tempos e modos verbais.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 5),
('11000000-0000-0000-0000-000000000003', '26', 'padrao', 'Informatica', 'Nocoes de sistema operacional (ambiente Windows).', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 6),
('11000000-0000-0000-0000-000000000003', '27', 'padrao', 'Direito Constitucional', '3.4 Da Uniao: bens e competencias (arts. 20 a 24 da CF).', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura artigo 20 a 24 da Constituicao Federal', NULL, NULL, 7),
('11000000-0000-0000-0000-000000000003', '28', 'revisao', NULL, NULL, NULL, 'REVISAO OUSE PASSAR', NULL, 8),
('11000000-0000-0000-0000-000000000003', '29', 'acao', NULL, NULL, NULL, NULL, 'APLICAR AS TECNICAS OUSE PASSAR', 9),
('11000000-0000-0000-0000-000000000003', '30', 'acao', NULL, NULL, NULL, NULL, 'Iniciante: SIMULADO COM ASSUNTOS DA RODADA / Avancado: SIMULADO COMPLETO / Correcao do Simulado', 10);

-- ======================================
-- RODADA 4
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, nota, ordem)
VALUES ('11000000-0000-0000-0000-000000000004', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 4, '4a RODADA (Missoes 31 a 41)', 'A numeracao das missoes segue a ordem de apresentacao do conteudo para manter a logica de estudo.', 4);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, ordem) VALUES
('11000000-0000-0000-0000-000000000004', '31', 'padrao', 'Raciocinio Logico', 'Regra de Tres Simples e Composta.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 1),
('11000000-0000-0000-0000-000000000004', '32', 'padrao', 'Legislacao de Transito', 'Veiculos. Registro de Veiculos. Licenciamento.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 96 ao 117 e Art. 120 ao 135 do CTB.', NULL, NULL, 2),
('11000000-0000-0000-0000-000000000004', '33', 'padrao', 'Direito Constitucional', 'Ordem social. 5.1 Base e objetivos da ordem social. 5.2 Seguridade social. 5.3 Meio ambiente. 5.4 Familia, crianca, adolescente, idoso, indio.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 193 ao 204 // artigo 225 ao 232 da Constituicao Federal', NULL, NULL, 3),
('11000000-0000-0000-0000-000000000004', '34', 'revisao', NULL, NULL, NULL, 'REVISAO OUSE PASSAR', NULL, 4),
('11000000-0000-0000-0000-000000000004', '35', 'padrao', 'Direito Constitucional', 'Defesa do Estado e das instituicoes democraticas. 4.1 Forcas Armadas (art. 142, CF). 4.2 Seguranca publica (art. 144 da CF).', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do artigo 142 e 144 da Constituicao Federal.', NULL, NULL, 5),
('11000000-0000-0000-0000-000000000004', '36', 'padrao', 'Informatica', 'Acesso a distancia a computadores, transferencia de informacao e arquivos, aplicativos de audio, video e multimidia', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 6),
('11000000-0000-0000-0000-000000000004', '37', 'padrao', 'Portugues', 'Compreensao e interpretacao de textos de generos variados e Reconhecimento de tipos e generos textuais.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 7),
('11000000-0000-0000-0000-000000000004', '38', 'padrao', 'Legislacao de Transito', 'CTB: Engenharia de Trafego, Operacao, Fiscalizacao e Policiamento Ostensivo de Transito.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 91 ao 95 do CTB.', NULL, NULL, 8),
('11000000-0000-0000-0000-000000000004', '39', 'acao', NULL, NULL, NULL, NULL, 'APLICAR AS TECNICAS OUSE PASSAR', 9),
('11000000-0000-0000-0000-000000000004', '40', 'acao', NULL, NULL, NULL, NULL, 'PRODUZIR UMA DISCURSIVA', 10),
('11000000-0000-0000-0000-000000000004', '41', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO', 11);

-- ======================================
-- RODADA 5
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000005', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 5, '5a RODADA (Missoes 42 a 51)', 5);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, ordem) VALUES
('11000000-0000-0000-0000-000000000005', '42', 'padrao', 'Direito Constitucional', '1 Poder constituinte. 1.1 Fundamentos do poder constituinte. 1.2 Poder constituinte originario e derivado. 1.3 Reforma e revisao constitucionais. 1.4 Limitacao do poder de revisao. 1.5 Emendas a Constituicao.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 1),
('11000000-0000-0000-0000-000000000005', '43', 'padrao', 'Legislacao de Transito', 'CTB: Veiculos em Circulacao Internacional + Resolucao CONTRAN No 933 DE 28/03/2022 (revoga resolucao 360)', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 118 e 119 do CTB + Resolucao citada.', NULL, NULL, 2),
('11000000-0000-0000-0000-000000000005', '44', 'revisao', NULL, NULL, NULL, 'Revisao: Parte 1 - Direito Constitucional (5 missoes)', NULL, 3),
('11000000-0000-0000-0000-000000000005', '45', 'padrao', 'Portugues', '5.4 Emprego dos sinais de pontuacao.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 4),
('11000000-0000-0000-0000-000000000005', '46', 'padrao', 'Informatica', 'Transformacao digital. 3.1 Internet das coisas (IoT). 3.2 Big data. 3.3 Inteligencia artificial.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 5),
('11000000-0000-0000-0000-000000000005', '47', 'padrao', 'Raciocinio Logico', 'Sequencias numericas. Progressao aritmetica e Progressao Geometrica', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 6),
('11000000-0000-0000-0000-000000000005', '48', 'padrao', 'Legislacao de Transito', 'CTB: Conducao de Escolares. Conducao de Moto-frete.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 136 ao 139-B do CTB.', NULL, NULL, 7),
('11000000-0000-0000-0000-000000000005', '49', 'padrao', 'Direito Administrativo', '1. Nocoes de organizacao administrativa. 1.1 Centralizacao, descentralizacao, concentracao e desconcentracao. 1.2 Administracao direta e indireta. 1.3 Autarquias, fundacoes, empresas publicas e sociedades de economia mista.', 'Estudar a teoria pontual e resolver a lista de questoes.', 'Revisao: Parte 2 - Direito Constitucional (4 missoes)', NULL, 8),
('11000000-0000-0000-0000-000000000005', '50', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR e APLICAR AS TECNICAS OUSE PASSAR', 9),
('11000000-0000-0000-0000-000000000005', '51', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO', 10);

-- ======================================
-- RODADA 6
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000006', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 6, '6a RODADA (Missoes 52 a 62)', 6);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, extra, ordem) VALUES
('11000000-0000-0000-0000-000000000006', '52', 'padrao', 'Raciocinio Logico', 'Analise Combinatoria e probabilidade.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, NULL, 1),
('11000000-0000-0000-0000-000000000006', '53', 'padrao', 'Portugues', '5.5 Concordancia verbal e nominal.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, NULL, 2),
('11000000-0000-0000-0000-000000000006', '54', 'padrao', 'Informatica', 'Nocoes de virus, worms, phishing e pragas virtuais', 'Estudar a teoria pontual e resolver a lista de questoes.', 'Revisao: Parte 1 - Direito Constitucional (5 missoes)', NULL, NULL, 3),
('11000000-0000-0000-0000-000000000006', '55', 'padrao', 'Legislacao de Transito', 'CTB: Habilitacao + Res. 789 (Anexo I - Habilitacao)', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 140 ao 160 do CTB + Resolucao citada', NULL, NULL, NULL, 4),
('11000000-0000-0000-0000-000000000006', '56', 'padrao', 'Direito Administrativo', '2 Ato administrativo. 2.1 Conceito, requisitos, atributos, classificacao e especies.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, NULL, 5),
('11000000-0000-0000-0000-000000000006', '57', 'padrao', 'Legislacao de Transito', 'CTB: Infracoes de Transito.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 161 ao 255 do CTB.', NULL, NULL, NULL, 6),
('11000000-0000-0000-0000-000000000006', '58', 'padrao', 'Direito Administrativo', '3 Agentes publicos. 3.1 Legislacao pertinente. 3.1.1 Lei no 8.112/1990 e suas alteracoes. 3.1.2 Disposicoes constitucionais aplicaveis. 3.2 Disposicoes doutrinarias. 3.2.1 Conceito. 3.2.2 Especies. 3.2.3 Cargo, emprego e funcao publica. 3.3 Carreira de policial rodoviario federal.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, NULL, 7),
('11000000-0000-0000-0000-000000000006', '59', 'padrao', 'Legislacao de Transito', 'CTB: Penalidades.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 256 ao 268-A do CTB.', NULL, NULL, ARRAY['Revisao: Parte 2 - Direito Constitucional (4 missoes)'], 8),
('11000000-0000-0000-0000-000000000006', '60', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR + APLICAR AS TECNICAS OUSE PASSAR', NULL, 9),
('11000000-0000-0000-0000-000000000006', '61', 'acao', NULL, NULL, NULL, NULL, 'PRODUZIR UMA DISCURSIVA', NULL, 10),
('11000000-0000-0000-0000-000000000006', '62', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO (Iniciante: Rodada / Avancado: Completo) e CORRECAO', NULL, 11);

-- ======================================
-- RODADA 7
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000007', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 7, '7a RODADA (Missoes 63 a 74)', 7);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, ordem) VALUES
('11000000-0000-0000-0000-000000000007', '63', 'padrao', 'Raciocinio Logico', 'Modelagem de situacoes - problema por meio de equacoes do 1o e 2o graus e sistemas lineares.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 1),
('11000000-0000-0000-0000-000000000007', '64', 'padrao', 'Legislacao de Transito', 'Medidas Administrativas.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 269 ao 279 do CTB.', NULL, NULL, 2),
('11000000-0000-0000-0000-000000000007', '65', 'padrao', 'Informatica', 'Aplicativos para seguranca (antivirus, firewall, anti-spyware, VPN, etc.)', 'Estudar a teoria pontual e resolver a lista de questoes.', 'Revisao: Parte 1 - Direito Constitucional (5 missoes)', NULL, 3),
('11000000-0000-0000-0000-000000000007', '66', 'padrao', 'Direito Administrativo', '3.3.1 Lei no 9.654/1998 e suas alteracoes (carreira de PRF). 3.3.2 Lei no 12.855/2013 (indenizacao fronteiras). 3.3.3 Lei no 13.712/2018 (indenizacao PRF). 3.3.4 Decreto no 8.282/2014 (carreira de PRF).', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 4),
('11000000-0000-0000-0000-000000000007', '67', 'padrao', 'Legislacao de Transito', 'Processo Administrativo.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 280 ao 290 do CTB.', NULL, NULL, 5),
('11000000-0000-0000-0000-000000000007', '68', 'padrao', 'Direito Administrativo', '4 Poderes administrativos. 4.1 Hierarquico, disciplinar, regulamentar e de policia. 4.2 Uso e abuso do poder.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 6),
('11000000-0000-0000-0000-000000000007', '69', 'padrao', 'Legislacao de Transito', 'Crimes de Transito + Res. 432 (CONSUMO DE ALCOOL OU DE OUTRA SUBSTANCIA PSICOATIVA)', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 291 ao 312-B do CTB.', NULL, NULL, 7),
('11000000-0000-0000-0000-000000000007', '70', 'padrao', 'Portugues', '5.6 Regencia verbal e nominal. Emprego do sinal indicativo de crase', 'Estudar a teoria pontual e resolver a lista de questoes.', 'Revisao: Parte 2 - Direito Constitucional (4 missoes)', NULL, 8),
('11000000-0000-0000-0000-000000000007', '71', 'padrao', 'Legislacao de Transito', 'Anexo I do CTB', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 9),
('11000000-0000-0000-0000-000000000007', '72', 'padrao', 'Legislacao de Transito', 'Lei no 5.970/1973', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 10),
('11000000-0000-0000-0000-000000000007', '73', 'padrao', 'Legislacao de Transito', 'Revisao: Anexo I do CTB e Lei no 5.970/1973', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, 11),
('11000000-0000-0000-0000-000000000007', '74', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR + APLICAR AS TECNICAS OUSE PASSAR / SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO', 12);

-- ======================================
-- RODADA 8
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000008', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 8, '8a RODADA (Missoes 75 a 86)', 8);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, extra, ordem) VALUES
('11000000-0000-0000-0000-000000000008', '75', 'padrao', 'Raciocinio Logico', 'Nocao de funcao. Analise grafica. Funcao afim, quadratica, exponencial e logaritmica. Aplicacoes', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, NULL, 1),
('11000000-0000-0000-0000-000000000008', '76', 'padrao', 'Legislacao de Transito', '911/2022; 912/2022 36/1998; 970/2022; 938/2022', 'Estudar a teoria pontual e resolver a lista de questoes.', 'Revisao: Transito - CTB - Parte 1 (4 missoes)', NULL, NULL, 2),
('11000000-0000-0000-0000-000000000008', '77', 'padrao', 'Informatica', '5 Computacao na nuvem (cloud computing).', 'Estudar a teoria pontual e resolver a lista de questoes.', 'Revisao: Parte 1 - Direito Constitucional (5 missoes)', NULL, NULL, 3),
('11000000-0000-0000-0000-000000000008', '78', 'padrao', 'Direito Administrativo', '5 Licitacao. 5.1 Principios. 5.2 Contratacao direta: dispensa e inexigibilidade. 5.3 Modalidades. 5.4 Tipos. 5.5 Procedimento.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 2 (5 missoes)'], 4),
('11000000-0000-0000-0000-000000000008', '79', 'padrao', 'Raciocinio Logico', 'Descricao e analise de dados. Leitura e interpretacao de tabelas e graficos apresentados em diferentes linguagens e representacoes. Calculo de medias e analise de desvios de conjuntos de dados', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, NULL, 5),
('11000000-0000-0000-0000-000000000008', '80', 'padrao', 'Direito Administrativo', '6 Controle da Administracao Publica. 6.1 Controle exercido pela Administracao Publica. 6.2 Controle judicial. 6.3 Controle legislativo.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 3 (4 missoes)'], 6),
('11000000-0000-0000-0000-000000000008', '81', 'padrao', 'Portugues', '5.8 Colocacao dos pronomes atonos.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Parte 2 - Direito Constitucional (4 missoes)'], 7),
('11000000-0000-0000-0000-000000000008', '82', 'padrao', 'Legislacao de Transito', 'Resolucoes do Contran: 968/2022; 110/2000; 969/2022', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 4 (4 missoes)'], 8),
('11000000-0000-0000-0000-000000000008', '83', 'padrao', 'Legislacao de Transito', 'Resolucao 882/21 (revoga a 210, 211, 290, 520 e 803);', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, NULL, 9),
('11000000-0000-0000-0000-000000000008', '84', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR + APLICAR TECNICAS', NULL, 10),
('11000000-0000-0000-0000-000000000008', '85', 'acao', NULL, NULL, NULL, NULL, 'PRODUZIR UMA DISCURSIVA', NULL, 11),
('11000000-0000-0000-0000-000000000008', '86', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO + CORRECAO', NULL, 12);

-- ======================================
-- RODADA 9
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000009', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 9, '9a RODADA (Missoes 87 a 97)', 9);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, extra, ordem) VALUES
('11000000-0000-0000-0000-000000000009', '87', 'padrao', 'Raciocinio Logico', 'Metrica. Areas e volumes. Estimativa. Aplicacoes. Analise e interpretacao de diferentes representacoes de figuras planas, como desenhos, mapas e plantas. Utilizacao de escalas. Visualizacao de figuras espaciais em diferentes posicoes. Representacoes bidimensionais de projecoes, planificacao e cortes.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, NULL, 1),
('11000000-0000-0000-0000-000000000009', '88', 'padrao', 'Legislacao de Transito', 'Resolucoes do Contran: 960 (REVOGOU A 216/2006; 253/2007; 254/2007) e 955/2022', 'Estudar a teoria pontual e resolver a lista de questoes.', 'Revisao: Informatica - Parte 1 (4 missoes)', NULL, NULL, 2),
('11000000-0000-0000-0000-000000000009', '89', 'padrao', 'Portugues', '6 Reescrita de frases e paragrafos do texto. 6.1 Significacao das palavras. 6.2 Substituicao de palavras ou de trechos de texto. 6.3 Reorganizacao da estrutura de oracoes e de periodos do texto. 6.4 Reescrita de textos de diferentes generos e niveis de formalidade.', 'Estudar a teoria pontual e resolver a lista de questoes.', 'Revisao: Parte 1 - Direito Constitucional (5 missoes)', NULL, NULL, 3),
('11000000-0000-0000-0000-000000000009', '90', 'padrao', 'Direito Administrativo', '7 Responsabilidade civil do Estado. 7.1 Responsabilidade civil do Estado no direito brasileiro. 7.1.1 Responsabilidade por ato comissivo do Estado. 7.1.2 Responsabilidade por omissao do Estado. 7.2 Requisitos para a demonstracao da responsabilidade do Estado. 7.3 Causas excludentes e atenuantes da responsabilidade do Estado.', 'Estudar a teoria pontual e resolver a lista de questoes.', 'Revisao: Informatica - Parte 2 (4 missoes)', NULL, ARRAY['Revisao: Transito - CTB - Parte 1 (4 missoes)'], 4),
('11000000-0000-0000-0000-000000000009', '91', 'padrao', 'Legislacao de Transito', 'Resolucoes do Contran: 946/2022; 508/2014; 945/2022, exceto os anexos; 735/2018, exceto os anexos;', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 2 (5 missoes)'], 5),
('11000000-0000-0000-0000-000000000009', '92', 'padrao', 'Direito Administrativo', '8 Regime juridico-administrativo. 8.1 Conceito. 8.2 Principios expressos e implicitos da Administracao Publica.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Parte 2 - Direito Constitucional (4 missoes)'], 6),
('11000000-0000-0000-0000-000000000009', '93', 'padrao', 'Portugues', '7 Correspondencia oficial (conforme Manual de Redacao da Presidencia da Republica). 7.1 Aspectos gerais da redacao oficial. 7.2 Finalidade dos expedientes oficiais. 7.3 Adequacao da linguagem ao tipo de documento. 7.4 Adequacao do formato do texto ao genero.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 3 (4 missoes)'], 7),
('11000000-0000-0000-0000-000000000009', '94', 'padrao', 'Legislacao de Transito', 'Resolucoes do Contran: 925/2022; 909/20252 e 561/2015, exceto as fichas;', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 4 (4 missoes)'], 8),
('11000000-0000-0000-0000-000000000009', '95', 'padrao', 'Legislacao de Transito', 'Resolucoes do Contran: 870/21 (740/2018 FOI REVOGADA); 871/21 (REVOGA A 806/2020);', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, NULL, 9),
('11000000-0000-0000-0000-000000000009', '96', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR + TECNICAS', NULL, 10),
('11000000-0000-0000-0000-000000000009', '97', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO (Iniciante e Avancado) + CORRECAO', NULL, 11);

-- ======================================
-- RODADA 10
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000010', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 10, '10a RODADA (Missoes 98 a 109)', 10);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, extra, ordem) VALUES
('11000000-0000-0000-0000-000000000010', '98', 'padrao', 'Legislacao de Transito', 'Resolucao do Contran: 798/2020;', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Fazer uma prova de portugues', 'Revisao: Transito - CTB - Parte 1 (4 missoes)'], 1),
('11000000-0000-0000-0000-000000000010', '99', 'padrao', 'Direito Penal', '1 Principios basicos.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Raciocinio Logico - Parte 1 (5 missoes)', 'Revisao: Informatica - Parte 1 (4 missoes)'], 2),
('11000000-0000-0000-0000-000000000010', '100', 'padrao', 'Legislacao de Transito', 'Resolucoes do Contran: 809/2020; 810/2020.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Direito Administrativo - Parte 1 (4 missoes)', 'Revisao: Transito - CTB - Parte 2 (5 missoes)'], 3),
('11000000-0000-0000-0000-000000000010', '101', 'padrao', 'Direito Penal', '2 Aplicacao da lei penal. 2.1 Lei penal no tempo. 2.1.1 Tempo do crime. 2.1.2 Conflito de leis penais no tempo. 2.2 Lei penal no espaco. 2.2.1 Lugar do crime. 2.2.2 Territorialidade. 2.2.3 Extraterritorialidade.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura dos arts 1 ao 12 do Codigo Penal.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 3 (4 missoes)'], 4),
('11000000-0000-0000-0000-000000000010', '102', 'padrao', 'Legislacao Especial', '1 Lei no 5.553/1968 e Lei no 12.037/2009.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Parte 1 - Direito Constitucional (5 missoes)'], 5),
('11000000-0000-0000-0000-000000000010', '103', 'padrao', 'Direito Penal', '3 Tipicidade. 3.1 Crime doloso e crime culposo. 3.2 Erro de tipo. 3.3 Crime consumado e tentado. 3.4 Crime impossivel. 3.5 Punibilidade e causas de extincao. 4 Ilicitude. 4.1 Causas de exclusao da ilicitude. 4.2 Excesso punivel. e 5.3 Erro de proibicao.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do art, 13 ao 25 do Codigo Penal.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 4 (4 missoes)'], 6),
('11000000-0000-0000-0000-000000000010', '104', 'padrao', 'Legislacao Especial', '2 Lei no 8.069/1990 e suas alteracoes.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Informatica - Parte 2 (4 missoes)', 'Revisao: Raciocinio Logico - Parte 2 (5 missoes)'], 7),
('11000000-0000-0000-0000-000000000010', '105', 'padrao', 'Fisica', '1 Cinematica escalar, cinematica vetorial.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Parte 2 - Direito Constitucional (4 missoes)', 'Revisao: Direito Administrativo - Parte 2 (5 missoes)'], 8),
('11000000-0000-0000-0000-000000000010', '106', 'padrao', 'Legislacao Especial', '3 Lei no 8.072/1990 e suas alteracoes.', 'Estudar a teoria pontual e resolver 20 questoes', NULL, NULL, NULL, 9),
('11000000-0000-0000-0000-000000000010', '107', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR', NULL, 10),
('11000000-0000-0000-0000-000000000010', '108', 'acao', NULL, NULL, NULL, NULL, 'PRODUZIR UMA DISCURSIVA', NULL, 11),
('11000000-0000-0000-0000-000000000010', '109', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO + CORRECAO', NULL, 12);

-- ======================================
-- RODADA 11
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000011', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 11, '11a RODADA (Missoes 110 a 119)', 11);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, extra, ordem) VALUES
('11000000-0000-0000-0000-000000000011', '110', 'padrao', 'Direito Penal', '5 Culpabilidade. 5.1 Causas de exclusao da culpabilidade. 5.2 Imputabilidade.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do art, 26 ao 28 do Codigo Penal.', NULL, NULL, ARRAY['Revisao: Fazer uma prova de portugues', 'Revisao: Informatica - Parte 1 (4 missoes)'], 1),
('11000000-0000-0000-0000-000000000011', '111', 'padrao', 'Legislacao Especial', '4 Decreto no 1.655/1995 e art. 47 do Decreto no 9.662/2019.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Raciocinio Logico - Parte 1 (5 missoes)', 'Revisao: Transito - CTB - Parte 1 (4 missoes)'], 2),
('11000000-0000-0000-0000-000000000011', '112', 'padrao', 'Direito Penal', '6.1 Crimes contra a pessoa.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 121 ao 154-B do Codigo Penal.', NULL, NULL, ARRAY['Revisao: Transito - Resolucoes - Parte 1 (4 missoes)', 'Revisao: Transito - CTB - Parte 2 (5 missoes)'], 3),
('11000000-0000-0000-0000-000000000011', '113', 'padrao', 'Fisica', '2 Movimento circular.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Direito Administrativo - Parte 1 (4 missoes)', 'Revisao: Transito - CTB - Parte 3 (4 missoes)'], 4),
('11000000-0000-0000-0000-000000000011', '114', 'padrao', 'Direito Penal', '6.2 Crimes contra o patrimonio', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura do Art. 155 ao 183 do Codigo Penal.', NULL, NULL, ARRAY['Revisao: Parte 1 - Direito Constitucional (5 missoes)'], 5),
('11000000-0000-0000-0000-000000000011', '115', 'padrao', 'Fisica', '3 Leis de Newton e suas aplicacoes.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 4 (4 missoes)', 'Revisao: Raciocinio Logico - Parte 2 (5 missoes)'], 6),
('11000000-0000-0000-0000-000000000011', '116', 'padrao', 'Direito Penal', '6.3 Crimes contra a dignidade sexual.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura dos arts 213 ao 234-B do Codigo Penal.', NULL, NULL, ARRAY['Revisao: Informatica - Parte 2 (4 missoes)', 'Revisao: Direito Administrativo - Parte 2 (5 missoes)'], 7),
('11000000-0000-0000-0000-000000000011', '117', 'padrao', 'Legislacao Especial', '5 Lei no 9.099/1995 e suas alteracoes.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Parte 2 - Direito Constitucional (4 missoes)', 'Revisao: Transito - Resolucoes - Parte 2 (5 missoes)'], 8),
('11000000-0000-0000-0000-000000000011', '118', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR + TECNICAS', NULL, 9),
('11000000-0000-0000-0000-000000000011', '119', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO COM ASSUNTOS DA RODADA e CORRECAO DO SIMULADO', NULL, 10);

-- ======================================
-- RODADA 12
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000012', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 12, '12a RODADA (Missoes 120 a 130)', 12);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, extra, ordem) VALUES
('11000000-0000-0000-0000-000000000012', '120', 'padrao', 'Direito Penal', '6.4 Crimes contra a incolumidade publica.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura dos arts 250 a 285 do Codigo Penal.', NULL, NULL, ARRAY['Revisao: Fazer uma prova de portugues', 'Revisao: Direito Administrativo - Parte 1 (4 missoes)'], 1),
('11000000-0000-0000-0000-000000000012', '121', 'padrao', 'Fisica', '4 Trabalho. 5 Potencia.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Raciocinio Logico - Parte 1 (5 missoes)', 'Revisao: Transito - CTB - Parte 1 (4 missoes)'], 2),
('11000000-0000-0000-0000-000000000012', '122', 'padrao', 'Direito Penal', '6.5 Crimes contra a fe publica.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Informatica - Parte 1 (4 missoes)', 'Revisao: Transito - CTB - Parte 2 (5 missoes)'], 3),
('11000000-0000-0000-0000-000000000012', '123', 'padrao', 'Legislacao Especial', '6 Lei no 9.455/1997 e suas alteracoes. 7 Lei no 9.605/1998 e suas alteracoes: Capitulos III e V.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - Resolucoes - Parte 1 (4 missoes)', 'Revisao: Transito - CTB - Parte 3 (4 missoes)'], 4),
('11000000-0000-0000-0000-000000000012', '124', 'padrao', 'Direito Penal', '6.6 Crimes contra a Administracao Publica.', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura arts. 312 a 359-H do Codigo Penal', NULL, NULL, ARRAY['Revisao: Direito Administrativo - Parte 2 (5 missoes)', 'Revisao: Informatica - Parte 2 (4 missoes)'], 5),
('11000000-0000-0000-0000-000000000012', '125', 'padrao', 'Fisica', '6 Energia cinetica, energia potencial, atrito. 7 Conservacao de energia e suas transformacoes.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Parte 1 - Direito Constitucional (5 missoes)', 'Revisao: Raciocinio Logico - Parte 2 (5 missoes)'], 6),
('11000000-0000-0000-0000-000000000012', '126', 'padrao', 'Legislacao Especial', '8 Lei no 10.826/2003 e suas alteracoes: Capitulo IV. 9 Lei no 11.343/2006 e suas alteracoes.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 4 (4 missoes)', 'Revisao: Parte 2 - Direito Constitucional (4 missoes)'], 7),
('11000000-0000-0000-0000-000000000012', '127', 'revisao', NULL, NULL, NULL, 'Revisao: Transito - Resolucoes - Parte 2 (5 missoes)', NULL, NULL, 8),
('11000000-0000-0000-0000-000000000012', '128', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR + TECNICAS', NULL, 9),
('11000000-0000-0000-0000-000000000012', '129', 'acao', NULL, NULL, NULL, NULL, 'PRODUZIR UMA DISCURSIVA', NULL, 10),
('11000000-0000-0000-0000-000000000012', '130', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO + CORRECAO', NULL, 11);

-- ======================================
-- RODADA 13
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000013', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 13, '13a RODADA (Missoes 131 a 140)', 13);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, extra, ordem) VALUES
('11000000-0000-0000-0000-000000000013', '131', 'padrao', 'Legislacao Especial', '10 Lei no 12.850/2013 e suas alteracoes.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Fazer uma prova de portugues', 'Revisao: Informatica - Parte 1 (4 missoes)', 'Revisao: Direito Penal - Parte 1 (5 missoes)'], 1),
('11000000-0000-0000-0000-000000000013', '132', 'padrao', 'Fisica', '8 Quantidade de movimento e conservacao da quantidade de movimento, impulso. 9 Colisoes.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Parte 1 - Direito Constitucional (5 missoes)', 'Revisao: Transito - CTB - Parte 1 (4 missoes)'], 2),
('11000000-0000-0000-0000-000000000013', '133', 'padrao', 'Legislacao Especial', '11 Lei no 13.675/2018. 12 Lei no 13.869/2019.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Informatica - Parte 2 (4 missoes)', 'Revisao: Transito - CTB - Parte 2 (5 missoes)', 'Revisao: Direito Administrativo - Parte 1 (4 missoes)'], 3),
('11000000-0000-0000-0000-000000000013', '134', 'padrao', 'Direito Processual Penal', 'Diligencias Investigatorias (art. 6o e 13 do CPP). e 1 Acao penal. 1.1 Conceito. 1.2 Caracteristicas. 1.3 Especies. 1.4 Condicoes. 2 Termo Circunstanciado de Ocorrencia (Lei no 9.099/1995). 2.1 Atos processuais: forma, lugar e tempo.', NULL, NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 3 (4 missoes)'], 4),
('11000000-0000-0000-0000-000000000013', '135', 'padrao', 'Direitos Humanos', '1 Direitos humanos na Constituicao Federal. 1.1 A Constituicao Federal e os tratados internacionais de direitos humanos.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - Resolucoes - Parte 1 (4 missoes)', 'Revisao: Raciocinio Logico - Parte 1 (5 missoes)'], 5),
('11000000-0000-0000-0000-000000000013', '136', 'padrao', 'Direito Processual Penal', '3 Prova. 3.1 Conceito, objeto, classificacao. 3.2 Preservacao de local de crime. 3.3 Requisitos e onus da prova. 3.4 Provas ilicitas. 3.5 Meios de prova: pericial, interrogatorio, confissao, perguntas ao ofendido, testemunhas, reconhecimento de pessoas e coisas, acareacao, documentos, indicios. 3.6 Busca e apreensao: pessoal, domiciliar, requisitos, restricoes, horarios.', NULL, NULL, NULL, ARRAY['Revisao: Direito Penal - Parte 2 (5 missoes)'], 6),
('11000000-0000-0000-0000-000000000013', '137', 'padrao', 'Direitos Humanos', '2 Declaracao Universal dos Direitos Humanos.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Direito Administrativo - Parte 2 (5 missoes)', 'Revisao: Parte 2 - Direito Constitucional (4 missoes)', 'Revisao: Transito - CTB - Parte 4 (4 missoes)'], 7),
('11000000-0000-0000-0000-000000000013', '138', 'padrao', 'Direito Processual Penal', '4 Prisao. 4.1 Conceito, formalidades, especies e mandado de prisao e cumprimento. 4.2 Prisao em flagrante. 5 Identificacao Criminal (art. 5o, LVIII, da Constituicao Federal e art. 3o da Lei no 12.037/2009).', 'Estudar a teoria pontual e resolver a lista de questoes. Leitura dos arts 282 ao 350 do Codigo de Processo Penal.', NULL, NULL, ARRAY['Revisao: Raciocinio Logico - Parte 2 (5 missoes)', 'Revisao: Transito - Resolucoes - Parte 1 (4 missoes)'], 8),
('11000000-0000-0000-0000-000000000013', '139', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR + TECNICAS', NULL, 9),
('11000000-0000-0000-0000-000000000013', '140', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO + CORRECAO', NULL, 10);

-- ======================================
-- RODADA 14
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000014', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 14, '14a RODADA (Missoes 141 a 151)', 14);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, extra, ordem) VALUES
('11000000-0000-0000-0000-000000000014', '141', 'padrao', 'Direitos Humanos', '3 Convencao Americana sobre Direitos Humanos (Decreto no 678/1992).', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Fazer uma prova de portugues', 'Revisao: Informatica - Parte 1 (4 missoes)'], 1),
('11000000-0000-0000-0000-000000000014', '142', 'padrao', 'Etica e cidadania', 'Etica e moral', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Parte 1 - Direito Constitucional (5 missoes)', 'Revisao: Transito - CTB - Parte 1 (4 missoes)'], 2),
('11000000-0000-0000-0000-000000000014', '143', 'padrao', 'Geopolitica', '1 O Brasil politico: nacao e territorio.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Informatica - Parte 2 (4 missoes)', 'Revisao: Transito - CTB - Parte 2 (5 missoes)'], 3),
('11000000-0000-0000-0000-000000000014', '144', 'padrao', 'Etica e cidadania', 'Etica, principios e valores', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Fisica', 'Revisao: Transito - CTB - Parte 3 (4 missoes)', 'Revisao: Legislacao Especial - Parte 1 (4 missoes)'], 4),
('11000000-0000-0000-0000-000000000014', '145', 'padrao', 'Etica e cidadania', 'Etica e funcao publica: integridade Etica no setor publico. 4.1 Principios da Administracao Publica: moralidade (art. 37 da CF). 4.2. Deveres dos servidores publicos: moralidade administrativa (Lei no 8.112/1990, art. 116, IX).', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - Resolucoes - Parte 1 (4 missoes)', 'Revisao: Raciocinio Logico - Parte 1 (5 missoes)', 'Revisao: Direito Penal - Parte 1 (5 missoes)'], 5),
('11000000-0000-0000-0000-000000000014', '146', 'padrao', 'Geopolitica', '2 Organizacao do Estado Brasileiro.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Direito Administrativo - Parte 1 (4 missoes)', 'Revisao: Parte 2 - Direito Constitucional (4 missoes)', 'Revisao: Direito Penal - Parte 2 (5 missoes)'], 6),
('11000000-0000-0000-0000-000000000014', '147', 'revisao', NULL, NULL, NULL, 'Revisao: Direito Penal e Direito Processual Penal', NULL, ARRAY['Revisao: Direito Administrativo - Parte 2 (5 missoes)', 'Revisao: Legislacao Especial - Parte 2 (5 missoes)'], 7),
('11000000-0000-0000-0000-000000000014', '148', 'padrao', 'Geopolitica', '3 A divisao interregional do trabalho e da producao no Brasil.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Raciocinio Logico - Parte 2 (5 missoes)', 'Revisao: Transito - CTB - Parte 4 (4 missoes)', 'Revisao: Transito - Resolucoes - Parte 2 (5 missoes)'], 8),
('11000000-0000-0000-0000-000000000014', '149', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR + TECNICAS', NULL, 9),
('11000000-0000-0000-0000-000000000014', '150', 'acao', NULL, NULL, NULL, NULL, 'PRODUZIR UMA DISCURSIVA', NULL, 10),
('11000000-0000-0000-0000-000000000014', '151', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO + CORRECAO', NULL, 11);

-- ======================================
-- RODADA 15
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000015', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 15, '15a RODADA (Missoes 152 a 169)', 15);

INSERT INTO missoes (rodada_id, numero, tipo, materia, assunto, instrucoes, tema, acao, extra, obs, ordem) VALUES
('11000000-0000-0000-0000-000000000015', '152', 'padrao', 'Etica e Cidadania', 'Politica de governanca da administracao publica federal (Decreto no 9.203/2017). 4.4. Promocao da etica e de regras de conduta para servidores. 4.4.1. Codigo de Etica Profissional do Servidor Publico Civil do Poder Executivo Federal (Decreto no 1.171/1994).', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Fazer uma prova de portugues', 'Revisao: Direito Administrativo - Parte 1 (4 missoes)'], NULL, 1),
('11000000-0000-0000-0000-000000000015', '153', 'padrao', 'Geopolitica', '4 A estrutura urbana brasileira e as grandes metropoles.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Raciocinio Logico - Parte 1 (5 missoes)', 'Revisao: Parte 1 - Direito Constitucional (5 missoes)'], NULL, 2),
('11000000-0000-0000-0000-000000000015', '154', 'padrao', 'Etica e cidadania', 'Sistema de Gestao da Etica do Poder Executivo Federal e Comissoes de Etica (Decreto no 6.029/2007). Codigo de Conduta da Alta Administracao Federal (Exposicao de Motivos no 37/2000).', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Informatica - Parte 1 (4 missoes)', 'Revisao: Transito - CTB - Parte 1 (4 missoes)'], NULL, 3),
('11000000-0000-0000-0000-000000000015', '155', 'padrao', 'Geopolitica', '5 Distribuicao espacial da populacao no Brasil e movimentos migratorios internos.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Fisica', 'Revisao: Transito - CTB - Parte 2 (5 missoes)'], NULL, 4),
('11000000-0000-0000-0000-000000000015', '156', 'padrao', 'Ingles OU Espanhol', 'BASES PARA A INTERPRETACAO TEXTUAL', 'Assistir as videoaulas e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Informatica - Parte 2 (4 missoes)'], 'o aluno deve escolher entre Ingles ou Espanhol.', 5),
('11000000-0000-0000-0000-000000000015', '157', 'padrao', 'Geopolitica', '6 Integracao entre industria e estrutura urbana e setor agricola no Brasil.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Direito Administrativo - Parte 2 (5 missoes)', 'Revisao: Legislacao Especial - Parte 1 (4 missoes)'], NULL, 6),
('11000000-0000-0000-0000-000000000015', '158', 'padrao', 'Ingles OU Espanhol', 'VERBOS', 'Assistir as videoaulas e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - CTB - Parte 3 (4 missoes)', 'Revisao: Direitos Humanos'], 'o aluno deve escolher entre Ingles ou Espanhol.', 7),
('11000000-0000-0000-0000-000000000015', '159', 'padrao', 'Etica e cidadania', 'Etica e democracia: exercicio da cidadania. 5.1 Promocao da transparencia ativa e do acesso a informacao (Lei no 12.527/2011 e Decreto no 7.724/2012). 5.2. Tratamento de conflitos de interesses e nepotismo (Lei no 12.813/2013 e Decreto no 7.203/2010).', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Direito Penal'], NULL, 8),
('11000000-0000-0000-0000-000000000015', '160', 'padrao', 'Geopolitica', '7 Rede de transporte no Brasil: modais e principais infraestruturas', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Transito - Resolucoes - Parte 1 (4 missoes)'], NULL, 9),
('11000000-0000-0000-0000-000000000015', '161', 'padrao', 'Ingles OU Espanhol', 'VOCABULARIO', 'Assistir as videoaulas e resolver questoes', NULL, NULL, ARRAY['Revisao: Raciocinio Logico - Parte 2 (5 missoes)'], 'o aluno deve escolher entre Ingles ou Espanhol.', 10),
('11000000-0000-0000-0000-000000000015', '162', 'padrao', 'Geopolitica', '8 A integracao do Brasil ao processo de internacionalizacao da economia.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Parte 2 - Direito Constitucional (4 missoes)'], NULL, 11),
('11000000-0000-0000-0000-000000000015', '163', 'padrao', 'Ingles OU Espanhol', 'REVISAO FINAL', 'Assistir as videoaulas e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Direito Penal - Parte 1 (5 missoes)'], 'o aluno deve escolher entre Ingles ou Espanhol.', 12),
('11000000-0000-0000-0000-000000000015', '164', 'padrao', 'Geopolitica', '10 Macrodivisao natural do espaco brasileiro: biomas, dominios e ecossistemas.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Legislacao Especial'], NULL, 13),
('11000000-0000-0000-0000-000000000015', '165', 'revisao', NULL, NULL, NULL, 'Revisao: Transito - Resolucoes - Parte 2 (5 missoes)', NULL, NULL, NULL, 14),
('11000000-0000-0000-0000-000000000015', '166', 'revisao', NULL, NULL, NULL, 'Revisao: Direito Penal - Parte 2 (5 missoes)', NULL, NULL, NULL, 15),
('11000000-0000-0000-0000-000000000015', '167', 'padrao', 'Geopolitica', '9 Geografia e gestao ambiental.', 'Estudar a teoria pontual e resolver a lista de questoes.', NULL, NULL, ARRAY['Revisao: Direito Processual Penal', 'Revisao: Transito - CTB - Parte 4 (4 missoes)', 'Revisao: Legislacao Especial - Parte 2 (5 missoes)'], NULL, 16),
('11000000-0000-0000-0000-000000000015', '168', 'acao', NULL, NULL, NULL, NULL, 'REVISAO OUSE PASSAR + TECNICAS', NULL, NULL, 17),
('11000000-0000-0000-0000-000000000015', '169', 'acao', NULL, NULL, NULL, NULL, 'SIMULADO + CORRECAO', NULL, NULL, 18);

-- ======================================
-- RODADA 16
-- ======================================
INSERT INTO rodadas (id, preparatorio_id, numero, titulo, ordem)
VALUES ('11000000-0000-0000-0000-000000000016', 'a1b2c3d4-e5f6-7890-abcd-ef1234567890', 16, '16a RODADA - SOMENTE PARA REVISAO (Missoes 170 a 184)', 16);

INSERT INTO missoes (rodada_id, numero, tipo, tema, ordem) VALUES
('11000000-0000-0000-0000-000000000016', '170', 'revisao', 'REVISAO: Materia: Portugues', 1),
('11000000-0000-0000-0000-000000000016', '171', 'revisao', 'REVISAO: Materia: Raciocinio Logico', 2),
('11000000-0000-0000-0000-000000000016', '172', 'revisao', 'REVISAO: Materia: Informatica', 3),
('11000000-0000-0000-0000-000000000016', '173', 'revisao', 'REVISAO: Materia: Transito - CTB', 4),
('11000000-0000-0000-0000-000000000016', '174', 'revisao', 'REVISAO: Materia: Direito Administrativo', 5),
('11000000-0000-0000-0000-000000000016', '175', 'revisao', 'REVISAO: Materia: Direito Constitucional', 6),
('11000000-0000-0000-0000-000000000016', '176', 'revisao', 'REVISAO: Materia: Direito Penal', 7),
('11000000-0000-0000-0000-000000000016', '177', 'revisao', 'REVISAO: Materia: Transito - Resolucoes', 8),
('11000000-0000-0000-0000-000000000016', '178', 'revisao', 'REVISAO: Materia: Fisica', 9),
('11000000-0000-0000-0000-000000000016', '179', 'revisao', 'REVISAO: Materia: Direito Processual Penal', 10),
('11000000-0000-0000-0000-000000000016', '180', 'revisao', 'REVISAO: Materia: Legislacao Especial', 11),
('11000000-0000-0000-0000-000000000016', '181', 'revisao', 'REVISAO: Materia: Direitos Humanos', 12),
('11000000-0000-0000-0000-000000000016', '182', 'revisao', 'REVISAO: Materia: Etica e Cidadania', 13),
('11000000-0000-0000-0000-000000000016', '183', 'revisao', 'REVISAO: Materia: Geopolitica', 14),
('11000000-0000-0000-0000-000000000016', '184', 'revisao', 'REVISAO: Materia: Ingles ou Espanhol', 15);
