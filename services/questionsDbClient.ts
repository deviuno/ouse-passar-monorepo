import { createClient } from '@supabase/supabase-js';

/**
 * Cliente Supabase para o Banco de Questões (Projeto Scrapping)
 * Este é um banco separado que contém ~79.000 questões de concursos
 * alimentado automaticamente via n8n
 */

const questionsDbUrl = import.meta.env.VITE_QUESTIONS_DB_URL;
const questionsDbAnonKey = import.meta.env.VITE_QUESTIONS_DB_ANON_KEY;

if (!questionsDbUrl || !questionsDbAnonKey) {
  console.warn('Questions DB environment variables missing. External questions will not be available.');
}

export const questionsDb = createClient(
  questionsDbUrl || '',
  questionsDbAnonKey || ''
);

// Tipos para as questões do banco externo
export interface ExternalQuestion {
  id: number;
  materia: string;
  assunto: string | null;
  concurso: string | null;
  enunciado: string;
  alternativas: { letter: string; text: string }[] | string;
  gabarito: string | null;
  comentario: string | null;
  orgao: string | null;
  cargo_area_especialidade_edicao: string | null;
  prova: string | null;
  ano: number | null;
  banca: string | null;
  created_at: string | null;
  imagens_enunciado: string | null;
  imagens_comentario: string[] | null;
  questao_revisada: string | null;
}

// Filtros disponíveis para cursos
export interface CourseQuestionFilters {
  materias?: string[];           // Ex: ['Direito Constitucional', 'Direito Administrativo']
  bancas?: string[];             // Ex: ['CEBRASPE', 'FCC', 'FGV']
  anos?: number[];               // Ex: [2022, 2023, 2024]
  orgaos?: string[];             // Ex: ['PRF', 'PF', 'TRT']
  assuntos?: string[];           // Ex: ['Direitos Fundamentais', 'Atos Administrativos']
  excludeIds?: number[];         // IDs de questões a excluir
  limit?: number;                // Limite de questões (default: 1000)
}

// Estatísticas do banco de questões
export interface QuestionsStats {
  total: number;
  materias: number;
  bancas: number;
  anos: number;
}
