/**
 * Serviço para monitoramento e gerenciamento de agentes Mastra
 */

import { supabase } from '../lib/supabase';

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

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'https://mastra.ouspassar.com.br';

// ============================================================================
// FORMATADOR DE COMENTÁRIOS
// ============================================================================

export const agentesService = {
  // --------------------------------------------------------------------------
  // Estatísticas do Formatador
  // --------------------------------------------------------------------------
  async getComentarioStats(): Promise<ComentarioFormatStats> {
    const { data, error } = await supabase
      .from('comentarios_pendentes_formatacao')
      .select('status');

    if (error) throw error;

    const stats: ComentarioFormatStats = {
      total: data?.length || 0,
      pendente: 0,
      processando: 0,
      concluido: 0,
      falha: 0,
      ignorado: 0,
    };

    for (const item of data || []) {
      const status = item.status as keyof Omit<ComentarioFormatStats, 'total'>;
      if (status in stats) {
        stats[status]++;
      }
    }

    return stats;
  },

  // --------------------------------------------------------------------------
  // Lista de itens na fila
  // --------------------------------------------------------------------------
  async getComentarioQueue(
    status?: string,
    limit: number = 50
  ): Promise<ComentarioFormatItem[]> {
    let query = supabase
      .from('comentarios_pendentes_formatacao')
      .select('*')
      .order('processed_at', { ascending: false, nullsFirst: false })
      .limit(limit);

    if (status && status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  // --------------------------------------------------------------------------
  // Processar fila (via Mastra API)
  // --------------------------------------------------------------------------
  async processarFila(limite: number = 100): Promise<ProcessarFilaResponse> {
    const response = await fetch(`${MASTRA_URL}/api/comentario/processar-fila`, {
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
    const response = await fetch(`${MASTRA_URL}/api/comentario/resetar-falhas`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    return response.json();
  },

  // ============================================================================
  // SCRAPER DE QUESTÕES
  // ============================================================================

  // --------------------------------------------------------------------------
  // Status dos cadernos
  // --------------------------------------------------------------------------
  async getScraperCadernos(): Promise<ScraperCaderno[]> {
    const { data, error } = await supabase
      .from('tec_cadernos')
      .select('*')
      .order('updated_at', { ascending: false })
      .limit(20);

    if (error) throw error;
    return data || [];
  },

  // --------------------------------------------------------------------------
  // Contas TecConcursos
  // --------------------------------------------------------------------------
  async getTecAccounts(): Promise<TecAccount[]> {
    const { data, error } = await supabase
      .from('tec_accounts')
      .select('id, email, login_status, last_used_at, is_busy')
      .order('last_used_at', { ascending: false, nullsFirst: true });

    if (error) throw error;
    return data || [];
  },

  // --------------------------------------------------------------------------
  // Stats do scraper
  // --------------------------------------------------------------------------
  async getScraperStats(): Promise<{ status: string; count: number }[]> {
    const { data, error } = await supabase
      .from('tec_cadernos')
      .select('status');

    if (error) throw error;

    const counts: Record<string, number> = {};
    for (const item of data || []) {
      counts[item.status] = (counts[item.status] || 0) + 1;
    }

    return Object.entries(counts).map(([status, count]) => ({ status, count }));
  },
};

export default agentesService;
