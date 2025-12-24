// Algoritmo de Trilha Adaptativa
// Baseado no PRD: Regra de Alternancia e Massificacao

import {
  UserTrail,
  TrailMission,
  PreparatorioMateria,
  Assunto,
  MissionStatus,
  MissionType,
  GeneratedMission,
  TrailSlots,
  MissionResult,
  MassificationCheck,
  UserLevel,
} from '../types';
import { PASSING_SCORE, getQuestionsLimit } from '../constants';

/**
 * Regra Absoluta: Jamais permitir duas missoes consecutivas da mesma materia
 * Logica de "Slots Ativos":
 * 1. O sistema pega as 2 materias de maior peso do Raio-X (Slot A e Slot B)
 * 2. Geracao da Trilha alterna entre os slots
 * 3. Quando uma materia acaba, ela vai para o Pool de Revisao e uma nova entra
 */

export interface TrailContext {
  trail: UserTrail;
  materias: PreparatorioMateria[];
  slots: TrailSlots;
  lastMissionMateriaId?: string;
  revisionPool: string[];
}

/**
 * Inicializa os slots ativos com as 2 materias de maior peso
 */
export function initializeSlots(materias: PreparatorioMateria[]): TrailSlots {
  // Ordenar por peso (maior primeiro) e depois por ordem
  const sorted = [...materias].sort((a, b) => {
    if (b.peso !== a.peso) return b.peso - a.peso;
    return a.ordem - b.ordem;
  });

  return {
    slotA: sorted[0] || null,
    slotB: sorted[1] || null,
  };
}

/**
 * Determina qual slot usar para a proxima missao (alternancia)
 */
export function getNextSlot(
  lastSlot: 'A' | 'B' | null,
  slots: TrailSlots
): 'A' | 'B' {
  if (!lastSlot) return 'A';
  return lastSlot === 'A' ? 'B' : 'A';
}

/**
 * Obtem a proxima materia da lista de relevancia para substituir um slot vazio
 */
export function getNextMateriaByRelevance(
  materias: PreparatorioMateria[],
  excludeIds: string[]
): PreparatorioMateria | null {
  const available = materias
    .filter((m) => !excludeIds.includes(m.id))
    .sort((a, b) => b.peso - a.peso);

  return available[0] || null;
}

/**
 * Gera a proxima missao baseada no algoritmo de alternancia
 */
export function generateNextMission(
  context: TrailContext,
  assuntosByMateria: Map<string, Assunto[]>,
  completedAssuntoIds: string[]
): GeneratedMission | null {
  const { slots, lastMissionMateriaId, materias, revisionPool } = context;

  // Determinar qual slot usar
  let nextSlot: 'A' | 'B';
  if (!lastMissionMateriaId) {
    nextSlot = 'A';
  } else if (lastMissionMateriaId === slots.slotA?.id) {
    nextSlot = 'B';
  } else {
    nextSlot = 'A';
  }

  const currentMateria = nextSlot === 'A' ? slots.slotA : slots.slotB;

  if (!currentMateria) {
    // Tentar encontrar uma nova materia
    const excludeIds = [
      slots.slotA?.id,
      slots.slotB?.id,
      ...revisionPool,
    ].filter(Boolean) as string[];

    const newMateria = getNextMateriaByRelevance(materias, excludeIds);
    if (!newMateria) return null;

    // Atualizar slot com nova materia (isso deve ser salvo no banco)
    return generateNextMission(
      {
        ...context,
        slots: {
          ...slots,
          [nextSlot === 'A' ? 'slotA' : 'slotB']: newMateria,
        },
      },
      assuntosByMateria,
      completedAssuntoIds
    );
  }

  // Buscar proximo assunto da materia
  const assuntos = assuntosByMateria.get(currentMateria.id) || [];
  const nextAssunto = assuntos.find(
    (a) => !completedAssuntoIds.includes(a.id)
  );

  if (!nextAssunto) {
    // Materia finalizada - mover para pool de revisao
    // O frontend deve atualizar o estado
    return {
      assunto: assuntos[0]!, // Revisao do primeiro assunto
      materia: currentMateria,
      slot: nextSlot,
      tipo: 'revisao' as MissionType,
    };
  }

  return {
    assunto: nextAssunto,
    materia: currentMateria,
    slot: nextSlot,
    tipo: 'normal' as MissionType,
  };
}

/**
 * Gera um lote de missoes para uma rodada
 */
export function generateRoundMissions(
  context: TrailContext,
  assuntosByMateria: Map<string, Assunto[]>,
  completedAssuntoIds: string[],
  missionsPerRound: number = 6
): GeneratedMission[] {
  const missions: GeneratedMission[] = [];
  let tempContext = { ...context };
  let tempCompletedIds = [...completedAssuntoIds];

  for (let i = 0; i < missionsPerRound; i++) {
    const mission = generateNextMission(
      tempContext,
      assuntosByMateria,
      tempCompletedIds
    );

    if (!mission) break;

    missions.push(mission);
    tempCompletedIds.push(mission.assunto.id);
    tempContext = {
      ...tempContext,
      lastMissionMateriaId: mission.materia.id,
    };
  }

  // Adicionar missao tecnica no final da rodada
  if (missions.length > 0) {
    const lastMission = missions[missions.length - 1];
    missions.push({
      assunto: lastMission.assunto, // Usar o ultimo assunto como referencia
      materia: lastMission.materia,
      slot: lastMission.slot === 'A' ? 'B' : 'A',
      tipo: 'tecnica' as MissionType,
    });
  }

  return missions;
}

/**
 * Verifica se o usuario passou na massificacao
 */
export function checkMassification(result: MissionResult): MassificationCheck {
  const passed = result.score >= PASSING_SCORE;

  return {
    passed,
    score: result.score,
    requiredScore: PASSING_SCORE,
    action: passed ? 'unlock_next' : 'massification_required',
  };
}

/**
 * Calcula o XP ganho em uma missao
 */
export function calculateMissionXP(
  result: MissionResult,
  userLevel: UserLevel
): { xp: number; coins: number } {
  const baseXP = result.correctAnswers * 10;
  const bonusStreak = result.score >= 80 ? 20 : 0;
  const bonusPerfect = result.score === 100 ? 50 : 0;
  const bonusFirstTry = result.missionId && !result.missionId.includes('retry') ? 10 : 0;

  const xp = baseXP + bonusStreak + bonusPerfect;
  const coins = Math.floor(xp / 10) + bonusFirstTry;

  return { xp, coins };
}

/**
 * Determina o numero de questoes para uma missao baseado no nivel e materia
 */
export function getMissionQuestionCount(
  materia: string,
  userLevel: UserLevel
): number {
  return getQuestionsLimit(materia, userLevel);
}

/**
 * Verifica se uma rodada foi completada
 */
export function isRoundCompleted(missions: TrailMission[]): boolean {
  return missions.every(
    (m) => m.status === 'completed' || m.status === 'locked'
  );
}

/**
 * Obtem a proxima missao disponivel
 */
export function getNextAvailableMission(
  missions: TrailMission[]
): TrailMission | null {
  return missions.find((m) => m.status === 'available') || null;
}

/**
 * Atualiza o status das missoes apos completar uma
 */
export function updateMissionsAfterCompletion(
  missions: TrailMission[],
  completedMissionId: string,
  score: number
): TrailMission[] {
  const check = checkMassification({
    missionId: completedMissionId,
    totalQuestions: 10,
    correctAnswers: Math.round(score / 10),
    score,
    timeSpent: 0,
    answers: [],
  });

  return missions.map((mission, index) => {
    if (mission.id === completedMissionId) {
      return {
        ...mission,
        status: check.passed ? 'completed' : 'massification',
        score,
        completed_at: check.passed ? new Date().toISOString() : undefined,
      };
    }

    // Se passou, desbloquear a proxima missao
    if (check.passed) {
      const completedIndex = missions.findIndex((m) => m.id === completedMissionId);
      if (index === completedIndex + 1 && mission.status === 'locked') {
        return {
          ...mission,
          status: 'available' as MissionStatus,
        };
      }
    }

    return mission;
  });
}

/**
 * Cria a estrutura inicial de uma trilha para um novo usuario
 */
export function createInitialTrailStructure(
  userId: string,
  preparatorioId: string,
  materias: PreparatorioMateria[],
  userLevel: UserLevel
): {
  trail: Partial<UserTrail>;
  slots: TrailSlots;
} {
  const slots = initializeSlots(materias);

  return {
    trail: {
      user_id: userId,
      preparatorio_id: preparatorioId,
      nivel_usuario: userLevel,
      slot_a_materia_id: slots.slotA?.id,
      slot_b_materia_id: slots.slotB?.id,
      current_round: 1,
    },
    slots,
  };
}
