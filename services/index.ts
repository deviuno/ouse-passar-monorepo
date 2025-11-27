// Supabase Client
export { supabase } from './supabaseClient';
export type {
  DbUserProfile,
  DbQuestion,
  DbCourse,
  DbUserAnswer,
  DbUserReview,
  DbUserFlashcard,
  DbStudySession,
} from './supabaseClient';

// Auth Service
export {
  getCurrentUser,
  getCurrentSession,
  signUpWithEmail,
  signInWithEmail,
  signInWithGoogle,
  signOut,
  resetPassword,
  updatePassword,
  onAuthStateChange,
  signInAnonymously,
} from './authService';

// User Service
export {
  fetchUserProfile,
  transformProfileToStats,
  updateUserStats,
  incrementUserStats,
  saveUserAnswer,
  fetchUserAnswers,
  upsertUserReview,
  fetchUserReviews,
  fetchDueReviews,
  saveUserFlashcard,
  saveUserFlashcards,
  fetchUserFlashcards,
  updateFlashcardMastery,
  fetchUserCourses,
  purchaseUserCourse,
  createStudySession,
  finishStudySession,
  fetchLeaderboard,
} from './userService';

// Questions Service
export {
  fetchQuestions,
  fetchQuestionById,
  fetchFilterOptions,
  getQuestionsCount,
} from './questionsService';

// Courses Service
export {
  fetchCourses,
  fetchCoursesWithOwnership,
  fetchCourseById,
} from './coursesService';
export type { CourseWithFilters, DbCourseWithFilters } from './coursesService';

// External Questions Service (Scrapping Project)
export {
  fetchExternalQuestions,
  fetchExternalQuestionsByIds,
  fetchExternalQuestionById,
  getExternalQuestionsStats,
  listAvailableMaterias,
  listAvailableBancas,
  listAvailableAnos,
  listAvailableOrgaos,
  countExternalQuestions,
  fetchRandomQuestions,
  getShortBancaName,
  BANCA_SHORT_NAMES,
} from './externalQuestionsService';
export type { QuestionsStats } from './externalQuestionsService';

// Questions DB Client (for types)
export { questionsDb } from './questionsDbClient';
export type { ExternalQuestion, CourseQuestionFilters } from './questionsDbClient';

// AI Service (Gemini)
export {
  generateExplanation,
  chatWithTutor,
  generateFlashcards,
  analyzeEssay,
} from './geminiService';
