// Types para usuario e onboarding
import { UserLevel } from './trail';

export type LeagueTier = 'ferro' | 'bronze' | 'prata' | 'ouro' | 'diamante';

// Schedule por dia da semana (em minutos)
export interface WeeklySchedule {
  domingo: number;
  segunda: number;
  terca: number;
  quarta: number;
  quinta: number;
  sexta: number;
  sabado: number;
}

export const DEFAULT_SCHEDULE: WeeklySchedule = {
  domingo: 0,
  segunda: 60,
  terca: 60,
  quarta: 60,
  quinta: 60,
  sexta: 60,
  sabado: 120,
};

export const DAYS_OF_WEEK = [
  { key: 'segunda' as keyof WeeklySchedule, label: 'S', fullLabel: 'Segunda-feira' },
  { key: 'terca' as keyof WeeklySchedule, label: 'T', fullLabel: 'Terça-feira' },
  { key: 'quarta' as keyof WeeklySchedule, label: 'Q', fullLabel: 'Quarta-feira' },
  { key: 'quinta' as keyof WeeklySchedule, label: 'Q', fullLabel: 'Quinta-feira' },
  { key: 'sexta' as keyof WeeklySchedule, label: 'S', fullLabel: 'Sexta-feira' },
  { key: 'sabado' as keyof WeeklySchedule, label: 'S', fullLabel: 'Sábado' },
  { key: 'domingo' as keyof WeeklySchedule, label: 'D', fullLabel: 'Domingo' },
] as const;

export type OnboardingStepName = 'cadastro' | 'concurso' | 'nivel' | 'disponibilidade' | 'completed';

export interface UserOnboarding {
  id: string;
  user_id: string;
  onboarding_step?: OnboardingStepName;
  concurso_alvo?: string;
  nivel_conhecimento?: UserLevel;
  schedule?: WeeklySchedule;
  materias_dominadas?: string[];
  completed_at?: string;
  created_at: string;
  updated_at?: string;
}

// Dados de cadastro do usuário
export interface UserRegistration {
  name: string;
  email: string;
  phone: string;
  password: string;
}

export interface UserProfile {
  id: string;
  email?: string;
  name?: string;
  avatar_url?: string;
  role?: 'admin' | 'user';
  xp: number;
  coins: number;
  streak: number;
  level: number;
  correct_answers: number;
  total_answered: number;
  avatar_id: string;
  league_tier: LeagueTier;
  created_at: string;
  updated_at: string;
}

export interface UserStats {
  xp: number;
  streak: number;
  level: number;
  correctAnswers: number;
  totalAnswered: number;
  coins: number;
  avatarId?: string;
}

export interface WeeklyRankingUser {
  id: string;
  name: string;
  avatar_url?: string;
  xp: number;
  league_tier: LeagueTier;
  rank: number;
}

// Estatisticas detalhadas (Raio-X do Aluno)
export interface StudentAnalytics {
  taxaAcertoGlobal: number;
  taxaAcertoPorMateria: MateriaStats[];
  tempoMedioPorQuestao: number;
  comparativoMedia: ComparativoStats;
  evolucaoSemanal: EvolucaoSemanal[];
  pontosFortes: string[];
  pontosFracos: string[];
}

export interface MateriaStats {
  materia: string;
  acertos: number;
  total: number;
  percentual: number;
  status: 'forte' | 'medio' | 'fraco';
}

export interface ComparativoStats {
  suaPosicao: number;
  totalUsuarios: number;
  percentilGeral: number;
  comparativoPorMateria: {
    materia: string;
    seuPercentual: number;
    mediaGeral: number;
    diferenca: number;
  }[];
}

export interface EvolucaoSemanal {
  semana: string;
  questoesRespondidas: number;
  taxaAcerto: number;
  xpGanho: number;
}
