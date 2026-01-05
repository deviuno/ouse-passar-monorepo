/**
 * TecConcursos Scraper Service
 * Frontend service para gerenciar o scraper do TecConcursos
 */

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL
  ? import.meta.env.VITE_MASTRA_URL
  : 'http://localhost:4000';

// ==================== TYPES ====================

export interface TecAccount {
  id: string;
  email: string;
  password?: string | null;
  cookies?: { present: boolean } | null;
  is_active: boolean;
  last_login_check?: string | null;
  login_status: 'valid' | 'invalid' | 'expired' | 'unknown';
  created_at: string;
  updated_at: string;
}

export interface TecCaderno {
  id: string;
  name: string;
  url: string;
  total_questions: number;
  collected_questions: number;
  new_questions: number;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'error';
  priority: number;
  started_at?: string | null;
  completed_at?: string | null;
  last_error?: string | null;
  current_page: number;
  created_at: string;
  updated_at: string;
}

export interface TecScrapingLog {
  id: string;
  caderno_id?: string | null;
  log_type: 'info' | 'warning' | 'error' | 'success';
  message: string;
  details?: any;
  created_at: string;
  tec_cadernos?: { name: string } | null;
}

export interface ScrapingProgress {
  area: string;
  caderno: string;
  questoesColetadas: number;
  questoesTotal: number;
  status: 'running' | 'completed' | 'error' | 'paused';
  lastError?: string;
  startedAt: string;
  updatedAt: string;
}

export interface QueueStatus {
  queuedCount: number;
  currentlyRunning: { id: string; name: string } | null;
  isProcessing: boolean;
  progress: ScrapingProgress | null;
}

export interface TecScraperSettings {
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

// ==================== HELPER ====================

async function apiRequest<T>(
  endpoint: string,
  options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const response = await fetch(`${MASTRA_URL}/api/tec-scraper${endpoint}`, {
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
      ...options,
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        error: result.error || `HTTP ${response.status}`,
      };
    }

    return {
      success: result.success,
      data: result,
      error: result.error,
    };
  } catch (error) {
    console.error('[TecScraperService] Error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Erro de conexão',
    };
  }
}

// ==================== STATUS ====================

export async function getScraperStatus(): Promise<{
  isRunning: boolean;
  progress: ScrapingProgress | null;
}> {
  const result = await apiRequest<{ isRunning: boolean; progress: ScrapingProgress | null }>('/status');
  return result.data || { isRunning: false, progress: null };
}

// ==================== ACCOUNTS ====================

export async function getAccounts(): Promise<TecAccount[]> {
  const result = await apiRequest<{ accounts: TecAccount[] }>('/accounts');
  return result.data?.accounts || [];
}

export async function createAccount(data: {
  email: string;
  password?: string;
  cookies?: string;
}): Promise<{ success: boolean; account?: TecAccount; error?: string }> {
  const result = await apiRequest<{ account: TecAccount }>('/accounts', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return {
    success: result.success,
    account: result.data?.account,
    error: result.error,
  };
}

export async function updateAccount(
  id: string,
  data: {
    email?: string;
    password?: string;
    cookies?: string;
    is_active?: boolean;
  }
): Promise<{ success: boolean; account?: TecAccount; error?: string }> {
  const result = await apiRequest<{ account: TecAccount }>(`/accounts/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return {
    success: result.success,
    account: result.data?.account,
    error: result.error,
  };
}

export async function deleteAccount(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await apiRequest(`/accounts/${id}`, { method: 'DELETE' });
  return { success: result.success, error: result.error };
}

export async function testAccountLogin(id: string): Promise<{
  success: boolean;
  loginValid?: boolean;
  message?: string;
  error?: string;
}> {
  const result = await apiRequest<{ loginValid: boolean; message: string }>(
    `/accounts/${id}/test-login`,
    { method: 'POST' }
  );
  return {
    success: result.success,
    loginValid: result.data?.loginValid,
    message: result.data?.message,
    error: result.error,
  };
}

export async function importAccountCookies(
  id: string,
  cookies: string
): Promise<{
  success: boolean;
  loginValid?: boolean;
  message?: string;
  error?: string;
}> {
  const result = await apiRequest<{ loginValid: boolean; message: string }>(
    `/accounts/${id}/import-cookies`,
    {
      method: 'POST',
      body: JSON.stringify({ cookies }),
    }
  );
  return {
    success: result.success,
    loginValid: result.data?.loginValid,
    message: result.data?.message,
    error: result.error,
  };
}

export async function activateAccount(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await apiRequest(`/accounts/${id}/activate`, { method: 'POST' });
  return { success: result.success, error: result.error };
}

// ==================== CADERNOS ====================

export async function getCadernos(): Promise<TecCaderno[]> {
  const result = await apiRequest<{ cadernos: TecCaderno[] }>('/cadernos');
  return result.data?.cadernos || [];
}

export async function createCaderno(data: {
  name: string;
  url: string;
  priority?: number;
}): Promise<{ success: boolean; caderno?: TecCaderno; error?: string }> {
  const result = await apiRequest<{ caderno: TecCaderno }>('/cadernos', {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return {
    success: result.success,
    caderno: result.data?.caderno,
    error: result.error,
  };
}

export async function deleteCaderno(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await apiRequest(`/cadernos/${id}`, { method: 'DELETE' });
  return { success: result.success, error: result.error };
}

export async function startCaderno(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await apiRequest(`/cadernos/${id}/start`, { method: 'POST' });
  return { success: result.success, error: result.error };
}

export async function pauseCaderno(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await apiRequest(`/cadernos/${id}/pause`, { method: 'POST' });
  return { success: result.success, error: result.error };
}

export async function resumeCaderno(id: string): Promise<{ success: boolean; error?: string }> {
  const result = await apiRequest(`/cadernos/${id}/resume`, { method: 'POST' });
  return { success: result.success, error: result.error };
}

export async function getCadernoProgress(id: string): Promise<{
  caderno: TecCaderno | null;
  isCurrentlyRunning: boolean;
}> {
  const result = await apiRequest<{
    caderno: TecCaderno;
    isCurrentlyRunning: boolean;
  }>(`/cadernos/${id}/progress`);
  return {
    caderno: result.data?.caderno || null,
    isCurrentlyRunning: result.data?.isCurrentlyRunning || false,
  };
}

// ==================== LOGS ====================

export async function getLogs(options?: {
  caderno_id?: string;
  log_type?: 'info' | 'warning' | 'error' | 'success';
  limit?: number;
  offset?: number;
}): Promise<TecScrapingLog[]> {
  const params = new URLSearchParams();
  if (options?.caderno_id) params.set('caderno_id', options.caderno_id);
  if (options?.log_type) params.set('log_type', options.log_type);
  if (options?.limit) params.set('limit', String(options.limit));
  if (options?.offset) params.set('offset', String(options.offset));

  const queryString = params.toString();
  const endpoint = queryString ? `/logs?${queryString}` : '/logs';

  const result = await apiRequest<{ logs: TecScrapingLog[] }>(endpoint);
  return result.data?.logs || [];
}

export async function getCadernoLogs(
  cadernoId: string,
  limit?: number
): Promise<TecScrapingLog[]> {
  const endpoint = limit
    ? `/logs/${cadernoId}?limit=${limit}`
    : `/logs/${cadernoId}`;
  const result = await apiRequest<{ logs: TecScrapingLog[] }>(endpoint);
  return result.data?.logs || [];
}

export async function clearOldLogs(): Promise<{ success: boolean; error?: string }> {
  const result = await apiRequest('/logs', { method: 'DELETE' });
  return { success: result.success, error: result.error };
}

// ==================== QUEUE ====================

export async function processQueue(): Promise<{ success: boolean; error?: string }> {
  const result = await apiRequest('/queue/process', { method: 'POST' });
  return { success: result.success, error: result.error };
}

export async function getQueueStatus(): Promise<QueueStatus> {
  const result = await apiRequest<QueueStatus>('/queue/status');
  return (
    result.data || {
      queuedCount: 0,
      currentlyRunning: null,
      isProcessing: false,
      progress: null,
    }
  );
}

// ==================== SETTINGS ====================

export async function getScraperSettings(): Promise<TecScraperSettings | null> {
  const result = await apiRequest<{ settings: TecScraperSettings }>('/settings');
  return result.data?.settings || null;
}

export async function updateScraperSettings(
  settings: Partial<TecScraperSettings>
): Promise<{ success: boolean; settings?: TecScraperSettings; error?: string }> {
  const result = await apiRequest<{ settings: TecScraperSettings }>('/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
  return {
    success: result.success,
    settings: result.data?.settings,
    error: result.error,
  };
}

// ==================== LEGACY ENDPOINTS ====================

export async function stopScraping(): Promise<{ success: boolean; error?: string }> {
  const result = await apiRequest('/stop', { method: 'POST' });
  return { success: result.success, error: result.error };
}

export async function importCookies(cookies: string): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  const result = await apiRequest<{ message: string }>('/cookies/import', {
    method: 'POST',
    body: JSON.stringify({ cookies }),
  });
  return {
    success: result.success,
    message: result.data?.message,
    error: result.error,
  };
}

export async function checkCookies(): Promise<{
  isLoggedIn: boolean;
  message?: string;
}> {
  const result = await apiRequest<{ isLoggedIn: boolean; message: string }>('/cookies/check');
  return {
    isLoggedIn: result.data?.isLoggedIn || false,
    message: result.data?.message,
  };
}

// ==================== HELPERS ====================

export function getStatusColor(status: TecCaderno['status']): string {
  switch (status) {
    case 'completed':
      return 'text-green-400';
    case 'running':
      return 'text-yellow-400';
    case 'error':
      return 'text-red-400';
    case 'paused':
      return 'text-orange-400';
    case 'queued':
    default:
      return 'text-gray-400';
  }
}

export function getStatusBgColor(status: TecCaderno['status']): string {
  switch (status) {
    case 'completed':
      return 'bg-green-500/20';
    case 'running':
      return 'bg-yellow-500/20';
    case 'error':
      return 'bg-red-500/20';
    case 'paused':
      return 'bg-orange-500/20';
    case 'queued':
    default:
      return 'bg-gray-500/20';
  }
}

export function getStatusLabel(status: TecCaderno['status']): string {
  switch (status) {
    case 'completed':
      return 'Concluído';
    case 'running':
      return 'Em execução';
    case 'error':
      return 'Erro';
    case 'paused':
      return 'Pausado';
    case 'queued':
      return 'Na fila';
    default:
      return status;
  }
}

export function getLoginStatusColor(status: TecAccount['login_status']): string {
  switch (status) {
    case 'valid':
      return 'text-green-400';
    case 'invalid':
    case 'expired':
      return 'text-red-400';
    case 'unknown':
    default:
      return 'text-yellow-400';
  }
}

export function getLoginStatusLabel(status: TecAccount['login_status']): string {
  switch (status) {
    case 'valid':
      return 'Válido';
    case 'invalid':
      return 'Inválido';
    case 'expired':
      return 'Expirado';
    case 'unknown':
    default:
      return 'Não verificado';
  }
}

export function getLogTypeColor(type: TecScrapingLog['log_type']): string {
  switch (type) {
    case 'success':
      return 'text-green-400';
    case 'error':
      return 'text-red-400';
    case 'warning':
      return 'text-yellow-400';
    case 'info':
    default:
      return 'text-blue-400';
  }
}

export function formatProgress(collected: number, total: number): string {
  if (total === 0) return '0%';
  const percent = (collected / total) * 100;
  return `${percent.toFixed(1)}%`;
}

export function formatNumber(num: number): string {
  return num.toLocaleString('pt-BR');
}

export function formatDateTime(isoString: string | null | undefined): string {
  if (!isoString) return '-';
  return new Date(isoString).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function calculateElapsedTime(startedAt: string | null | undefined): string {
  if (!startedAt) return '-';

  const start = new Date(startedAt).getTime();
  const now = Date.now();
  const elapsed = now - start;

  const hours = Math.floor(elapsed / (1000 * 60 * 60));
  const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes}min`;
}
