import { ImageScraperService } from '../services/imageScraperService.js';

let isProcessing = false;
let lastRun: Date | null = null;
let processedCount = 0;

/**
 * Processa imagens pendentes
 * Deve ser chamado a cada 2 minutos (como no n8n original)
 */
export async function processImages(
  questionsDbUrl: string,
  questionsDbKey: string,
  limit: number = 100
): Promise<{
  success: boolean;
  processed: number;
  successCount: number;
  failedCount: number;
}> {
  // Evitar execuções simultâneas
  if (isProcessing) {
    console.log('[ImageProcessor] Já existe um processamento em andamento, ignorando...');
    return {
      success: false,
      processed: 0,
      successCount: 0,
      failedCount: 0,
    };
  }

  isProcessing = true;
  lastRun = new Date();

  try {
    console.log(`[ImageProcessor] Iniciando processamento de imagens (limite: ${limit})...`);

    const imageService = new ImageScraperService(questionsDbUrl, questionsDbKey);
    const result = await imageService.processBatch(limit);

    processedCount += result.success;

    console.log(`[ImageProcessor] Processamento concluído: ${result.success} sucesso, ${result.failed} falhas de ${result.processed} questões`);

    return {
      success: true,
      processed: result.processed,
      successCount: result.success,
      failedCount: result.failed,
    };
  } catch (error) {
    console.error('[ImageProcessor] Erro durante processamento:', error);
    return {
      success: false,
      processed: 0,
      successCount: 0,
      failedCount: 0,
    };
  } finally {
    isProcessing = false;
  }
}

/**
 * Obtém status do processador
 */
export function getImageProcessorStatus(): {
  isProcessing: boolean;
  lastRun: Date | null;
  totalProcessed: number;
} {
  return {
    isProcessing,
    lastRun,
    totalProcessed: processedCount,
  };
}

/**
 * Cria um intervalo para processar imagens periodicamente
 * @param questionsDbUrl URL do Supabase
 * @param questionsDbKey Chave do Supabase
 * @param intervalMs Intervalo em milissegundos (padrão: 2 minutos)
 */
export function startImageProcessorCron(
  questionsDbUrl: string,
  questionsDbKey: string,
  intervalMs: number = 2 * 60 * 1000
): NodeJS.Timeout {
  console.log(`[ImageProcessor] Iniciando cron job (intervalo: ${intervalMs / 1000}s)`);

  // Executar imediatamente na primeira vez
  processImages(questionsDbUrl, questionsDbKey, 100);

  // Agendar execuções periódicas
  return setInterval(() => {
    processImages(questionsDbUrl, questionsDbKey, 100);
  }, intervalMs);
}
