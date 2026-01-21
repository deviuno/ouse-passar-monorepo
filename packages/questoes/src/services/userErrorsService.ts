import { supabase } from './supabaseClient';
import { questionsDb } from './questionsDbClient';

// ============================================
// TYPES
// ============================================

export interface AssuntoErrorStats {
  assunto: string;
  errorCount: number;
  questionIds: number[];
}

export interface MateriaErrorStats {
  materia: string;
  totalErrors: number;
  assuntos: AssuntoErrorStats[];
}

export interface UserErrorsStats {
  totalErrors: number;
  questionIds: number[];
  materias: MateriaErrorStats[];
}

// ============================================
// FUNCTIONS
// ============================================

/**
 * Get all wrong answers for a user, grouped by matéria and assunto
 */
export async function getUserErrors(userId: string): Promise<UserErrorsStats> {
  try {
    console.log('[userErrorsService] Fetching errors for user:', userId);

    // Get all wrong answers from question_user_answers
    const { data: wrongAnswers, error } = await supabase
      .from('question_user_answers')
      .select('question_id')
      .eq('user_id', userId)
      .eq('is_correct', false);

    if (error) {
      console.error('[userErrorsService] Error fetching wrong answers:', error);
      return { totalErrors: 0, questionIds: [], materias: [] };
    }

    if (!wrongAnswers || wrongAnswers.length === 0) {
      console.log('[userErrorsService] No wrong answers found');
      return { totalErrors: 0, questionIds: [], materias: [] };
    }

    // Get unique question IDs
    const questionIds = [...new Set(wrongAnswers.map(a => a.question_id))];
    console.log(`[userErrorsService] Found ${questionIds.length} unique wrong questions`);

    // Fetch questions from questions DB to get matéria and assunto
    const { data: questions, error: questionsError } = await questionsDb
      .from('questoes_concurso')
      .select('id, materia, assunto')
      .in('id', questionIds);

    if (questionsError) {
      console.error('[userErrorsService] Error fetching questions:', questionsError);
      return { totalErrors: questionIds.length, questionIds, materias: [] };
    }

    if (!questions || questions.length === 0) {
      console.log('[userErrorsService] No questions found in questions DB');
      return { totalErrors: questionIds.length, questionIds, materias: [] };
    }

    // Group by matéria and assunto
    const materiaMap = new Map<string, Map<string, number[]>>();

    questions.forEach(q => {
      const materia = q.materia || 'Sem matéria';
      const assunto = q.assunto || 'Sem assunto';

      if (!materiaMap.has(materia)) {
        materiaMap.set(materia, new Map());
      }

      const assuntoMap = materiaMap.get(materia)!;
      if (!assuntoMap.has(assunto)) {
        assuntoMap.set(assunto, []);
      }

      assuntoMap.get(assunto)!.push(q.id);
    });

    // Convert to array structure
    const materias: MateriaErrorStats[] = Array.from(materiaMap.entries())
      .map(([materia, assuntoMap]) => {
        const assuntos: AssuntoErrorStats[] = Array.from(assuntoMap.entries())
          .map(([assunto, ids]) => ({
            assunto,
            errorCount: ids.length,
            questionIds: ids,
          }))
          .sort((a, b) => b.errorCount - a.errorCount);

        const totalErrors = assuntos.reduce((sum, a) => sum + a.errorCount, 0);

        return {
          materia,
          totalErrors,
          assuntos,
        };
      })
      .sort((a, b) => b.totalErrors - a.totalErrors);

    console.log('[userErrorsService] Processed errors by matéria:', materias.length);

    return {
      totalErrors: questionIds.length,
      questionIds,
      materias,
    };
  } catch (err) {
    console.error('[userErrorsService] Exception in getUserErrors:', err);
    return { totalErrors: 0, questionIds: [], materias: [] };
  }
}

/**
 * Get question IDs of wrong answers for a specific matéria
 */
export async function getErrorsByMateria(userId: string, materia: string): Promise<number[]> {
  const allErrors = await getUserErrors(userId);
  const materiaStats = allErrors.materias.find(m => m.materia === materia);

  if (!materiaStats) return [];

  return materiaStats.assuntos.flatMap(a => a.questionIds);
}

/**
 * Get question IDs of wrong answers for a specific assunto
 */
export async function getErrorsByAssunto(userId: string, materia: string, assunto: string): Promise<number[]> {
  const allErrors = await getUserErrors(userId);
  const materiaStats = allErrors.materias.find(m => m.materia === materia);

  if (!materiaStats) return [];

  const assuntoStats = materiaStats.assuntos.find(a => a.assunto === assunto);
  return assuntoStats?.questionIds || [];
}
