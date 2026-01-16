/**
 * Cron Job para Processamento Automático de Formatação
 *
 * Processa automaticamente as filas de formatação de comentários e enunciados
 * usando AI SDK diretamente com Vertex AI (gemini-2.5-flash).
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { generateText } from 'ai';
import { vertex } from '../lib/modelProvider.js';

// Estado do processador
let isProcessingComentarios = false;
let isProcessingEnunciados = false;
let lastRunComentarios: Date | null = null;
let lastRunEnunciados: Date | null = null;
let comentariosProcessados = 0;
let enunciadosProcessados = 0;
let comentariosFalhas = 0;
let enunciadosFalhas = 0;

// Intervalo entre questões (500ms para alta velocidade com Vertex AI)
const DELAY_BETWEEN_QUESTIONS = 500;

// System prompt para formatação de comentários
const COMENTARIO_SYSTEM_PROMPT = `Você é um especialista em formatação de textos educacionais para questões de concursos públicos brasileiros.

## 🎯 TAREFA PRINCIPAL
Transformar comentários de questões desorganizados em explicações DIDÁTICAS e VISUALMENTE ATRAENTES, mantendo 100% do conteúdo original.

## ⚠️ REGRAS FUNDAMENTAIS

1. **MANTENHA TODO O CONTEÚDO**: Não remova informações, apenas reorganize
2. **NÃO INVENTE NADA**: Não adicione informações que não estejam no original
3. **TRANSFORME VISUALMENTE**: Seu trabalho é tornar o texto mais fácil de ler e estudar
4. **USE EMOJIS**: Adicione emojis relevantes para seções e títulos
5. **CRIE ESTRUTURA**: Separe em seções lógicas com títulos claros
6. **PRESERVE FÓRMULAS LATEX**: Mantenha fórmulas matemáticas EXATAMENTE como estão

## 🎨 ELEMENTOS DE FORMATAÇÃO

### Emojis para Títulos:
- 📊 Dados / Análise / Estatísticas
- 📋 Informações / Resumo
- ⚙️ Resolução / Cálculo / Método
- ✅ Conclusão / Gabarito / Resposta
- 📜 Legislação / Fundamentação Legal
- 🔍 Análise / Exame
- 💡 Dica / Atenção
- ⚠️ Cuidado / Pegadinha

### Estrutura típica:
1. Contextualização breve em **negrito**
2. Blockquote > para afirmações a julgar
3. Separador ---
4. Seções com emojis (## 📊 Análise)
5. Tabelas para dados comparativos
6. Conclusão com gabarito

## 🔧 FORMATO DE RESPOSTA

Retorne APENAS um JSON válido:

{
    "comentarioFormatado": "O texto formatado aqui com \\n para quebras de linha...",
    "alteracoes": ["Lista de principais alterações feitas"],
    "confianca": 0.95
}

## ⚠️ REGRAS

1. **confianca** entre 0 e 1
2. **SEMPRE adicione emojis** nos títulos de seção
3. **SEMPRE use separadores** (---) entre seções principais
4. **Use tabelas** sempre que houver dados comparativos
5. Para textos muito curtos (< 100 caracteres), mantenha simples
6. **NUNCA invente URLs de imagens**`;

// System prompt para formatação de enunciados
const ENUNCIADO_SYSTEM_PROMPT = `Você é um especialista em formatação de enunciados de questões de concursos públicos brasileiros.

## 🎯 TAREFA PRINCIPAL
Transformar enunciados em TEXTO CORRIDO ou HTML SUJO em textos BEM ESTRUTURADOS e LEGÍVEIS em Markdown, mantendo 100% do conteúdo original.

## ⚠️ REGRAS FUNDAMENTAIS

1. **MANTENHA TODO O CONTEÚDO**: Não remova informações, apenas reorganize
2. **NÃO INVENTE NADA**: Não adicione informações que não estejam no original
3. **MELHORE A LEGIBILIDADE**: Tornar o texto mais fácil de ler
4. **PRESERVE FÓRMULAS**: Mantenha fórmulas matemáticas EXATAMENTE como estão
5. **EMBEDE IMAGENS**: Coloque imagens no local correto do texto usando ![Imagem](URL)

## 🧹 LIMPEZA DE HTML

### REMOVER completamente:
- Comentários HTML: <!-- qualquer coisa -->
- Comentários Angular: <!-- ngIf: ... -->
- Tags vazias: <div></div>, <p></p>
- Atributos de estilo: style="...", class="...", id="..."

### CONVERTER para Markdown:
- <strong> ou <b> → **texto**
- <em> ou <i> → *texto*
- <img src="url"> → ![Imagem](url)
- <br> → quebra de linha
- Listas HTML → listas markdown

## 📐 ESTRUTURA DO ENUNCIADO

1. **Indicação de texto associado** (ex: "Texto associado")
2. **Título do texto** (quando houver) → ## Título
3. **Corpo do texto de apoio** (parágrafos separados)
4. **IMAGENS** → ![Imagem](url) no local apropriado
5. **Fonte/Referência** → *Disponível em: ... (Adaptado)*
6. **Comando da questão** → separado com --- e em **negrito**

## 🔧 FORMATO DE RESPOSTA

Retorne APENAS um JSON válido:

{
    "enunciadoFormatado": "O texto formatado aqui com \\n para quebras de linha...",
    "alteracoes": ["Lista de principais alterações feitas"],
    "confianca": 0.95
}

## ⚠️ REGRAS

1. **confianca** entre 0 e 1
2. **SEMPRE separe o comando da questão** do texto de apoio
3. **Use separador (---)** antes do comando da questão
4. **SEMPRE embede imagens fornecidas** no local apropriado
5. **Fonte/referência** sempre em itálico
6. Ignore ícones de aviso (icone-aviso.png)`;

/**
 * Delay helper
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Processa a fila de formatação de comentários usando AI SDK diretamente
 */
export async function processComentariosQueue(
  questionsDbUrl: string,
  questionsDbKey: string,
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
          .select('id, enunciado, comentario, comentario_original, comentario_formatado, materia, gabarito')
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

        // Chamar IA diretamente usando AI SDK
        const model = vertex("gemini-2.5-flash");
        const prompt = `Formate o seguinte comentário de questão de concurso.

## CONTEXTO DA QUESTÃO
**Matéria:** ${questao.materia || 'Não informada'}
**Gabarito:** ${questao.gabarito || 'Não informado'}

**Enunciado:**
${questao.enunciado || 'Não disponível'}

## COMENTÁRIO PARA FORMATAR
${questao.comentario}`;

        const response = await generateText({
          model,
          system: COMENTARIO_SYSTEM_PROMPT,
          prompt,
        });

        const responseText = response.text || '';

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
          // Preparar update: backup do original + salvar formatado
          const updateData: Record<string, any> = {
            comentario: result.comentarioFormatado,  // Formatado vai pro campo principal
            comentario_formatado: true               // Flag indicando que foi formatado
          };

          // Se ainda não tem backup do original, fazer agora
          if (!questao.comentario_original) {
            updateData.comentario_original = questao.comentario;
          }

          // Atualizar questão
          await questionsDb
            .from('questoes_concurso')
            .update(updateData)
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
 * Processa a fila de formatação de enunciados usando AI SDK diretamente
 */
export async function processEnunciadosQueue(
  questionsDbUrl: string,
  questionsDbKey: string,
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
          .select('id, enunciado, enunciado_original, enunciado_formatado, imagens_enunciado, materia')
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

        // Preparar lista de imagens
        let imagensInfo = '';
        if (questao.imagens_enunciado && Array.isArray(questao.imagens_enunciado) && questao.imagens_enunciado.length > 0) {
          imagensInfo = `\n\n## IMAGENS DISPONÍVEIS\n${questao.imagens_enunciado.map((url: string, i: number) => `${i + 1}. ${url}`).join('\n')}`;
        }

        // Chamar IA diretamente usando AI SDK
        const model = vertex("gemini-2.5-flash");
        const prompt = `Formate o seguinte enunciado de questão de concurso.

## MATÉRIA
${questao.materia || 'Não informada'}

## ENUNCIADO ORIGINAL
${questao.enunciado}${imagensInfo}`;

        const response = await generateText({
          model,
          system: ENUNCIADO_SYSTEM_PROMPT,
          prompt,
        });

        const responseText = response.text || '';

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
          // Preparar update: backup do original + salvar formatado
          const updateData: Record<string, any> = {
            enunciado: result.enunciadoFormatado,  // Formatado vai pro campo principal
            enunciado_formatado: true              // Flag indicando que foi formatado
          };

          // Se ainda não tem backup do original, fazer agora
          if (!questao.enunciado_original) {
            updateData.enunciado_original = questao.enunciado;
          }

          // Atualizar questão
          await questionsDb
            .from('questoes_concurso')
            .update(updateData)
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
  intervalMs: number = 60 * 1000, // 1 minuto
  batchSize: number = 30
) {
  console.log(`[FormatterProcessor] Iniciando cron de comentários (intervalo: ${intervalMs / 1000}s, batch: ${batchSize})`);

  // Primeira execução após 30 segundos
  setTimeout(() => {
    processComentariosQueue(questionsDbUrl, questionsDbKey, batchSize);
  }, 30 * 1000);

  // Execuções subsequentes
  setInterval(() => {
    processComentariosQueue(questionsDbUrl, questionsDbKey, batchSize);
  }, intervalMs);
}

/**
 * Inicia o cron job de formatação de enunciados
 */
export function startEnunciadoFormatterCron(
  questionsDbUrl: string,
  questionsDbKey: string,
  intervalMs: number = 60 * 1000, // 1 minuto
  batchSize: number = 30
) {
  console.log(`[FormatterProcessor] Iniciando cron de enunciados (intervalo: ${intervalMs / 1000}s, batch: ${batchSize})`);

  // Primeira execução após 1 minuto (para não conflitar com comentários)
  setTimeout(() => {
    processEnunciadosQueue(questionsDbUrl, questionsDbKey, batchSize);
  }, 60 * 1000);

  // Execuções subsequentes
  setInterval(() => {
    processEnunciadosQueue(questionsDbUrl, questionsDbKey, batchSize);
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
