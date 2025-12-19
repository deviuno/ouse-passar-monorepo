/**
 * Serviço para buscar rodadas e missões do sistema de planejamento
 */

import { supabase } from './supabaseClient';
import {
  Rodada,
  Missao,
  RodadaComProgresso,
  MissaoComProgresso,
  UserMissaoProgress,
  MissionStatus,
} from '../types/trail';

/**
 * Busca todas as rodadas de um preparatório com suas missões
 */
export async function getRodadasByPreparatorio(
  preparatorioId: string
): Promise<Rodada[]> {
  try {
    // Buscar rodadas
    const { data: rodadas, error: rodadasError } = await supabase
      .from('rodadas')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .order('ordem', { ascending: true });

    if (rodadasError) {
      console.error('[RodadasService] Erro ao buscar rodadas:', rodadasError);
      return [];
    }

    if (!rodadas || rodadas.length === 0) {
      return [];
    }

    // Buscar missões de todas as rodadas
    const rodadaIds = rodadas.map((r) => r.id);
    const { data: missoes, error: missoesError } = await supabase
      .from('missoes')
      .select('*')
      .in('rodada_id', rodadaIds)
      .order('ordem', { ascending: true });

    if (missoesError) {
      console.error('[RodadasService] Erro ao buscar missões:', missoesError);
    }

    // Agrupar missões por rodada
    const missoesPorRodada = new Map<string, Missao[]>();
    (missoes || []).forEach((m) => {
      const list = missoesPorRodada.get(m.rodada_id) || [];
      list.push(m);
      missoesPorRodada.set(m.rodada_id, list);
    });

    // Montar resultado
    return rodadas.map((rodada) => ({
      ...rodada,
      missoes: missoesPorRodada.get(rodada.id) || [],
    }));
  } catch (error) {
    console.error('[RodadasService] Erro ao buscar rodadas:', error);
    return [];
  }
}

/**
 * Busca o progresso do usuário em todas as missões de um preparatório
 */
export async function getUserMissaoProgress(
  userId: string,
  preparatorioId: string
): Promise<Map<string, UserMissaoProgress>> {
  try {
    const { data, error } = await supabase
      .from('user_missao_progress')
      .select('*')
      .eq('user_id', userId);

    if (error) {
      // Tabela pode não existir ainda
      if (error.code === '42P01') {
        console.warn('[RodadasService] Tabela user_missao_progress não existe');
        return new Map();
      }
      console.error('[RodadasService] Erro ao buscar progresso:', error);
      return new Map();
    }

    const progressMap = new Map<string, UserMissaoProgress>();
    (data || []).forEach((p) => {
      progressMap.set(p.missao_id, p);
    });

    return progressMap;
  } catch (error) {
    console.error('[RodadasService] Erro ao buscar progresso:', error);
    return new Map();
  }
}

/**
 * Busca rodadas com progresso do usuário
 */
export async function getRodadasComProgresso(
  userId: string,
  preparatorioId: string
): Promise<RodadaComProgresso[]> {
  try {
    // Buscar rodadas e missões
    const rodadas = await getRodadasByPreparatorio(preparatorioId);

    if (rodadas.length === 0) {
      return [];
    }

    // Buscar progresso do usuário
    const progressMap = await getUserMissaoProgress(userId, preparatorioId);

    // Determinar qual é a missão atual (primeira não completada)
    let foundCurrentMission = false;

    // Helper para verificar se uma missão está "concluída" para fins de desbloqueio
    // needs_massificacao NÃO é considerada concluída - bloqueia a próxima
    const isMissaoCompleta = (missaoId: string) => {
      const progress = progressMap.get(missaoId);
      return progress?.status === 'completed';
    };

    // Processar cada rodada
    const rodadasComProgresso: RodadaComProgresso[] = rodadas.map((rodada, rodadaIndex) => {
      // Verificar se a rodada anterior foi completada (para rodadas após a primeira)
      let rodadaAnteriorCompleta = true;
      if (rodadaIndex > 0) {
        const rodadaAnterior = rodadas[rodadaIndex - 1];
        const missoesAnteriores = rodadaAnterior.missoes || [];
        rodadaAnteriorCompleta = missoesAnteriores.every((m) => isMissaoCompleta(m.id));
      }

      const missoesComProgresso: MissaoComProgresso[] = (rodada.missoes || []).map((missao, missaoIndex) => {
        const progress = progressMap.get(missao.id);

        // Determinar status
        let status: MissionStatus = 'locked';

        if (progress) {
          // Se já tem progresso, usar o status do progresso
          status = progress.status;

          // Se está em needs_massificacao, marcar que encontramos a missão atual
          if (status === 'needs_massificacao') {
            foundCurrentMission = true;
          }
        } else if (!foundCurrentMission) {
          // Verificar se esta missão pode ser desbloqueada
          if (rodadaIndex === 0 && missaoIndex === 0) {
            // Primeira missão da primeira rodada sempre disponível
            status = 'available';
            foundCurrentMission = true;
          } else if (rodadaIndex === 0) {
            // Missões seguintes da primeira rodada: verificar se a anterior foi completada
            const missaoAnterior = rodada.missoes![missaoIndex - 1];
            if (isMissaoCompleta(missaoAnterior.id)) {
              status = 'available';
              foundCurrentMission = true;
            }
          } else if (rodadaAnteriorCompleta) {
            // Rodadas seguintes: só desbloquear se a rodada anterior foi completada
            if (missaoIndex === 0) {
              // Primeira missão da rodada
              status = 'available';
              foundCurrentMission = true;
            } else {
              // Missões seguintes: verificar se a anterior foi completada
              const missaoAnterior = rodada.missoes![missaoIndex - 1];
              if (isMissaoCompleta(missaoAnterior.id)) {
                status = 'available';
                foundCurrentMission = true;
              }
            }
          }
        }

        return {
          ...missao,
          progress,
          status,
          isCurrentMission: (status === 'available' && !progress) || status === 'needs_massificacao',
          // Campos extras para massificação
          massificacao_attempts: progress?.massificacao_attempts || 0,
        };
      });

      return {
        ...rodada,
        missoes: missoesComProgresso,
      };
    });

    return rodadasComProgresso;
  } catch (error) {
    console.error('[RodadasService] Erro ao buscar rodadas com progresso:', error);
    return [];
  }
}

/**
 * Atualiza o progresso de uma missão
 */
export async function updateMissaoProgress(
  userId: string,
  missaoId: string,
  status: MissionStatus,
  score?: number
): Promise<boolean> {
  try {
    const now = new Date().toISOString();

    // Verificar se já existe progresso
    const { data: existing } = await supabase
      .from('user_missao_progress')
      .select('id, attempts')
      .eq('user_id', userId)
      .eq('missao_id', missaoId)
      .single();

    if (existing) {
      // Atualizar
      const { error } = await supabase
        .from('user_missao_progress')
        .update({
          status,
          score,
          attempts: existing.attempts + 1,
          completed_at: status === 'completed' ? now : null,
        })
        .eq('id', existing.id);

      if (error) {
        console.error('[RodadasService] Erro ao atualizar progresso:', error);
        return false;
      }
    } else {
      // Criar novo
      const { error } = await supabase.from('user_missao_progress').insert({
        user_id: userId,
        missao_id: missaoId,
        status,
        score,
        attempts: 1,
        started_at: now,
        completed_at: status === 'completed' ? now : null,
      });

      if (error) {
        console.error('[RodadasService] Erro ao criar progresso:', error);
        return false;
      }
    }

    return true;
  } catch (error) {
    console.error('[RodadasService] Erro ao atualizar progresso:', error);
    return false;
  }
}

/**
 * Busca uma missão específica por ID
 */
export async function getMissaoById(missaoId: string): Promise<Missao | null> {
  try {
    const { data, error } = await supabase
      .from('missoes')
      .select('*')
      .eq('id', missaoId)
      .single();

    if (error) {
      console.error('[RodadasService] Erro ao buscar missão:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('[RodadasService] Erro ao buscar missão:', error);
    return null;
  }
}

/**
 * Conta total de missões e completadas de um preparatório
 */
export async function countMissoesProgress(
  userId: string,
  preparatorioId: string
): Promise<{ total: number; completed: number; percent: number }> {
  try {
    // Buscar rodadas
    const { data: rodadas } = await supabase
      .from('rodadas')
      .select('id')
      .eq('preparatorio_id', preparatorioId);

    if (!rodadas || rodadas.length === 0) {
      return { total: 0, completed: 0, percent: 0 };
    }

    const rodadaIds = rodadas.map((r) => r.id);

    // Contar total de missões
    const { count: total } = await supabase
      .from('missoes')
      .select('*', { count: 'exact', head: true })
      .in('rodada_id', rodadaIds);

    // Buscar progresso do usuário
    const { data: progress } = await supabase
      .from('user_missao_progress')
      .select('missao_id')
      .eq('user_id', userId)
      .eq('status', 'completed');

    // Filtrar apenas missões deste preparatório
    const { data: missoes } = await supabase
      .from('missoes')
      .select('id')
      .in('rodada_id', rodadaIds);

    const missaoIds = new Set((missoes || []).map((m) => m.id));
    const completed = (progress || []).filter((p) => missaoIds.has(p.missao_id)).length;

    const totalNum = total || 0;
    const percent = totalNum > 0 ? Math.round((completed / totalNum) * 100) : 0;

    return { total: totalNum, completed, percent };
  } catch (error) {
    console.error('[RodadasService] Erro ao contar progresso:', error);
    return { total: 0, completed: 0, percent: 0 };
  }
}

/**
 * Converte uma MissaoComProgresso para o formato TrailMission usado pelo TrailMap
 */
export function missaoToTrailMission(missao: MissaoComProgresso): any {
  // Determinar o tipo de missão para o TrailMap
  let tipo: 'normal' | 'revisao' | 'simulado_rodada' | 'massificacao' = 'normal';
  if (missao.tipo === 'revisao') tipo = 'revisao';
  else if (missao.tipo === 'acao') tipo = 'simulado_rodada';

  // Criar nome do assunto baseado nos dados da missão
  let nomeAssunto = '';
  if (missao.tipo === 'padrao') {
    nomeAssunto = missao.assunto || missao.materia || 'Estudo';
  } else if (missao.tipo === 'revisao') {
    nomeAssunto = missao.tema || 'Revisão';
  } else if (missao.tipo === 'acao') {
    nomeAssunto = missao.acao || 'Ação';
  }

  return {
    id: missao.id,
    round_id: missao.rodada_id,
    materia_id: '', // Não temos mais materia_id separado
    ordem: missao.ordem,
    status: missao.status,
    tipo,
    score: missao.progress?.score,
    attempts: missao.progress?.attempts || 0,
    created_at: missao.created_at,
    completed_at: missao.progress?.completed_at,
    // Simular o assunto para exibição no TrailMap
    assunto: {
      id: missao.id,
      materia_id: '',
      nome: nomeAssunto,
      ordem: missao.ordem,
      nivel_dificuldade: 'intermediario' as const,
      created_at: missao.created_at,
    },
    materia: missao.materia ? {
      id: '',
      preparatorio_id: '',
      materia: missao.materia,
      peso: 1,
      ordem: 0,
      total_assuntos: 0,
      created_at: missao.created_at,
    } : undefined,
    // Dados originais da missão para uso posterior
    _missaoOriginal: missao,
  };
}

/**
 * Converte um array de RodadasComProgresso para o formato de rounds usado pela trilha
 */
export function rodadasToTrailRounds(rodadas: RodadaComProgresso[]): any[] {
  return rodadas.map((rodada) => ({
    id: rodada.id,
    trail_id: rodada.preparatorio_id,
    round_number: rodada.numero,
    status: determineRoundStatus(rodada.missoes),
    tipo: 'normal' as const,
    created_at: rodada.created_at,
    missions: rodada.missoes.map(missaoToTrailMission),
  }));
}

/**
 * Determina o status de uma rodada baseado nas missões
 */
function determineRoundStatus(missoes: MissaoComProgresso[]): 'locked' | 'active' | 'completed' {
  if (missoes.length === 0) return 'locked';

  const allCompleted = missoes.every((m) => m.status === 'completed');
  if (allCompleted) return 'completed';

  // needs_massificacao também é considerado ativo - o aluno precisa refazer a missão
  const hasAvailable = missoes.some(
    (m) => m.status === 'available' || m.status === 'in_progress' || m.status === 'needs_massificacao'
  );
  if (hasAvailable) return 'active';

  return 'locked';
}

export default {
  getRodadasByPreparatorio,
  getUserMissaoProgress,
  getRodadasComProgresso,
  updateMissaoProgress,
  getMissaoById,
  countMissoesProgress,
  missaoToTrailMission,
  rodadasToTrailRounds,
};
