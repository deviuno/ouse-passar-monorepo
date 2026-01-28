// Re-export all types
export * from './trail';
export * from './user';

// Types existentes migrados
export interface Alternative {
  letter: string;
  text: string;
}

export interface RawQuestion {
  id: number;
  materia: string;
  assunto: string;
  concurso: string;
  enunciado: string;
  alternativas: string;
  gabarito: string;
  comentario: string | null;
  orgao: string;
  banca: string;
  ano: number;
  imagens_enunciado?: string | null;
  imagens_comentario?: string | null;
  explicacaoPegadinha?: string | null;
}

export interface CommunityStats {
  alternative: string;
  percentage: number;
}

export interface ParsedQuestion extends Omit<RawQuestion, 'alternativas'> {
  alternativas: string;
  parsedAlternativas: Alternative[];
  isPegadinha?: boolean;
  isAiGenerated?: boolean;
  communityStats?: CommunityStats[];
}

export interface UserAnswer {
  questionId: number;
  selectedLetter: string;
  correctLetter: string;
  isCorrect: boolean;
}

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  image?: string;
  isOwned: boolean;
  price?: string;
  blockSize?: number;
}

export interface Comment {
  id: string;
  author: string;
  avatar?: string;
  text: string;
  likes: number;
  dislikes: number;
  timeAgo: string;
  replies?: Comment[];
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
}

export interface LeagueUser {
  rank: number;
  name: string;
  xp: string;
  avatar: string;
  isCurrentUser: boolean;
  trend: 'up' | 'down' | 'same';
}

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  courses: string[];
  online: boolean;
}

// Modo de prática/estudo de questões (diferente de StudyMode que é 'normal' | 'reta_final')
export type PracticeMode = 'zen' | 'hard' | 'reta_final' | 'review';

export type StoreItemType = 'avatar' | 'theme' | 'powerup';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: StoreItemType;
  icon: string;
  value?: string;
}

export interface Flashcard {
  id: string;
  questionId: number;
  front: string;
  back: string;
  masteryLevel: 'new' | 'learning' | 'mastered';
  materia?: string;
  assunto?: string;
}

export interface ReviewItem {
  questionId: number;
  nextReviewDate: number;
  lastDifficulty: 'error' | 'hard' | 'medium' | 'easy';
  interval: number;
}

export interface EssayFeedback {
  score: number;
  maxScore: number;
  generalComment: string;
  competencies: {
    grammar: { score: number; feedback: string };
    structure: { score: number; feedback: string };
    content: { score: number; feedback: string };
  };
  improvedParagraph?: string;
}

export type ToastType = 'success' | 'error' | 'info';

export interface ToastMessage {
  id: string;
  type: ToastType;
  message: string;
}

export type GamificationModalType = 'coins' | 'streak' | 'ranking' | 'level' | 'league' | 'daily_goal' | null;

export type LeagueTier = 'ferro' | 'bronze' | 'prata' | 'ouro' | 'diamante';

export interface UserStats {
  xp: number;
  streak: number;
  level: number;
  correctAnswers: number;
  totalAnswered: number;
  coins: number;
  avatarId?: string;
  lastPracticeDate?: string | null;
}

// Simulados
export interface Simulado {
  id: string;
  nome: string;
  preparatorio_id: string;
  duracao_minutos: number;
  total_questoes: number;
  is_premium: boolean;
  preco?: number;
  created_at: string;
}

export interface Caderno {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  filters: any; // Using any to avoid circular dependency with FilterOptions
  settings?: {
    questionCount?: number;
    studyMode?: 'zen' | 'hard';
    toggleFilters?: any;
  };
  questions_count?: number;
  saved_questions_count?: number;
  is_favorite: boolean;
  created_at: string;
}

export interface CadernoQuestao {
  id: string;
  caderno_id: string;
  questao_id: number;
  nota?: string;
  created_at: string;
}

export interface SimuladoResult {
  id: string;
  user_id: string;
  simulado_id: string;
  score: number;
  tempo_gasto: number;
  ranking_position?: number;
  completed_at: string;
}

// Notificações
export interface AppNotification {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning' | 'error';
  link?: string;
}

// Preparatorio é exportado de ./trail
