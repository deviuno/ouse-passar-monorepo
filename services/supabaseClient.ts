import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase environment variables missing. Some features may not work.');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

// Types for database tables
export interface DbUserProfile {
  id: string;
  email: string | null;
  name: string | null;
  avatar_url: string | null;
  xp: number;
  coins: number;
  streak: number;
  level: number;
  correct_answers: number;
  total_answered: number;
  avatar_id: string;
  league_tier: 'ferro' | 'bronze' | 'prata' | 'ouro' | 'diamante';
  created_at: string;
  updated_at: string;
}

export interface DbQuestion {
  id: number;
  materia: string;
  assunto: string | null;
  concurso: string | null;
  enunciado: string;
  alternativas: { letter: string; text: string }[];
  gabarito: string;
  comentario: string | null;
  orgao: string | null;
  cargo_area_especialidade_edicao: string | null;
  prova: string | null;
  ano: number | null;
  banca: string | null;
  imagens_enunciado: string | null;
  imagens_comentario: string[] | null;
  questao_revisada: string | null;
  is_pegadinha: boolean;
  explicacao_pegadinha: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbCourse {
  id: string;
  title: string;
  subtitle: string | null;
  icon: string | null;
  image_url: string | null;
  price: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface DbUserAnswer {
  id: string;
  user_id: string;
  question_id: number;
  selected_letter: string;
  correct_letter: string;
  is_correct: boolean;
  time_taken: number | null;
  study_mode: 'zen' | 'hard' | 'reta_final' | 'review' | 'pvp' | null;
  session_id: string | null;
  answered_at: string;
}

export interface DbUserReview {
  id: string;
  user_id: string;
  question_id: number;
  next_review_date: string;
  last_difficulty: 'error' | 'hard' | 'medium' | 'easy' | null;
  interval_days: number;
  repetitions: number;
  ease_factor: number;
  created_at: string;
  updated_at: string;
}

export interface DbUserFlashcard {
  id: string;
  user_id: string;
  question_id: number | null;
  front: string;
  back: string;
  materia: string | null;
  assunto: string | null;
  mastery_level: 'new' | 'learning' | 'mastered';
  next_review_date: string | null;
  created_at: string;
  updated_at: string;
}

export interface DbStudySession {
  id: string;
  user_id: string;
  course_id: string | null;
  study_mode: 'zen' | 'hard' | 'reta_final' | 'review' | 'pvp';
  total_questions: number;
  correct_answers: number;
  time_limit: number | null;
  started_at: string;
  finished_at: string | null;
  xp_earned: number;
  coins_earned: number;
}
