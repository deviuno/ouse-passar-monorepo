/**
 * Cron Job para Extração Automática de Gabaritos
 *
 * Processa questões sem gabarito, tentando extrair a resposta correta
 * do comentário usando IA.
 *
 * Fluxo:
 * 1. Busca questões sem gabarito que têm comentário
 * 2. Adiciona à fila questoes_pendentes_ia (se não estiver)
 * 3. Processa a fila usando IA para extrair gabarito
 *
 * Refatorado para usar AI SDK diretamente com Vertex AI (bypass Mastra streaming).
 */

// IMPORTANT: Import instrumentation first to initialize OpenTelemetry
import '../instrumentation.js';

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { vertex } from '../lib/modelProvider.js';

let isProcessing = false;
let lastRun: Date | null = null;
let stats = {
  queued: 0,
  extracted: 0,
  failed: 0,
};

// System prompt para extração de gabarito
const SYSTEM_PROMPT = `Você é um especialista em análise de comentários de questões de concursos públicos brasileiros.

## TAREFA
Analisar o comentário/explicação de uma questão e extrair o gabarito (resposta correta).

## TIPOS DE QUESTÃO

### 1. Múltipla Escolha
- Gabarito é uma letra: A, B, C, D ou E
- Comentário geralmente explica por que uma alternativa está correta
- Exemplos de indicação:
  - "A alternativa correta é a letra B"
  - "Resposta: C"
  - "A opção D está correta porque..."
  - "Gabarito: E"

### 2. Certo/Errado (CESPE/CEBRASPE)
- Gabarito é C (Certo) ou E (Errado)
- Comentário explica se a assertiva/afirmativa está correta ou não
- Exemplos de indicação:
  - "ITEM CERTO"
  - "A assertiva está correta"
  - "Afirmativa ERRADA"
  - "O item está incorreto porque..."

## COMO IDENTIFICAR O GABARITO

1. **Indicações explícitas**: Procure por "Gabarito:", "Resposta:", "Alternativa correta:", etc.

2. **Análise do contexto**: Se o comentário diz "a alternativa A está correta porque..." → gabarito = A

3. **Questões CESPE**:
   - Se explica que a assertiva está correta → C
   - Se explica que a assertiva está errada/incorreta → E

4. **Negações**: Cuidado com frases como "A alternativa A está INCORRETA" - isso NÃO significa que A é o gabarito

5. **Múltiplas menções**: Se várias alternativas são mencionadas, identifique qual é indicada como CORRETA

## FORMATO DE RESPOSTA

Retorne APENAS um JSON válido (sem markdown, sem explicações extras):

{
    "gabarito": "A",
    "confianca": 0.95,
    "motivo": "O comentário indica explicitamente 'Gabarito: Letra A'"
}

## REGRAS IMPORTANTES

1. **confianca** deve ser um número entre 0 e 1:
   - 0.9-1.0: Indicação explícita clara (ex: "Gabarito: A")
   - 0.7-0.9: Forte indicação contextual (ex: "A letra B está correta")
   - 0.5-0.7: Indicação implícita ou ambígua
   - < 0.5: Não conseguiu determinar

2. Se não conseguir determinar o gabarito com confiança >= 0.7, retorne:
   {
       "gabarito": null,
       "confianca": 0.3,
       "motivo": "Não foi possível identificar o gabarito no comentário"
   }

3. **NÃO INVENTE**: Baseie-se APENAS no texto fornecido. Se não há indicação clara, retorne null.

4. **Valide a letra**: Para múltipla escolha, gabarito deve ser A, B, C, D ou E. Para certo/errado, deve ser C ou E.`;

/**
 * Popula a fila com questões sem gabarito
 */
async function populateQueue(db: SupabaseClient, limit: number = 100): Promise<number> {
  try {
    // Buscar questões sem gabarito que têm comentário e não estão na fila
    const { data: questoes, error } = await db
      .from('questoes_concurso')
      .select('id')
      .or('gabarito.is.null,gabarito.eq.')
      .not('comentario', 'is', null)
      .not('comentario', 'eq', '')
      .limit(limit);

    if (error || !questoes || questoes.length === 0) {
      return 0;
    }

    // Verificar quais já estão na fila
    const ids = questoes.map(q => q.id);
    const { data: existentes } = await db
      .from('questoes_pendentes_ia')
      .select('questao_id')
      .in('questao_id', ids);

    const existentesSet = new Set((existentes || []).map(e => e.questao_id));
    const novos = questoes.filter(q => !existentesSet.has(q.id));

    if (novos.length === 0) {
      return 0;
    }

    // Adicionar à fila
    const { error: insertError } = await db
      .from('questoes_pendentes_ia')
      .insert(novos.map(q => ({
        questao_id: q.id,
        status: 'pendente',
        tentativas: 0,
        created_at: new Date().toISOString(),
      })));

    if (insertError) {
      console.error('[GabaritoExtractor] Erro ao adicionar à fila:', insertError);
      return 0;
    }

    console.log(`[GabaritoExtractor] Adicionadas ${novos.length} questões à fila`);
    return novos.length;
  } catch (error) {
    console.error('[GabaritoExtractor] Erro ao popular fila:', error);
    return 0;
  }
}

/**
 * Processa uma questão e extrai o gabarito
 * Refatorado para usar AI SDK diretamente com Vertex AI
 */
async function extractGabarito(
  db: SupabaseClient,
  questaoId: number
): Promise<{ success: boolean; gabarito?: string; error?: string }> {
  try {
    // Buscar questão
    const { data: questao, error: fetchError } = await db
      .from('questoes_concurso')
      .select('*')
      .eq('id', questaoId)
      .single();

    if (fetchError || !questao) {
      return { success: false, error: 'Questão não encontrada' };
    }

    if (!questao.comentario) {
      return { success: false, error: 'Questão sem comentário' };
    }

    // Formatar alternativas
    const alternativasText = questao.alternativas
      ?.map((alt: any) => `${alt.letter}. ${alt.text}`)
      .join('\n') || 'Alternativas não disponíveis';

    // Prompt para extração
    const userPrompt = `Analise esta questão de concurso e extraia o gabarito:

## ENUNCIADO:
${questao.enunciado || 'N/A'}

## ALTERNATIVAS:
${alternativasText}

## COMENTÁRIO/EXPLICAÇÃO:
${questao.comentario}

---
Extraia o gabarito correto baseado no comentário acima.`;

    // Usar AI SDK diretamente com Vertex AI
    const model = vertex("gemini-2.5-flash");
    const response = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
      experimental_telemetry: { isEnabled: true },
    });

    const text = response.text || '';

    // Parse JSON
    const jsonMatch = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return { success: false, error: 'IA não retornou JSON válido' };
    }

    const parsed = JSON.parse(jsonMatch[0]);

    // Verificar confiança
    if (!parsed.gabarito || parsed.confianca < 0.7) {
      return { success: false, error: `Confiança baixa: ${parsed.confianca}` };
    }

    // Validar gabarito
    const gabaritoNorm = parsed.gabarito.toUpperCase().trim();
    if (!/^[A-E]$/.test(gabaritoNorm)) {
      return { success: false, error: `Gabarito inválido: ${parsed.gabarito}` };
    }

    // Atualizar questão
    const { error: updateError } = await db
      .from('questoes_concurso')
      .update({
        gabarito: gabaritoNorm,
        updated_at: new Date().toISOString(),
      })
      .eq('id', questaoId);

    if (updateError) {
      console.error(`[GabaritoExtractor] Erro ao atualizar questão ${questaoId}:`, updateError);
      return { success: false, error: `Erro ao atualizar questão: ${updateError.message}` };
    }

    return { success: true, gabarito: gabaritoNorm };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Processa a fila de questões pendentes
 * Refatorado para usar Vertex AI (não requer genAI)
 */
async function processQueue(
  db: SupabaseClient,
  limit: number = 5
): Promise<{ processed: number; success: number; failed: number }> {
  const result = { processed: 0, success: 0, failed: 0 };

  try {
    // Buscar pendentes
    const { data: pendentes, error } = await db
      .from('questoes_pendentes_ia')
      .select('questao_id, tentativas')
      .eq('status', 'pendente')
      .lt('tentativas', 3)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error || !pendentes || pendentes.length === 0) {
      return result;
    }

    console.log(`[GabaritoExtractor] Processando ${pendentes.length} questões da fila`);

    for (const item of pendentes) {
      result.processed++;

      // Marcar como processando
      await db
        .from('questoes_pendentes_ia')
        .update({
          status: 'processando',
          tentativas: (item.tentativas || 0) + 1,
        })
        .eq('questao_id', item.questao_id);

      // Extrair gabarito (usa Vertex AI internamente)
      const extraction = await extractGabarito(db, item.questao_id);

      if (extraction.success) {
        result.success++;
        stats.extracted++;

        await db
          .from('questoes_pendentes_ia')
          .update({
            status: 'concluido',
            processed_at: new Date().toISOString(),
          })
          .eq('questao_id', item.questao_id);

        console.log(`[GabaritoExtractor] Questão ${item.questao_id}: Gabarito ${extraction.gabarito}`);
      } else {
        result.failed++;
        stats.failed++;

        const newStatus = (item.tentativas || 0) >= 2 ? 'falha' : 'pendente';

        await db
          .from('questoes_pendentes_ia')
          .update({
            status: newStatus,
            erro: extraction.error,
            processed_at: new Date().toISOString(),
          })
          .eq('questao_id', item.questao_id);

        console.log(`[GabaritoExtractor] Questão ${item.questao_id}: Falha - ${extraction.error}`);
      }

      // Rate limit: 7s entre requisições (10 req/min)
      await new Promise(resolve => setTimeout(resolve, 7000));
    }

    return result;
  } catch (error) {
    console.error('[GabaritoExtractor] Erro ao processar fila:', error);
    return result;
  }
}

/**
 * Executa o ciclo completo de extração
 * Refatorado para usar Vertex AI (não requer googleApiKey)
 */
export async function runGabaritoExtraction(
  dbUrl: string,
  dbKey: string,
  options: { queueLimit?: number; processLimit?: number } = {}
): Promise<{
  success: boolean;
  queued: number;
  processed: number;
  extracted: number;
  failed: number;
}> {
  if (isProcessing) {
    console.log('[GabaritoExtractor] Já em execução, ignorando...');
    return { success: false, queued: 0, processed: 0, extracted: 0, failed: 0 };
  }

  isProcessing = true;
  lastRun = new Date();

  const result = {
    success: true,
    queued: 0,
    processed: 0,
    extracted: 0,
    failed: 0,
  };

  try {
    const db = createClient(dbUrl, dbKey);

    // 1. Popular fila com novas questões
    result.queued = await populateQueue(db, options.queueLimit || 50);
    stats.queued += result.queued;

    // 2. Processar fila (usa Vertex AI internamente)
    const processResult = await processQueue(db, options.processLimit || 5);
    result.processed = processResult.processed;
    result.extracted = processResult.success;
    result.failed = processResult.failed;

    console.log(`[GabaritoExtractor] Ciclo completo: ${result.queued} enfileiradas, ${result.extracted} extraídas, ${result.failed} falhas`);

    return result;
  } catch (error) {
    console.error('[GabaritoExtractor] Erro no ciclo:', error);
    result.success = false;
    return result;
  } finally {
    isProcessing = false;
  }
}

/**
 * Obtém status do extrator
 */
export function getGabaritoExtractorStatus(): {
  isProcessing: boolean;
  lastRun: Date | null;
  stats: typeof stats;
} {
  return {
    isProcessing,
    lastRun,
    stats: { ...stats },
  };
}

/**
 * Inicia o cron job de extração de gabaritos
 * Executa a cada 5 minutos (intercalado com o questionReviewer)
 * Refatorado para usar Vertex AI (não requer googleApiKey)
 */
export function startGabaritoExtractorCron(
  dbUrl: string,
  dbKey: string,
  intervalMs: number = 5 * 60 * 1000
): NodeJS.Timeout {
  console.log(`[GabaritoExtractor] Iniciando cron job (intervalo: ${intervalMs / 1000}s)`);

  // Primeira execução após 2 minutos
  setTimeout(() => {
    runGabaritoExtraction(dbUrl, dbKey);
  }, 2 * 60 * 1000);

  // Execuções periódicas
  return setInterval(() => {
    runGabaritoExtraction(dbUrl, dbKey);
  }, intervalMs);
}
