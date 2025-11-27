// Auto-generated Supabase types
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      courses: {
        Row: {
          created_at: string | null
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          price: number | null
          subtitle: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          icon?: string | null
          id: string
          image_url?: string | null
          is_active?: boolean | null
          price?: number | null
          subtitle?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          price?: number | null
          subtitle?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      questoes_concurso: {
        Row: {
          alternativas: Json
          ano: number | null
          assunto: string | null
          banca: string | null
          cargo_area_especialidade_edicao: string | null
          comentario: string | null
          concurso: string | null
          created_at: string | null
          enunciado: string
          explicacao_pegadinha: string | null
          gabarito: string
          id: number
          imagens_comentario: string[] | null
          imagens_enunciado: string | null
          is_pegadinha: boolean | null
          materia: string
          orgao: string | null
          prova: string | null
          questao_revisada: string | null
          updated_at: string | null
        }
        Insert: {
          alternativas: Json
          ano?: number | null
          assunto?: string | null
          banca?: string | null
          cargo_area_especialidade_edicao?: string | null
          comentario?: string | null
          concurso?: string | null
          created_at?: string | null
          enunciado: string
          explicacao_pegadinha?: string | null
          gabarito: string
          id?: number
          imagens_comentario?: string[] | null
          imagens_enunciado?: string | null
          is_pegadinha?: boolean | null
          materia: string
          orgao?: string | null
          prova?: string | null
          questao_revisada?: string | null
          updated_at?: string | null
        }
        Update: {
          alternativas?: Json
          ano?: number | null
          assunto?: string | null
          banca?: string | null
          cargo_area_especialidade_edicao?: string | null
          comentario?: string | null
          concurso?: string | null
          created_at?: string | null
          enunciado?: string
          explicacao_pegadinha?: string | null
          gabarito?: string
          id?: number
          imagens_comentario?: string[] | null
          imagens_enunciado?: string | null
          is_pegadinha?: boolean | null
          materia?: string
          orgao?: string | null
          prova?: string | null
          questao_revisada?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      study_sessions: {
        Row: {
          coins_earned: number | null
          correct_answers: number | null
          course_id: string | null
          finished_at: string | null
          id: string
          started_at: string | null
          study_mode: string
          time_limit: number | null
          total_questions: number | null
          user_id: string
          xp_earned: number | null
        }
        Insert: {
          coins_earned?: number | null
          correct_answers?: number | null
          course_id?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          study_mode: string
          time_limit?: number | null
          total_questions?: number | null
          user_id: string
          xp_earned?: number | null
        }
        Update: {
          coins_earned?: number | null
          correct_answers?: number | null
          course_id?: string | null
          finished_at?: string | null
          id?: string
          started_at?: string | null
          study_mode?: string
          time_limit?: number | null
          total_questions?: number | null
          user_id?: string
          xp_earned?: number | null
        }
        Relationships: []
      }
      user_answers: {
        Row: {
          answered_at: string | null
          correct_letter: string
          id: string
          is_correct: boolean
          question_id: number
          selected_letter: string
          session_id: string | null
          study_mode: string | null
          time_taken: number | null
          user_id: string
        }
        Insert: {
          answered_at?: string | null
          correct_letter: string
          id?: string
          is_correct: boolean
          question_id: number
          selected_letter: string
          session_id?: string | null
          study_mode?: string | null
          time_taken?: number | null
          user_id: string
        }
        Update: {
          answered_at?: string | null
          correct_letter?: string
          id?: string
          is_correct?: boolean
          question_id?: number
          selected_letter?: string
          session_id?: string | null
          study_mode?: string | null
          time_taken?: number | null
          user_id?: string
        }
        Relationships: []
      }
      user_courses: {
        Row: {
          course_id: string
          id: string
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          id?: string
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          id?: string
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_flashcards: {
        Row: {
          assunto: string | null
          back: string
          created_at: string | null
          front: string
          id: string
          mastery_level: string | null
          materia: string | null
          next_review_date: string | null
          question_id: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          assunto?: string | null
          back: string
          created_at?: string | null
          front: string
          id?: string
          mastery_level?: string | null
          materia?: string | null
          next_review_date?: string | null
          question_id?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          assunto?: string | null
          back?: string
          created_at?: string | null
          front?: string
          id?: string
          mastery_level?: string | null
          materia?: string | null
          next_review_date?: string | null
          question_id?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_inventory: {
        Row: {
          id: string
          is_equipped: boolean | null
          item_id: string
          item_type: string
          purchased_at: string | null
          user_id: string
        }
        Insert: {
          id?: string
          is_equipped?: boolean | null
          item_id: string
          item_type: string
          purchased_at?: string | null
          user_id: string
        }
        Update: {
          id?: string
          is_equipped?: boolean | null
          item_id?: string
          item_type?: string
          purchased_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          avatar_id: string | null
          avatar_url: string | null
          coins: number | null
          correct_answers: number | null
          created_at: string | null
          email: string | null
          id: string
          league_tier: string | null
          level: number | null
          name: string | null
          streak: number | null
          total_answered: number | null
          updated_at: string | null
          xp: number | null
        }
        Insert: {
          avatar_id?: string | null
          avatar_url?: string | null
          coins?: number | null
          correct_answers?: number | null
          created_at?: string | null
          email?: string | null
          id: string
          league_tier?: string | null
          level?: number | null
          name?: string | null
          streak?: number | null
          total_answered?: number | null
          updated_at?: string | null
          xp?: number | null
        }
        Update: {
          avatar_id?: string | null
          avatar_url?: string | null
          coins?: number | null
          correct_answers?: number | null
          created_at?: string | null
          email?: string | null
          id?: string
          league_tier?: string | null
          level?: number | null
          name?: string | null
          streak?: number | null
          total_answered?: number | null
          updated_at?: string | null
          xp?: number | null
        }
        Relationships: []
      }
      user_reviews: {
        Row: {
          created_at: string | null
          ease_factor: number | null
          id: string
          interval_days: number | null
          last_difficulty: string | null
          next_review_date: string
          question_id: number
          repetitions: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          last_difficulty?: string | null
          next_review_date: string
          question_id: number
          repetitions?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          ease_factor?: number | null
          id?: string
          interval_days?: number | null
          last_difficulty?: string | null
          next_review_date?: string
          question_id?: number
          repetitions?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Insertable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type Updatable<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
