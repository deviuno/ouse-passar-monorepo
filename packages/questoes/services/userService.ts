import { supabase, DbUserProfile, DbUserAnswer, DbUserReview, DbUserFlashcard } from './supabaseClient';
import { UserStats, UserAnswer, ReviewItem, Flashcard } from '../types';
import { calculateLevel } from '../src/services/gamificationSettingsService';
import { addWeeklyXp } from './rankingService';
import { checkAndUnlockAchievements } from '../src/services/achievementsService';

// ============================================
// USER PROFILE / STATS
// ============================================

export const fetchUserProfile = async (userId: string): Promise<DbUserProfile | null> => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data;
};

export const transformProfileToStats = (profile: DbUserProfile): UserStats => ({
  xp: profile.xp,
  streak: profile.streak,
  level: profile.level,
  correctAnswers: profile.correct_answers,
  totalAnswered: profile.total_answered,
  coins: profile.coins,
  avatarId: profile.avatar_id,
});

export const updateUserStats = async (
  userId: string,
  updates: Partial<{
    xp: number;
    coins: number;
    streak: number;
    level: number;
    correct_answers: number;
    total_answered: number;
    avatar_id: string;
    league_tier: string;
  }>
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_profiles')
    .update(updates)
    .eq('id', userId);

  if (error) {
    console.error('Error updating user stats:', error);
    return false;
  }

  return true;
};

// Increment stats (XP, coins, answers)
export const incrementUserStats = async (
  userId: string,
  increments: {
    xp?: number;
    coins?: number;
    correct_answers?: number;
    total_answered?: number;
  }
): Promise<boolean> => {
  // First get current values
  const profile = await fetchUserProfile(userId);
  if (!profile) return false;

  const updates: any = {};
  if (increments.xp) updates.xp = profile.xp + increments.xp;
  if (increments.coins) updates.coins = profile.coins + increments.coins;
  if (increments.correct_answers) updates.correct_answers = profile.correct_answers + increments.correct_answers;
  if (increments.total_answered) updates.total_answered = profile.total_answered + increments.total_answered;

  // Calculate level based on XP using gamification settings
  if (updates.xp) {
    updates.level = await calculateLevel(updates.xp);
  }

  // Track weekly XP for league rankings
  if (increments.xp) {
    addWeeklyXp(
      userId,
      increments.xp,
      increments.total_answered || 0,
      increments.correct_answers || 0
    ).catch(err => console.error('Error updating weekly XP:', err));
  }

  const result = await updateUserStats(userId, updates);

  // Check and unlock achievements based on new stats
  if (result) {
    const newStats = {
      xp: updates.xp || profile.xp,
      coins: updates.coins || profile.coins,
      level: updates.level || profile.level,
      correctAnswers: updates.correct_answers || profile.correct_answers,
      totalAnswered: updates.total_answered || profile.total_answered,
      streak: profile.streak,
    };

    checkAndUnlockAchievements(userId, newStats).catch(err =>
      console.error('Error checking achievements:', err)
    );
  }

  return result;
};

// ============================================
// USER ANSWERS (History)
// ============================================

export const saveUserAnswer = async (
  userId: string,
  answer: {
    questionId: number;
    selectedLetter: string;
    correctLetter: string;
    isCorrect: boolean;
    studyMode?: string;
    sessionId?: string;
    timeTaken?: number;
  }
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_answers')
    .insert({
      user_id: userId,
      question_id: answer.questionId,
      selected_letter: answer.selectedLetter,
      correct_letter: answer.correctLetter,
      is_correct: answer.isCorrect,
      study_mode: answer.studyMode,
      session_id: answer.sessionId,
      time_taken: answer.timeTaken,
    });

  if (error) {
    console.error('Error saving user answer:', error);
    return false;
  }

  return true;
};

export const fetchUserAnswers = async (
  userId: string,
  options?: { limit?: number; onlyIncorrect?: boolean }
): Promise<UserAnswer[]> => {
  let query = supabase
    .from('user_answers')
    .select('*')
    .eq('user_id', userId)
    .order('answered_at', { ascending: false });

  if (options?.onlyIncorrect) {
    query = query.eq('is_correct', false);
  }

  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching user answers:', error);
    return [];
  }

  return (data || []).map((a: DbUserAnswer) => ({
    questionId: a.question_id,
    selectedLetter: a.selected_letter,
    correctLetter: a.correct_letter,
    isCorrect: a.is_correct,
  }));
};

// ============================================
// USER REVIEWS (SRS - Spaced Repetition)
// ============================================

export const upsertUserReview = async (
  userId: string,
  review: {
    questionId: number;
    nextReviewDate: number; // timestamp
    lastDifficulty: 'error' | 'hard' | 'medium' | 'easy';
    intervalDays: number;
  }
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_reviews')
    .upsert(
      {
        user_id: userId,
        question_id: review.questionId,
        next_review_date: new Date(review.nextReviewDate).toISOString(),
        last_difficulty: review.lastDifficulty,
        interval_days: review.intervalDays,
      },
      { onConflict: 'user_id,question_id' }
    );

  if (error) {
    console.error('Error upserting user review:', error);
    return false;
  }

  return true;
};

export const fetchUserReviews = async (userId: string): Promise<ReviewItem[]> => {
  const { data, error } = await supabase
    .from('user_reviews')
    .select('*')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user reviews:', error);
    return [];
  }

  return (data || []).map((r: DbUserReview) => ({
    questionId: r.question_id,
    nextReviewDate: new Date(r.next_review_date).getTime(),
    lastDifficulty: r.last_difficulty || 'medium',
    interval: r.interval_days,
  }));
};

export const fetchDueReviews = async (userId: string): Promise<ReviewItem[]> => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from('user_reviews')
    .select('*')
    .eq('user_id', userId)
    .lte('next_review_date', now);

  if (error) {
    console.error('Error fetching due reviews:', error);
    return [];
  }

  return (data || []).map((r: DbUserReview) => ({
    questionId: r.question_id,
    nextReviewDate: new Date(r.next_review_date).getTime(),
    lastDifficulty: r.last_difficulty || 'medium',
    interval: r.interval_days,
  }));
};

// ============================================
// USER FLASHCARDS
// ============================================

export const saveUserFlashcard = async (
  userId: string,
  flashcard: Omit<Flashcard, 'id'>
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('user_flashcards')
    .insert({
      user_id: userId,
      question_id: flashcard.questionId,
      front: flashcard.front,
      back: flashcard.back,
      materia: flashcard.materia,
      assunto: flashcard.assunto,
      mastery_level: flashcard.masteryLevel,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error saving flashcard:', error);
    return null;
  }

  return data?.id || null;
};

export const saveUserFlashcards = async (
  userId: string,
  flashcards: Omit<Flashcard, 'id'>[]
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_flashcards')
    .insert(
      flashcards.map(fc => ({
        user_id: userId,
        question_id: fc.questionId,
        front: fc.front,
        back: fc.back,
        materia: fc.materia,
        assunto: fc.assunto,
        mastery_level: fc.masteryLevel,
      }))
    );

  if (error) {
    console.error('Error saving flashcards:', error);
    return false;
  }

  return true;
};

export const fetchUserFlashcards = async (userId: string): Promise<Flashcard[]> => {
  const { data, error } = await supabase
    .from('user_flashcards')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching flashcards:', error);
    return [];
  }

  return (data || []).map((fc: DbUserFlashcard) => ({
    id: fc.id,
    questionId: fc.question_id || 0,
    front: fc.front,
    back: fc.back,
    masteryLevel: fc.mastery_level,
    materia: fc.materia || undefined,
    assunto: fc.assunto || undefined,
  }));
};

export const updateFlashcardMastery = async (
  flashcardId: string,
  masteryLevel: 'new' | 'learning' | 'mastered'
): Promise<boolean> => {
  const { error } = await supabase
    .from('user_flashcards')
    .update({ mastery_level: masteryLevel })
    .eq('id', flashcardId);

  if (error) {
    console.error('Error updating flashcard mastery:', error);
    return false;
  }

  return true;
};

// ============================================
// USER COURSES
// ============================================

export const fetchUserCourses = async (userId: string): Promise<string[]> => {
  const { data, error } = await supabase
    .from('user_courses')
    .select('course_id')
    .eq('user_id', userId);

  if (error) {
    console.error('Error fetching user courses:', error);
    return [];
  }

  return (data || []).map(c => c.course_id);
};

export const purchaseUserCourse = async (userId: string, courseId: string): Promise<boolean> => {
  const { error } = await supabase
    .from('user_courses')
    .insert({
      user_id: userId,
      course_id: courseId,
    });

  if (error) {
    console.error('Error purchasing course:', error);
    return false;
  }

  return true;
};

// ============================================
// STUDY SESSIONS
// ============================================

export const createStudySession = async (
  userId: string,
  session: {
    courseId?: string;
    studyMode: string;
    totalQuestions: number;
    timeLimit?: number;
  }
): Promise<string | null> => {
  const { data, error } = await supabase
    .from('study_sessions')
    .insert({
      user_id: userId,
      course_id: session.courseId,
      study_mode: session.studyMode,
      total_questions: session.totalQuestions,
      time_limit: session.timeLimit,
    })
    .select('id')
    .single();

  if (error) {
    console.error('Error creating study session:', error);
    return null;
  }

  return data?.id || null;
};

export const finishStudySession = async (
  sessionId: string,
  results: {
    correctAnswers: number;
    xpEarned: number;
    coinsEarned: number;
  }
): Promise<boolean> => {
  const { error } = await supabase
    .from('study_sessions')
    .update({
      correct_answers: results.correctAnswers,
      xp_earned: results.xpEarned,
      coins_earned: results.coinsEarned,
      finished_at: new Date().toISOString(),
    })
    .eq('id', sessionId);

  if (error) {
    console.error('Error finishing study session:', error);
    return false;
  }

  return true;
};

// ============================================
// RANKING / LEADERBOARD
// ============================================

export const fetchLeaderboard = async (
  leagueTier?: string,
  limit: number = 50
): Promise<Array<{
  rank: number;
  userId: string;
  name: string;
  xp: number;
  avatarUrl: string | null;
}>> => {
  let query = supabase
    .from('user_profiles')
    .select('id, name, xp, avatar_url, league_tier')
    .order('xp', { ascending: false })
    .limit(limit);

  if (leagueTier) {
    query = query.eq('league_tier', leagueTier);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching leaderboard:', error);
    return [];
  }

  return (data || []).map((user, index) => ({
    rank: index + 1,
    userId: user.id,
    name: user.name || 'Anônimo',
    xp: user.xp,
    avatarUrl: user.avatar_url,
  }));
};
