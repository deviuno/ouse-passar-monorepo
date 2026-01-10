/**
 * Serviço para monitoramento e gerenciamento de agentes Mastra
 *
 * IMPORTANTE: As tabelas de comentários, cadernos e contas estão no banco de questões,
 * não no banco principal. Por isso usamos a API do Mastra para acessar esses dados.
 */

// ============================================================================
// INTERFACES
// ============================================================================

export interface ComentarioFormatStats {
  total: number;
  pendente: number;
  processando: number;
  concluido: number;
  falha: number;
  ignorado: number;
}

export interface ComentarioFormatItem {
  id: string;
  questao_id: number;
  status: 'pendente' | 'processando' | 'concluido' | 'falha' | 'ignorado';
  erro: string | null;
  created_at: string;
  processed_at: string | null;
}

export interface ScraperCaderno {
  id: string;
  nome: string;
  url: string;
  status: 'queued' | 'running' | 'paused' | 'completed' | 'error';
  questoes_extraidas: number;
  total_questoes: number;
  created_at: string;
  updated_at: string;
}

export interface TecAccount {
  id: string;
  email: string;
  login_status: 'valid' | 'invalid' | 'unknown';
  last_used_at: string | null;
  is_busy: boolean;
}

export interface QuestaoDetalhes {
  id: number;
  enunciado: string;
  alternativas: { letter: string; text: string }[] | null;
  comentario: string | null;
  comentario_formatado: boolean; // Flag indicating if comment has been formatted
  materia: string | null;
  assunto: string | null;
  banca: string | null;
  ano: number | null;
  gabarito: string | null;
}

export interface ProcessarFilaResponse {
  success: boolean;
  sucesso?: number;
  falha?: number;
  message?: string;
  error?: string;
}

export interface PopularFilaResponse {
  success: boolean;
  adicionadas?: number;
  message?: string;
  error?: string;
}

// ============================================================================
// MASTRA API URL
// ============================================================================

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL
  ? import.meta.env.VITE_MASTRA_URL
  : 'http://localhost:4000';

// ============================================================================
// FORMATADOR DE COMENTÁRIOS
// ============================================================================

export const agentesService = {
  // --------------------------------------------------------------------------
  // Estatísticas do Formatador (via Mastra API)
  // --------------------------------------------------------------------------
  async getComentarioStats(): Promise<ComentarioFormatStats> {
    const response = await fetch(`${MASTRA_URL}/api/comentarios/fila-formatacao/status`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar estatísticas');
    }

    return {
      total: data.total || 0,
      pendente: data.pendente || 0,
      processando: data.processando || 0,
      concluido: data.concluido || 0,
      falha: data.falha || 0,
      ignorado: data.ignorado || 0,
    };
  },

  // --------------------------------------------------------------------------
  // Lista de itens na fila (via Mastra API) - com paginação
  // --------------------------------------------------------------------------
  async getComentarioQueue(
    status?: string,
    page: number = 1,
    limit: number = 50
  ): Promise<{ items: ComentarioFormatItem[]; total: number; page: number; totalPages: number }> {
    const params = new URLSearchParams();
    if (status && status !== 'all') params.append('status', status);
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    const response = await fetch(`${MASTRA_URL}/api/admin/comentarios/queue?${params}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar fila');
    }

    return {
      items: data.items || [],
      total: data.total || 0,
      page: data.page || page,
      totalPages: data.totalPages || 1,
    };
  },

  // --------------------------------------------------------------------------
  // Processar fila (via Mastra API)
  // --------------------------------------------------------------------------
  async processarFila(limite: number = 100): Promise<ProcessarFilaResponse> {
    const response = await fetch(`${MASTRA_URL}/api/comentarios/processar-fila-formatacao`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limite }),
    });

    return response.json();
  },

  // --------------------------------------------------------------------------
  // Popular fila (via Mastra API)
  // --------------------------------------------------------------------------
  async popularFila(
    limite: number = 1000,
    materiaFilter?: string,
    reprocessarFalhas: boolean = false
  ): Promise<PopularFilaResponse> {
    const response = await fetch(`${MASTRA_URL}/api/comentarios/fila-formatacao/popular`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limite, materiaFilter, reprocessarFalhas }),
    });

    return response.json();
  },

  // --------------------------------------------------------------------------
  // Resetar falhas (via Mastra API)
  // --------------------------------------------------------------------------
  async resetarFalhas(): Promise<{ success: boolean; resetadas?: number; error?: string }> {
    const response = await fetch(`${MASTRA_URL}/api/comentarios/fila-formatacao/resetar-falhas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    return response.json();
  },

  // ============================================================================
  // SCRAPER DE QUESTÕES (via Mastra API)
  // ============================================================================

  // --------------------------------------------------------------------------
  // Status dos cadernos
  // --------------------------------------------------------------------------
  async getScraperCadernos(): Promise<ScraperCaderno[]> {
    const response = await fetch(`${MASTRA_URL}/api/admin/scraper/cadernos`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar cadernos');
    }

    return data.cadernos || [];
  },

  // --------------------------------------------------------------------------
  // Contas TecConcursos
  // --------------------------------------------------------------------------
  async getTecAccounts(): Promise<TecAccount[]> {
    const response = await fetch(`${MASTRA_URL}/api/admin/scraper/accounts`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar contas');
    }

    return data.accounts || [];
  },

  // --------------------------------------------------------------------------
  // Stats do scraper (calculado a partir dos cadernos)
  // --------------------------------------------------------------------------
  async getScraperStats(): Promise<{ status: string; count: number }[]> {
    const cadernos = await this.getScraperCadernos();

    const counts: Record<string, number> = {};
    for (const caderno of cadernos) {
      counts[caderno.status] = (counts[caderno.status] || 0) + 1;
    }

    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },

  // --------------------------------------------------------------------------
  // Detalhes de uma questão específica (via Mastra API)
  // --------------------------------------------------------------------------
  async getQuestaoDetalhes(questaoId: number): Promise<QuestaoDetalhes> {
    const response = await fetch(`${MASTRA_URL}/api/admin/questao/${questaoId}`);
    const data = await response.json();

    if (!data.success) {
      throw new Error(data.error || 'Erro ao buscar questão');
    }

    return data.questao;
  },
};

export default agentesService;
