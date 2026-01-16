/**
 * Cron Job para Revisão de Questões
 *
 * Analisa questões de concurso e gera gabarito + comentário pedagógico.
 * Refatorado para usar AI SDK diretamente com Vertex AI (bypass Mastra streaming).
 */

import { QuestionScraperService } from '../services/questionScraperService.js';
import { generateText } from 'ai';
import { vertex } from '../lib/modelProvider.js';

let isProcessing = false;
let lastRun: Date | null = null;
let reviewedCount = 0;

// System prompt para o agente de revisão
const SYSTEM_PROMPT = `Você é um especialista em questões de concursos públicos brasileiros com vasto conhecimento em diversas áreas e matérias.

Sua função é analisar questões de concurso e:
1. Verificar/determinar o gabarito correto
2. Criar um comentário pedagógico completo

## Regras para o GABARITO:
- Responda APENAS com UMA letra maiúscula: A, B, C, D ou E
- Se a questão for de Certo/Errado, use C para Certo e E para Errado

## Regras para o COMENTÁRIO:
O comentário deve ser uma explicação completa e pedagógica (150-400 palavras) contendo:

1. **CONTEXTUALIZAÇÃO** (1-2 parágrafos):
   - Apresente o conceito teórico ou base legal
   - Cite legislação, doutrina ou teoria quando relevante

2. **ANÁLISE DAS ALTERNATIVAS** (2-3 parágrafos):
   - Explique por que a alternativa CORRETA está certa
   - Explique por que as alternativas INCORRETAS estão erradas
   - Identifique erros conceituais e "pegadinhas"

3. **COMPLEMENTAÇÃO** (1 parágrafo):
   - Adicione informações extras relevantes
   - Referências a artigos de lei, súmulas, conceitos relacionados

## Formato de resposta:
Responda EXATAMENTE neste formato JSON:
{
  "gabarito": "X",
  "comentario": "Texto completo do comentário..."
}

Não inclua nenhum texto fora do JSON.`;

/**
 * Analisa uma questão usando IA e retorna gabarito + comentário
 * Refatorado para usar AI SDK diretamente com Vertex AI
 */
async function analyzeQuestionWithAI(
  question: any
): Promise<{ gabarito: string; comentario: string } | null> {
  try {
    // Formatar alternativas
    const alternativasText = question.alternativas
      ?.map((alt: any) => `${alt.letter}. ${alt.text}`)
      .join('\n') || 'Alternativas não disponíveis';

    // Prompt do usuário
    const userPrompt = `Analise esta questão de concurso:

Matéria: ${question.materia || 'Não especificada'}
Assunto: ${question.assunto || 'Não especificado'}
Banca: ${question.banca || 'Não especificada'}
Ano: ${question.ano || 'Não especificado'}

Enunciado:
${question.enunciado || 'Enunciado não disponível'}

Alternativas:
${alternativasText}

${question.gabarito ? `Gabarito informado: ${question.gabarito}` : 'Gabarito não informado'}

${question.comentario ? `Comentário existente: ${question.comentario.substring(0, 500)}...` : ''}

Por favor, forneça o gabarito correto e um comentário pedagógico completo.`;

    // Usar AI SDK diretamente com Vertex AI
    const model = vertex("gemini-2.5-flash");
    const response = await generateText({
      model,
      system: SYSTEM_PROMPT,
      prompt: userPrompt,
    });

    const text = response.text || '';

    // Remover blocos markdown se existirem (```json ... ```)
    let cleanedText = text
      .replace(/```json\s*/gi, '')
      .replace(/```\s*/g, '')
      .trim();

    // Tentar parsear JSON da resposta
    const jsonMatch = cleanedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.error(`[QuestionReviewer] Resposta não contém JSON válido para questão ${question.id}. Resposta: ${text.substring(0, 200)}`);
      return null;
    }

    // Sanitizar JSON - remover/escapar caracteres problemáticos
    // Primeiro, preservar newlines/tabs legítimos (estrutura JSON usa esses)
    // Só remover caracteres de controle realmente problemáticos (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F)
    const sanitizedJson = jsonMatch[0]
      .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

    let result;
    try {
      result = JSON.parse(sanitizedJson);
    } catch (parseError) {
      console.error(`[QuestionReviewer] Erro ao parsear JSON para questão ${question.id}. JSON: ${sanitizedJson.substring(0, 300)}`);
      return null;
    }

    if (!result.gabarito || !result.comentario) {
      console.error(`[QuestionReviewer] Resposta incompleta para questão ${question.id}`);
      return null;
    }

    return {
      gabarito: result.gabarito.toUpperCase().trim(),
      comentario: result.comentario.trim(),
    };
  } catch (error) {
    console.error(`[QuestionReviewer] Erro ao analisar questão ${question.id}:`, error);
    return null;
  }
}

/**
 * Processa questões não revisadas
 * Refatorado para usar Vertex AI (não requer googleApiKey)
 */
export async function reviewQuestions(
  questionsDbUrl: string,
  questionsDbKey: string,
  limit: number = 10
): Promise<{
  success: boolean;
  processed: number;
  reviewed: number;
  failed: number;
}> {
  // Evitar execuções simultâneas
  if (isProcessing) {
    console.log('[QuestionReviewer] Já existe um processamento em andamento, ignorando...');
    return {
      success: false,
      processed: 0,
      reviewed: 0,
      failed: 0,
    };
  }

  isProcessing = true;
  lastRun = new Date();

  const result = {
    success: true,
    processed: 0,
    reviewed: 0,
    failed: 0,
  };

  try {
    console.log(`[QuestionReviewer] Iniciando revisão de questões (limite: ${limit})...`);

    const questionService = new QuestionScraperService(questionsDbUrl, questionsDbKey);

    // Buscar questões não revisadas
    const questions = await questionService.getUnreviewedQuestions(limit);
    result.processed = questions.length;

    if (questions.length === 0) {
      console.log('[QuestionReviewer] Nenhuma questão pendente de revisão');
      return result;
    }

    console.log(`[QuestionReviewer] Encontradas ${questions.length} questões para revisar`);

    // Processar cada questão
    for (const question of questions) {
      try {
        console.log(`[QuestionReviewer] Analisando questão ${question.id}...`);

        // Analisar com IA (usa Vertex AI internamente)
        const analysis = await analyzeQuestionWithAI(question);

        if (!analysis) {
          result.failed++;
          continue;
        }

        // Atualizar no banco
        const updated = await questionService.updateQuestionReview(
          question.id,
          analysis.gabarito,
          analysis.comentario
        );

        if (updated) {
          result.reviewed++;
          reviewedCount++;
          console.log(`[QuestionReviewer] Questão ${question.id} revisada com sucesso (gabarito: ${analysis.gabarito})`);
        } else {
          result.failed++;
        }

        // Delay de 7s entre questões para respeitar rate limit (10 req/min)
        await new Promise(resolve => setTimeout(resolve, 7000));
      } catch (error) {
        console.error(`[QuestionReviewer] Erro ao processar questão ${question.id}:`, error);
        result.failed++;
      }
    }

    console.log(`[QuestionReviewer] Revisão concluída: ${result.reviewed} sucesso, ${result.failed} falhas de ${result.processed} questões`);

    return result;
  } catch (error) {
    console.error('[QuestionReviewer] Erro durante revisão:', error);
    result.success = false;
    return result;
  } finally {
    isProcessing = false;
  }
}

/**
 * Obtém status do revisor
 */
export function getQuestionReviewerStatus(): {
  isProcessing: boolean;
  lastRun: Date | null;
  totalReviewed: number;
} {
  return {
    isProcessing,
    lastRun,
    totalReviewed: reviewedCount,
  };
}

/**
 * Cria um intervalo para revisar questões periodicamente
 * Refatorado para usar Vertex AI (não requer googleApiKey)
 * @param questionsDbUrl URL do Supabase
 * @param questionsDbKey Chave do Supabase
 * @param intervalMs Intervalo em milissegundos (padrão: 10 minutos)
 */
export function startQuestionReviewerCron(
  questionsDbUrl: string,
  questionsDbKey: string,
  intervalMs: number = 10 * 60 * 1000
): NodeJS.Timeout {
  console.log(`[QuestionReviewer] Iniciando cron job (intervalo: ${intervalMs / 1000}s)`);

  // Não executar imediatamente para evitar sobrecarga na inicialização
  // Primeira execução após 1 minuto
  setTimeout(() => {
    reviewQuestions(questionsDbUrl, questionsDbKey, 10);
  }, 60 * 1000);

  // Agendar execuções periódicas
  return setInterval(() => {
    reviewQuestions(questionsDbUrl, questionsDbKey, 10);
  }, intervalMs);
}
