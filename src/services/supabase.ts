// Re-export from main services folder
export { supabase } from '../../services/supabaseClient';
export type {
  DbUserProfile,
  DbQuestion,
  DbCourse,
  DbUserAnswer,
  DbUserReview,
  DbUserFlashcard,
  DbStudySession,
} from '../../services/supabaseClient';
