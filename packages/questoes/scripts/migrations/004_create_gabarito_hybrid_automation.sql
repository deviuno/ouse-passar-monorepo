-- Migration: Automação Híbrida de Extração de Gabarito
-- Banco: Questões (swzosaapqtyhmwdiwdje)
--
-- Esta migration cria:
-- 1. Tabela de fila para processamento por IA
-- 2. Colunas de auditoria na tabela de questões
-- 3. Função e trigger para processar gabaritos automaticamente
--
-- Execute no Supabase Dashboard > SQL Editor

-- ============================================================================
-- 1. TABELA DE FILA PARA PROCESSAMENTO POR IA
-- ============================================================================

CREATE TABLE IF NOT EXISTS questoes_pendentes_ia (
    id SERIAL PRIMARY KEY,
    questao_id INTEGER NOT NULL UNIQUE,
    tentativas INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pendente', -- pendente, processando, concluido, falha
    erro TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    processed_at TIMESTAMPTZ
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_pendentes_status ON questoes_pendentes_ia(status);
CREATE INDEX IF NOT EXISTS idx_pendentes_created ON questoes_pendentes_ia(created_at);

-- Comentário
COMMENT ON TABLE questoes_pendentes_ia IS 'Fila de questões aguardando processamento por IA para extração de gabarito';

-- ============================================================================
-- 2. COLUNAS DE AUDITORIA
-- ============================================================================

ALTER TABLE questoes_concurso
ADD COLUMN IF NOT EXISTS gabarito_auto_extraido BOOLEAN DEFAULT false;

ALTER TABLE questoes_concurso
ADD COLUMN IF NOT EXISTS gabarito_metodo TEXT; -- 'regex', 'ia', ou NULL (manual)

-- Comentários
COMMENT ON COLUMN questoes_concurso.gabarito_auto_extraido IS 'Indica se o gabarito foi extraído automaticamente';
COMMENT ON COLUMN questoes_concurso.gabarito_metodo IS 'Método usado para extrair: regex, ia, ou NULL (manual)';

-- ============================================================================
-- 3. FUNÇÃO DE PROCESSAMENTO DE GABARITO
-- ============================================================================

CREATE OR REPLACE FUNCTION processar_gabarito_questao()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    gabarito_extraido TEXT := NULL;
BEGIN
    -- Se já tem gabarito válido, mantém ativo e não processa
    IF NEW.gabarito IS NOT NULL AND NEW.gabarito != '' THEN
        NEW.ativo := true;
        RETURN NEW;
    END IF;

    -- Se enunciado inválido, inativa imediatamente
    IF NEW.enunciado IS NULL OR NEW.enunciado = '' OR NEW.enunciado = 'deleted' THEN
        NEW.ativo := false;
        RETURN NEW;
    END IF;

    -- Tenta extrair via regex do comentário
    IF NEW.comentario IS NOT NULL AND NEW.comentario != '' THEN

        -- Padrão 1: "Gabarito: Letra B" ou "Gabarito: B" ou "Gabarito B"
        gabarito_extraido := UPPER(substring(NEW.comentario FROM
            '(?i)gabarito\s*[;:]?\s*(?:letra\s*)?["\x27]?([A-Ea-e])["\x27]?'));

        -- Padrão 2: "Resposta: A" ou "Resposta correta: B" ou "Resposta Letra C"
        IF gabarito_extraido IS NULL THEN
            gabarito_extraido := UPPER(substring(NEW.comentario FROM
                '(?i)resposta\s*(?:correta)?\s*[:\-]?\s*(?:letra\s*)?["\x27]?([A-Ea-e])["\x27]?'));
        END IF;

        -- Padrão 3: "alternativa correta é a letra A" ou "alternativa correta: B"
        IF gabarito_extraido IS NULL THEN
            gabarito_extraido := UPPER(substring(NEW.comentario FROM
                '(?i)alternativa\s*correta\s*(?:é\s*)?(?:a\s*)?(?:letra\s*)?[:\-]?\s*["\x27]?([A-Ea-e])["\x27]?'));
        END IF;

        -- Padrão 4: "Letra A está correta" ou "A letra B está correta"
        IF gabarito_extraido IS NULL THEN
            gabarito_extraido := UPPER(substring(NEW.comentario FROM
                '(?i)(?:a\s+)?letra\s+([A-Ea-e])\s+(?:está\s+)?correta'));
        END IF;

        -- Padrão 5: CESPE - "ITEM CERTO" / "ITEM ERRADO"
        IF gabarito_extraido IS NULL THEN
            IF NEW.comentario ~* 'ITEM\s+CERTO' THEN
                gabarito_extraido := 'C';
            ELSIF NEW.comentario ~* 'ITEM\s+ERRADO' THEN
                gabarito_extraido := 'E';
            END IF;
        END IF;

        -- Padrão 6: "Certo:" ou "Errado:" no início do comentário
        IF gabarito_extraido IS NULL THEN
            IF NEW.comentario ~* '^\s*certo\s*[:\.\-]' THEN
                gabarito_extraido := 'C';
            ELSIF NEW.comentario ~* '^\s*errado\s*[:\.\-]' THEN
                gabarito_extraido := 'E';
            END IF;
        END IF;

        -- Padrão 7: "assertiva está correta" / "assertiva incorreta"
        IF gabarito_extraido IS NULL THEN
            IF NEW.comentario ~* 'assertiva\s+(?:está\s+)?correta' THEN
                gabarito_extraido := 'C';
            ELSIF NEW.comentario ~* 'assertiva\s+(?:está\s+)?(?:incorreta|errada)' THEN
                gabarito_extraido := 'E';
            END IF;
        END IF;

        -- Padrão 8: "afirmativa está correta" / "afirmativa incorreta"
        IF gabarito_extraido IS NULL THEN
            IF NEW.comentario ~* 'afirmativa\s+(?:está\s+)?correta' THEN
                gabarito_extraido := 'C';
            ELSIF NEW.comentario ~* 'afirmativa\s+(?:está\s+)?(?:incorreta|errada)' THEN
                gabarito_extraido := 'E';
            END IF;
        END IF;

        -- Padrão 9: "Portanto, gabarito letra A" ou "Portanto, a resposta é B"
        IF gabarito_extraido IS NULL THEN
            gabarito_extraido := UPPER(substring(NEW.comentario FROM
                '(?i)portanto,?\s*(?:o\s+)?(?:gabarito|resposta)\s*(?:é\s*)?(?:a?\s*)?(?:letra\s*)?["\x27]?([A-Ea-e])["\x27]?'));
        END IF;

    END IF;

    -- Se encontrou via regex, preenche e ativa
    IF gabarito_extraido IS NOT NULL THEN
        NEW.gabarito := gabarito_extraido;
        NEW.ativo := true;
        NEW.gabarito_auto_extraido := true;
        NEW.gabarito_metodo := 'regex';
        RETURN NEW;
    END IF;

    -- Não encontrou via regex - marca como inativo e enfileira para IA
    NEW.ativo := false;

    -- Insere na fila de processamento por IA (ignora se já existe)
    -- Nota: Isso só funciona em INSERT, não em UPDATE (NEW.id pode não existir ainda em INSERT)
    -- Para INSERT, o id será gerado após o trigger, então usamos AFTER trigger separado

    RETURN NEW;
END;
$$;

-- Comentário
COMMENT ON FUNCTION processar_gabarito_questao() IS
'Extrai gabarito do comentário via regex. Se não encontrar, marca ativo=false para processamento posterior por IA.';

-- ============================================================================
-- 4. FUNÇÃO PARA ENFILEIRAR QUESTÕES PENDENTES (AFTER TRIGGER)
-- ============================================================================

CREATE OR REPLACE FUNCTION enfileirar_questao_pendente()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- Só enfileira se não tem gabarito e está inativo
    IF (NEW.gabarito IS NULL OR NEW.gabarito = '') AND NEW.ativo = false THEN
        -- Só enfileira se tem comentário (senão não adianta processar por IA)
        IF NEW.comentario IS NOT NULL AND NEW.comentario != '' THEN
            INSERT INTO questoes_pendentes_ia (questao_id)
            VALUES (NEW.id)
            ON CONFLICT (questao_id) DO NOTHING;
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- Comentário
COMMENT ON FUNCTION enfileirar_questao_pendente() IS
'Enfileira questões sem gabarito para processamento por IA';

-- ============================================================================
-- 5. TRIGGERS
-- ============================================================================

-- Remover triggers antigos se existirem
DROP TRIGGER IF EXISTS trg_processar_gabarito ON questoes_concurso;
DROP TRIGGER IF EXISTS trg_enfileirar_pendente ON questoes_concurso;

-- Trigger BEFORE: processa regex e define ativo
CREATE TRIGGER trg_processar_gabarito
    BEFORE INSERT OR UPDATE ON questoes_concurso
    FOR EACH ROW
    EXECUTE FUNCTION processar_gabarito_questao();

-- Trigger AFTER: enfileira para IA se necessário (precisa do ID gerado)
CREATE TRIGGER trg_enfileirar_pendente
    AFTER INSERT OR UPDATE ON questoes_concurso
    FOR EACH ROW
    EXECUTE FUNCTION enfileirar_questao_pendente();

-- ============================================================================
-- 6. POLÍTICAS RLS PARA TABELA DE FILA
-- ============================================================================

-- Habilitar RLS
ALTER TABLE questoes_pendentes_ia ENABLE ROW LEVEL SECURITY;

-- Política para leitura e escrita (permite acesso do service role)
CREATE POLICY "Allow all for service role" ON questoes_pendentes_ia
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

SELECT 'Automação híbrida de gabarito criada com sucesso!' as status;
SELECT
    'Tabela questoes_pendentes_ia: ' ||
    CASE WHEN EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'questoes_pendentes_ia')
         THEN 'OK' ELSE 'ERRO' END as verificacao_tabela;
SELECT
    'Função processar_gabarito_questao: ' ||
    CASE WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'processar_gabarito_questao')
         THEN 'OK' ELSE 'ERRO' END as verificacao_funcao;
SELECT
    'Trigger trg_processar_gabarito: ' ||
    CASE WHEN EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'trg_processar_gabarito')
         THEN 'OK' ELSE 'ERRO' END as verificacao_trigger;
