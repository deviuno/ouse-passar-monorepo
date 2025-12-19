// @ts-nocheck
// TODO: Regenerar tipos do Supabase para incluir tabelas N8N
/**
 * Serviço para integração com webhooks N8N
 *
 * IMPORTANTE: Este serviço é NOVO e NÃO modifica nenhum serviço existente.
 * Ele lida exclusivamente com as chamadas aos webhooks N8N para:
 * - Etapa 1: Criar estrutura do preparatório (matérias e assuntos)
 * - Etapa 2: Gerar conteúdo sob demanda (texto, áudio, imagem, mapa mental)
 */

import { supabase } from '../lib/supabase';
import {
  CreatePreparatorioN8NPayload,
  N8NPreparatorioWebhookPayload,
  GenerateContentN8NPayload,
  ContentGenerationResponse,
  N8NWebhookResponse,
  N8NStatus,
  NivelDificuldade,
  Conteudo,
  PreparatorioMateria,
  Assunto,
} from '../lib/database.types';

// Helper para acessar tabelas que não estão nos tipos gerados
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

// URLs dos webhooks N8N
const N8N_PREPARATORIO_WEBHOOK = import.meta.env.VITE_N8N_PREPARATORIO_WEBHOOK ||
  'https://n8n.appcodigodavida.com.br/webhook/preparatorio';
const N8N_CONTEUDO_WEBHOOK = import.meta.env.VITE_N8N_CONTEUDO_WEBHOOK ||
  'https://n8n.appcodigodavida.com.br/webhook/conteudo';

// Configurações de timeout e retry
const WEBHOOK_TIMEOUT = 60000; // 60 segundos
const MAX_RETRIES = 3;
const RETRY_DELAY_BASE = 1000; // 1 segundo inicial, exponencial

// =====================================================
// Helpers
// =====================================================

/**
 * Aguarda um tempo determinado
 */
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Executa fetch com timeout
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit,
  timeout: number
): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

/**
 * Executa chamada com retry exponencial
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  maxRetries: number = MAX_RETRIES
): Promise<Response> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await fetchWithTimeout(url, options, WEBHOOK_TIMEOUT);

      // Se não for erro de servidor (5xx), retorna a resposta
      if (response.status < 500) {
        return response;
      }

      // Erro de servidor, pode fazer retry
      lastError = new Error(`Server error: ${response.status}`);
    } catch (error) {
      lastError = error as Error;

      // Se for abort (timeout), pode fazer retry
      if ((error as Error).name !== 'AbortError') {
        // Outro tipo de erro, verificar se é de rede
        if (!(error as Error).message.includes('fetch')) {
          throw error; // Não é erro de rede, propaga
        }
      }
    }

    // Aguarda antes do próximo retry (exponential backoff)
    if (attempt < maxRetries - 1) {
      const delayMs = RETRY_DELAY_BASE * Math.pow(2, attempt);
      console.log(`Retry ${attempt + 1}/${maxRetries} em ${delayMs}ms...`);
      await delay(delayMs);
    }
  }

  throw lastError || new Error('Falha após múltiplas tentativas');
}

// =====================================================
// Serviço Principal
// =====================================================

export const n8nService = {
  // =====================================================
  // ETAPA 1: Criar Estrutura do Preparatório
  // =====================================================

  /**
   * Envia dados do edital para o N8N criar a estrutura do preparatório
   * (matérias e assuntos)
   */
  async createPreparatorioStructure(
    preparatorioId: string,
    payload: CreatePreparatorioN8NPayload
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Atualizar status para 'pending'
      await this.updatePreparatorioN8NStatus(preparatorioId, 'pending');

      // Formatar payload para o formato esperado pelo N8N
      const webhookPayload: N8NPreparatorioWebhookPayload = {
        preparatorio_id: preparatorioId,
        nome: payload.nome,
        orgao: payload.orgao,
        banca: payload.banca,
        nivel: payload.nivel,
        cargo: payload.cargo,
        requisitos: payload.requisitos || '',
        areas_conhecimento: payload.areas_conhecimento || [],
        data_prevista: payload.data_prevista || '',
        submittedAt: new Date().toISOString(),
        formMode: 'production',
      };

      console.log('Enviando para N8N:', N8N_PREPARATORIO_WEBHOOK);
      console.log('Payload:', webhookPayload);

      // Chamar webhook
      const response = await fetchWithRetry(N8N_PREPARATORIO_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify([webhookPayload]), // N8N espera um array
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro do webhook: ${response.status} - ${errorText}`);
      }

      // N8N pode retornar resposta vazia (apenas status 200) ou JSON
      let result: N8NWebhookResponse = { success: true };
      const responseText = await response.text();

      if (responseText && responseText.trim()) {
        try {
          result = JSON.parse(responseText) as N8NWebhookResponse;
        } catch {
          // Resposta não é JSON válido, assumir sucesso se status OK
          console.log('N8N retornou resposta não-JSON:', responseText);
        }
      }

      if (result.success === false) {
        throw new Error(result.error?.message || 'Erro desconhecido do N8N');
      }

      // Atualizar status para 'processing' (N8N está processando em background)
      await this.updatePreparatorioN8NStatus(preparatorioId, 'processing');

      return {
        success: true,
        message: result.message || 'Preparatório enviado para processamento',
      };
    } catch (error) {
      console.error('Erro ao criar estrutura do preparatório:', error);

      // Atualizar status para 'error'
      await this.updatePreparatorioN8NStatus(
        preparatorioId,
        'error',
        (error as Error).message
      );

      return {
        success: false,
        message: (error as Error).message,
      };
    }
  },

  /**
   * Atualiza o status N8N de um preparatório
   */
  async updatePreparatorioN8NStatus(
    preparatorioId: string,
    status: N8NStatus,
    errorMessage?: string
  ): Promise<void> {
    const updateData: Record<string, unknown> = {
      n8n_status: status,
    };

    if (status === 'completed') {
      updateData.n8n_processed_at = new Date().toISOString();
      updateData.n8n_error_message = null;
    } else if (status === 'error' && errorMessage) {
      updateData.n8n_error_message = errorMessage;
    } else if (status === 'pending' || status === 'processing') {
      updateData.n8n_error_message = null;
    }

    const { error } = await supabase
      .from('preparatorios')
      .update(updateData)
      .eq('id', preparatorioId);

    if (error) {
      console.error('Erro ao atualizar status N8N:', error);
    }
  },

  /**
   * Verifica o status de processamento de um preparatório
   */
  async checkPreparatorioStatus(preparatorioId: string): Promise<{
    status: N8NStatus;
    errorMessage: string | null;
    materiasCount: number;
    assuntosCount: number;
  }> {
    // Buscar preparatório
    const { data: preparatorio, error: prepError } = await supabase
      .from('preparatorios')
      .select('n8n_status, n8n_error_message')
      .eq('id', preparatorioId)
      .single();

    if (prepError) {
      throw prepError;
    }

    // Contar matérias
    const { count: materiasCount } = await db
      .from('preparatorio_materias')
      .select('id', { count: 'exact', head: true })
      .eq('preparatorio_id', preparatorioId);

    // Contar assuntos (via matérias)
    const { data: materias } = await db
      .from('preparatorio_materias')
      .select('id')
      .eq('preparatorio_id', preparatorioId);

    let assuntosCount = 0;
    if (materias && materias.length > 0) {
      const materiaIds = materias.map((m: { id: string }) => m.id);
      const { count } = await db
        .from('assuntos')
        .select('id', { count: 'exact', head: true })
        .in('materia_id', materiaIds);
      assuntosCount = count || 0;
    }

    return {
      status: preparatorio.n8n_status || 'none',
      errorMessage: preparatorio.n8n_error_message,
      materiasCount: materiasCount || 0,
      assuntosCount,
    };
  },

  // =====================================================
  // ETAPA 2: Gerar Conteúdo Sob Demanda
  // =====================================================

  /**
   * Verifica se o conteúdo existe para um assunto e nível
   */
  async getConteudo(
    assuntoId: string,
    nivelDificuldade: NivelDificuldade
  ): Promise<Conteudo | null> {
    const { data, error } = await db
      .from('conteudos')
      .select('*')
      .eq('assunto_id', assuntoId)
      .eq('nivel_dificuldade', nivelDificuldade)
      .maybeSingle();

    if (error) {
      console.error('Erro ao buscar conteúdo:', error);
      return null;
    }

    return data;
  },

  /**
   * Gera conteúdo para um assunto específico
   */
  async generateContent(
    payload: GenerateContentN8NPayload
  ): Promise<ContentGenerationResponse> {
    try {
      // Verificar se já existe conteúdo em geração
      const existing = await this.getConteudo(payload.assunto_id, payload.nivel_dificuldade);
      if (existing?.status === 'generating') {
        return {
          success: false,
          message: 'Conteúdo já está sendo gerado. Aguarde.',
          id: existing.id,
          nivel_dificuldade: payload.nivel_dificuldade,
        };
      }

      if (existing?.status === 'completed') {
        return {
          success: true,
          message: 'Conteúdo já existe.',
          id: existing.id,
          nivel_dificuldade: payload.nivel_dificuldade,
        };
      }

      // Criar ou atualizar registro com status 'generating'
      const { data: conteudo, error: upsertError } = await db
        .from('conteudos')
        .upsert(
          {
            assunto_id: payload.assunto_id,
            nivel_dificuldade: payload.nivel_dificuldade,
            status: 'generating',
            generation_started_at: new Date().toISOString(),
            error_message: null,
          },
          { onConflict: 'assunto_id,nivel_dificuldade' }
        )
        .select()
        .single();

      if (upsertError) {
        throw upsertError;
      }

      console.log('Enviando para N8N:', N8N_CONTEUDO_WEBHOOK);

      // Chamar webhook
      const response = await fetchWithRetry(N8N_CONTEUDO_WEBHOOK, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erro do webhook: ${response.status} - ${errorText}`);
      }

      const result = await response.json() as ContentGenerationResponse;

      if (result.success === false) {
        throw new Error(result.message || 'Erro desconhecido do N8N');
      }

      return {
        success: true,
        message: result.message || 'Conteúdo gerado com sucesso',
        id: result.id || conteudo.id,
        nivel_dificuldade: payload.nivel_dificuldade,
      };
    } catch (error) {
      console.error('Erro ao gerar conteúdo:', error);

      // Atualizar status para 'error'
      await db
        .from('conteudos')
        .update({
          status: 'error',
          error_message: (error as Error).message,
        })
        .eq('assunto_id', payload.assunto_id)
        .eq('nivel_dificuldade', payload.nivel_dificuldade);

      return {
        success: false,
        message: (error as Error).message,
        id: '',
        nivel_dificuldade: payload.nivel_dificuldade,
      };
    }
  },

  // =====================================================
  // Operações de Leitura (Matérias e Assuntos)
  // =====================================================

  /**
   * Busca todas as matérias de um preparatório
   */
  async getMaterias(preparatorioId: string): Promise<PreparatorioMateria[]> {
    const { data, error } = await db
      .from('preparatorio_materias')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .eq('is_active', true)
      .order('ordem');

    if (error) {
      console.error('Erro ao buscar matérias:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Busca todos os assuntos de uma matéria
   */
  async getAssuntos(materiaId: string): Promise<Assunto[]> {
    const { data, error } = await db
      .from('assuntos')
      .select('*')
      .eq('materia_id', materiaId)
      .eq('is_active', true)
      .order('ordem');

    if (error) {
      console.error('Erro ao buscar assuntos:', error);
      return [];
    }

    return data || [];
  },

  /**
   * Busca um assunto específico com seus dados completos
   */
  async getAssuntoById(assuntoId: string): Promise<Assunto | null> {
    const { data, error } = await db
      .from('assuntos')
      .select('*')
      .eq('id', assuntoId)
      .single();

    if (error) {
      console.error('Erro ao buscar assunto:', error);
      return null;
    }

    return data;
  },

  /**
   * Busca matéria com seus assuntos
   */
  async getMateriaComAssuntos(materiaId: string): Promise<PreparatorioMateria & { assuntos: Assunto[] } | null> {
    const { data: materia, error: materiaError } = await db
      .from('preparatorio_materias')
      .select('*')
      .eq('id', materiaId)
      .single();

    if (materiaError || !materia) {
      console.error('Erro ao buscar matéria:', materiaError);
      return null;
    }

    const assuntos = await this.getAssuntos(materiaId);

    return {
      ...materia,
      assuntos,
    };
  },

  /**
   * Busca todas as matérias de um preparatório com seus assuntos
   */
  async getMateriasComAssuntos(preparatorioId: string): Promise<(PreparatorioMateria & { assuntos: Assunto[] })[]> {
    const materias = await this.getMaterias(preparatorioId);

    const materiasComAssuntos = await Promise.all(
      materias.map(async (materia) => {
        const assuntos = await this.getAssuntos(materia.id);
        return {
          ...materia,
          assuntos,
        };
      })
    );

    return materiasComAssuntos;
  },
};
