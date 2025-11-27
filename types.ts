
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
  alternativas: string; // JSON string
  gabarito: string;
  comentario: string | null;
  orgao: string;
  banca: string;
  ano: number;
  // Handling potential nulls/missing fields based on description
  imagens_enunciado?: string | null;
  imagens_comentario?: string | null;
  explicacaoPegadinha?: string | null; // New field
}

export interface CommunityStats {
  alternative: string;
  percentage: number;
}

export interface ParsedQuestion extends Omit<RawQuestion, 'alternativas'> {
  alternativas: string; // Keep the original JSON string for compatibility
  parsedAlternativas: Alternative[];
  isPegadinha?: boolean; // Derived from data analysis
  communityStats?: CommunityStats[];
}

export interface UserAnswer {
  questionId: number;
  selectedLetter: string;
  correctLetter: string;
  isCorrect: boolean;
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

export interface Course {
  id: string;
  title: string;
  subtitle: string;
  icon: string;
  image?: string; // New field for Vertical Cards
  isOwned: boolean;
  price?: string;
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
    courses: string[]; // e.g. "PRF", "TJ-SP"
    online: boolean;
}

export type StudyMode = 'zen' | 'hard' | 'reta_final' | 'review';

export type StoreItemType = 'avatar' | 'theme' | 'powerup';

export interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: StoreItemType;
  icon: string; 
  value?: string; // specific value like color code or image url
}

export interface Flashcard {
  id: string;
  questionId: number;
  front: string; // The concept/question
  back: string;  // The answer/explanation
  masteryLevel: 'new' | 'learning' | 'mastered';
  materia?: string;
  assunto?: string;
}

export interface ReviewItem {
  questionId: number;
  nextReviewDate: number; // Timestamp
  lastDifficulty: 'error' | 'hard' | 'medium' | 'easy';
  interval: number; // Days until next review
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