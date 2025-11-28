// Re-export from main services folder
export {
  fetchQuestions,
  fetchQuestionById,
  fetchFilterOptions,
  getQuestionsCount,
} from '../../services/questionsService';

export type { DbQuestion as Question } from '../../services/supabaseClient';
