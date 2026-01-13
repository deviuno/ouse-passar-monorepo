/**
 * Cron Job para Processamento Automático de Formatação
 *
 * Processa automaticamente as filas de formatação de comentários e enunciados
 * usando os agentes de IA (gemini-3-flash-preview).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Estado do processador
let isProcessingComentarios = false;
let isProcessingEnunciados = false;
let lastRunComentarios: Date | null = null;
let lastRunEnunciados: Date | null = null;
let comentariosProcessados = 0;
let enunciadosProcessados = 0;
let comentariosFalhas = 0;
let enunciadosFalhas = 0;

// Intervalo entre questões (mínimo para evitar sobrecarga)
const DELAY_BETWEEN_QUESTIONS = 1000; // 1 segundo (~60 req/min por agente)

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Processa a fila de formatação de comentários
 */
export async function processComentariosQueue(
  questionsDbUrl: string,
  questionsDbKey: string,
  mastra: any,
  limit: number = 10
): Promise<{ success: number; failed: number }> {
  if (isProcessingComentarios) {
    console.log('[FormatterProcessor] Comentários já estão sendo processados, pulando...');
    return { success: 0, failed: 0 };
  }

  isProcessingComentarios = true;
  lastRunComentarios = new Date();
  let success = 0;
  let failed = 0;

  try {
    const questionsDb = createClient(questionsDbUrl, questionsDbKey);

    // Buscar questões pendentes
    const { data: pendentes, error: fetchError } = await questionsDb
      .from('comentarios_pendentes_formatacao')
      .select('questao_id')
      .eq('status', 'pendente')
      .lt('tentativas', 3)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error('[FormatterProcessor] Erro ao buscar fila de comentários:', fetchError);
      return { success: 0, failed: 0 };
    }

    if (!pendentes || pendentes.length === 0) {
      console.log('[FormatterProcessor] Nenhum comentário pendente na fila');
      return { success: 0, failed: 0 };
    }

    console.log(`[FormatterProcessor] Processando ${pendentes.length} comentários...`);

    for (const item of pendentes) {
      try {
        // Marcar como processando
        await questionsDb
          .from('comentarios_pendentes_formatacao')
          .update({
            status: 'processando',
            tentativas: (await questionsDb
              .from('comentarios_pendentes_formatacao')
              .select('tentativas')
              .eq('questao_id', item.questao_id)
              .single()).data?.tentativas + 1 || 1
          })
          .eq('questao_id', item.questao_id);

        // Buscar questão
        const { data: questao } = await questionsDb
          .from('questoes_concurso')
          .select('id, enunciado, comentario, comentario_formatado, materia, gabarito')
          .eq('id', item.questao_id)
          .single();

        if (!questao || !questao.comentario || questao.comentario.trim() === '') {
          await questionsDb
            .from('comentarios_pendentes_formatacao')
            .update({
              status: 'ignorado',
              erro: 'Sem comentário',
              processed_at: new Date().toISOString()
            })
            .eq('questao_id', item.questao_id);
          failed++;
          continue;
        }

        if (questao.comentario_formatado) {
          await questionsDb
            .from('comentarios_pendentes_formatacao')
            .update({
              status: 'ignorado',
              erro: 'Já formatado',
              processed_at: new Date().toISOString()
            })
            .eq('questao_id', item.questao_id);
          continue;
        }

        // Chamar agente de IA
        const agent = mastra.getAgent("comentarioFormatterAgent");
        if (!agent) {
          console.error('[FormatterProcessor] Agente comentarioFormatterAgent não encontrado');
          failed++;
          continue;
        }

        const prompt = `Formate o seguinte comentário de questão de concurso.

## CONTEXTO DA QUESTÃO
**Matéria:** ${questao.materia || 'Não informada'}
**Gabarito:** ${questao.gabarito || 'Não informado'}

**Enunciado:**
${questao.enunciado || 'Não disponível'}

## COMENTÁRIO PARA FORMATAR
${questao.comentario}`;

        const response = await agent.generate(prompt);
        const responseText = typeof response.text === 'string' ? response.text : String(response.text);

        let cleanedResponse = responseText
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();

        let result;
        try {
          result = JSON.parse(cleanedResponse);
        } catch {
          // Tentar extrair JSON do texto
          const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Resposta não é JSON válido');
          }
        }

        if (result.comentarioFormatado) {
          // Atualizar questão com comentário formatado
          await questionsDb
            .from('questoes_concurso')
            .update({ comentario_formatado: result.comentarioFormatado })
            .eq('id', item.questao_id);

          // Marcar como concluído
          await questionsDb
            .from('comentarios_pendentes_formatacao')
            .update({
              status: 'concluido',
              processed_at: new Date().toISOString()
            })
            .eq('questao_id', item.questao_id);

          success++;
          comentariosProcessados++;
          console.log(`[FormatterProcessor] Comentário ${item.questao_id} formatado com sucesso`);
        } else {
          throw new Error('Resposta não contém comentarioFormatado');
        }

        // Delay para rate limit
        await delay(DELAY_BETWEEN_QUESTIONS);

      } catch (error: any) {
        console.error(`[FormatterProcessor] Erro ao processar comentário ${item.questao_id}:`, error.message);

        await questionsDb
          .from('comentarios_pendentes_formatacao')
          .update({
            status: 'falha',
            erro: error.message?.substring(0, 500) || 'Erro desconhecido',
            processed_at: new Date().toISOString()
          })
          .eq('questao_id', item.questao_id);

        failed++;
        comentariosFalhas++;
      }
    }

    console.log(`[FormatterProcessor] Comentários processados: ${success} sucesso, ${failed} falhas`);
    return { success, failed };

  } finally {
    isProcessingComentarios = false;
  }
}

/**
 * Processa a fila de formatação de enunciados
 */
export async function processEnunciadosQueue(
  questionsDbUrl: string,
  questionsDbKey: string,
  mastra: any,
  limit: number = 10
): Promise<{ success: number; failed: number }> {
  if (isProcessingEnunciados) {
    console.log('[FormatterProcessor] Enunciados já estão sendo processados, pulando...');
    return { success: 0, failed: 0 };
  }

  isProcessingEnunciados = true;
  lastRunEnunciados = new Date();
  let success = 0;
  let failed = 0;

  try {
    const questionsDb = createClient(questionsDbUrl, questionsDbKey);

    // Buscar questões pendentes
    const { data: pendentes, error: fetchError } = await questionsDb
      .from('enunciados_pendentes_formatacao')
      .select('questao_id')
      .eq('status', 'pendente')
      .lt('tentativas', 3)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (fetchError) {
      console.error('[FormatterProcessor] Erro ao buscar fila de enunciados:', fetchError);
      return { success: 0, failed: 0 };
    }

    if (!pendentes || pendentes.length === 0) {
      console.log('[FormatterProcessor] Nenhum enunciado pendente na fila');
      return { success: 0, failed: 0 };
    }

    console.log(`[FormatterProcessor] Processando ${pendentes.length} enunciados...`);

    for (const item of pendentes) {
      try {
        // Marcar como processando
        await questionsDb
          .from('enunciados_pendentes_formatacao')
          .update({
            status: 'processando',
            tentativas: (await questionsDb
              .from('enunciados_pendentes_formatacao')
              .select('tentativas')
              .eq('questao_id', item.questao_id)
              .single()).data?.tentativas + 1 || 1
          })
          .eq('questao_id', item.questao_id);

        // Buscar questão
        const { data: questao } = await questionsDb
          .from('questoes_concurso')
          .select('id, enunciado, enunciado_formatado, imagens_enunciado, materia')
          .eq('id', item.questao_id)
          .single();

        if (!questao || !questao.enunciado || questao.enunciado.trim() === '') {
          await questionsDb
            .from('enunciados_pendentes_formatacao')
            .update({
              status: 'ignorado',
              erro: 'Sem enunciado',
              processed_at: new Date().toISOString()
            })
            .eq('questao_id', item.questao_id);
          failed++;
          continue;
        }

        if (questao.enunciado_formatado) {
          await questionsDb
            .from('enunciados_pendentes_formatacao')
            .update({
              status: 'ignorado',
              erro: 'Já formatado',
              processed_at: new Date().toISOString()
            })
            .eq('questao_id', item.questao_id);
          continue;
        }

        // Chamar agente de IA
        const agent = mastra.getAgent("enunciadoFormatterAgent");
        if (!agent) {
          console.error('[FormatterProcessor] Agente enunciadoFormatterAgent não encontrado');
          failed++;
          continue;
        }

        // Preparar lista de imagens
        let imagensInfo = '';
        if (questao.imagens_enunciado && Array.isArray(questao.imagens_enunciado) && questao.imagens_enunciado.length > 0) {
          imagensInfo = `\n\n## IMAGENS DISPONÍVEIS\n${questao.imagens_enunciado.map((url: string, i: number) => `${i + 1}. ${url}`).join('\n')}`;
        }

        const prompt = `Formate o seguinte enunciado de questão de concurso.

## MATÉRIA
${questao.materia || 'Não informada'}

## ENUNCIADO ORIGINAL
${questao.enunciado}${imagensInfo}`;

        const response = await agent.generate(prompt);
        const responseText = typeof response.text === 'string' ? response.text : String(response.text);

        let cleanedResponse = responseText
          .replace(/```json\s*/g, '')
          .replace(/```\s*/g, '')
          .trim();

        let result;
        try {
          result = JSON.parse(cleanedResponse);
        } catch {
          // Tentar extrair JSON do texto
          const jsonMatch = cleanedResponse.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            result = JSON.parse(jsonMatch[0]);
          } else {
            throw new Error('Resposta não é JSON válido');
          }
        }

        if (result.enunciadoFormatado) {
          // Atualizar questão com enunciado formatado
          await questionsDb
            .from('questoes_concurso')
            .update({ enunciado_formatado: result.enunciadoFormatado })
            .eq('id', item.questao_id);

          // Marcar como concluído
          await questionsDb
            .from('enunciados_pendentes_formatacao')
            .update({
              status: 'concluido',
              processed_at: new Date().toISOString()
            })
            .eq('questao_id', item.questao_id);

          success++;
          enunciadosProcessados++;
          console.log(`[FormatterProcessor] Enunciado ${item.questao_id} formatado com sucesso`);
        } else {
          throw new Error('Resposta não contém enunciadoFormatado');
        }

        // Delay para rate limit
        await delay(DELAY_BETWEEN_QUESTIONS);

      } catch (error: any) {
        console.error(`[FormatterProcessor] Erro ao processar enunciado ${item.questao_id}:`, error.message);

        await questionsDb
          .from('enunciados_pendentes_formatacao')
          .update({
            status: 'falha',
            erro: error.message?.substring(0, 500) || 'Erro desconhecido',
            processed_at: new Date().toISOString()
          })
          .eq('questao_id', item.questao_id);

        failed++;
        enunciadosFalhas++;
      }
    }

    console.log(`[FormatterProcessor] Enunciados processados: ${success} sucesso, ${failed} falhas`);
    return { success, failed };

  } finally {
    isProcessingEnunciados = false;
  }
}

/**
 * Inicia o cron job de formatação de comentários
 */
export function startComentarioFormatterCron(
  questionsDbUrl: string,
  questionsDbKey: string,
  mastra: any,
  intervalMs: number = 5 * 60 * 1000, // 5 minutos
  batchSize: number = 10
) {
  console.log(`[FormatterProcessor] Iniciando cron de comentários (intervalo: ${intervalMs / 1000}s, batch: ${batchSize})`);

  // Primeira execução após 30 segundos
  setTimeout(() => {
    processComentariosQueue(questionsDbUrl, questionsDbKey, mastra, batchSize);
  }, 30 * 1000);

  // Execuções subsequentes
  setInterval(() => {
    processComentariosQueue(questionsDbUrl, questionsDbKey, mastra, batchSize);
  }, intervalMs);
}

/**
 * Inicia o cron job de formatação de enunciados
 */
export function startEnunciadoFormatterCron(
  questionsDbUrl: string,
  questionsDbKey: string,
  mastra: any,
  intervalMs: number = 5 * 60 * 1000, // 5 minutos
  batchSize: number = 10
) {
  console.log(`[FormatterProcessor] Iniciando cron de enunciados (intervalo: ${intervalMs / 1000}s, batch: ${batchSize})`);

  // Primeira execução após 1 minuto (para não conflitar com comentários)
  setTimeout(() => {
    processEnunciadosQueue(questionsDbUrl, questionsDbKey, mastra, batchSize);
  }, 60 * 1000);

  // Execuções subsequentes
  setInterval(() => {
    processEnunciadosQueue(questionsDbUrl, questionsDbKey, mastra, batchSize);
  }, intervalMs);
}

/**
 * Retorna o status do processador de formatação
 */
export function getFormatterProcessorStatus() {
  return {
    comentarios: {
      isProcessing: isProcessingComentarios,
      lastRun: lastRunComentarios?.toISOString() || null,
      totalProcessed: comentariosProcessados,
      totalFailed: comentariosFalhas
    },
    enunciados: {
      isProcessing: isProcessingEnunciados,
      lastRun: lastRunEnunciados?.toISOString() || null,
      totalProcessed: enunciadosProcessados,
      totalFailed: enunciadosFalhas
    }
  };
}
