import { Router, Request, Response } from 'express';
import { QuestionScraperService, ScraperPayload, ScrapedQuestion } from '../services/questionScraperService.js';
import { ImageScraperService } from '../services/imageScraperService.js';
import { StatsScraperService } from '../services/statsScraperService.js';
import { QuestionCleanupService } from '../services/questionCleanupService.js';

export function createScraperRoutes(
  questionsDbUrl: string,
  questionsDbKey: string
): Router {
  const router = Router();

  // Inicializar serviços
  const questionService = new QuestionScraperService(questionsDbUrl, questionsDbKey);
  const imageService = new ImageScraperService(questionsDbUrl, questionsDbKey);
  const statsService = new StatsScraperService(questionsDbUrl, questionsDbKey);
  const cleanupService = new QuestionCleanupService(questionsDbUrl, questionsDbKey);

  /**
   * POST /api/scraper/questoes
   * Recebe questões do scraper externo e salva no banco
   */
  router.post('/questoes', async (req: Request, res: Response) => {
    try {
      const payload = req.body as ScraperPayload;

      // Validação básica
      if (!payload.data || !Array.isArray(payload.data)) {
        return res.status(400).json({
          success: false,
          error: 'Payload inválido: campo "data" deve ser um array de questões',
        });
      }

      console.log(`[Scraper API] Recebidas ${payload.data.length} questões de ${payload.source || 'fonte desconhecida'}`);

      // Processar questões
      const result = await questionService.processBatch(payload.data);

      return res.json({
        success: true,
        message: `Processamento concluído`,
        timestamp: new Date().toISOString(),
        source: payload.source,
        account: payload.account,
        result: {
          received: payload.data.length,
          inserted: result.inserted,
          skipped: result.skipped,
          errors: result.errors,
        },
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao processar questões:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * GET /api/scraper/ids
   * Retorna todos os IDs de questões existentes
   * Usado pelo scraper para evitar duplicatas
   */
  router.get('/ids', async (req: Request, res: Response) => {
    try {
      const ids = await questionService.getAllIds();

      return res.json({
        success: true,
        count: ids.length,
        ids,
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao listar IDs:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * GET /api/scraper/questao/:id
   * Retorna uma questão por ID
   */
  router.get('/questao/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const question = await questionService.getQuestionById(id);

      if (!question) {
        return res.status(404).json({
          success: false,
          error: 'Questão não encontrada',
        });
      }

      return res.json({
        success: true,
        question,
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao buscar questão:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * POST /api/scraper/processar-imagens
   * Dispara processamento manual de imagens pendentes
   */
  router.post('/processar-imagens', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;

      console.log(`[Scraper API] Iniciando processamento de até ${limit} questões com imagens pendentes`);

      const result = await imageService.processBatch(limit);

      return res.json({
        success: true,
        message: 'Processamento de imagens concluído',
        result,
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao processar imagens:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * GET /api/scraper/stats
   * Retorna estatísticas do scraping
   */
  router.get('/stats', async (req: Request, res: Response) => {
    try {
      const includeAll = req.query.all === 'true';
      const stats = await statsService.getDashboardStats(includeAll);

      return res.json({
        success: true,
        ...stats,
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao buscar estatísticas:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * GET /api/scraper/pending-images
   * Lista questões com imagens pendentes de processamento
   */
  router.get('/pending-images', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const questions = await imageService.getQuestionsWithPendingImages(limit);

      return res.json({
        success: true,
        count: questions.length,
        questions: questions.map(q => ({
          id: q.id,
          materia: q.materia,
          imagens_enunciado: q.imagens_enunciado,
          created_at: q.created_at,
        })),
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao listar imagens pendentes:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * GET /api/scraper/unreviewed
   * Lista questões não revisadas pela IA
   */
  router.get('/unreviewed', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const questions = await questionService.getUnreviewedQuestions(limit);

      return res.json({
        success: true,
        count: questions.length,
        questions: questions.map(q => ({
          id: q.id,
          materia: q.materia,
          assunto: q.assunto,
          gabarito: q.gabarito,
          created_at: q.created_at,
        })),
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao listar questões não revisadas:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * GET /api/scraper/corrupted
   * Lista questões com HTML corrompido (AngularJS templates, etc)
   */
  router.get('/corrupted', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string) || 100;
      const questions = await questionService.findCorruptedQuestions(limit);

      return res.json({
        success: true,
        count: questions.length,
        questions: questions.map(q => ({
          id: q.id,
          enunciado_preview: q.enunciado?.substring(0, 200) + '...',
        })),
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao listar questões corrompidas:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * POST /api/scraper/cleanup
   * Executa limpeza de questões corrompidas
   * - Tenta sanitizar e atualizar questões com HTML corrompido
   * - Questões que não podem ser sanitizadas são desativadas (ativo=false)
   */
  router.post('/cleanup', async (req: Request, res: Response) => {
    try {
      const batchSize = parseInt(req.query.batchSize as string) || 50;

      console.log(`[Scraper API] Iniciando limpeza de até ${batchSize} questões corrompidas`);

      const result = await questionService.cleanupCorruptedQuestions(batchSize);

      return res.json({
        success: true,
        message: 'Limpeza de questões corrompidas concluída',
        result,
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao executar limpeza:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * POST /api/scraper/cleanup/:id
   * Sanitiza uma questão específica
   */
  router.post('/cleanup/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      console.log(`[Scraper API] Sanitizando questão ${id}`);

      const result = await questionService.sanitizeAndUpdateQuestion(id);

      return res.json({
        success: result.success,
        action: result.action,
        details: result.details,
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao sanitizar questão:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  // ==================== LIMPEZA COM IA ====================

  /**
   * GET /api/scraper/ai-cleanup/stats
   * Retorna estatísticas de questões corrompidas para limpeza com IA
   */
  router.get('/ai-cleanup/stats', async (req: Request, res: Response) => {
    try {
      const total = await cleanupService.countCorruptedQuestions();
      const sample = await cleanupService.getCorruptedQuestions(5);

      return res.json({
        success: true,
        totalCorrupted: total,
        sampleIds: sample.map(q => q.id),
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao buscar stats de limpeza:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * POST /api/scraper/ai-cleanup/question/:id
   * Limpa uma questão específica usando IA
   */
  router.post('/ai-cleanup/question/:id', async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const questionId = parseInt(id);

      if (isNaN(questionId)) {
        return res.status(400).json({
          success: false,
          error: 'ID inválido',
        });
      }

      console.log(`[Scraper API] Iniciando limpeza IA da questão ${questionId}`);

      const result = await cleanupService.cleanAndUpdateQuestion(questionId);

      return res.json({
        success: result.success,
        action: result.action,
        details: result.details,
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao limpar questão com IA:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * POST /api/scraper/ai-cleanup/batch
   * Processa um lote de questões corrompidas usando IA
   * Query params:
   *   - batchSize: número de questões por lote (default: 10)
   *   - delay: delay entre questões em ms (default: 1000)
   */
  router.post('/ai-cleanup/batch', async (req: Request, res: Response) => {
    try {
      const batchSize = parseInt(req.query.batchSize as string) || 10;
      const delay = parseInt(req.query.delay as string) || 1000;

      console.log(`[Scraper API] Iniciando limpeza IA em lote (${batchSize} questões, delay ${delay}ms)`);

      const stats = await cleanupService.processBatch(batchSize, delay);

      return res.json({
        success: true,
        message: 'Lote processado com sucesso',
        stats,
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao processar lote com IA:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  /**
   * POST /api/scraper/ai-cleanup/start
   * Inicia processamento contínuo em background
   * Query params:
   *   - batchSize: número de questões por lote (default: 10)
   *   - maxBatches: número máximo de lotes (default: 100)
   *   - delayBetweenBatches: delay entre lotes em ms (default: 5000)
   */
  router.post('/ai-cleanup/start', async (req: Request, res: Response) => {
    try {
      const batchSize = parseInt(req.query.batchSize as string) || 10;
      const maxBatches = parseInt(req.query.maxBatches as string) || 100;
      const delayBetweenBatches = parseInt(req.query.delayBetweenBatches as string) || 5000;

      console.log(`[Scraper API] Iniciando processamento contínuo (${maxBatches} lotes de ${batchSize})`);

      // Iniciar em background (não aguarda)
      cleanupService.startContinuousProcessing(
        batchSize,
        delayBetweenBatches,
        maxBatches,
        (stats, batch) => {
          console.log(`[Scraper API] Progresso: Lote ${batch} - ${stats.cleaned} limpas, ${stats.failed} falhas`);
        }
      ).then(stats => {
        console.log(`[Scraper API] Processamento finalizado: ${stats.cleaned} limpas, ${stats.failed} falhas`);
      }).catch(error => {
        console.error('[Scraper API] Erro no processamento contínuo:', error);
      });

      return res.json({
        success: true,
        message: 'Processamento iniciado em background',
        config: {
          batchSize,
          maxBatches,
          delayBetweenBatches,
          estimatedQuestions: batchSize * maxBatches,
        },
      });
    } catch (error) {
      console.error('[Scraper API] Erro ao iniciar processamento:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro interno',
      });
    }
  });

  return router;
}
