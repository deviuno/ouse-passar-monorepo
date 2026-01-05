/**
 * TecConcursos Parallel Scraper Worker
 *
 * Worker que gerencia scraping paralelo com múltiplas contas automaticamente.
 * Cada conta tem seu próprio browser e processa cadernos independentemente.
 *
 * Uso: tsx src/parallel-worker.ts
 * ou: node dist/parallel-worker.js
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Import the main scraper service
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

const POLL_INTERVAL = 3000; // 3 seconds
const HEARTBEAT_INTERVAL = 10000; // 10 seconds

// ==================== STATE ====================

let _supabase: SupabaseClient | null = null;

interface AccountWorker {
  accountId: string;
  email: string;
  isProcessing: boolean;
  currentCadernoId: string | null;
  currentCadernoName: string | null;
  lastActivity: Date;
}

// Map of accountId -> worker state
const _workers: Map<string, AccountWorker> = new Map();

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

function log(message: string, level: 'info' | 'warn' | 'error' = 'info', accountId?: string): void {
  const prefix = accountId ? `[Worker:${accountId.slice(0, 8)}]` : '[ParallelWorker]';
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

// ==================== ACCOUNT MANAGEMENT ====================

interface TecAccount {
  id: string;
  email: string;
  is_active: boolean;
  login_status: string;
}

async function getValidAccounts(): Promise<TecAccount[]> {
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from('tec_accounts')
    .select('id, email, is_active, login_status')
    .eq('is_active', true)
    .eq('login_status', 'valid');

  if (error || !data) {
    return [];
  }

  return data as TecAccount[];
}

// ==================== COMMAND PROCESSING ====================

interface Command {
  id: string;
  command: 'start' | 'stop' | 'pause' | 'resume';
  caderno_id: string | null;
  account_id: string | null;
  payload: {
    startQuestion?: number;
    endQuestion?: number;
    parallelMode?: boolean;
  } | null;
  status: string;
  created_at: string;
}

async function getNextCommandForAccount(accountId: string): Promise<Command | null> {
  const supabase = getSupabase();

  // Buscar comandos pendentes para esta conta específica
  const { data, error } = await supabase
    .from('tec_scraper_commands')
    .select('*')
    .eq('status', 'pending')
    .eq('account_id', accountId)
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
  account_id: string | null;
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

async function checkForStopCommandForAccount(accountId: string): Promise<boolean> {
  const supabase = getSupabase();

  const { data } = await supabase
    .from('tec_scraper_commands')
    .select('id, command')
    .eq('status', 'pending')
    .eq('account_id', accountId)
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

// ==================== WORKER LOOP FOR SINGLE ACCOUNT ====================

async function processCadernoForAccount(
  accountId: string,
  cadernoId: string,
  worker: AccountWorker,
  payload?: Command['payload']
): Promise<void> {
  const caderno = await getCaderno(cadernoId);
  if (!caderno) {
    log(`Caderno ${cadernoId} not found`, 'error', accountId);
    return;
  }

  // Get range from payload (for parallel mode) or use default
  const isParallelMode = payload?.parallelMode === true;
  const startQuestion = payload?.startQuestion || (caderno.last_question_number || 0) + 1;
  const endQuestion = payload?.endQuestion || caderno.total_questions;

  worker.currentCadernoId = cadernoId;
  worker.currentCadernoName = isParallelMode
    ? `${caderno.name} [${startQuestion}-${endQuestion}]`
    : caderno.name;
  worker.isProcessing = true;
  worker.lastActivity = new Date();

  if (isParallelMode) {
    log(`Iniciando caderno: ${caderno.name} (questões ${startQuestion}-${endQuestion})`, 'info', accountId);
    await addLog(cadernoId, 'info', `[${worker.email}] Processando questões ${startQuestion}-${endQuestion}`);
  } else {
    log(`Iniciando caderno: ${caderno.name}`, 'info', accountId);
    await addLog(cadernoId, 'info', `Iniciando extração: ${caderno.name} [Conta: ${worker.email}]`);
  }

  // In parallel mode, don't update the main caderno status (it's shared)
  if (!isParallelMode) {
    await updateCadernoStatus(cadernoId, {
      status: 'running',
      started_at: caderno.started_at || new Date().toISOString(),
      last_error: null,
      account_id: accountId,
    });
  }

  let shouldStop = false;

  try {
    const isResuming = startQuestion > 1 && !isParallelMode;

    if (isResuming) {
      log(`Retomando da questão ${startQuestion}`, 'info', accountId);
      await addLog(cadernoId, 'info', `Retomando da questão ${startQuestion}`);
    }

    // Progress check interval
    const progressInterval = setInterval(async () => {
      worker.lastActivity = new Date();

      // Check for stop command
      const stopCommand = await checkForStopCommandForAccount(accountId);
      if (stopCommand) {
        log('Comando de parar recebido', 'info', accountId);
        shouldStop = true;
        await TecConcursosScraper.pararScraping();
      }
    }, 5000);

    const result = await TecConcursosScraper.extrairQuestoesDeCadernoUrl(caderno.url, {
      startFromQuestion: startQuestion,
      endAtQuestion: endQuestion,
      cadernoId,
      accountId,
    });

    clearInterval(progressInterval);

    // Update final status
    if (result.success) {
      if (isParallelMode) {
        // In parallel mode, just log completion of this range
        await addLog(cadernoId, 'success', `[${worker.email}] Concluído range ${startQuestion}-${endQuestion}! Novas: ${result.salvos}`);
        log(`Range ${startQuestion}-${endQuestion} concluído! Novas: ${result.salvos}`, 'info', accountId);
      } else {
        await updateCadernoStatus(cadernoId, {
          status: shouldStop ? 'paused' : 'completed',
          completed_at: shouldStop ? null : new Date().toISOString(),
        });
        const totalColetadas = caderno.last_question_number || result.salvos;
        await addLog(cadernoId, 'success', `Extração ${shouldStop ? 'pausada' : 'concluída'}! Novas: ${result.salvos}, Total: ${totalColetadas}`);
        log(`Extração ${shouldStop ? 'pausada' : 'concluída'}! Novas: ${result.salvos}`, 'info', accountId);
      }
    } else {
      if (!isParallelMode) {
        await updateCadernoStatus(cadernoId, {
          status: 'error',
          last_error: result.message,
        });
      }
      await addLog(cadernoId, 'error', `[${worker.email}] Erro: ${result.message}`);
      log(`Erro: ${result.message}`, 'error', accountId);
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Erro fatal: ${errorMessage}`, 'error', accountId);
    if (!isParallelMode) {
      await updateCadernoStatus(cadernoId, {
        status: 'error',
        last_error: errorMessage,
      });
    }
    await addLog(cadernoId, 'error', `[${worker.email}] Erro fatal: ${errorMessage}`);
  } finally {
    worker.currentCadernoId = null;
    worker.currentCadernoName = null;
    worker.isProcessing = false;
    worker.lastActivity = new Date();

    // Close browser for this account
    await TecConcursosScraper.closeBrowser(accountId);
  }
}

async function processCommandForAccount(command: Command, worker: AccountWorker): Promise<void> {
  const accountId = worker.accountId;
  const isParallel = command.payload?.parallelMode === true;
  const rangeInfo = isParallel ? ` [range: ${command.payload?.startQuestion}-${command.payload?.endQuestion}]` : '';
  log(`Processando comando: ${command.command} (caderno: ${command.caderno_id || 'none'})${rangeInfo}`, 'info', accountId);

  await markCommandProcessing(command.id);

  try {
    switch (command.command) {
      case 'start':
      case 'resume':
        if (!command.caderno_id) {
          throw new Error('caderno_id is required for start/resume command');
        }
        await processCadernoForAccount(accountId, command.caderno_id, worker, command.payload);
        break;

      case 'stop':
      case 'pause':
        if (worker.currentCadernoId) {
          await TecConcursosScraper.pararScraping();
          await updateCadernoStatus(worker.currentCadernoId, { status: 'paused' });
        }
        break;

      default:
        log(`Comando desconhecido: ${command.command}`, 'warn', accountId);
    }

    await markCommandCompleted(command.id);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Comando falhou: ${errorMessage}`, 'error', accountId);
    await markCommandFailed(command.id, errorMessage);
  }
}

async function accountWorkerLoop(worker: AccountWorker): Promise<void> {
  const accountId = worker.accountId;

  while (true) {
    try {
      // Don't poll if already processing
      if (!worker.isProcessing) {
        const command = await getNextCommandForAccount(accountId);

        if (command) {
          await processCommandForAccount(command, worker);
        }
      }
    } catch (error) {
      log(`Erro no loop: ${error}`, 'error', accountId);
    }

    await delay(POLL_INTERVAL);
  }
}

// ==================== MAIN ====================

async function printStatus(): Promise<void> {
  const activeWorkers = Array.from(_workers.values()).filter(w => w.isProcessing);
  const idleWorkers = Array.from(_workers.values()).filter(w => !w.isProcessing);

  if (activeWorkers.length > 0) {
    log(`--- Status: ${activeWorkers.length} processando, ${idleWorkers.length} disponíveis ---`);
    for (const w of activeWorkers) {
      log(`  🔄 ${w.email}: ${w.currentCadernoName}`);
    }
  }
}

async function main(): Promise<void> {
  log('='.repeat(60));
  log('TecConcursos Parallel Scraper Worker');
  log('='.repeat(60));

  // Get valid accounts
  const accounts = await getValidAccounts();

  if (accounts.length === 0) {
    log('Nenhuma conta válida encontrada! Configure cookies válidos nas contas.', 'error');
    process.exit(1);
  }

  log(`Encontradas ${accounts.length} contas válidas:`);
  for (const acc of accounts) {
    log(`  ✓ ${acc.email}`);
  }

  // Initialize workers for each account
  for (const account of accounts) {
    const worker: AccountWorker = {
      accountId: account.id,
      email: account.email,
      isProcessing: false,
      currentCadernoId: null,
      currentCadernoName: null,
      lastActivity: new Date(),
    };
    _workers.set(account.id, worker);
  }

  log('='.repeat(60));
  log(`Iniciando ${_workers.size} workers paralelos...`);
  log('='.repeat(60));

  // Start worker loops for each account with staggered delays to avoid rate limiting
  const STAGGER_DELAY_MS = 15000; // 15 segundos entre cada worker
  const workersArray = Array.from(_workers.values());

  const workerPromises = workersArray.map((worker, index) => {
    const startDelay = index * STAGGER_DELAY_MS;
    log(`Worker para ${worker.email} iniciará em ${startDelay/1000}s`, 'info', worker.accountId);

    // Start each worker with a staggered delay
    return new Promise<void>(async (resolve) => {
      await delay(startDelay);
      log(`Worker iniciado para: ${worker.email}`, 'info', worker.accountId);
      await accountWorkerLoop(worker);
      resolve();
    });
  });

  // Status printer interval
  setInterval(printStatus, 30000);

  // Graceful shutdown
  process.on('SIGINT', async () => {
    log('Recebido SIGINT, encerrando...');
    await TecConcursosScraper.closeAllBrowsers();
    process.exit(0);
  });

  process.on('SIGTERM', async () => {
    log('Recebido SIGTERM, encerrando...');
    await TecConcursosScraper.closeAllBrowsers();
    process.exit(0);
  });

  // Wait for all workers (they run forever)
  await Promise.all(workerPromises);
}

// Start
main().catch(error => {
  log(`Erro fatal: ${error}`, 'error');
  process.exit(1);
});
