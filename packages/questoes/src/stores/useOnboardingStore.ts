import { create } from 'zustand';
import { OnboardingStep, ONBOARDING_STEPS } from '../constants';
import { UserLevel, WeeklySchedule, DEFAULT_SCHEDULE, UserRegistration } from '../types';

interface OnboardingData {
  // Passo 1: Cadastro
  name?: string;
  email?: string;
  phone?: string;
  password?: string;

  // Passo 2: Concurso
  concurso_alvo?: string;

  // Passo 3: Nível
  nivel_conhecimento?: UserLevel;

  // Passo 4: Disponibilidade
  schedule: WeeklySchedule;
}

interface OnboardingState {
  currentStep: OnboardingStep;
  stepIndex: number;
  data: OnboardingData;
  isCompleted: boolean;

  // Navigation
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: OnboardingStep) => void;

  // Passo 1: Cadastro
  setName: (name: string) => void;
  setEmail: (email: string) => void;
  setPhone: (phone: string) => void;
  setPassword: (password: string) => void;

  // Passo 2: Concurso
  setConcursoAlvo: (concurso: string) => void;

  // Passo 3: Nível
  setNivelConhecimento: (nivel: UserLevel) => void;

  // Passo 4: Disponibilidade
  toggleDay: (day: keyof WeeklySchedule) => void;
  setDayMinutes: (day: keyof WeeklySchedule, minutes: number) => void;

  // Completion
  complete: () => void;

  // Reset
  reset: () => void;

  // Computed
  canGoNext: () => boolean;
  getProgress: () => { current: number; total: number; percentage: number };
  getWeeklyTotal: () => number;
  getRegistrationData: () => UserRegistration | null;
  getPreferencesData: () => {
    target_contest_id: string;
    proficiency_level: string;
    schedule: WeeklySchedule;
  } | null;
}

export const useOnboardingStore = create<OnboardingState>()((set, get) => ({
  currentStep: 'inicio',
  stepIndex: 0,
  data: {
    schedule: { ...DEFAULT_SCHEDULE },
  },
  isCompleted: false,

  nextStep: () => {
    const { stepIndex, currentStep } = get();
    const nextIndex = Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1);
    const nextStepValue = ONBOARDING_STEPS[nextIndex];
    console.log('[useOnboardingStore] nextStep:', {
      from: currentStep,
      fromIndex: stepIndex,
      to: nextStepValue,
      toIndex: nextIndex,
    });
    set({
      stepIndex: nextIndex,
      currentStep: nextStepValue,
    });
  },

  previousStep: () => {
    const { stepIndex, currentStep } = get();
    const prevIndex = Math.max(stepIndex - 1, 0);
    const prevStepValue = ONBOARDING_STEPS[prevIndex];
    console.log('[useOnboardingStore] previousStep:', {
      from: currentStep,
      fromIndex: stepIndex,
      to: prevStepValue,
      toIndex: prevIndex,
    });
    set({
      stepIndex: prevIndex,
      currentStep: prevStepValue,
    });
  },

  goToStep: (step) => {
    const { currentStep, stepIndex } = get();
    const index = ONBOARDING_STEPS.indexOf(step);
    console.log('[useOnboardingStore] goToStep:', {
      from: currentStep,
      fromIndex: stepIndex,
      to: step,
      toIndex: index,
    });
    if (index >= 0) {
      set({
        stepIndex: index,
        currentStep: step,
      });
    }
  },

  // Passo 1: Cadastro
  setName: (name) =>
    set((state) => ({
      data: { ...state.data, name },
    })),

  setEmail: (email) =>
    set((state) => ({
      data: { ...state.data, email },
    })),

  setPhone: (phone) =>
    set((state) => ({
      data: { ...state.data, phone },
    })),

  setPassword: (password) =>
    set((state) => ({
      data: { ...state.data, password },
    })),

  // Passo 2: Concurso
  setConcursoAlvo: (concurso_alvo) =>
    set((state) => ({
      data: { ...state.data, concurso_alvo },
    })),

  // Passo 3: Nível
  setNivelConhecimento: (nivel_conhecimento) =>
    set((state) => ({
      data: { ...state.data, nivel_conhecimento },
    })),

  // Passo 4: Disponibilidade
  toggleDay: (day) =>
    set((state) => ({
      data: {
        ...state.data,
        schedule: {
          ...state.data.schedule,
          [day]: state.data.schedule[day] > 0 ? 0 : 60, // Toggle entre 0 e 60 minutos
        },
      },
    })),

  setDayMinutes: (day, minutes) =>
    set((state) => ({
      data: {
        ...state.data,
        schedule: {
          ...state.data.schedule,
          [day]: Math.max(0, Math.min(480, minutes)), // Min 0, Max 8 horas
        },
      },
    })),

  complete: () => set({ isCompleted: true }),

  reset: () =>
    set({
      currentStep: 'inicio',
      stepIndex: 0,
      data: {
        schedule: { ...DEFAULT_SCHEDULE },
      },
      isCompleted: false,
    }),

  canGoNext: () => {
    const { currentStep, data } = get();

    switch (currentStep) {
      case 'inicio':
        // Sempre pode avançar (escolha é feita pelo botão)
        return true;
      case 'cadastro':
        // Validar todos os campos do cadastro
        return !!(
          data.name?.trim() &&
          data.email?.trim() &&
          data.phone?.trim() &&
          data.password?.trim() &&
          data.password.length >= 6
        );
      case 'concurso':
        return !!data.concurso_alvo;
      case 'nivel':
        return !!data.nivel_conhecimento;
      case 'disponibilidade':
        // Precisa ter pelo menos um dia com mais de 0 minutos
        return get().getWeeklyTotal() > 0;
      case 'loading':
        return true;
      default:
        return false;
    }
  },

  getProgress: () => {
    const { currentStep } = get();
    // Excluir 'inicio' e 'loading' do progresso visual
    // Steps visuais: cadastro (1), concurso (2), nivel (3), disponibilidade (4)
    const visualSteps = ['cadastro', 'concurso', 'nivel', 'disponibilidade'];
    const total = visualSteps.length;
    const currentVisualIndex = visualSteps.indexOf(currentStep);
    const current = currentVisualIndex >= 0 ? currentVisualIndex + 1 : 0;
    const percentage = total > 0 ? (current / total) * 100 : 0;
    return { current, total, percentage };
  },

  getWeeklyTotal: () => {
    const { schedule } = get().data;
    return Object.values(schedule).reduce((acc, val) => acc + val, 0);
  },

  getRegistrationData: () => {
    const { data } = get();
    if (!data.name || !data.email || !data.phone || !data.password) {
      return null;
    }
    return {
      name: data.name,
      email: data.email,
      phone: data.phone,
      password: data.password,
    };
  },

  getPreferencesData: () => {
    const { data } = get();
    if (!data.concurso_alvo || !data.nivel_conhecimento) {
      return null;
    }
    return {
      target_contest_id: data.concurso_alvo,
      proficiency_level: data.nivel_conhecimento,
      schedule: data.schedule,
    };
  },
}));
