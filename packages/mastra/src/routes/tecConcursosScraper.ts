/**
 * Rotas para controle do TecConcursos Scraper
 */

import { Router, Request, Response } from 'express';
import TecConcursosScraper from '../services/tecConcursosScraper.js';

export function createTecConcursosScraperRoutes(): Router {
  const router = Router();

  /**
   * GET /api/tec-scraper/status
   * Retorna status atual do scraper
   */
  router.get('/status', (req: Request, res: Response) => {
    const isRunning = TecConcursosScraper.isScrapingRunning();
    const progress = TecConcursosScraper.getScrapingProgress();

    return res.json({
      success: true,
      isRunning,
      progress,
    });
  });

  /**
   * POST /api/tec-scraper/start
   * Inicia o scraping de uma área específica
   * Body: { area: string }
   */
  router.post('/start', async (req: Request, res: Response) => {
    const { area } = req.body;

    if (!area) {
      return res.status(400).json({
        success: false,
        error: 'Área não especificada. Informe o campo "area" no body.',
      });
    }

    if (TecConcursosScraper.isScrapingRunning()) {
      return res.status(409).json({
        success: false,
        error: 'Scraping já está em execução. Aguarde ou pare o processo atual.',
        progress: TecConcursosScraper.getScrapingProgress(),
      });
    }

    // Iniciar scraping em background (não bloqueia a resposta)
    TecConcursosScraper.iniciarScrapingArea(area).catch(err => {
      console.error('[TecScraper Route] Erro no scraping:', err);
    });

    return res.json({
      success: true,
      message: `Scraping da área "${area}" iniciado em background`,
      progress: TecConcursosScraper.getScrapingProgress(),
    });
  });

  /**
   * POST /api/tec-scraper/stop
   * Para o scraping em execução
   */
  router.post('/stop', async (req: Request, res: Response) => {
    if (!TecConcursosScraper.isScrapingRunning()) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum scraping em execução',
      });
    }

    await TecConcursosScraper.pararScraping();

    return res.json({
      success: true,
      message: 'Scraping parado',
      progress: TecConcursosScraper.getScrapingProgress(),
    });
  });

  /**
   * POST /api/tec-scraper/login-test
   * Testa o login no TecConcursos
   */
  router.post('/login-test', async (req: Request, res: Response) => {
    try {
      const success = await TecConcursosScraper.login();

      if (success) {
        // Fechar browser após teste
        await TecConcursosScraper.closeBrowser();
      }

      return res.json({
        success,
        message: success ? 'Login realizado com sucesso!' : 'Falha no login',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido',
      });
    }
  });

  /**
   * GET /api/tec-scraper/areas
   * Lista as áreas disponíveis para scraping
   */
  router.get('/areas', (req: Request, res: Response) => {
    const areas = [
      { id: 'policial', nome: 'Policial', prioridade: 1 },
      { id: 'fiscal', nome: 'Fiscal', prioridade: 2 },
      { id: 'tribunais-mpu', nome: 'Tribunais e MPU', prioridade: 3 },
      { id: 'administrativa', nome: 'Administrativa', prioridade: 4 },
      { id: 'bancaria', nome: 'Bancária', prioridade: 5 },
      { id: 'controle', nome: 'Controle', prioridade: 6 },
      { id: 'gestao-governanca', nome: 'Gestão e Governança', prioridade: 7 },
      { id: 'regulacao', nome: 'Regulação', prioridade: 8 },
      { id: 'legislativo', nome: 'Legislativo', prioridade: 9 },
      { id: 'diplomacia', nome: 'Diplomacia', prioridade: 10 },
      { id: 'militar', nome: 'Militar', prioridade: 11 },
      { id: 'outras', nome: 'Outras Carreiras', prioridade: 12 },
    ];

    return res.json({
      success: true,
      areas,
    });
  });

  /**
   * POST /api/tec-scraper/cron/start
   * Inicia o cron job de scraping automático
   * Body: { intervalHours?: number }
   */
  router.post('/cron/start', (req: Request, res: Response) => {
    const intervalHours = req.body.intervalHours || 24;
    const intervalMs = intervalHours * 60 * 60 * 1000;

    TecConcursosScraper.startScrapingCron(intervalMs);

    return res.json({
      success: true,
      message: `Cron job iniciado (intervalo: ${intervalHours} horas)`,
    });
  });

  /**
   * POST /api/tec-scraper/cron/stop
   * Para o cron job de scraping automático
   */
  router.post('/cron/stop', (req: Request, res: Response) => {
    TecConcursosScraper.stopScrapingCron();

    return res.json({
      success: true,
      message: 'Cron job parado',
    });
  });

  return router;
}

export default createTecConcursosScraperRoutes;
