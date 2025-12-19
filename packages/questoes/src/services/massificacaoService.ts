/**
 * Serviço de Massificação
 *
 * Gerencia o controle de missões que precisam de massificação.
 * Massificação é ativada quando o aluno tem desempenho < 50% em uma missão.
 *
 * Regras:
 * - Limite de tentativas: Infinito
 * - Recompensas: Nenhuma (0 XP, 0 moedas)
 * - Questões: Exatamente as mesmas da missão original
 * - Conteúdo: Sim, terá acesso ao conteúdo
 * - Estatísticas: Sim, registrar que fez massificação
 *
 * Abordagem: Usar user_missao_progress para rastrear estado de massificação
 * - status: 'needs_massificacao' quando precisa refazer
 * - status: 'completed' quando passou (seja direto ou após massificação)
 */

import { supabase } from './supabaseClient';
import { TrailMission, MissionStatus } from '../types/trail';
import { PASSING_SCORE } from '../constants/levelConfig';

/**
 * Verifica se uma missão precisa de massificação
 */
export function needsMassificacao(score: number): boolean {
  return score < PASSING_SCORE;
}

/**
 * Marca uma missão como precisando de massificação
 */
export async function marcarNeedsMassificacao(
  userId: string,
  missaoId: string,
  score: number,
  questoesIds: string[]
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // Verificar se já existe progresso
    const { data: existing } = await supabase
      .from('user_missao_progress')
      .select('id, attempts, massificacao_attempts')
      .eq('user_id', userId)
      .eq('missao_id', missaoId)
      .single();

    if (existing) {
      // Atualizar para needs_massificacao
      const { error } = await supabase
        .from('user_missao_progress')
        .update({
          status: 'needs_massificacao',
          score,
          attempts: existing.attempts + 1,
          massificacao_attempts: (existing.massificacao_attempts || 0) + 1,
          questoes_ids: questoesIds,
          last_attempt_at: now,
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[Massificacao] Erro ao marcar needs_massificacao:', error);
        return false;
      }
    } else {
      // Criar novo registro com needs_massificacao
      const { error } = await supabase.from('user_missao_progress').insert({
        user_id: userId,
        missao_id: missaoId,
        status: 'needs_massificacao',
        score,
        attempts: 1,
        massificacao_attempts: 1,
        questoes_ids: questoesIds,
        started_at: now,
        last_attempt_at: now,
      });

      if (error) {
        console.error('[Massificacao] Erro ao criar needs_massificacao:', error);
        return false;
      }
    }

    console.log(`[Massificacao] Missão ${missaoId} marcada como needs_massificacao`);
    return true;
  } catch (error) {
    console.error('[Massificacao] Erro ao marcar needs_massificacao:', error);
    return false;
  }
}

/**
 * Completa uma massificação (usuário passou após refazer)
 */
export async function completarMassificacao(
  userId: string,
  missaoId: string,
  score: number
): Promise<boolean> {
  try {
    const passed = score >= PASSING_SCORE;
    const now = new Date().toISOString();

    if (!passed) {
      // Não passou, incrementar tentativas mas manter status
      const { data: existing } = await supabase
        .from('user_missao_progress')
        .select('id, massificacao_attempts')
        .eq('user_id', userId)
        .eq('missao_id', missaoId)
        .single();

      if (existing) {
        await supabase
          .from('user_missao_progress')
          .update({
            score,
            massificacao_attempts: (existing.massificacao_attempts || 0) + 1,
            last_attempt_at: now,
          })
          .eq('id', existing.id);
      }

      return false;
    }

    // Passou! Atualizar para completed
    const { error } = await supabase
      .from('user_missao_progress')
      .update({
        status: 'completed',
        score,
        completed_at: now,
        last_attempt_at: now,
      })
      .eq('user_id', userId)
      .eq('missao_id', missaoId);

    if (error) {
      console.error('[Massificacao] Erro ao completar massificação:', error);
      return false;
    }

    console.log(`[Massificacao] Missão ${missaoId} completada após massificação`);
    return true;
  } catch (error) {
    console.error('[Massificacao] Erro ao completar massificação:', error);
    return false;
  }
}

/**
 * Busca as questões originais de uma missão em massificação
 */
export async function getQuestoesIdsMassificacao(
  userId: string,
  missaoId: string
): Promise<string[]> {
  try {
    const { data } = await supabase
      .from('user_missao_progress')
      .select('questoes_ids')
      .eq('user_id', userId)
      .eq('missao_id', missaoId)
      .single();

    return data?.questoes_ids || [];
  } catch (error) {
    console.error('[Massificacao] Erro ao buscar questões:', error);
    return [];
  }
}

/**
 * Verifica se uma missão precisa de massificação (baseado no progresso do usuário)
 */
export function isMassificacao(mission: TrailMission): boolean {
  // Verificar pelo status calculado
  return mission.status === 'needs_massificacao';
}

/**
 * Verifica se uma missão está em estado de massificação
 */
export function isNeedsMassificacao(status: MissionStatus): boolean {
  return status === 'needs_massificacao';
}

/**
 * Conta quantas tentativas de massificação o usuário fez
 */
export async function getMassificacaoAttempts(
  userId: string,
  missaoId: string
): Promise<number> {
  try {
    const { data } = await supabase
      .from('user_missao_progress')
      .select('massificacao_attempts')
      .eq('user_id', userId)
      .eq('missao_id', missaoId)
      .single();

    return data?.massificacao_attempts || 0;
  } catch (error) {
    console.error('[Massificacao] Erro ao buscar tentativas:', error);
    return 0;
  }
}

/**
 * Conta estatísticas de massificação do usuário
 */
export async function contarMassificacoes(userId: string): Promise<{
  total: number;
  passaram: number;
  pendentes: number;
}> {
  try {
    const { data, error } = await supabase
      .from('user_missao_progress')
      .select('status, massificacao_attempts')
      .eq('user_id', userId)
      .gt('massificacao_attempts', 0);

    if (error) throw error;

    const stats = data || [];
    const total = stats.length;
    const passaram = stats.filter((s) => s.status === 'completed').length;
    const pendentes = stats.filter((s) => s.status === 'needs_massificacao').length;

    return { total, passaram, pendentes };
  } catch (error) {
    console.error('[Massificacao] Erro ao contar massificações:', error);
    return { total: 0, passaram: 0, pendentes: 0 };
  }
}

// Legacy exports for compatibility
export async function createMassificacao(): Promise<null> {
  console.warn('[Massificacao] createMassificacao is deprecated. Use marcarNeedsMassificacao instead.');
  return null;
}

export async function desbloquearProximaMissao(): Promise<void> {
  console.warn('[Massificacao] desbloquearProximaMissao is deprecated. Unlock is now automatic based on progress.');
}
