/**
 * Serviço para gerenciar conquistas do sistema de planejamento
 */

import { supabase } from '../lib/supabase';
import {
  PlanejamentoConquista,
  PlanejamentoConquistaUsuario,
  CreatePlanejamentoConquistaInput,
  UpdatePlanejamentoConquistaInput,
  PlanejamentoConquistaRequisitoTipo,
} from '../lib/database.types';

// Labels para os tipos de requisito (usado na UI)
export const REQUISITO_TIPO_LABELS: Record<PlanejamentoConquistaRequisitoTipo, string> = {
  missoes_completadas: 'Missões Completadas',
  rodadas_completadas: 'Rodadas Completadas',
  dias_consecutivos: 'Dias Consecutivos',
  porcentagem_edital: '% do Edital',
  missoes_por_dia: 'Missões por Dia',
  tempo_estudo: 'Tempo de Estudo (min)',
  primeiro_acesso: 'Primeiro Acesso',
  semana_perfeita: 'Semana Perfeita',
  mes_perfeito: 'Mês Perfeito',
  custom: 'Personalizado',
};

export const planejamentoConquistasService = {
  // =====================================================
  // CRUD de Conquistas
  // =====================================================

  /**
   * Busca todas as conquistas
   */
  async getAll(includeInactive = false): Promise<PlanejamentoConquista[]> {
    let query = supabase
      .from('planejamento_conquistas')
      .select('*')
      .order('ordem', { ascending: true });

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  /**
   * Busca uma conquista por ID
   */
  async getById(id: string): Promise<PlanejamentoConquista | null> {
    const { data, error } = await supabase
      .from('planejamento_conquistas')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Cria uma nova conquista
   */
  async create(input: CreatePlanejamentoConquistaInput): Promise<PlanejamentoConquista> {
    const { data, error } = await supabase
      .from('planejamento_conquistas')
      .insert({
        id: input.id,
        nome: input.nome,
        descricao: input.descricao,
        icone: input.icone || '🏆',
        requisito_tipo: input.requisito_tipo,
        requisito_valor: input.requisito_valor,
        xp_recompensa: input.xp_recompensa || 0,
        moedas_recompensa: input.moedas_recompensa || 0,
        is_active: input.is_active ?? true,
        is_hidden: input.is_hidden ?? false,
        ordem: input.ordem ?? 0,
        mensagem_desbloqueio: input.mensagem_desbloqueio,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Atualiza uma conquista
   */
  async update(id: string, input: UpdatePlanejamentoConquistaInput): Promise<PlanejamentoConquista> {
    const { data, error } = await supabase
      .from('planejamento_conquistas')
      .update({
        ...input,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Remove uma conquista
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('planejamento_conquistas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  /**
   * Alterna o status ativo de uma conquista
   */
  async toggleActive(id: string, is_active: boolean): Promise<void> {
    const { error } = await supabase
      .from('planejamento_conquistas')
      .update({ is_active, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) throw error;
  },

  // =====================================================
  // Conquistas do Usuário
  // =====================================================

  /**
   * Busca conquistas desbloqueadas de um planejamento
   */
  async getConquistasUsuario(planejamentoId: string): Promise<PlanejamentoConquistaUsuario[]> {
    const { data, error } = await supabase
      .from('planejamento_conquistas_usuario')
      .select('*')
      .eq('planejamento_id', planejamentoId);

    if (error) throw error;
    return data || [];
  },

  /**
   * Verifica se uma conquista foi desbloqueada
   */
  async isConquistaDesbloqueada(planejamentoId: string, conquistaId: string): Promise<boolean> {
    const { data } = await supabase
      .from('planejamento_conquistas_usuario')
      .select('id')
      .eq('planejamento_id', planejamentoId)
      .eq('conquista_id', conquistaId)
      .maybeSingle();

    return !!data;
  },

  /**
   * Desbloqueia uma conquista para um planejamento
   */
  async desbloquearConquista(planejamentoId: string, conquistaId: string): Promise<PlanejamentoConquistaUsuario | null> {
    // Verifica se já foi desbloqueada
    const jaDesbloqueada = await this.isConquistaDesbloqueada(planejamentoId, conquistaId);
    if (jaDesbloqueada) return null;

    const { data, error } = await supabase
      .from('planejamento_conquistas_usuario')
      .insert({
        planejamento_id: planejamentoId,
        conquista_id: conquistaId,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Busca conquistas com status de desbloqueio para um planejamento
   */
  async getConquistasComStatus(planejamentoId: string): Promise<(PlanejamentoConquista & { desbloqueada: boolean; desbloqueada_em: string | null })[]> {
    // Busca todas as conquistas ativas
    const conquistas = await this.getAll();

    // Busca conquistas desbloqueadas do usuário
    const desbloqueadas = await this.getConquistasUsuario(planejamentoId);
    const desbloqueadasMap = new Map(
      desbloqueadas.map(d => [d.conquista_id, d.desbloqueada_em])
    );

    // Combina os dados
    return conquistas.map(conquista => ({
      ...conquista,
      desbloqueada: desbloqueadasMap.has(conquista.id),
      desbloqueada_em: desbloqueadasMap.get(conquista.id) || null,
    }));
  },

  // =====================================================
  // Estatísticas
  // =====================================================

  /**
   * Conta quantos usuários desbloquearam cada conquista
   */
  async getEstatisticas(): Promise<Record<string, number>> {
    const { data, error } = await supabase
      .from('planejamento_conquistas_usuario')
      .select('conquista_id');

    if (error) throw error;

    const stats: Record<string, number> = {};
    (data || []).forEach(item => {
      stats[item.conquista_id] = (stats[item.conquista_id] || 0) + 1;
    });

    return stats;
  },
};
