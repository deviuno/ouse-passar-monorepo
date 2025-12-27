import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  UserTrail,
  TrailRound,
  TrailMission,
  TrailMapData,
  TrailRoundWithMissions,
  Preparatorio,
  PreparatorioMateria,
  MissionStatus,
  UserPreparatorio,
} from '../types';
import { STORAGE_KEYS } from '../constants';
import { supabase } from '../services/supabaseClient';

// Helper type for mission URL params
export interface MissionUrlParams {
  prepSlug: string;
  roundNum: number;
  missionNum: number;
}

interface TrailState {
  // User's preparatorios
  userPreparatorios: UserPreparatorio[];
  selectedPreparatorioId: string | null;

  // Current trail data
  currentTrail: UserTrail | null;
  rounds: TrailRoundWithMissions[];
  preparatorio: Preparatorio | null;
  materias: PreparatorioMateria[];

  // UI state
  isLoading: boolean;
  currentMissionId: string | null;
  selectedMissionId: string | null;

  // Animation state - para animar avatar após completar missão
  justCompletedMissionId: string | null;

  // Round navigation state
  viewingRoundIndex: number;

  // Actions - Preparatorios
  setUserPreparatorios: (preparatorios: UserPreparatorio[]) => void;
  setSelectedPreparatorioId: (id: string | null, userId?: string) => void;
  addUserPreparatorio: (preparatorio: UserPreparatorio) => void;
  getSelectedPreparatorio: () => UserPreparatorio | null;
  loadMainPreparatorioFromDb: (userId: string) => Promise<string | null>;

  // Actions - Trail
  setCurrentTrail: (trail: UserTrail | null) => void;
  setRounds: (rounds: TrailRoundWithMissions[]) => void;
  setPreparatorio: (preparatorio: Preparatorio | null) => void;
  setMaterias: (materias: PreparatorioMateria[]) => void;
  setLoading: (loading: boolean) => void;
  setCurrentMissionId: (id: string | null) => void;
  setSelectedMissionId: (id: string | null) => void;

  // Mission actions
  updateMissionStatus: (missionId: string, status: MissionStatus, score?: number) => void;
  completeMission: (missionId: string, score: number) => void;
  unlockNextMission: (currentMissionId: string) => void;
  clearJustCompletedMission: () => void;

  // Round actions
  updateRoundStatus: (roundId: string, status: 'locked' | 'active' | 'completed') => void;
  setViewingRoundIndex: (index: number) => void;
  goToPreviousRound: () => void;
  goToNextRound: () => void;
  getCurrentActiveRoundIndex: () => number;

  // Computed
  getMapData: () => TrailMapData | null;
  getCurrentMission: () => TrailMission | null;
  getNextAvailableMission: () => TrailMission | null;
  getMissionById: (id: string) => TrailMission | null;
  getRoundById: (id: string) => TrailRoundWithMissions | null;

  // URL helpers
  getMissionUrl: (mission: TrailMission) => string;
  getMissionByUrlParams: (params: MissionUrlParams) => TrailMission | null;
  getMissionUrlParams: (mission: TrailMission) => MissionUrlParams | null;

  // Reset
  reset: () => void;
}

export const useTrailStore = create<TrailState>()(
  persist(
    (set, get) => ({
      // User's preparatorios
      userPreparatorios: [],
      selectedPreparatorioId: null,

      // Current trail data
      currentTrail: null,
      rounds: [],
      preparatorio: null,
      materias: [],
      isLoading: false,
      currentMissionId: null,
      selectedMissionId: null,

      // Animation state
      justCompletedMissionId: null,

      // Round navigation
      viewingRoundIndex: 0,

      // Actions - Preparatorios
      setUserPreparatorios: (userPreparatorios) => set({ userPreparatorios }),
      setSelectedPreparatorioId: (selectedPreparatorioId, userId) => {
        set({ selectedPreparatorioId });

        // Persistir no banco de dados se temos userId
        if (selectedPreparatorioId && userId) {
          const { userPreparatorios } = get();
          const selected = userPreparatorios.find((p) => p.id === selectedPreparatorioId);
          if (selected?.preparatorio_id) {
            // Atualizar main_preparatorio_id no perfil do usuário
            supabase
              .from('user_profiles')
              .update({ main_preparatorio_id: selected.preparatorio_id })
              .eq('id', userId)
              .then(({ error }) => {
                if (error) {
                  console.error('[useTrailStore] Erro ao salvar preparatório principal:', error);
                } else {
                  console.log('[useTrailStore] Preparatório principal salvo:', selected.preparatorio_id);
                }
              });
          }
        }
      },
      addUserPreparatorio: (preparatorio) =>
        set((state) => ({
          userPreparatorios: [...state.userPreparatorios, preparatorio],
        })),
      getSelectedPreparatorio: () => {
        const { userPreparatorios, selectedPreparatorioId } = get();
        return userPreparatorios.find((p) => p.id === selectedPreparatorioId) || null;
      },
      loadMainPreparatorioFromDb: async (userId: string) => {
        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('main_preparatorio_id')
            .eq('id', userId)
            .single();

          if (error) {
            console.error('[useTrailStore] Erro ao carregar preparatório principal:', error);
            return null;
          }

          return data?.main_preparatorio_id || null;
        } catch (err) {
          console.error('[useTrailStore] Exception ao carregar preparatório principal:', err);
          return null;
        }
      },

      // Actions - Trail
      setCurrentTrail: (currentTrail) => set({ currentTrail }),
      setRounds: (rounds) => set({ rounds }),
      setPreparatorio: (preparatorio) => set({ preparatorio }),
      setMaterias: (materias) => set({ materias }),
      setLoading: (isLoading) => set({ isLoading }),
      setCurrentMissionId: (currentMissionId) => set({ currentMissionId }),
      setSelectedMissionId: (selectedMissionId) => set({ selectedMissionId }),

      updateMissionStatus: (missionId, status, score) =>
        set((state) => ({
          rounds: state.rounds.map((round) => ({
            ...round,
            missions: round.missions.map((mission) =>
              mission.id === missionId
                ? {
                    ...mission,
                    status,
                    score: score !== undefined ? score : mission.score,
                    completed_at: status === 'completed' ? new Date().toISOString() : mission.completed_at,
                  }
                : mission
            ),
          })),
        })),

      completeMission: (missionId, score) => {
        const { updateMissionStatus, unlockNextMission } = get();
        updateMissionStatus(missionId, 'completed', score);
        unlockNextMission(missionId);
        // Salvar qual missão foi completada para animar na trilha
        set({ justCompletedMissionId: missionId });
      },

      clearJustCompletedMission: () => set({ justCompletedMissionId: null }),

      unlockNextMission: (currentMissionId) => {
        const { rounds } = get();
        let foundCurrent = false;
        let nextMission: TrailMission | null = null;

        // Find the next mission after the current one
        for (const round of rounds) {
          for (const mission of round.missions) {
            if (foundCurrent && mission.status === 'locked') {
              nextMission = mission;
              break;
            }
            if (mission.id === currentMissionId) {
              foundCurrent = true;
            }
          }
          if (nextMission) break;
        }

        if (nextMission) {
          set((state) => ({
            rounds: state.rounds.map((round) => ({
              ...round,
              missions: round.missions.map((mission) =>
                mission.id === nextMission!.id
                  ? { ...mission, status: 'available' as MissionStatus }
                  : mission
              ),
            })),
          }));
        }
      },

      updateRoundStatus: (roundId, status) =>
        set((state) => ({
          rounds: state.rounds.map((round) =>
            round.id === roundId
              ? {
                  ...round,
                  status,
                  completed_at: status === 'completed' ? new Date().toISOString() : round.completed_at,
                }
              : round
          ),
        })),

      setViewingRoundIndex: (viewingRoundIndex) => set({ viewingRoundIndex }),

      goToPreviousRound: () => {
        const { viewingRoundIndex } = get();
        if (viewingRoundIndex > 0) {
          set({ viewingRoundIndex: viewingRoundIndex - 1 });
        }
      },

      goToNextRound: () => {
        const { viewingRoundIndex, rounds } = get();
        if (viewingRoundIndex < rounds.length - 1) {
          set({ viewingRoundIndex: viewingRoundIndex + 1 });
        }
      },

      getCurrentActiveRoundIndex: () => {
        const { rounds } = get();
        let lastActiveIndex = 0;
        for (let i = 0; i < rounds.length; i++) {
          if (rounds[i].status !== 'locked') {
            lastActiveIndex = i;
          }
        }
        return lastActiveIndex;
      },

      getMapData: () => {
        const { currentTrail, rounds, currentMissionId } = get();
        if (!currentTrail) return null;

        return {
          trail: currentTrail,
          rounds,
          currentMissionId: currentMissionId || undefined,
        };
      },

      getCurrentMission: () => {
        const { rounds, currentMissionId } = get();
        if (!currentMissionId) return null;

        for (const round of rounds) {
          const mission = round.missions.find((m) => m.id === currentMissionId);
          if (mission) return mission;
        }
        return null;
      },

      getNextAvailableMission: () => {
        const { rounds } = get();

        for (const round of rounds) {
          // needs_massificacao também é considerada disponível - o aluno precisa refazer
          const availableMission = round.missions.find(
            (m) => m.status === 'available' || m.status === 'needs_massificacao'
          );
          if (availableMission) return availableMission;
        }
        return null;
      },

      getMissionById: (id) => {
        const { rounds } = get();
        for (const round of rounds) {
          const mission = round.missions.find((m) => m.id === id);
          if (mission) return mission;
        }
        return null;
      },

      getRoundById: (id) => {
        const { rounds } = get();
        return rounds.find((r) => r.id === id) || null;
      },

      // URL helpers
      getMissionUrl: (mission) => {
        const { rounds, preparatorio } = get();
        if (!preparatorio?.slug) return `/missao/${mission.id}`;

        const round = rounds.find((r) => r.id === mission.round_id);
        if (!round) return `/missao/${mission.id}`;

        return `/${preparatorio.slug}/r/${round.round_number}/m/${mission.ordem}`;
      },

      getMissionByUrlParams: (params) => {
        const { rounds, userPreparatorios } = get();

        // Find preparatorio by slug
        const userPrep = userPreparatorios.find(
          (up) => up.preparatorio?.slug === params.prepSlug
        );
        if (!userPrep) return null;

        // Find round by number
        const round = rounds.find((r) => r.round_number === params.roundNum);
        if (!round) return null;

        // Find mission by ordem
        const mission = round.missions.find((m) => m.ordem === params.missionNum);
        return mission || null;
      },

      getMissionUrlParams: (mission) => {
        const { rounds, preparatorio } = get();
        if (!preparatorio?.slug) return null;

        const round = rounds.find((r) => r.id === mission.round_id);
        if (!round) return null;

        return {
          prepSlug: preparatorio.slug,
          roundNum: round.round_number,
          missionNum: mission.ordem,
        };
      },

      reset: () =>
        set({
          userPreparatorios: [],
          selectedPreparatorioId: null,
          currentTrail: null,
          rounds: [],
          preparatorio: null,
          materias: [],
          isLoading: false,
          currentMissionId: null,
          selectedMissionId: null,
          justCompletedMissionId: null,
          viewingRoundIndex: 0,
        }),
    }),
    {
      name: STORAGE_KEYS.CURRENT_TRAIL,
      partialize: (state) => ({
        currentTrail: state.currentTrail,
        currentMissionId: state.currentMissionId,
        selectedPreparatorioId: state.selectedPreparatorioId,
        rounds: state.rounds,
        preparatorio: state.preparatorio,
        viewingRoundIndex: state.viewingRoundIndex,
        userPreparatorios: state.userPreparatorios, // Persistir para evitar recarregar ao voltar para trilha
      }),
    }
  )
);
