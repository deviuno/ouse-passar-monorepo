-- Script de Correção de Acentuação em Massa
-- Aplica correções visuais em strings sem alterar chaves ou IDs.

BEGIN;

-- 1. Preparatórios
UPDATE preparatorios 
SET nome = REPLACE(nome, 'Policia', 'Polícia'),
    descricao = REPLACE(REPLACE(REPLACE(descricao, 'Policia', 'Polícia'), 'Rodoviaria', 'Rodoviária'), 'missoes', 'missões');

UPDATE preparatorios 
SET nome = REPLACE(nome, 'Rodoviaria', 'Rodoviária')
WHERE nome LIKE '%Rodoviaria%';

-- 2. Rodadas
UPDATE rodadas 
SET titulo = REPLACE(titulo, 'Missoes', 'Missões');

-- 3. Mensagens de Incentivo
UPDATE mensagens_incentivo 
SET mensagem = REPLACE(REPLACE(REPLACE(REPLACE(mensagem, 'dedicacao', 'dedicação'), 'missao', 'missão'), 'concluida', 'concluída'), 'aprovacao', 'aprovação');

UPDATE mensagens_incentivo 
SET mensagem = REPLACE(REPLACE(REPLACE(mensagem, 'esforco', 'esforço'), 'vitoria', 'vitória'), 'amanha', 'amanhã');

UPDATE mensagens_incentivo 
SET mensagem = REPLACE(mensagem, 'Voce', 'Você');

-- 4. Missões
UPDATE missoes 
SET materia = REPLACE(REPLACE(REPLACE(materia, 'Portugues', 'Português'), 'Informatica', 'Informática'), 'Transito', 'Trânsito');

UPDATE missoes 
SET materia = REPLACE(REPLACE(materia, 'Raciocinio', 'Raciocínio'), 'Logico', 'Lógico');

UPDATE missoes 
SET materia = REPLACE(REPLACE(materia, 'Policia', 'Polícia'), 'Legislacao', 'Legislação');

UPDATE missoes 
SET assunto = REPLACE(REPLACE(REPLACE(REPLACE(assunto, 'questoes', 'questões'), 'Constituicao', 'Constituição'), 'oracoes', 'orações'), 'coordenacao', 'coordenação');

UPDATE missoes 
SET assunto = REPLACE(REPLACE(REPLACE(REPLACE(assunto, 'subordinacao', 'subordinação'), 'Cidadao', 'Cidadão'), 'Educacao', 'Educação'), 'Sinalizacao', 'Sinalização');

UPDATE missoes 
SET assunto = REPLACE(REPLACE(REPLACE(REPLACE(assunto, 'Circulacao', 'Circulação'), 'Conducao', 'Condução'), 'veiculos', 'veículos'), 'Disposicoes', 'Disposições');

UPDATE missoes 
SET instrucoes = REPLACE(REPLACE(REPLACE(REPLACE(instrucoes, 'questoes', 'questões'), 'Constituicao', 'Constituição'), 'artigo', 'artigo'), 'missao', 'missão');

UPDATE missoes 
SET tema = REPLACE(tema, 'REVISAO', 'REVISÃO');

UPDATE missoes 
SET acao = REPLACE(REPLACE(REPLACE(acao, 'TECNICAS', 'TÉCNICAS'), 'CORRECAO', 'CORREÇÃO'), 'RODADA', 'RODADA'); -- RODADA não muda

UPDATE missoes 
SET acao = REPLACE(acao, 'PRODUZIR UMA DISCURSIVA', 'PRODUZIR UMA DISCURSIVA'); -- Sem acento mas OK

-- 5. Outras tabelas de conteúdo se existirem
-- (Adicionar conforme necessário)

COMMIT;
