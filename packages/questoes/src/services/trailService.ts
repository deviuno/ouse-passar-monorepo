// Trail Service - Servico para gerenciar a trilha do usuario
import { supabase } from './supabaseClient';
import {
  UserTrail,
  TrailRound,
  TrailMission,
  TrailRoundWithMissions,
  Preparatorio,
  PreparatorioMateria,
  Assunto,
  MissionStatus,
  UserLevel,
} from '../types';
import {
  createInitialTrailStructure,
  generateRoundMissions,
  initializeSlots,
} from '../lib/trailAlgorithm';

export const trailService = {
  /**
   * Busca todos os preparatorios disponiveis
   */
  async fetchPreparatorios(): Promise<Preparatorio[]> {
    const { data, error } = await supabase
      .from('preparatorios')
      .select('*')
      .eq('is_active', true)
      .order('nome');

    if (error) throw error;
    return data || [];
  },

  /**
   * Busca um preparatorio pelo slug
   */
  async fetchPreparatorioBySlug(slug: string): Promise<Preparatorio | null> {
    const { data, error } = await supabase
      .from('preparatorios')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Busca as materias de um preparatorio
   */
  async fetchMateriasByPreparatorio(preparatorioId: string): Promise<PreparatorioMateria[]> {
    const { data, error } = await supabase
      .from('preparatorio_materias')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .order('ordem');

    if (error) throw error;
    return data || [];
  },

  /**
   * Busca os assuntos de uma materia
   */
  async fetchAssuntosByMateria(materiaId: string): Promise<Assunto[]> {
    const { data, error } = await supabase
      .from('assuntos')
      .select('*')
      .eq('materia_id', materiaId)
      .order('ordem');

    if (error) throw error;
    return data || [];
  },

  /**
   * Busca a trilha do usuario para um preparatorio
   */
  async fetchUserTrail(userId: string, preparatorioId: string): Promise<UserTrail | null> {
    const { data, error } = await supabase
      .from('user_trails')
      .select('*')
      .eq('user_id', userId)
      .eq('preparatorio_id', preparatorioId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  /**
   * Cria uma nova trilha para o usuario
   */
  async createUserTrail(
    userId: string,
    preparatorioId: string,
    userLevel: UserLevel
  ): Promise<UserTrail> {
    // Buscar materias do preparatorio
    const materias = await this.fetchMateriasByPreparatorio(preparatorioId);

    // Criar estrutura inicial
    const { trail } = createInitialTrailStructure(
      userId,
      preparatorioId,
      materias,
      userLevel
    );

    // Inserir no banco
    const { data, error } = await supabase
      .from('user_trails')
      .insert(trail)
      .select()
      .single();

    if (error) throw error;

    // Criar primeira rodada
    await this.createRound(data.id, 1);

    return data;
  },

  /**
   * Cria uma nova rodada
   */
  async createRound(trailId: string, roundNumber: number): Promise<TrailRound> {
    const { data, error } = await supabase
      .from('trail_rounds')
      .insert({
        trail_id: trailId,
        round_number: roundNumber,
        status: roundNumber === 1 ? 'active' : 'locked',
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Busca as rodadas de uma trilha com suas missoes
   */
  async fetchRoundsWithMissions(trailId: string): Promise<TrailRoundWithMissions[]> {
    // Buscar rodadas
    const { data: rounds, error: roundsError } = await supabase
      .from('trail_rounds')
      .select('*')
      .eq('trail_id', trailId)
      .order('round_number');

    if (roundsError) throw roundsError;

    if (!rounds || rounds.length === 0) return [];

    // Buscar missoes de todas as rodadas
    const { data: missions, error: missionsError } = await supabase
      .from('trail_missions')
      .select(`
        *,
        assunto:assuntos(*),
        materia:preparatorio_materias(*)
      `)
      .in('round_id', rounds.map((r) => r.id))
      .order('ordem');

    if (missionsError) throw missionsError;

    // Agrupar missoes por rodada
    return rounds.map((round) => ({
      ...round,
      missions: (missions || []).filter((m) => m.round_id === round.id),
    }));
  },

  /**
   * Cria missoes para uma rodada
   */
  async createMissionsForRound(
    roundId: string,
    trailId: string,
    preparatorioId: string,
    userLevel: UserLevel
  ): Promise<TrailMission[]> {
    // Buscar materias e assuntos
    const materias = await this.fetchMateriasByPreparatorio(preparatorioId);

    // Buscar assuntos de todas as materias
    const assuntosByMateria = new Map<string, Assunto[]>();
    for (const materia of materias) {
      const assuntos = await this.fetchAssuntosByMateria(materia.id);
      assuntosByMateria.set(materia.id, assuntos);
    }

    // Buscar trilha para contexto
    const { data: trail } = await supabase
      .from('user_trails')
      .select('*')
      .eq('id', trailId)
      .single();

    if (!trail) throw new Error('Trail not found');

    // Buscar missoes completadas
    const { data: completedMissions } = await supabase
      .from('trail_missions')
      .select('assunto_id')
      .eq('status', 'completed');

    const completedAssuntoIds = (completedMissions || [])
      .map((m) => m.assunto_id)
      .filter(Boolean);

    // Gerar missoes
    const slots = initializeSlots(materias);
    const generatedMissions = generateRoundMissions(
      {
        trail,
        materias,
        slots,
        revisionPool: [],
      },
      assuntosByMateria,
      completedAssuntoIds
    );

    // Criar missoes no banco
    const missionsToInsert = generatedMissions.map((gm, index) => ({
      round_id: roundId,
      assunto_id: gm.assunto.id,
      materia_id: gm.materia.id,
      ordem: index + 1,
      status: index === 0 ? 'available' : 'locked',
      tipo: gm.tipo,
    }));

    const { data: insertedMissions, error } = await supabase
      .from('trail_missions')
      .insert(missionsToInsert)
      .select();

    if (error) throw error;
    return insertedMissions || [];
  },

  /**
   * Atualiza o status de uma missao
   */
  async updateMissionStatus(
    missionId: string,
    status: MissionStatus,
    score?: number
  ): Promise<void> {
    const updates: any = { status };

    if (score !== undefined) {
      updates.score = score;
    }

    if (status === 'completed') {
      updates.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from('trail_missions')
      .update(updates)
      .eq('id', missionId);

    if (error) throw error;
  },

  /**
   * Incrementa tentativas de uma missao
   */
  async incrementMissionAttempts(missionId: string): Promise<void> {
    const { error } = await supabase.rpc('increment_mission_attempts', {
      p_mission_id: missionId,
    });

    if (error) {
      // Fallback se RPC nao existir
      const { data } = await supabase
        .from('trail_missions')
        .select('attempts')
        .eq('id', missionId)
        .single();

      if (data) {
        await supabase
          .from('trail_missions')
          .update({ attempts: (data.attempts || 0) + 1 })
          .eq('id', missionId);
      }
    }
  },

  /**
   * Desbloqueia a proxima missao
   */
  async unlockNextMission(currentMissionId: string): Promise<void> {
    // Buscar missao atual e seu round
    const { data: currentMission } = await supabase
      .from('trail_missions')
      .select('round_id, ordem')
      .eq('id', currentMissionId)
      .single();

    if (!currentMission) return;

    // Buscar proxima missao
    const { data: nextMission } = await supabase
      .from('trail_missions')
      .select('id')
      .eq('round_id', currentMission.round_id)
      .eq('ordem', currentMission.ordem + 1)
      .single();

    if (nextMission) {
      await this.updateMissionStatus(nextMission.id, 'available');
    }
  },

  /**
   * Salva respostas de uma missao
   */
  async saveMissionAnswers(
    missionId: string,
    userId: string,
    answers: {
      questionId: string;
      selectedAnswer: string;
      isCorrect: boolean;
      timeSpent: number;
    }[],
    attemptNumber: number
  ): Promise<void> {
    const answersToInsert = answers.map((a) => ({
      mission_id: missionId,
      user_id: userId,
      question_id: a.questionId,
      selected_answer: a.selectedAnswer,
      is_correct: a.isCorrect,
      time_spent: a.timeSpent,
      attempt_number: attemptNumber,
    }));

    const { error } = await supabase
      .from('mission_answers')
      .insert(answersToInsert);

    if (error) throw error;
  },
};

export default trailService;
