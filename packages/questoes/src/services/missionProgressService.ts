/**
 * Serviço para salvar e recuperar progresso de missão em andamento
 * Permite que o aluno saia e continue de onde parou
 */

import { supabase } from './supabaseClient';

export interface MissionAnswer {
  letter: string;
  correct: boolean;
}

export interface MissionProgressData {
  missionId: string;
  odaId?: string;
  questoesIds?: (number | string)[]; // Opcional - questões agora são fixas por missão
  answers: Record<number | string, MissionAnswer>;
  currentQuestionIndex: number;
  status: 'in_progress' | 'completed' | 'needs_massificacao';
  startedAt?: string;
  studyMode?: 'zen' | 'hard'; // Modo de estudo selecionado pelo usuário
}

// Debounce para evitar muitas requisições
let saveTimeout: NodeJS.Timeout | null = null;
let pendingSave: MissionProgressData | null = null;

// Armazenar userId para uso no beforeunload
let lastUserId: string | null = null;

/**
 * Salva o progresso da missão (com debounce de 500ms)
 */
export async function saveMissionProgress(
  userId: string,
  data: MissionProgressData
): Promise<{ success: boolean; error: string | null }> {
  // Armazena os dados pendentes e userId
  pendingSave = data;
  lastUserId = userId;

  console.log('[MissionProgressService] Agendando save:', {
    missionId: data.missionId,
    answersCount: Object.keys(data.answers).length,
    currentIndex: data.currentQuestionIndex,
  });

  // Cancela timeout anterior se existir
  if (saveTimeout) {
    clearTimeout(saveTimeout);
  }

  // Agenda o salvamento com debounce
  return new Promise((resolve) => {
    saveTimeout = setTimeout(async () => {
      if (!pendingSave) {
        resolve({ success: true, error: null });
        return;
      }

      const dataToSave = pendingSave;
      pendingSave = null;

      console.log('[MissionProgressService] Executando save:', {
        answersCount: Object.keys(dataToSave.answers).length,
        answers: dataToSave.answers,
      });

      try {
        const { error } = await supabase
          .from('user_missao_progress')
          .upsert(
            {
              user_id: userId,
              missao_id: dataToSave.missionId,
              status: dataToSave.status,
              // questoesIds é opcional - questões são fixas por missão na tabela missao_questoes
              questoes_ids: dataToSave.questoesIds?.map(String) || [],
              answers_json: dataToSave.answers,
              current_question_index: dataToSave.currentQuestionIndex,
              study_mode: dataToSave.studyMode || 'zen',
              started_at: dataToSave.startedAt || new Date().toISOString(),
              last_attempt_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            },
            {
              onConflict: 'user_id,missao_id',
            }
          );

        if (error) {
          console.error('[MissionProgressService] Erro ao salvar progresso:', error);
          resolve({ success: false, error: error.message });
        } else {
          console.log('[MissionProgressService] Progresso salvo com sucesso!');
          resolve({ success: true, error: null });
        }
      } catch (err: any) {
        console.error('[MissionProgressService] Exceção ao salvar:', err);
        resolve({ success: false, error: err.message });
      }
    }, 500);
  });
}

/**
 * Força o salvamento de qualquer progresso pendente (chamado antes de sair da página)
 */
export async function flushPendingSave(): Promise<void> {
  if (!pendingSave || !lastUserId) return;

  // Cancela o timeout pendente
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }

  const dataToSave = pendingSave;
  const userId = lastUserId;
  pendingSave = null;

  console.log('[MissionProgressService] Flush: salvando progresso pendente...');

  try {
    await supabase
      .from('user_missao_progress')
      .upsert(
        {
          user_id: userId,
          missao_id: dataToSave.missionId,
          status: dataToSave.status,
          // questoesIds é opcional - questões são fixas por missão
          questoes_ids: dataToSave.questoesIds?.map(String) || [],
          answers_json: dataToSave.answers,
          current_question_index: dataToSave.currentQuestionIndex,
          study_mode: dataToSave.studyMode || 'zen',
          started_at: dataToSave.startedAt || new Date().toISOString(),
          last_attempt_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,missao_id',
        }
      );
    console.log('[MissionProgressService] Flush: progresso salvo!');
  } catch (err) {
    console.error('[MissionProgressService] Flush: erro ao salvar:', err);
  }
}

/**
 * Salva o progresso imediatamente (sem debounce)
 * Usar quando precisar garantir que foi salvo (ex: antes de sair da página)
 */
export async function saveMissionProgressImmediate(
  userId: string,
  data: MissionProgressData
): Promise<{ success: boolean; error: string | null }> {
  // Cancela qualquer save pendente
  if (saveTimeout) {
    clearTimeout(saveTimeout);
    saveTimeout = null;
  }
  pendingSave = null;

  console.log('[MissionProgressService] Salvando imediatamente:', {
    missionId: data.missionId,
    answersCount: Object.keys(data.answers).length,
    currentIndex: data.currentQuestionIndex,
  });

  try {
    const { error } = await supabase
      .from('user_missao_progress')
      .upsert(
        {
          user_id: userId,
          missao_id: data.missionId,
          status: data.status,
          // questoesIds é opcional - questões são fixas por missão
          questoes_ids: data.questoesIds?.map(String) || [],
          answers_json: data.answers,
          current_question_index: data.currentQuestionIndex,
          study_mode: data.studyMode || 'zen',
          started_at: data.startedAt || new Date().toISOString(),
          last_attempt_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'user_id,missao_id',
        }
      );

    if (error) {
      console.error('[MissionProgressService] Erro ao salvar progresso:', error);
      return { success: false, error: error.message };
    }

    console.log('[MissionProgressService] Progresso salvo imediatamente!');
    return { success: true, error: null };
  } catch (err: any) {
    console.error('[MissionProgressService] Exceção ao salvar:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Recupera o progresso salvo de uma missão
 */
export async function getMissionProgress(
  userId: string,
  missionId: string
): Promise<MissionProgressData | null> {
  try {
    const { data, error } = await supabase
      .from('user_missao_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('missao_id', missionId)
      .single();

    if (error) {
      // Não encontrado é esperado para missões novas
      if (error.code === 'PGRST116') {
        return null;
      }
      console.error('[MissionProgressService] Erro ao buscar progresso:', error);
      return null;
    }

    if (!data) {
      return null;
    }

    // Retorna se estiver em progresso
    // Nota: questoes_ids não é mais necessário - questões são fixas por missão na tabela missao_questoes
    if (data.status === 'in_progress') {
      const hasAnswers = data.answers_json && Object.keys(data.answers_json).length > 0;

      console.log('[MissionProgressService] Progresso encontrado:', {
        answersCount: hasAnswers ? Object.keys(data.answers_json).length : 0,
        currentIndex: data.current_question_index,
      });

      return {
        missionId: data.missao_id,
        odaId: data.id,
        questoesIds: data.questoes_ids || [],
        answers: (data.answers_json || {}) as Record<number, MissionAnswer>,
        currentQuestionIndex: data.current_question_index || 0,
        status: data.status as 'in_progress',
        startedAt: data.started_at,
        studyMode: (data.study_mode as 'zen' | 'hard') || 'zen',
      };
    }

    console.log('[MissionProgressService] Nenhum progresso válido encontrado');
    return null;
  } catch (err: any) {
    console.error('[MissionProgressService] Exceção ao buscar:', err);
    return null;
  }
}

/**
 * Limpa o progresso ao completar a missão
 * (Na verdade, apenas atualiza o status - os dados são mantidos para histórico)
 */
export async function clearMissionProgress(
  userId: string,
  missionId: string,
  finalStatus: 'completed' | 'needs_massificacao',
  score: number
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('user_missao_progress')
      .update({
        status: finalStatus,
        score: score,
        completed_at: finalStatus === 'completed' ? new Date().toISOString() : null,
        updated_at: new Date().toISOString(),
      })
      .eq('user_id', userId)
      .eq('missao_id', missionId);

    if (error) {
      console.error('[MissionProgressService] Erro ao limpar progresso:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[MissionProgressService] Exceção ao limpar:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Inicia uma nova tentativa de missão
 * Reseta as respostas (questões são fixas por missão na tabela missao_questoes)
 */
export async function startMissionAttempt(
  userId: string,
  missionId: string
): Promise<{ success: boolean; error: string | null }> {
  try {
    const { error } = await supabase
      .from('user_missao_progress')
      .upsert(
        {
          user_id: userId,
          missao_id: missionId,
          status: 'in_progress',
          questoes_ids: [], // Questões são fixas na tabela missao_questoes
          answers_json: {},
          current_question_index: 0,
          started_at: new Date().toISOString(),
          last_attempt_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          attempts: 1,
        },
        {
          onConflict: 'user_id,missao_id',
        }
      );

    if (error) {
      console.error('[MissionProgressService] Erro ao iniciar tentativa:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[MissionProgressService] Exceção ao iniciar:', err);
    return { success: false, error: err.message };
  }
}
