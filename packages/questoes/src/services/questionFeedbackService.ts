import { supabase } from './supabaseClient';

export type DifficultyRating = 'easy' | 'medium' | 'hard';

export interface QuestionStatistics {
  totalAnswers: number;
  correctAnswers: number;
  accuracyRate: number;
  alternativeDistribution: Record<string, number>;
  difficultyDistribution: {
    easy: number;
    medium: number;
    hard: number;
  };
  averageDifficulty: DifficultyRating | null;
}

export interface UserAnswer {
  questionId: number;
  selectedAlternative: string;
  isCorrect: boolean;
  timeSpentSeconds?: number;
}

// Save user's answer to a question
export async function saveUserAnswer(answer: UserAnswer, userId?: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('question_user_answers')
      .insert({
        question_id: answer.questionId,
        user_id: userId || null,
        selected_alternative: answer.selectedAlternative,
        is_correct: answer.isCorrect,
        time_spent_seconds: answer.timeSpentSeconds || null,
      });

    if (error) {
      console.error('[QuestionFeedback] Error saving user answer:', error);
      return false;
    }

    console.log(`[QuestionFeedback] Saved answer for question ${answer.questionId}`);
    return true;
  } catch (e) {
    console.error('[QuestionFeedback] Exception saving user answer:', e);
    return false;
  }
}

// Save user's difficulty rating for a question
export async function saveDifficultyRating(
  questionId: number,
  difficulty: DifficultyRating,
  userId: string
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('question_difficulty_ratings')
      .upsert(
        {
          question_id: questionId,
          user_id: userId,
          difficulty: difficulty,
        },
        {
          onConflict: 'question_id,user_id',
        }
      );

    if (error) {
      console.error('[QuestionFeedback] Error saving difficulty rating:', error);
      return false;
    }

    console.log(`[QuestionFeedback] Saved difficulty rating "${difficulty}" for question ${questionId}`);
    return true;
  } catch (e) {
    console.error('[QuestionFeedback] Exception saving difficulty rating:', e);
    return false;
  }
}

// Get user's previous difficulty rating for a question
export async function getUserDifficultyRating(
  questionId: number,
  userId: string
): Promise<DifficultyRating | null> {
  try {
    const { data, error } = await supabase
      .from('question_difficulty_ratings')
      .select('difficulty')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .single();

    if (error || !data) {
      return null;
    }

    return data.difficulty as DifficultyRating;
  } catch (e) {
    console.error('[QuestionFeedback] Exception getting user difficulty rating:', e);
    return null;
  }
}

// Get complete statistics for a question
export async function getQuestionStatistics(questionId: number): Promise<QuestionStatistics> {
  const defaultStats: QuestionStatistics = {
    totalAnswers: 0,
    correctAnswers: 0,
    accuracyRate: 0,
    alternativeDistribution: {},
    difficultyDistribution: { easy: 0, medium: 0, hard: 0 },
    averageDifficulty: null,
  };

  try {
    // Fetch all answers for this question
    const { data: answers, error: answersError } = await supabase
      .from('question_user_answers')
      .select('selected_alternative, is_correct')
      .eq('question_id', questionId);

    if (answersError) {
      console.error('[QuestionFeedback] Error fetching answers:', answersError);
      return defaultStats;
    }

    // Fetch all difficulty ratings for this question
    const { data: ratings, error: ratingsError } = await supabase
      .from('question_difficulty_ratings')
      .select('difficulty')
      .eq('question_id', questionId);

    if (ratingsError) {
      console.error('[QuestionFeedback] Error fetching ratings:', ratingsError);
    }

    // Calculate answer statistics
    const totalAnswers = answers?.length || 0;
    const correctAnswers = answers?.filter((a) => a.is_correct).length || 0;
    const accuracyRate = totalAnswers > 0 ? Math.round((correctAnswers / totalAnswers) * 100) : 0;

    // Calculate alternative distribution
    const alternativeDistribution: Record<string, number> = {};
    answers?.forEach((a) => {
      const alt = a.selected_alternative.toUpperCase();
      alternativeDistribution[alt] = (alternativeDistribution[alt] || 0) + 1;
    });

    // Convert to percentages
    Object.keys(alternativeDistribution).forEach((key) => {
      alternativeDistribution[key] = Math.round(
        (alternativeDistribution[key] / totalAnswers) * 100
      );
    });

    // Calculate difficulty distribution
    const difficultyDistribution = { easy: 0, medium: 0, hard: 0 };
    ratings?.forEach((r) => {
      const diff = r.difficulty as DifficultyRating;
      if (diff in difficultyDistribution) {
        difficultyDistribution[diff]++;
      }
    });

    // Calculate average difficulty
    let averageDifficulty: DifficultyRating | null = null;
    const totalRatings = (ratings?.length || 0);
    if (totalRatings > 0) {
      const difficultyScore =
        (difficultyDistribution.easy * 1 +
          difficultyDistribution.medium * 2 +
          difficultyDistribution.hard * 3) /
        totalRatings;

      if (difficultyScore < 1.67) {
        averageDifficulty = 'easy';
      } else if (difficultyScore < 2.34) {
        averageDifficulty = 'medium';
      } else {
        averageDifficulty = 'hard';
      }
    }

    return {
      totalAnswers,
      correctAnswers,
      accuracyRate,
      alternativeDistribution,
      difficultyDistribution,
      averageDifficulty,
    };
  } catch (e) {
    console.error('[QuestionFeedback] Exception getting question statistics:', e);
    return defaultStats;
  }
}

// Get question IDs filtered by difficulty level
// First returns questions rated by the user, then community-rated questions
export async function getQuestionIdsByDifficulty(
  userId: string,
  difficultyLevels: DifficultyRating[],
  limit?: number
): Promise<{ userRated: number[]; communityRated: number[] }> {
  const result = { userRated: [] as number[], communityRated: [] as number[] };

  if (difficultyLevels.length === 0) {
    return result;
  }

  try {
    // 1. Get questions that the USER rated with the selected difficulty levels
    const { data: userRatings, error: userError } = await supabase
      .from('question_difficulty_ratings')
      .select('question_id')
      .eq('user_id', userId)
      .in('difficulty', difficultyLevels);

    if (userError) {
      console.error('[QuestionFeedback] Error fetching user difficulty ratings:', userError);
    } else if (userRatings) {
      result.userRated = userRatings.map(r => r.question_id);
    }

    // 2. Get questions that the COMMUNITY rated with those levels
    // (questions with at least 3 ratings in the selected difficulty levels)
    const { data: communityRatings, error: communityError } = await supabase
      .from('question_difficulty_ratings')
      .select('question_id, difficulty')
      .in('difficulty', difficultyLevels)
      .neq('user_id', userId); // Exclude user's own ratings

    if (communityError) {
      console.error('[QuestionFeedback] Error fetching community difficulty ratings:', communityError);
    } else if (communityRatings) {
      // Count ratings per question
      const ratingCounts = new Map<number, number>();
      communityRatings.forEach(r => {
        const count = ratingCounts.get(r.question_id) || 0;
        ratingCounts.set(r.question_id, count + 1);
      });

      // Filter questions with at least 3 community ratings
      const communityQuestionIds = Array.from(ratingCounts.entries())
        .filter(([_, count]) => count >= 3)
        .sort((a, b) => b[1] - a[1]) // Sort by most ratings first
        .map(([questionId]) => questionId)
        .filter(id => !result.userRated.includes(id)); // Exclude already included user-rated questions

      result.communityRated = communityQuestionIds;
    }

    console.log(`[QuestionFeedback] Difficulty filter: ${result.userRated.length} user-rated, ${result.communityRated.length} community-rated`);
    return result;
  } catch (e) {
    console.error('[QuestionFeedback] Exception getting questions by difficulty:', e);
    return result;
  }
}

// Check if user has already answered this question
export async function hasUserAnsweredQuestion(
  questionId: number,
  userId: string
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('question_user_answers')
      .select('id')
      .eq('question_id', questionId)
      .eq('user_id', userId)
      .limit(1);

    if (error) {
      console.error('[QuestionFeedback] Error checking user answer:', error);
      return false;
    }

    return (data?.length || 0) > 0;
  } catch (e) {
    console.error('[QuestionFeedback] Exception checking user answer:', e);
    return false;
  }
}
