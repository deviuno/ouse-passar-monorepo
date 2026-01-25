import { supabase } from './supabaseClient';

export type ReportMotivo =
  | 'resposta_errada'
  | 'questao_desatualizada'
  | 'enunciado_confuso'
  | 'alternativas_incorretas'
  | 'imagem_quebrada'
  | 'solicitar_explicacao'
  | 'outro';

export const REPORT_MOTIVOS: { value: ReportMotivo; label: string }[] = [
  { value: 'resposta_errada', label: 'Resposta errada' },
  { value: 'questao_desatualizada', label: 'Questão desatualizada' },
  { value: 'enunciado_confuso', label: 'Enunciado confuso' },
  { value: 'alternativas_incorretas', label: 'Alternativas incorretas' },
  { value: 'imagem_quebrada', label: 'Imagem não carrega' },
  { value: 'outro', label: 'Outro motivo' },
];

// Motivo especial para solicitação de explicação (não aparece na lista de reports normais)
export const SOLICITAR_EXPLICACAO_MOTIVO: ReportMotivo = 'solicitar_explicacao';

export interface QuestionReportInput {
  questionId: number;
  userId: string;
  motivo: ReportMotivo;
  descricao?: string;
  questionInfo: {
    materia?: string;
    assunto?: string;
    banca?: string;
    ano?: number;
  };
}

export interface QuestionReport {
  id: string;
  question_id: number;
  user_id: string;
  question_materia: string | null;
  question_assunto: string | null;
  question_banca: string | null;
  question_ano: number | null;
  motivo: ReportMotivo;
  descricao: string | null;
  status: 'pendente' | 'em_analise' | 'resolvido' | 'rejeitado';
  admin_resposta: string | null;
  admin_id: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
}

/**
 * Cria um novo report de questão
 */
export async function createQuestionReport(input: QuestionReportInput): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('question_reports')
      .insert({
        question_id: input.questionId,
        user_id: input.userId,
        motivo: input.motivo,
        descricao: input.descricao || null,
        question_materia: input.questionInfo.materia || null,
        question_assunto: input.questionInfo.assunto || null,
        question_banca: input.questionInfo.banca || null,
        question_ano: input.questionInfo.ano || null,
      });

    if (error) {
      console.error('[QuestionReports] Error creating report:', error);
      return false;
    }

    console.log(`[QuestionReports] Report created for question ${input.questionId}`);
    return true;
  } catch (e) {
    console.error('[QuestionReports] Exception creating report:', e);
    return false;
  }
}

/**
 * Verifica se o usuário já reportou esta questão
 */
export async function hasUserReportedQuestion(
  questionId: number,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('question_reports')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('[QuestionReports] Error checking report:', error);
      return false;
    }

    return data && data.length > 0;
  } catch (e) {
    console.error('[QuestionReports] Exception checking report:', e);
    return false;
  }
}

/**
 * Busca reports do usuário
 */
export async function getUserReports(userId: string): Promise<QuestionReport[]> {
  try {
    const { data, error } = await supabase
      .from('question_reports')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[QuestionReports] Error fetching user reports:', error);
      return [];
    }

    return data || [];
  } catch (e) {
    console.error('[QuestionReports] Exception fetching user reports:', e);
    return [];
  }
}
