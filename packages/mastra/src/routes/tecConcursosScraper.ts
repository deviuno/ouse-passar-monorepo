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

  /**
   * POST /api/tec-scraper/cookies/import
   * Importa cookies de uma sessão logada manualmente
   * Body: { cookies: string } - JSON string dos cookies
   *
   * COMO OBTER OS COOKIES:
   * 1. Abra o TecConcursos no Chrome e faça login manualmente (resolvendo o CAPTCHA)
   * 2. Abra DevTools (F12) > Application > Cookies
   * 3. Ou use a extensão "EditThisCookie" para exportar todos os cookies como JSON
   * 4. Envie o JSON para este endpoint
   */
  router.post('/cookies/import', async (req: Request, res: Response) => {
    const { cookies } = req.body;

    if (!cookies) {
      return res.status(400).json({
        success: false,
        error: 'Cookies não fornecidos. Envie um JSON com a chave "cookies" contendo o array de cookies.',
      });
    }

    try {
      const cookiesString = typeof cookies === 'string' ? cookies : JSON.stringify(cookies);
      const result = await TecConcursosScraper.importCookies(cookiesString);

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao importar cookies',
      });
    }
  });

  /**
   * POST /api/tec-scraper/cookies/export
   * Exporta cookies da sessão atual do scraper
   */
  router.post('/cookies/export', async (req: Request, res: Response) => {
    try {
      const result = await TecConcursosScraper.exportCookies();
      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido ao exportar cookies',
      });
    }
  });

  /**
   * GET /api/tec-scraper/cookies/check
   * Verifica se os cookies salvos ainda são válidos
   */
  router.get('/cookies/check', async (req: Request, res: Response) => {
    try {
      // Isso vai tentar o login que usa cookies automaticamente
      const isLoggedIn = await TecConcursosScraper.login();

      if (isLoggedIn) {
        await TecConcursosScraper.closeBrowser();
      }

      return res.json({
        success: true,
        isLoggedIn,
        message: isLoggedIn ? 'Cookies válidos - login bem-sucedido' : 'Cookies inválidos ou inexistentes',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao verificar cookies',
      });
    }
  });

  /**
   * POST /api/tec-scraper/extract-caderno
   * Extrai questões de um caderno existente por URL
   * Body: { url: string }
   *
   * Uso: Para cadernos criados manualmente no TecConcursos
   * Exemplo: { "url": "https://www.tecconcursos.com.br/s/Q5jOgS" }
   */
  router.post('/extract-caderno', async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL do caderno não fornecida. Envie um JSON com a chave "url".',
      });
    }

    if (TecConcursosScraper.isScrapingRunning()) {
      return res.status(409).json({
        success: false,
        error: 'Uma extração já está em execução. Aguarde ou pare o processo atual.',
        progress: TecConcursosScraper.getScrapingProgress(),
      });
    }

    // Iniciar extração em background (não bloqueia a resposta)
    TecConcursosScraper.extrairQuestoesDeCadernoUrl(url).then(result => {
      console.log('[TecScraper Route] Extração concluída:', result.message);
    }).catch(err => {
      console.error('[TecScraper Route] Erro na extração:', err);
    });

    return res.json({
      success: true,
      message: `Extração do caderno iniciada em background: ${url}`,
      progress: TecConcursosScraper.getScrapingProgress(),
    });
  });

  /**
   * POST /api/tec-scraper/extract-caderno/sync
   * Extrai questões de um caderno existente por URL (síncrono - aguarda conclusão)
   * Body: { url: string }
   *
   * ATENÇÃO: Esta rota pode demorar vários minutos dependendo do número de questões
   */
  router.post('/extract-caderno/sync', async (req: Request, res: Response) => {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'URL do caderno não fornecida. Envie um JSON com a chave "url".',
      });
    }

    if (TecConcursosScraper.isScrapingRunning()) {
      return res.status(409).json({
        success: false,
        error: 'Uma extração já está em execução. Aguarde ou pare o processo atual.',
        progress: TecConcursosScraper.getScrapingProgress(),
      });
    }

    try {
      const result = await TecConcursosScraper.extrairQuestoesDeCadernoUrl(url);

      return res.json({
        success: result.success,
        message: result.message,
        questoesColetadas: result.questoes.length,
        salvos: result.salvos,
        erros: result.erros,
        // Não retornar as questões completas para não sobrecarregar a resposta
        // questoes: result.questoes,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro desconhecido na extração',
      });
    }
  });

  return router;
}

export default createTecConcursosScraperRoutes;
