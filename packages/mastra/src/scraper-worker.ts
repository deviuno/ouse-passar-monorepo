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

const WORKER_ID = `worker-${process.pid}-${Date.now()}`;
const POLL_INTERVAL = 2000; // 2 seconds
const HEARTBEAT_INTERVAL = 10000; // 10 seconds

// ==================== STATE ====================

let _supabase: SupabaseClient | null = null;
let _currentCadernoId: string | null = null;
let _shouldStop = false;

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
  payload: any;
  status: string;
  created_at: string;
}

async function getNextCommand(): Promise<Command | null> {
  const supabase = getSupabase();

  const { data, error } = await supabase
    .from('tec_scraper_commands')
    .select('*')
    .eq('status', 'pending')
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

async function processCaderno(cadernoId: string): Promise<void> {
  _currentCadernoId = cadernoId;
  _shouldStop = false;

  const caderno = await getCaderno(cadernoId);
  if (!caderno) {
    log(`Caderno ${cadernoId} not found`, 'error');
    return;
  }

  log(`Starting caderno: ${caderno.name}`);
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
      await updateCadernoStatus(cadernoId, {
        status: 'error',
        last_error: result.message,
      });
      await addLog(cadernoId, 'error', `Erro na extração: ${result.message}`);
      log(`Extraction failed: ${result.message}`, 'error');
    }

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    log(`Fatal error processing caderno: ${errorMessage}`, 'error');
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
  log(`Processing command: ${command.command} (caderno: ${command.caderno_id || 'none'})`);

  await markCommandProcessing(command.id);

  try {
    switch (command.command) {
      case 'start':
      case 'resume':
        if (!command.caderno_id) {
          throw new Error('caderno_id is required for start/resume command');
        }
        await processCaderno(command.caderno_id);
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
  log(`Worker started: ${WORKER_ID}`);
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
