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
  // Questões revisadas (errou mas depois acertou)
  totalReviewed: number;
  reviewedQuestionIds: number[];
  reviewedMaterias: MateriaErrorStats[];
}

// ============================================
// FUNCTIONS
// ============================================

/**
 * Helper function to group question IDs by matéria and assunto
 */
function groupByMateriaAssunto(
  questionIds: number[],
  questionsData: Array<{ id: number; materia: string | null; assunto: string | null }>
): MateriaErrorStats[] {
  const materiaMap = new Map<string, Map<string, number[]>>();
  const questionsMap = new Map(questionsData.map(q => [q.id, q]));

  questionIds.forEach(id => {
    const q = questionsMap.get(id);
    if (!q) return;

    const materia = q.materia || 'Sem matéria';
    const assunto = q.assunto || 'Sem assunto';

    if (!materiaMap.has(materia)) {
      materiaMap.set(materia, new Map());
    }

    const assuntoMap = materiaMap.get(materia)!;
    if (!assuntoMap.has(assunto)) {
      assuntoMap.set(assunto, []);
    }

    assuntoMap.get(assunto)!.push(id);
  });

  return Array.from(materiaMap.entries())
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
}

/**
 * Get all wrong answers for a user, grouped by matéria and assunto
 * Also identifies "reviewed" questions (errou mas depois acertou)
 */
export async function getUserErrors(userId: string): Promise<UserErrorsStats> {
  const emptyResult: UserErrorsStats = {
    totalErrors: 0,
    questionIds: [],
    materias: [],
    totalReviewed: 0,
    reviewedQuestionIds: [],
    reviewedMaterias: [],
  };

  try {
    console.log('[userErrorsService] Fetching errors for user:', userId);

    // Get ALL answers from user with timestamps
    const { data: allAnswers, error } = await supabase
      .from('question_user_answers')
      .select('question_id, is_correct, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[userErrorsService] Error fetching answers:', error);
      return emptyResult;
    }

    if (!allAnswers || allAnswers.length === 0) {
      console.log('[userErrorsService] No answers found');
      return emptyResult;
    }

    // Process answers to determine status of each question
    // Map: question_id -> { firstWrongAt: Date | null, lastCorrectAt: Date | null }
    const questionStatus = new Map<number, { firstWrongAt: Date | null; lastCorrectAt: Date | null }>();

    allAnswers.forEach(answer => {
      const qid = answer.question_id;
      const timestamp = new Date(answer.created_at);

      if (!questionStatus.has(qid)) {
        questionStatus.set(qid, { firstWrongAt: null, lastCorrectAt: null });
      }

      const status = questionStatus.get(qid)!;

      if (!answer.is_correct) {
        // Track first wrong answer
        if (!status.firstWrongAt || timestamp < status.firstWrongAt) {
          status.firstWrongAt = timestamp;
        }
      } else {
        // Track last correct answer
        if (!status.lastCorrectAt || timestamp > status.lastCorrectAt) {
          status.lastCorrectAt = timestamp;
        }
      }
    });

    // Categorize questions
    const activeErrorIds: number[] = [];
    const reviewedIds: number[] = [];

    questionStatus.forEach((status, qid) => {
      // Only consider questions that have at least one wrong answer
      if (status.firstWrongAt) {
        // Check if there's a correct answer AFTER the first wrong answer
        if (status.lastCorrectAt && status.lastCorrectAt > status.firstWrongAt) {
          reviewedIds.push(qid);
        } else {
          activeErrorIds.push(qid);
        }
      }
    });

    console.log(`[userErrorsService] Found ${activeErrorIds.length} active errors, ${reviewedIds.length} reviewed`);

    if (activeErrorIds.length === 0 && reviewedIds.length === 0) {
      return emptyResult;
    }

    // Fetch questions from questions DB to get matéria and assunto
    const allQuestionIds = [...activeErrorIds, ...reviewedIds];
    const { data: questions, error: questionsError } = await questionsDb
      .from('questoes_concurso')
      .select('id, materia, assunto')
      .in('id', allQuestionIds);

    if (questionsError) {
      console.error('[userErrorsService] Error fetching questions:', questionsError);
      return {
        ...emptyResult,
        totalErrors: activeErrorIds.length,
        questionIds: activeErrorIds,
        totalReviewed: reviewedIds.length,
        reviewedQuestionIds: reviewedIds,
      };
    }

    if (!questions || questions.length === 0) {
      console.log('[userErrorsService] No questions found in questions DB');
      return {
        ...emptyResult,
        totalErrors: activeErrorIds.length,
        questionIds: activeErrorIds,
        totalReviewed: reviewedIds.length,
        reviewedQuestionIds: reviewedIds,
      };
    }

    // Group by matéria and assunto
    const materias = groupByMateriaAssunto(activeErrorIds, questions);
    const reviewedMaterias = groupByMateriaAssunto(reviewedIds, questions);

    console.log('[userErrorsService] Processed errors by matéria:', materias.length);
    console.log('[userErrorsService] Processed reviewed by matéria:', reviewedMaterias.length);

    return {
      totalErrors: activeErrorIds.length,
      questionIds: activeErrorIds,
      materias,
      totalReviewed: reviewedIds.length,
      reviewedQuestionIds: reviewedIds,
      reviewedMaterias,
    };
  } catch (err) {
    console.error('[userErrorsService] Exception in getUserErrors:', err);
    return emptyResult;
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
