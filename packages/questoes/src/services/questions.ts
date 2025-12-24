// Re-export from questionsService
export {
  fetchQuestions,
  fetchQuestionById,
  fetchFilterOptions,
  getQuestionsCount,
} from './questionsService';

export type { DbQuestion as Question } from './supabaseClient';
