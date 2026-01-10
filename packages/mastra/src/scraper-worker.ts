/**
 * TecConcursos Scraper Worker
 *
 * Processo separado que executa o scraping de forma independente do servidor principal.
 * Comunicação via banco de dados (polling de comandos).
 *
 * Uso: node dist/scraper-worker.js
 * ou: tsx src/scraper-worker.ts
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Import the main scraper service to reuse its extraction logic
import TecConcursosScraper from './services/tecConcursosScraper.js';

// ==================== SETUP ====================

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const result = dotenv.config();
if (result.error || !process.env.VITE_SUPABASE_URL) {
  console.log('Loading .env from questoes package...');
  const questoesEnvPath = path.resolve(__dirname, '../../questoes/.env');
  dotenv.config({ path: questoesEnvPath });
}

// ==================== CONSTANTS ====================

// Account ID pode vir de argumento de linha de comando ou variável de ambiente
// Uso: node dist/scraper-worker.js --account=UUID
// Ou: SCRAPER_ACCOUNT_ID=UUID node dist/scraper-worker.js
const accountArg = process.argv.find(arg => arg.startsWith('--account='));
const ACCOUNT_ID = accountArg?.split('=')[1] || process.env.SCRAPER_ACCOUNT_ID || null;

const WORKER_ID = `worker-${process.pid}-${Date.now()}${ACCOUNT_ID ? `-${ACCOUNT_ID.slice(0, 8)}` : ''}`;
const POLL_INTERVAL = 2000; // 2 seconds
const HEARTBEAT_INTERVAL = 10000; // 10 seconds

// ==================== STATE ====================

let _supabase: SupabaseClient | null = null;
let _currentCadernoId: string | null = null;
let _shouldStop = false;
let _accountEmail: string | null = null;

// ==================== HELPERS ====================

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

function log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
  const prefix = '[ScraperWorker]';
  const timestamp = new Date().toISOString();
  const logMessage = `${prefix} [${timestamp}] ${message}`;

  switch (level) {
    case 'error':
      console.error(logMessage);
      break;
    case 'warn':
      console.warn(logMessage);
      break;
    default:
      console.log(logMessage);
  }
}

async function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
  } catch (error) {
    log(`Failed to add log: ${error}`, 'error');
  }
}

// ==================== WORKER STATE MANAGEMENT ====================

async function updateWorkerState(status: 'idle' | 'running' | 'paused', cadernoId: string | null = null): Promise<void> {
  const supabase = getSupabase();

  const { data: existing } = await supabase
    .from('tec_scraper_worker_state')
    .select('id')
    .eq('worker_id', WORKER_ID)
    .single();

  if (existing) {
    await supabase
      .from('tec_scraper_worker_state')
      .update({
        status,
        current_caderno_id: cadernoId,
        last_heartbeat: new Date().toISOString(),
        started_at: status === 'running' ? new Date().toISOString() : undefined,
      })
      .eq('worker_id', WORKER_ID);
  } else {
    await supabase.from('tec_scraper_worker_state').insert({
      worker_id: WORKER_ID,
      status,
      current_caderno_id: cadernoId,
      started_at: status === 'running' ? new Date().toISOString() : null,
    });
  }
}

async function sendHeartbeat(): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('tec_scraper_worker_state')
    .update({ last_heartbeat: new Date().toISOString() })
    .eq('worker_id', WORKER_ID);
}

// ==================== COMMAND PROCESSING ====================

interface Command {
  id: string;
  command: 'start' | 'stop' | 'pause' | 'resume';
  caderno_id: string | null;
  account_id: string | null;
  payload: any;
  status: string;
  created_at: string;
}

async function getNextCommand(): Promise<Command | null> {
  const supabase = getSupabase();

  let query = supabase
    .from('tec_scraper_commands')
    .select('*')
    .eq('status', 'pending');

  // Se este worker está atribuído a uma conta específica, filtrar por ela
  // Também pegar comandos sem account_id (compatibilidade)
  if (ACCOUNT_ID) {
    query = query.or(`account_id.eq.${ACCOUNT_ID},account_id.is.null`);
  }

  const { data, error } = await query
    .order('created_at', { ascending: true })
    .limit(1)
    .single();

  if (error || !data) {
    return null;
  }

  return data as Command;
}

async function markCommandProcessing(commandId: string): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('tec_scraper_commands')
    .update({ status: 'processing' })
    .eq('id', commandId);
}

async function markCommandCompleted(commandId: string): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('tec_scraper_commands')
    .update({
      status: 'completed',
      processed_at: new Date().toISOString()
    })
    .eq('id', commandId);
}

async function markCommandFailed(commandId: string, error: string): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('tec_scraper_commands')
    .update({
      status: 'failed',
      processed_at: new Date().toISOString(),
      payload: { error }
    })
    .eq('id', commandId);
}

// ==================== CADERNO PROCESSING ====================

interface CadernoRecord {
  id: string;
  name: string;
  url: string;
  total_questions: number;
  collected_questions: number;
  new_questions: number;
  status: string;
  current_page: number;
  started_at: string | null;
  completed_at: string | null;
  last_error: string | null;
  last_question_number: number | null;
  last_question_id: string | null;
}

async function getCaderno(cadernoId: string): Promise<CadernoRecord | null> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tec_cadernos')
    .select('*')
    .eq('id', cadernoId)
    .single();

  if (error || !data) {
    return null;
  }

  return data as CadernoRecord;
}

async function updateCadernoStatus(
  cadernoId: string,
  updates: Partial<CadernoRecord>
): Promise<void> {
  const supabase = getSupabase();
  await supabase
    .from('tec_cadernos')
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq('id', cadernoId);
}

async function checkForStopCommand(): Promise<boolean> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('tec_scraper_commands')
    .select('id, command')
    .eq('status', 'pending')
    .in('command', ['stop', 'pause'])
    .limit(1)
    .single();

  if (data) {
    await markCommandProcessing(data.id);
    await markCommandCompleted(data.id);
    return true;
  }

  return false;
}

// ==================== ACCOUNT FAILOVER ====================

/**
 * Verifica se o erro é relacionado a login/acesso
 */
function isLoginOrAccessError(errorMessage: string): boolean {
  const loginErrorPatterns = [
    'Acesso negado',
    'Não foi possível fazer login',
    'login',
    'permission',
    'sessão expirada',
    'cookies',
    'autenticação',
  ];
  const lowerMessage = errorMessage.toLowerCase();
  return loginErrorPatterns.some(pattern => lowerMessage.includes(pattern.toLowerCase()));
}

/**
 * Busca outra conta disponível para failover, excluindo a conta que falhou
 */
async function getAvailableAccountForFailover(excludeAccountId: string | null): Promise<{ id: string; email: string } | null> {
  const supabase = getSupabase();

  try {
    // Buscar todas as contas ativas
    const { data: accounts, error } = await supabase
      .from('tec_accounts')
      .select('id, email, cookies, login_status')
      .eq('is_active', true)
      .not('cookies', 'is', null);

    if (error || !accounts || accounts.length === 0) {
      log('No active accounts found for failover', 'warn');
      return null;
    }

    // Buscar cadernos em execução para saber quais contas estão ocupadas
    const { data: runningCadernos } = await supabase
      .from('tec_cadernos')
      .select('account_id')
      .eq('status', 'running');

    const busyAccountIds = new Set(
      (runningCadernos || [])
        .filter(c => c.account_id)
        .map(c => c.account_id)
    );

    // Filtrar contas disponíveis (não ocupadas e não a conta que falhou)
    const availableAccounts = accounts.filter(acc =>
      acc.id !== excludeAccountId &&
      !busyAccountIds.has(acc.id) &&
      acc.login_status === 'valid'
    );

    if (availableAccounts.length === 0) {
      log('No available accounts for failover (all busy or excluded)', 'warn');
      return null;
    }

    // Retornar a primeira conta disponível
    return { id: availableAccounts[0].id, email: availableAccounts[0].email };
  } catch (error) {
    log(`Error getting account for failover: ${error}`, 'error');
    return null;
  }
}

/**
 * Marca uma conta como tendo problemas de login
 */
async function markAccountLoginIssue(accountId: string): Promise<void> {
  const supabase = getSupabase();
  try {
    await supabase
      .from('tec_accounts')
      .update({
        login_status: 'invalid',
        last_login_check: new Date().toISOString()
      })
      .eq('id', accountId);
    log(`Account ${accountId.slice(0, 8)}... marked as having login issues`);
  } catch (error) {
    log(`Error marking account login issue: ${error}`, 'error');
  }
}

const MAX_FAILOVER_ATTEMPTS = 3;

async function processCaderno(cadernoId: string, commandAccountId?: string | null, failoverAttempt: number = 0): Promise<void> {
  _currentCadernoId = cadernoId;
  _shouldStop = false;

  // Check failover limit
  if (failoverAttempt >= MAX_FAILOVER_ATTEMPTS) {
    log(`Max failover attempts (${MAX_FAILOVER_ATTEMPTS}) reached, giving up`, 'error');
    await addLog(cadernoId, 'error', `Máximo de tentativas de failover (${MAX_FAILOVER_ATTEMPTS}) atingido. Atualize os cookies das contas.`);
    await updateCadernoStatus(cadernoId, {
      status: 'error',
      last_error: 'Máximo de tentativas de failover atingido',
    });
    return;
  }

  // Usar account_id do comando, do worker, ou null
  const effectiveAccountId = commandAccountId || ACCOUNT_ID || null;

  const caderno = await getCaderno(cadernoId);
  if (!caderno) {
    log(`Caderno ${cadernoId} not found`, 'error');
    return;
  }

  log(`Starting caderno: ${caderno.name}${effectiveAccountId ? ` [Account: ${effectiveAccountId.slice(0, 8)}...]` : ''}`);
  await addLog(cadernoId, 'info', `Iniciando extração: ${caderno.name}`);

  // Update status to running
  await updateCadernoStatus(cadernoId, {
    status: 'running',
    started_at: caderno.started_at || new Date().toISOString(),
    last_error: null,
  });
  await updateWorkerState('running', cadernoId);

  try {
    // Determinar posição de retomada
    const startFromQuestion = (caderno.last_question_number || 0) + 1;
    const isResuming = startFromQuestion > 1;

    if (isResuming) {
      log(`Resuming from question ${startFromQuestion} (last was ${caderno.last_question_number})`);
      await addLog(cadernoId, 'info', `Retomando da questão ${startFromQuestion}`);
    }

    log(`Calling TecConcursosScraper.extrairQuestoesDeCadernoUrl for: ${caderno.url}`);

    // Start a progress polling interval to update the database
    const progressInterval = setInterval(async () => {
      const progress = TecConcursosScraper.getScrapingProgress();
      if (progress && !_shouldStop) {
        await updateCadernoStatus(cadernoId, {
          total_questions: progress.questoesTotal || caderno.total_questions,
        });
      }

      // Check for stop command
      const stopCommand = await checkForStopCommand();
      if (stopCommand) {
        log('Stop command received, stopping scraper...');
        _shouldStop = true;
        await TecConcursosScraper.pararScraping();
      }
    }, 5000);

    const result = await TecConcursosScraper.extrairQuestoesDeCadernoUrl(caderno.url, {
      startFromQuestion,
      cadernoId,
      accountId: effectiveAccountId || undefined,
    });

    clearInterval(progressInterval);

    // Update final status
    if (result.success) {
      // Não atualizar collected_questions aqui pois já é atualizado em tempo real pela função
      await updateCadernoStatus(cadernoId, {
        status: _shouldStop ? 'paused' : 'completed',
        completed_at: _shouldStop ? null : new Date().toISOString(),
      });
      const totalColetadas = caderno.last_question_number || result.salvos;
      await addLog(cadernoId, 'success', `Extração ${_shouldStop ? 'pausada' : 'concluída'}! Novas: ${result.salvos}, Total: ${totalColetadas}`);
      log(`Extraction ${_shouldStop ? 'paused' : 'completed'}! New saved: ${result.salvos}, Total position: ${totalColetadas}, Errors: ${result.erros}`);
    } else {
      // Check if it's a login/access error and try failover
      const errorMsg = result.message || 'Unknown error';

      if (isLoginOrAccessError(errorMsg) && effectiveAccountId) {
        log(`Login/access error detected, attempting failover...`, 'warn');
        await addLog(cadernoId, 'warning', `Erro de login/acesso com conta atual, tentando failover...`);

        // Mark current account as having issues
        await markAccountLoginIssue(effectiveAccountId);

        // Close current browser
        await TecConcursosScraper.closeBrowser();

        // Try to get another account
        const newAccount = await getAvailableAccountForFailover(effectiveAccountId);

        if (newAccount) {
          log(`Failover: switching to account ${newAccount.email}`, 'info');
          await addLog(cadernoId, 'info', `Failover: trocando para conta ${newAccount.email}`);

          // Update caderno with new account
          const supabase = getSupabase();
          await supabase
            .from('tec_cadernos')
            .update({
              account_id: newAccount.id,
              last_error: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', cadernoId);

          // Retry with new account (recursive call with incremented failover count)
          _currentCadernoId = null;
          await updateWorkerState('idle', null);
          await processCaderno(cadernoId, newAccount.id, failoverAttempt + 1);
          return; // Exit current execution
        } else {
          log(`No available account for failover`, 'error');
          await addLog(cadernoId, 'error', `Nenhuma conta disponível para failover. Todas as contas precisam ter cookies atualizados.`);
        }
      }

      // If no failover possible or not a login error, mark as error
      await updateCadernoStatus(cadernoId, {
        status: 'error',
        last_error: errorMsg,
      });
      await addLog(cadernoId, 'error', `Erro na extração: ${errorMsg}`);
      log(`Extraction failed: ${errorMsg}`, 'error');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Fatal error processing caderno: ${errorMessage}`, 'error');

    // Also try failover for fatal errors that look like login issues
    if (isLoginOrAccessError(errorMessage) && effectiveAccountId) {
      log(`Fatal login/access error, attempting failover...`, 'warn');
      await markAccountLoginIssue(effectiveAccountId);
      await TecConcursosScraper.closeBrowser();

      const newAccount = await getAvailableAccountForFailover(effectiveAccountId);
      if (newAccount) {
        await addLog(cadernoId, 'info', `Failover após erro fatal: trocando para conta ${newAccount.email}`);
        const supabase = getSupabase();
        await supabase
          .from('tec_cadernos')
          .update({ account_id: newAccount.id, last_error: null })
          .eq('id', cadernoId);

        _currentCadernoId = null;
        await updateWorkerState('idle', null);
        await processCaderno(cadernoId, newAccount.id, failoverAttempt + 1);
        return;
      }
    }

    await updateCadernoStatus(cadernoId, {
      status: 'error',
      last_error: errorMessage,
    });
    await addLog(cadernoId, 'error', `Erro fatal: ${errorMessage}`);
  } finally {
    _currentCadernoId = null;
    await updateWorkerState('idle', null);
    // Close browser after extraction
    await TecConcursosScraper.closeBrowser();
  }
}

// ==================== MAIN LOOP ====================

async function processCommand(command: Command): Promise<void> {
  log(`Processing command: ${command.command} (caderno: ${command.caderno_id || 'none'}, account: ${command.account_id?.slice(0, 8) || 'any'})`);

  await markCommandProcessing(command.id);

  try {
    switch (command.command) {
      case 'start':
      case 'resume':
        if (!command.caderno_id) {
          throw new Error('caderno_id is required for start/resume command');
        }
        await processCaderno(command.caderno_id, command.account_id);
        break;

      case 'stop':
      case 'pause':
        _shouldStop = true;
        if (_currentCadernoId) {
          await TecConcursosScraper.pararScraping();
          await updateCadernoStatus(_currentCadernoId, { status: 'paused' });
        }
        break;

      default:
        log(`Unknown command: ${command.command}`, 'warn');
    }

    await markCommandCompleted(command.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Command failed: ${errorMessage}`, 'error');
    await markCommandFailed(command.id, errorMessage);
  }
}

async function mainLoop(): Promise<void> {
  // Buscar email da conta se tiver account_id
  if (ACCOUNT_ID) {
    const supabase = getSupabase();
    const { data } = await supabase
      .from('tec_accounts')
      .select('email')
      .eq('id', ACCOUNT_ID)
      .single();
    _accountEmail = data?.email || null;
  }

  log(`Worker started: ${WORKER_ID}`);
  if (ACCOUNT_ID) {
    log(`Assigned to account: ${_accountEmail || ACCOUNT_ID}`);
  } else {
    log('No specific account assigned - will process any command');
  }
  await updateWorkerState('idle', null);

  // Heartbeat interval
  const heartbeatTimer = setInterval(sendHeartbeat, HEARTBEAT_INTERVAL);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    log('Received SIGINT, shutting down...');
    clearInterval(heartbeatTimer);
    _shouldStop = true;
    await TecConcursosScraper.pararScraping();
    await TecConcursosScraper.closeBrowser();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log('Received SIGTERM, shutting down...');
    clearInterval(heartbeatTimer);
    _shouldStop = true;
    await TecConcursosScraper.pararScraping();
    await TecConcursosScraper.closeBrowser();
    process.exit(0);
  });

  // Main polling loop
  while (true) {
    try {
      const command = await getNextCommand();

      if (command) {
        await processCommand(command);
      }
    } catch (error) {
      log(`Error in main loop: ${error}`, 'error');
    }

    await delay(POLL_INTERVAL);
  }
}

// Start the worker
mainLoop().catch(error => {
  log(`Fatal error: ${error}`, 'error');
  process.exit(1);
});
