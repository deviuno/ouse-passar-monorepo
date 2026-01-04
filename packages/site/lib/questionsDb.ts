import { createClient } from '@supabase/supabase-js';

/**
 * Client para o banco de questões
 * Após unificação, usa o banco principal como fallback
 */

// Usa QUESTIONS_DB se definido, senão fallback para o banco principal
const questionsDbUrl = import.meta.env.VITE_QUESTIONS_DB_URL || import.meta.env.VITE_SUPABASE_URL;
const questionsDbKey = import.meta.env.VITE_QUESTIONS_DB_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

// Create client only if credentials are available
export const questionsDb = questionsDbUrl && questionsDbKey
  ? createClient(questionsDbUrl, questionsDbKey)
  : null;

export const isQuestionsDbConfigured = (): boolean => {
  return !!questionsDb;
};

// Tipo para as questões do banco
export interface Questao {
  id: number;
  materia: string;
  assunto: string;
  concurso: string;
  enunciado: string;
  alternativas: string; // JSON string com array de alternativas
  gabarito: string;
  comentario: string | null;
  orgao: string;
  cargo_area_especialidade_edicao: string;
  prova: string;
  ano: number;
  banca: string;
  created_at: string;
  imagens_enunciado: string | null;
  imagens_comentario: string | null;
  questao_revisada: string | null;
}

// Interface para alternativa parseada
export interface Alternativa {
  letter: string;
  text: string;
}

// Helper para parsear alternativas
export function parseAlternativas(alternativasJson: string): Alternativa[] {
  try {
    return JSON.parse(alternativasJson);
  } catch {
    return [];
  }
}

// Interface para filtros de questões
export interface QuestaoFiltros {
  materias?: string[];
  assuntos?: string[];
  bancas?: string[];
  orgaos?: string[];
  anos?: number[];
  questao_revisada?: boolean;
}
