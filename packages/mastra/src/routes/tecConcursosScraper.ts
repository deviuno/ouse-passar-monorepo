/**
 * Rotas para controle do TecConcursos Scraper
 * Inclui gerenciamento de contas, cadernos e logs via banco de dados
 */

import { Router, Request, Response } from 'express';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import TecConcursosScraper from '../services/tecConcursosScraper.js';
import TaxonomyScraper from '../services/taxonomyScraper.js';
import { taxonomyExtractorAgent } from '../mastra/agents/taxonomyExtractorAgent.js';

// ==================== INTERFACES ====================

interface TecAccount {
  id: string;
  email: string;
  password?: string;
  cookies?: any;
  is_active: boolean;
  last_login_check?: string;
  login_status: 'valid' | 'invalid' | 'expired' | 'unknown';
  created_at: string;
  updated_at: string;
}

interface TecCaderno {
  id: string;
  name: string;
  url: string;
  total_questions: number;
  collected_questions: number;
  new_questions: number;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'error';
  priority: number;
  started_at?: string;
  completed_at?: string;
  last_error?: string;
  current_page: number;
  account_id?: string;
  created_at: string;
  updated_at: string;
}

interface TecScrapingLog {
  id: string;
  caderno_id?: string;
  log_type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
  created_at: string;
}

interface TecScraperSettings {
  id: string;
  min_delay_ms: number;
  max_delay_ms: number;
  page_delay_ms: number;
  randomize_accounts: boolean;
  randomize_cadernos: boolean;
  questions_per_session: number;
  max_errors_before_pause: number;
  retry_on_error: boolean;
  max_retries: number;
  retry_delay_ms: number;
  auto_start_enabled: boolean;
  auto_start_time: string;
  auto_stop_time: string;
  created_at: string;
  updated_at: string;
}

// ==================== SUPABASE CLIENT ====================

let _supabase: SupabaseClient | null = null;

function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';
    if (!url || !key) {
      throw new Error('Supabase credentials not configured');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// ==================== HELPER FUNCTIONS ====================

async function addLog(
  cadernoId: string | null,
  logType: 'info' | 'warning' | 'error' | 'success',
  message: string,
  details?: any
): Promise<void> {
  try {
    const supabase = getSupabase();
    await supabase.from('tec_scraping_logs').insert({
      caderno_id: cadernoId,
      log_type: logType,
      message,
      details,
    });
  } catch (err) {
    console.error('[TecScraper] Erro ao adicionar log:', err);
  }
}

// ==================== COMMAND-BASED WORKER COMMUNICATION ====================
// Instead of calling the scraper directly, we now send commands via database
// The worker process polls for commands and executes them independently

/**
 * Send a command to the scraper worker
 */
async function sendCommand(
  command: 'start' | 'stop' | 'pause' | 'resume',
  cadernoId: string | null = null,
  accountId: string | null = null,
  payload?: any
): Promise<{ success: boolean; commandId?: string; error?: string }> {
  try {
    const supabase = getSupabase();
    const { data, error } = await supabase
      .from('tec_scraper_commands')
      .insert({
        command,
        caderno_id: cadernoId,
        account_id: accountId,
        payload,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true, commandId: data?.id };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}

/**
 * Get worker state from database
 */
async function getWorkerState(): Promise<{
  isRunning: boolean;
  currentCadernoId: string | null;
  lastHeartbeat: string | null;
}> {
  try {
    const supabase = getSupabase();

    // Get most recent active worker (heartbeat within last 30 seconds)
    const thirtySecondsAgo = new Date(Date.now() - 30000).toISOString();
    const { data } = await supabase
      .from('tec_scraper_worker_state')
      .select('*')
      .gte('last_heartbeat', thirtySecondsAgo)
      .order('last_heartbeat', { ascending: false })
      .limit(1)
      .single();

    if (data) {
      return {
        isRunning: data.status === 'running',
        currentCadernoId: data.current_caderno_id,
        lastHeartbeat: data.last_heartbeat,
      };
    }

    return { isRunning: false, currentCadernoId: null, lastHeartbeat: null };
  } catch {
    return { isRunning: false, currentCadernoId: null, lastHeartbeat: null };
  }
}

/**
 * Check if there's a running caderno (from database status, not worker)
 */
async function getRunningCaderno(): Promise<TecCaderno | null> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('tec_cadernos')
      .select('*')
      .eq('status', 'running')
      .limit(1)
      .single();

    return data as TecCaderno | null;
  } catch {
    return null;
  }
}

/**
 * Get all running cadernos (for parallel scraping)
 */
async function getRunningCadernos(): Promise<TecCaderno[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('tec_cadernos')
      .select('*')
      .eq('status', 'running');

    return (data || []) as TecCaderno[];
  } catch {
    return [];
  }
}

/**
 * Get accounts with valid login that are not currently running a caderno
 */
async function getAvailableAccounts(): Promise<TecAccount[]> {
  try {
    const supabase = getSupabase();

    // Get all valid accounts
    const { data: accounts } = await supabase
      .from('tec_accounts')
      .select('*')
      .eq('login_status', 'valid')
      .eq('is_active', true);

    if (!accounts || accounts.length === 0) {
      return [];
    }

    // Get running cadernos to see which accounts are busy
    const runningCadernos = await getRunningCadernos();
    const busyAccountIds = new Set(
      runningCadernos
        .filter(c => c.account_id)
        .map(c => c.account_id)
    );

    // Filter out busy accounts
    return accounts.filter(acc => !busyAccountIds.has(acc.id)) as TecAccount[];
  } catch {
    return [];
  }
}

/**
 * Check if an account is currently processing a caderno
 */
async function isAccountBusy(accountId: string): Promise<boolean> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('tec_cadernos')
      .select('id')
      .eq('status', 'running')
      .eq('account_id', accountId)
      .limit(1)
      .single();

    return !!data;
  } catch {
    return false;
  }
}

/**
 * Get queued cadernos that don't have an account assigned
 */
async function getQueuedCadernos(limit: number = 10): Promise<TecCaderno[]> {
  try {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('tec_cadernos')
      .select('*')
      .in('status', ['queued', 'paused'])
      .order('priority', { ascending: false })
      .order('created_at', { ascending: true })
      .limit(limit);

    return (data || []) as TecCaderno[];
  } catch {
    return [];
  }
}

export function createTecConcursosScraperRoutes(): Router {
  const router = Router();

  /**
   * GET /api/tec-scraper/status
   * Retorna status atual do scraper (from worker state)
   */
  router.get('/status', async (req: Request, res: Response) => {
    const workerState = await getWorkerState();
    const runningCaderno = await getRunningCaderno();

    // Build progress from database
    let progress = null;
    if (runningCaderno) {
      progress = {
        area: 'caderno',
        caderno: runningCaderno.name,
        questoesColetadas: runningCaderno.collected_questions,
        questoesTotal: runningCaderno.total_questions,
        status: runningCaderno.status,
        lastError: runningCaderno.last_error,
        startedAt: runningCaderno.started_at,
        updatedAt: runningCaderno.updated_at,
      };
    }

    return res.json({
      success: true,
      isRunning: workerState.isRunning || runningCaderno?.status === 'running',
      progress,
      workerState,
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
   * Para o scraping em execução (sends command to worker)
   */
  router.post('/stop', async (req: Request, res: Response) => {
    const runningCaderno = await getRunningCaderno();

    if (!runningCaderno) {
      return res.status(400).json({
        success: false,
        error: 'Nenhum scraping em execução',
      });
    }

    // Send stop command to worker
    const result = await sendCommand('stop', runningCaderno.id, runningCaderno.account_id || null);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        error: result.error || 'Erro ao enviar comando de parar',
      });
    }

    return res.json({
      success: true,
      message: 'Comando de parar enviado ao worker',
      commandId: result.commandId,
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
   * POST /api/tec-scraper/cookies/capture/:accountId
   * Captura cookies de uma conta fazendo login em navegador visível
   * O usuário resolve o CAPTCHA manualmente e o sistema captura os cookies
   *
   * Query params:
   * - timeoutMinutes: tempo máximo para resolver CAPTCHA (padrão: 5 minutos)
   */
  router.post('/cookies/capture/:accountId', async (req: Request, res: Response) => {
    const { accountId } = req.params;
    const { timeoutMinutes } = req.query;

    try {
      const result = await TecConcursosScraper.captureCookiesForAccount(accountId, {
        timeoutMinutes: timeoutMinutes ? parseInt(timeoutMinutes as string) : 5,
      });

      if (result.success) {
        // Update account login status
        const supabase = getSupabase();
        await supabase
          .from('tec_accounts')
          .update({
            login_status: 'valid',
            last_login_check: new Date().toISOString(),
          })
          .eq('id', accountId);

        return res.json({
          success: true,
          message: result.message,
          cookiesCount: result.cookiesCount,
        });
      } else {
        return res.status(400).json({
          success: false,
          error: result.message,
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao capturar cookies',
      });
    }
  });

  /**
   * POST /api/tec-scraper/cookies/capture-all
   * Captura cookies de TODAS as contas ativas, uma de cada vez
   * Abre navegador visível para cada conta resolver CAPTCHA
   *
   * Query params:
   * - timeoutMinutesPerAccount: tempo máximo para resolver CAPTCHA por conta (padrão: 5 minutos)
   */
  router.post('/cookies/capture-all', async (req: Request, res: Response) => {
    const { timeoutMinutesPerAccount } = req.query;

    try {
      const result = await TecConcursosScraper.captureAllAccountsCookies({
        timeoutMinutesPerAccount: timeoutMinutesPerAccount ? parseInt(timeoutMinutesPerAccount as string) : 5,
      });

      // Update login status for successful accounts
      if (result.success > 0) {
        const supabase = getSupabase();
        // Get accounts that succeeded (those not in failed list)
        const { data: accounts } = await supabase
          .from('tec_accounts')
          .select('id, email')
          .eq('is_active', true);

        if (accounts) {
          const successfulAccounts = accounts.filter(a => !result.failed.includes(a.email));
          for (const account of successfulAccounts) {
            await supabase
              .from('tec_accounts')
              .update({
                login_status: 'valid',
                last_login_check: new Date().toISOString(),
              })
              .eq('id', account.id);
          }
        }
      }

      return res.json({
        success: true,
        message: `Captura concluída: ${result.success}/${result.total} contas bem-sucedidas`,
        total: result.total,
        successCount: result.success,
        failed: result.failed,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao capturar cookies',
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

  // ==================== ACCOUNTS ENDPOINTS ====================

  /**
   * GET /api/tec-scraper/accounts
   * Lista todas as contas
   */
  router.get('/accounts', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('tec_accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Remove sensitive data from response
      const accounts = (data || []).map(acc => ({
        ...acc,
        password: acc.password ? '********' : null,
        cookies: acc.cookies ? { present: true } : null,
      }));

      return res.json({ success: true, accounts });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar contas',
      });
    }
  });

  /**
   * POST /api/tec-scraper/accounts
   * Adiciona nova conta
   */
  router.post('/accounts', async (req: Request, res: Response) => {
    const { email, password, cookies } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        error: 'Email é obrigatório',
      });
    }

    try {
      const supabase = getSupabase();

      // Parse cookies if string
      let parsedCookies = cookies;
      if (typeof cookies === 'string') {
        try {
          parsedCookies = JSON.parse(cookies);
        } catch {
          parsedCookies = null;
        }
      }

      const { data, error } = await supabase
        .from('tec_accounts')
        .insert({
          email,
          password: password || null,
          cookies: parsedCookies || null,
          is_active: false,
          login_status: 'unknown',
        })
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        account: { ...data, password: data.password ? '********' : null },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar conta',
      });
    }
  });

  /**
   * PUT /api/tec-scraper/accounts/:id
   * Atualiza uma conta
   */
  router.put('/accounts/:id', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { email, password, cookies, is_active } = req.body;

    try {
      const supabase = getSupabase();

      const updateData: any = {};
      if (email !== undefined) updateData.email = email;
      if (password !== undefined) updateData.password = password;
      if (is_active !== undefined) updateData.is_active = is_active;

      if (cookies !== undefined) {
        let parsedCookies = cookies;
        if (typeof cookies === 'string') {
          try {
            parsedCookies = JSON.parse(cookies);
          } catch {
            parsedCookies = null;
          }
        }
        updateData.cookies = parsedCookies;
      }

      // If activating this account, deactivate all others
      if (is_active === true) {
        await supabase
          .from('tec_accounts')
          .update({ is_active: false })
          .neq('id', id);
      }

      const { data, error } = await supabase
        .from('tec_accounts')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      return res.json({
        success: true,
        account: { ...data, password: data.password ? '********' : null },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar conta',
      });
    }
  });

  /**
   * DELETE /api/tec-scraper/accounts/:id
   * Remove uma conta
   */
  router.delete('/accounts/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const supabase = getSupabase();
      const { error } = await supabase.from('tec_accounts').delete().eq('id', id);

      if (error) throw error;

      return res.json({ success: true, message: 'Conta removida' });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao remover conta',
      });
    }
  });

  /**
   * POST /api/tec-scraper/accounts/:id/test-login
   * Testa login de uma conta específica
   */
  router.post('/accounts/:id/test-login', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const supabase = getSupabase();

      // Get account with cookies
      const { data: account, error } = await supabase
        .from('tec_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !account) {
        return res.status(404).json({
          success: false,
          error: 'Conta não encontrada',
        });
      }

      // If account has cookies, import them and test
      let loginSuccess = false;
      if (account.cookies) {
        const cookiesStr = JSON.stringify(account.cookies);
        const importResult = await TecConcursosScraper.importCookies(cookiesStr);
        if (importResult.success) {
          loginSuccess = await TecConcursosScraper.login();
        }
      }

      // Update account status
      await supabase
        .from('tec_accounts')
        .update({
          login_status: loginSuccess ? 'valid' : 'invalid',
          last_login_check: new Date().toISOString(),
        })
        .eq('id', id);

      if (loginSuccess) {
        await TecConcursosScraper.closeBrowser();
      }

      return res.json({
        success: true,
        loginValid: loginSuccess,
        message: loginSuccess ? 'Login válido' : 'Login inválido ou expirado',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao testar login',
      });
    }
  });

  /**
   * POST /api/tec-scraper/accounts/:id/import-cookies
   * Importa cookies para uma conta específica
   */
  router.post('/accounts/:id/import-cookies', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { cookies } = req.body;

    if (!cookies) {
      return res.status(400).json({
        success: false,
        error: 'Cookies não fornecidos',
      });
    }

    try {
      const supabase = getSupabase();

      let parsedCookies = cookies;
      if (typeof cookies === 'string') {
        parsedCookies = JSON.parse(cookies);
      }

      // Import cookies to scraper
      const importResult = await TecConcursosScraper.importCookies(
        typeof cookies === 'string' ? cookies : JSON.stringify(cookies)
      );

      if (!importResult.success) {
        return res.status(400).json({
          success: false,
          error: importResult.message || 'Falha ao importar cookies',
        });
      }

      // Test login
      const loginSuccess = await TecConcursosScraper.login();

      // Update account
      await supabase
        .from('tec_accounts')
        .update({
          cookies: parsedCookies,
          login_status: loginSuccess ? 'valid' : 'invalid',
          last_login_check: new Date().toISOString(),
        })
        .eq('id', id);

      if (loginSuccess) {
        await TecConcursosScraper.closeBrowser();
      }

      return res.json({
        success: true,
        loginValid: loginSuccess,
        message: loginSuccess
          ? 'Cookies importados e validados com sucesso'
          : 'Cookies importados mas login falhou',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao importar cookies',
      });
    }
  });

  /**
   * POST /api/tec-scraper/accounts/:id/activate
   * Ativa uma conta (desativa as outras)
   */
  router.post('/accounts/:id/activate', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const supabase = getSupabase();

      // Get account with cookies
      const { data: account, error: fetchError } = await supabase
        .from('tec_accounts')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError || !account) {
        return res.status(404).json({
          success: false,
          error: 'Conta não encontrada',
        });
      }

      // Deactivate all accounts
      await supabase.from('tec_accounts').update({ is_active: false });

      // Activate this account
      const { error } = await supabase
        .from('tec_accounts')
        .update({ is_active: true })
        .eq('id', id);

      if (error) throw error;

      // If account has cookies, load them into the scraper
      if (account.cookies) {
        await TecConcursosScraper.importCookies(JSON.stringify(account.cookies));
      }

      return res.json({
        success: true,
        message: 'Conta ativada com sucesso',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao ativar conta',
      });
    }
  });

  // ==================== CADERNOS ENDPOINTS ====================

  /**
   * GET /api/tec-scraper/cadernos
   * Lista todos os cadernos com status
   */
  router.get('/cadernos', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('tec_cadernos')
        .select('*')
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Progress is now stored directly in the caderno record by the worker
      return res.json({ success: true, cadernos: data || [] });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar cadernos',
      });
    }
  });

  /**
   * POST /api/tec-scraper/cadernos
   * Adiciona novo caderno à fila
   */
  router.post('/cadernos', async (req: Request, res: Response) => {
    const { name, url, priority } = req.body;

    if (!name || !url) {
      return res.status(400).json({
        success: false,
        error: 'Nome e URL são obrigatórios',
      });
    }

    if (!url.includes('tecconcursos.com.br')) {
      return res.status(400).json({
        success: false,
        error: 'URL deve ser do TecConcursos',
      });
    }

    try {
      const supabase = getSupabase();

      const { data, error } = await supabase
        .from('tec_cadernos')
        .insert({
          name,
          url,
          priority: priority || 0,
          status: 'queued',
        })
        .select()
        .single();

      if (error) throw error;

      await addLog(data.id, 'info', `Caderno adicionado à fila: ${name}`);

      // Worker will automatically pick up queued cadernos
      return res.json({ success: true, caderno: data });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao criar caderno',
      });
    }
  });

  /**
   * DELETE /api/tec-scraper/cadernos/:id
   * Remove um caderno
   */
  router.delete('/cadernos/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      // If this caderno is running, send stop command first
      const runningCadernos = await getRunningCadernos();
      const thisRunningCaderno = runningCadernos.find(c => c.id === id);
      if (thisRunningCaderno) {
        await sendCommand('stop', id, thisRunningCaderno.account_id || null);
      }

      const supabase = getSupabase();
      const { error } = await supabase.from('tec_cadernos').delete().eq('id', id);

      if (error) throw error;

      return res.json({ success: true, message: 'Caderno removido' });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao remover caderno',
      });
    }
  });

  /**
   * POST /api/tec-scraper/cadernos/:id/start
   * Inicia extração de um caderno específico (sends command to worker)
   * Suporta scraping paralelo - usa uma conta disponível
   */
  router.post('/cadernos/:id/start', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { account_id } = req.body; // Opcionalmente especificar uma conta

    try {
      const supabase = getSupabase();

      // Get available accounts
      const availableAccounts = await getAvailableAccounts();

      if (availableAccounts.length === 0) {
        // Check if there are any valid accounts at all
        const { data: validAccounts } = await supabase
          .from('tec_accounts')
          .select('id, email')
          .eq('login_status', 'valid')
          .eq('is_active', true);

        if (!validAccounts || validAccounts.length === 0) {
          return res.status(400).json({
            success: false,
            error: 'Nenhuma conta válida disponível. Configure cookies válidos em pelo menos uma conta.',
          });
        }

        return res.status(409).json({
          success: false,
          error: 'Todas as contas estão ocupadas. Aguarde uma extração terminar ou adicione mais contas.',
          busyAccounts: validAccounts.length,
        });
      }

      // Use specified account or first available
      let selectedAccount = availableAccounts[0];
      if (account_id) {
        const specified = availableAccounts.find(a => a.id === account_id);
        if (specified) {
          selectedAccount = specified;
        } else {
          return res.status(400).json({
            success: false,
            error: 'A conta especificada não está disponível ou é inválida.',
          });
        }
      }

      // Send start command to worker with account_id
      const result = await sendCommand('start', id, selectedAccount.id);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Erro ao enviar comando',
        });
      }

      // Update caderno status to queued and assign account
      await supabase
        .from('tec_cadernos')
        .update({
          status: 'queued',
          account_id: selectedAccount.id
        })
        .eq('id', id);

      await addLog(id, 'info', `Comando de iniciar enviado ao worker (conta: ${selectedAccount.email})`);

      return res.json({
        success: true,
        message: `Extração iniciada com a conta ${selectedAccount.email}`,
        commandId: result.commandId,
        account: { id: selectedAccount.id, email: selectedAccount.email },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao iniciar extração',
      });
    }
  });

  /**
   * POST /api/tec-scraper/parallel/start
   * Inicia scraping paralelo com todas as contas disponíveis
   * Distribui os cadernos na fila entre as contas
   */
  router.post('/parallel/start', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();

      // Get available accounts
      const availableAccounts = await getAvailableAccounts();

      if (availableAccounts.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhuma conta disponível para scraping paralelo',
        });
      }

      // Get queued cadernos
      const queuedCadernos = await getQueuedCadernos(availableAccounts.length);

      if (queuedCadernos.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhum caderno na fila para processar',
        });
      }

      const started: Array<{ caderno: string; account: string; commandId?: string }> = [];
      const errors: Array<{ caderno: string; error: string }> = [];

      // Distribute cadernos among accounts
      for (let i = 0; i < Math.min(queuedCadernos.length, availableAccounts.length); i++) {
        const caderno = queuedCadernos[i];
        const account = availableAccounts[i];

        // Send start command with account
        const result = await sendCommand('start', caderno.id, account.id);

        if (result.success) {
          // Update caderno with account assignment
          await supabase
            .from('tec_cadernos')
            .update({
              status: 'queued',
              account_id: account.id
            })
            .eq('id', caderno.id);

          await addLog(caderno.id, 'info', `Scraping paralelo iniciado (conta: ${account.email})`);

          started.push({
            caderno: caderno.name,
            account: account.email,
            commandId: result.commandId,
          });
        } else {
          errors.push({
            caderno: caderno.name,
            error: result.error || 'Erro desconhecido',
          });
        }
      }

      return res.json({
        success: true,
        message: `Scraping paralelo iniciado: ${started.length} cadernos em ${started.length} contas`,
        started,
        errors: errors.length > 0 ? errors : undefined,
        availableAccountsUsed: started.length,
        totalAvailableAccounts: availableAccounts.length,
        totalQueuedCadernos: queuedCadernos.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao iniciar scraping paralelo',
      });
    }
  });

  /**
   * GET /api/tec-scraper/parallel/status
   * Retorna status do scraping paralelo (todos os cadernos em execução)
   */
  router.get('/parallel/status', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();

      // Get all running cadernos with account info
      const { data: runningCadernos } = await supabase
        .from('tec_cadernos')
        .select(`
          *,
          tec_accounts!tec_cadernos_account_id_fkey (
            id,
            email
          )
        `)
        .eq('status', 'running');

      // Get available accounts
      const availableAccounts = await getAvailableAccounts();

      // Get queued cadernos
      const queuedCadernos = await getQueuedCadernos(20);

      return res.json({
        success: true,
        parallel: {
          running: (runningCadernos || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            progress: {
              collected: c.collected_questions,
              total: c.total_questions,
              percentage: c.total_questions > 0
                ? Math.round((c.collected_questions / c.total_questions) * 100)
                : 0,
            },
            account: c.tec_accounts ? {
              id: c.tec_accounts.id,
              email: c.tec_accounts.email,
            } : null,
            startedAt: c.started_at,
          })),
          runningCount: runningCadernos?.length || 0,
          availableAccounts: availableAccounts.length,
          queuedCadernos: queuedCadernos.length,
        },
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter status paralelo',
      });
    }
  });

  /**
   * POST /api/tec-scraper/parallel/caderno/:id
   * Inicia scraping paralelo de UM ÚNICO caderno com TODAS as contas disponíveis
   * Divide o caderno em ranges e cada conta processa um range diferente
   */
  router.post('/parallel/caderno/:id', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const supabase = getSupabase();

      // Get caderno info
      const { data: caderno, error: cadernoError } = await supabase
        .from('tec_cadernos')
        .select('*')
        .eq('id', id)
        .single();

      if (cadernoError || !caderno) {
        return res.status(404).json({
          success: false,
          error: 'Caderno não encontrado',
        });
      }

      // Get available accounts
      const availableAccounts = await getAvailableAccounts();

      if (availableAccounts.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'Nenhuma conta disponível para scraping paralelo',
        });
      }

      const totalQuestions = caderno.total_questions || 0;
      const startFrom = (caderno.last_question_number || 0) + 1;
      const remainingQuestions = totalQuestions - startFrom + 1;

      if (remainingQuestions <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Caderno já foi completamente processado',
        });
      }

      // Calculate ranges for each account
      const numAccounts = availableAccounts.length;
      const questionsPerAccount = Math.ceil(remainingQuestions / numAccounts);

      const assignments: Array<{
        account: { id: string; email: string };
        startQuestion: number;
        endQuestion: number;
        commandId?: string;
      }> = [];

      for (let i = 0; i < numAccounts; i++) {
        const account = availableAccounts[i];
        const rangeStart = startFrom + (i * questionsPerAccount);
        const rangeEnd = Math.min(rangeStart + questionsPerAccount - 1, totalQuestions);

        // Skip if range is invalid
        if (rangeStart > totalQuestions) break;

        // Send command with range info in payload
        const result = await sendCommand('start', id, account.id, {
          startQuestion: rangeStart,
          endQuestion: rangeEnd,
          parallelMode: true,
        });

        if (result.success) {
          assignments.push({
            account: { id: account.id, email: account.email },
            startQuestion: rangeStart,
            endQuestion: rangeEnd,
            commandId: result.commandId,
          });

          await addLog(id, 'info', `Scraping paralelo: ${account.email} processará questões ${rangeStart}-${rangeEnd}`);
        }
      }

      // Update caderno status
      await supabase
        .from('tec_cadernos')
        .update({
          status: 'running',
          started_at: caderno.started_at || new Date().toISOString(),
        })
        .eq('id', id);

      return res.json({
        success: true,
        message: `Scraping paralelo iniciado: ${assignments.length} contas processando o caderno "${caderno.name}"`,
        caderno: {
          id: caderno.id,
          name: caderno.name,
          totalQuestions,
          remainingQuestions,
        },
        assignments,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao iniciar scraping paralelo',
      });
    }
  });

  /**
   * POST /api/tec-scraper/cadernos/:id/pause
   * Pausa a extração de um caderno (sends command to worker)
   */
  router.post('/cadernos/:id/pause', async (req: Request, res: Response) => {
    const { id } = req.params;

    // Check if this caderno is running (supports parallel scraping)
    const runningCadernos = await getRunningCadernos();
    const thisCaderno = runningCadernos.find(c => c.id === id);

    if (!thisCaderno) {
      return res.status(400).json({
        success: false,
        error: 'Este caderno não está em execução',
      });
    }

    try {
      // Send pause command to worker with account_id
      const result = await sendCommand('pause', id, thisCaderno.account_id || null);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Erro ao enviar comando de pausar',
        });
      }

      await addLog(id, 'info', 'Comando de pausar enviado ao worker');

      return res.json({
        success: true,
        message: 'Comando de pausar enviado ao worker',
        commandId: result.commandId,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao pausar extração',
      });
    }
  });

  /**
   * POST /api/tec-scraper/cadernos/:id/resume
   * Retoma a extração de um caderno pausado (sends command to worker)
   * Suporta scraping paralelo - usa uma conta disponível
   */
  router.post('/cadernos/:id/resume', async (req: Request, res: Response) => {
    const { id } = req.params;
    const { account_id } = req.body;

    try {
      const supabase = getSupabase();

      // Get available accounts
      const availableAccounts = await getAvailableAccounts();

      if (availableAccounts.length === 0) {
        return res.status(409).json({
          success: false,
          error: 'Todas as contas estão ocupadas. Aguarde uma extração terminar.',
        });
      }

      // Use specified account or first available
      let selectedAccount = availableAccounts[0];
      if (account_id) {
        const specified = availableAccounts.find(a => a.id === account_id);
        if (specified) {
          selectedAccount = specified;
        }
      }

      // Send resume command to worker with account_id
      const result = await sendCommand('resume', id, selectedAccount.id);

      if (!result.success) {
        return res.status(500).json({
          success: false,
          error: result.error || 'Erro ao enviar comando de retomar',
        });
      }

      // Update caderno status to queued and assign account
      await supabase
        .from('tec_cadernos')
        .update({
          status: 'queued',
          account_id: selectedAccount.id
        })
        .eq('id', id);

      await addLog(id, 'info', `Comando de retomar enviado ao worker (conta: ${selectedAccount.email})`);

      return res.json({
        success: true,
        message: 'Comando de retomar enviado ao worker',
        commandId: result.commandId,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao retomar extração',
      });
    }
  });

  /**
   * GET /api/tec-scraper/cadernos/:id/progress
   * Retorna progresso em tempo real de um caderno (from database)
   */
  router.get('/cadernos/:id/progress', async (req: Request, res: Response) => {
    const { id } = req.params;

    try {
      const supabase = getSupabase();
      const { data: caderno, error } = await supabase
        .from('tec_cadernos')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !caderno) {
        return res.status(404).json({
          success: false,
          error: 'Caderno não encontrado',
        });
      }

      // Check if this caderno is currently running (via worker state)
      const workerState = await getWorkerState();
      const isCurrentlyRunning = workerState.currentCadernoId === id;

      return res.json({
        success: true,
        caderno,
        isCurrentlyRunning,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter progresso',
      });
    }
  });

  // ==================== LOGS ENDPOINTS ====================

  /**
   * GET /api/tec-scraper/logs
   * Lista todos os logs (com paginação e filtros)
   */
  router.get('/logs', async (req: Request, res: Response) => {
    const { caderno_id, log_type, limit = '100', offset = '0' } = req.query;

    try {
      const supabase = getSupabase();
      let query = supabase
        .from('tec_scraping_logs')
        .select('*, tec_cadernos(name)')
        .order('created_at', { ascending: false })
        .range(parseInt(offset as string), parseInt(offset as string) + parseInt(limit as string) - 1);

      if (caderno_id) {
        query = query.eq('caderno_id', caderno_id);
      }

      if (log_type) {
        query = query.eq('log_type', log_type);
      }

      const { data, error } = await query;

      if (error) throw error;

      return res.json({ success: true, logs: data || [] });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar logs',
      });
    }
  });

  /**
   * GET /api/tec-scraper/logs/:caderno_id
   * Lista logs de um caderno específico
   */
  router.get('/logs/:caderno_id', async (req: Request, res: Response) => {
    const { caderno_id } = req.params;
    const { limit = '50' } = req.query;

    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('tec_scraping_logs')
        .select('*')
        .eq('caderno_id', caderno_id)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit as string));

      if (error) throw error;

      return res.json({ success: true, logs: data || [] });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar logs do caderno',
      });
    }
  });

  /**
   * DELETE /api/tec-scraper/logs
   * Limpa logs antigos (mantém últimos 7 dias)
   */
  router.delete('/logs', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { error } = await supabase
        .from('tec_scraping_logs')
        .delete()
        .lt('created_at', sevenDaysAgo.toISOString());

      if (error) throw error;

      return res.json({ success: true, message: 'Logs antigos removidos' });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao limpar logs',
      });
    }
  });

  // ==================== QUEUE MANAGEMENT ====================

  /**
   * POST /api/tec-scraper/queue/process
   * Força o processamento da fila (sends command to worker)
   * Suporta scraping paralelo - processa um caderno por conta disponível
   */
  router.post('/queue/process', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();

      // Get available accounts (not busy)
      const availableAccounts = await getAvailableAccounts();

      if (availableAccounts.length === 0) {
        const runningCadernos = await getRunningCadernos();
        return res.status(409).json({
          success: false,
          error: 'Todas as contas estão ocupadas',
          runningCadernos: runningCadernos.map(c => c.name),
        });
      }

      // Get queued cadernos
      const queuedCadernos = await getQueuedCadernos(availableAccounts.length);

      if (queuedCadernos.length === 0) {
        return res.json({
          success: true,
          message: 'Nenhum caderno na fila',
        });
      }

      const started: Array<{ caderno: string; account: string }> = [];

      // Start one caderno per available account
      for (let i = 0; i < Math.min(queuedCadernos.length, availableAccounts.length); i++) {
        const caderno = queuedCadernos[i];
        const account = availableAccounts[i];

        const result = await sendCommand('start', caderno.id, account.id);

        if (result.success) {
          await supabase
            .from('tec_cadernos')
            .update({
              status: 'queued',
              account_id: account.id
            })
            .eq('id', caderno.id);

          started.push({ caderno: caderno.name, account: account.email });
        }
      }

      return res.json({
        success: true,
        message: `Iniciados ${started.length} cadernos`,
        started,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao processar fila',
      });
    }
  });

  /**
   * GET /api/tec-scraper/queue/status
   * Retorna status da fila (from database)
   */
  router.get('/queue/status', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { data: queued } = await supabase
        .from('tec_cadernos')
        .select('id')
        .eq('status', 'queued');

      const runningCaderno = await getRunningCaderno();
      const workerState = await getWorkerState();

      // Build progress from running caderno
      let progress = null;
      if (runningCaderno) {
        progress = {
          area: 'caderno',
          caderno: runningCaderno.name,
          questoesColetadas: runningCaderno.collected_questions,
          questoesTotal: runningCaderno.total_questions,
          status: runningCaderno.status,
          startedAt: runningCaderno.started_at,
          updatedAt: runningCaderno.updated_at,
        };
      }

      return res.json({
        success: true,
        queuedCount: queued?.length || 0,
        currentlyRunning: runningCaderno ? { id: runningCaderno.id, name: runningCaderno.name } : null,
        isProcessing: workerState.isRunning,
        progress,
        workerState,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao obter status da fila',
      });
    }
  });

  // ==================== SETTINGS ENDPOINTS ====================

  /**
   * GET /settings
   * Retorna as configurações do scraper
   */
  router.get('/settings', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const { data, error } = await supabase
        .from('tec_scraper_settings')
        .select('*')
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      // Se não existir configuração, criar uma padrão
      if (!data) {
        const { data: newSettings, error: insertError } = await supabase
          .from('tec_scraper_settings')
          .insert({})
          .select()
          .single();

        if (insertError) throw insertError;

        return res.json({
          success: true,
          settings: newSettings,
        });
      }

      return res.json({
        success: true,
        settings: data,
      });
    } catch (error) {
      console.error('[TecScraper] Erro ao buscar configurações:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao buscar configurações',
      });
    }
  });

  /**
   * PUT /settings
   * Atualiza as configurações do scraper
   */
  router.put('/settings', async (req: Request, res: Response) => {
    try {
      const supabase = getSupabase();
      const updates = req.body;

      // Remover campos que não devem ser atualizados
      delete updates.id;
      delete updates.created_at;
      delete updates.updated_at;

      // Buscar configuração existente
      const { data: existing } = await supabase
        .from('tec_scraper_settings')
        .select('id')
        .limit(1)
        .single();

      let result;
      if (existing) {
        // Atualizar configuração existente
        result = await supabase
          .from('tec_scraper_settings')
          .update(updates)
          .eq('id', existing.id)
          .select()
          .single();
      } else {
        // Criar nova configuração
        result = await supabase
          .from('tec_scraper_settings')
          .insert(updates)
          .select()
          .single();
      }

      if (result.error) throw result.error;

      await addLog(null, 'info', 'Configurações do scraper atualizadas', updates);

      return res.json({
        success: true,
        settings: result.data,
      });
    } catch (error) {
      console.error('[TecScraper] Erro ao atualizar configurações:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao atualizar configurações',
      });
    }
  });

  // ==================== TAXONOMY ENDPOINTS ====================

  /**
   * GET /api/tec-scraper/taxonomia/materias
   * Lista todas as matérias disponíveis no TecConcursos
   */
  router.get('/taxonomia/materias', async (req: Request, res: Response) => {
    try {
      if (TaxonomyScraper.isRunning()) {
        return res.status(409).json({
          success: false,
          error: 'Uma coleta de taxonomia já está em andamento',
        });
      }

      const result = await TaxonomyScraper.listarNomesMaterias();

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao listar matérias',
      });
    }
  });

  /**
   * GET /api/tec-scraper/taxonomia/materia/:slug
   * Coleta a taxonomia de uma matéria específica
   * Retorna estrutura hierárquica de assuntos em JSON e Markdown
   */
  router.get('/taxonomia/materia/:slug', async (req: Request, res: Response) => {
    const { slug } = req.params;

    try {
      if (TaxonomyScraper.isRunning()) {
        return res.status(409).json({
          success: false,
          error: 'Uma coleta de taxonomia já está em andamento',
        });
      }

      const result = await TaxonomyScraper.coletarTaxonomiaMateria(slug);

      return res.json(result);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao coletar taxonomia',
      });
    }
  });

  /**
   * GET /api/tec-scraper/taxonomia/materia/:slug/markdown
   * Coleta a taxonomia de uma matéria e retorna apenas o Markdown
   */
  router.get('/taxonomia/materia/:slug/markdown', async (req: Request, res: Response) => {
    const { slug } = req.params;

    try {
      if (TaxonomyScraper.isRunning()) {
        return res.status(409).json({
          success: false,
          error: 'Uma coleta de taxonomia já está em andamento',
        });
      }

      const result = await TaxonomyScraper.coletarTaxonomiaMateria(slug);

      if (!result.success) {
        return res.status(500).json(result);
      }

      // Retornar como texto/markdown
      res.setHeader('Content-Type', 'text/markdown; charset=utf-8');
      return res.send(result.markdown);
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao coletar taxonomia',
      });
    }
  });

  /**
   * POST /api/tec-scraper/taxonomia/completa
   * Coleta a taxonomia de TODAS as matérias (processo longo)
   * ATENÇÃO: Pode levar vários minutos
   */
  router.post('/taxonomia/completa', async (req: Request, res: Response) => {
    try {
      if (TaxonomyScraper.isRunning()) {
        return res.status(409).json({
          success: false,
          error: 'Uma coleta de taxonomia já está em andamento',
        });
      }

      // Iniciar coleta em background
      TaxonomyScraper.coletarTaxonomiaCompleta().then(result => {
        console.log(`[TaxonomyScraper] Coleta completa finalizada: ${result.success ? 'sucesso' : 'erro'}`);
        if (result.materias) {
          console.log(`[TaxonomyScraper] ${result.materias.length} matérias coletadas`);
        }
      }).catch(err => {
        console.error('[TaxonomyScraper] Erro na coleta completa:', err);
      });

      return res.json({
        success: true,
        message: 'Coleta de taxonomia completa iniciada em background',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao iniciar coleta',
      });
    }
  });

  /**
   * GET /api/tec-scraper/taxonomia/status
   * Verifica se uma coleta de taxonomia está em andamento
   */
  router.get('/taxonomia/status', async (req: Request, res: Response) => {
    return res.json({
      success: true,
      isRunning: TaxonomyScraper.isRunning(),
    });
  });

  /**
   * POST /api/tec-scraper/taxonomia/parar
   * Para a coleta de taxonomia em andamento
   */
  router.post('/taxonomia/parar', async (req: Request, res: Response) => {
    try {
      await TaxonomyScraper.parar();

      return res.json({
        success: true,
        message: 'Coleta de taxonomia parada',
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao parar coleta',
      });
    }
  });

  /**
   * POST /api/tec-scraper/taxonomia/materia/:slug/salvar
   * Coleta a taxonomia de uma matéria e salva no banco de dados
   */
  router.post('/taxonomia/materia/:slug/salvar', async (req: Request, res: Response) => {
    const { slug } = req.params;

    try {
      if (TaxonomyScraper.isRunning()) {
        return res.status(409).json({
          success: false,
          error: 'Uma coleta de taxonomia já está em andamento',
        });
      }

      // Coletar taxonomia
      const coletaResult = await TaxonomyScraper.coletarTaxonomiaMateria(slug);

      if (!coletaResult.success || !coletaResult.materia) {
        return res.status(500).json({
          success: false,
          error: coletaResult.error || 'Erro ao coletar taxonomia',
        });
      }

      // Salvar no banco
      const saveResult = await TaxonomyScraper.salvarTaxonomiaNoDb(coletaResult.materia);

      if (!saveResult.success) {
        return res.status(500).json({
          success: false,
          error: saveResult.error || 'Erro ao salvar no banco',
          materia: coletaResult.materia,
        });
      }

      return res.json({
        success: true,
        message: `Taxonomia de ${coletaResult.materia.nome} salva com sucesso`,
        materia: coletaResult.materia,
        assuntosCount: coletaResult.materia.assuntos.length,
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao salvar taxonomia',
      });
    }
  });

  /**
   * POST /api/tec-scraper/taxonomia/extract-from-html
   * Extrai taxonomia de HTML usando IA (Gemini)
   * Body: { html: string, materiaName: string, url?: string }
   *
   * Uso: A extensão do Chrome captura o HTML da página e envia para cá
   */
  router.post('/taxonomia/extract-from-html', async (req: Request, res: Response) => {
    const { html, materiaName, url } = req.body;

    if (!html) {
      return res.status(400).json({
        success: false,
        error: 'HTML não fornecido. Envie o campo "html" no body.',
      });
    }

    if (!materiaName) {
      return res.status(400).json({
        success: false,
        error: 'Nome da matéria não fornecido. Envie o campo "materiaName" no body.',
      });
    }

    try {
      console.log(`[TaxonomyAI] Processando HTML de ${materiaName} (${html.length} chars)`);

      // Limitar o tamanho do HTML para não exceder limites do modelo
      const maxHtmlLength = 100000; // ~100KB
      const truncatedHtml = html.length > maxHtmlLength
        ? html.substring(0, maxHtmlLength) + '\n<!-- HTML truncado -->'
        : html;

      const prompt = `Extraia a taxonomia de assuntos do seguinte HTML de uma página de matéria do TecConcursos.

Nome da matéria: ${materiaName}
${url ? `URL: ${url}` : ''}

HTML:
\`\`\`html
${truncatedHtml}
\`\`\`

Retorne APENAS o Markdown formatado com a estrutura hierárquica de assuntos, sem explicações adicionais.`;

      const response = await taxonomyExtractorAgent.generate(prompt);

      // Extrair o texto da resposta
      const markdown = typeof response.text === 'string'
        ? response.text
        : JSON.stringify(response.text);

      // Contar número de assuntos (linhas que começam com ## ou *)
      const assuntosCount = (markdown.match(/^(##|\*)/gm) || []).length;

      console.log(`[TaxonomyAI] Extração concluída: ${assuntosCount} assuntos encontrados`);

      return res.json({
        success: true,
        markdown,
        materiaName,
        url,
        assuntosCount,
      });
    } catch (error) {
      console.error('[TaxonomyAI] Erro ao extrair taxonomia:', error);
      return res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erro ao extrair taxonomia com IA',
      });
    }
  });

  return router;
}

export default createTecConcursosScraperRoutes;
