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

  // Actions - Preparatorios
  setUserPreparatorios: (preparatorios: UserPreparatorio[]) => void;
  setSelectedPreparatorioId: (id: string | null) => void;
  addUserPreparatorio: (preparatorio: UserPreparatorio) => void;
  getSelectedPreparatorio: () => UserPreparatorio | null;

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

  // Round actions
  updateRoundStatus: (roundId: string, status: 'locked' | 'active' | 'completed') => void;

  // Computed
  getMapData: () => TrailMapData | null;
  getCurrentMission: () => TrailMission | null;
  getNextAvailableMission: () => TrailMission | null;
  getMissionById: (id: string) => TrailMission | null;
  getRoundById: (id: string) => TrailRoundWithMissions | null;

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

      // Actions - Preparatorios
      setUserPreparatorios: (userPreparatorios) => set({ userPreparatorios }),
      setSelectedPreparatorioId: (selectedPreparatorioId) => set({ selectedPreparatorioId }),
      addUserPreparatorio: (preparatorio) =>
        set((state) => ({
          userPreparatorios: [...state.userPreparatorios, preparatorio],
        })),
      getSelectedPreparatorio: () => {
        const { userPreparatorios, selectedPreparatorioId } = get();
        return userPreparatorios.find((p) => p.id === selectedPreparatorioId) || null;
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
      },

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
          const availableMission = round.missions.find((m) => m.status === 'available');
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
        }),
    }),
    {
      name: STORAGE_KEYS.CURRENT_TRAIL,
      partialize: (state) => ({
        currentTrail: state.currentTrail,
        currentMissionId: state.currentMissionId,
        selectedPreparatorioId: state.selectedPreparatorioId,
      }),
    }
  )
);
