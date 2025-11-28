import { createClient } from '@supabase/supabase-js';

/**
 * Client para o banco de questões externo (scrapping)
 * Project ID: swzosaapqtyhmwdiwdje
 */

const questionsDbUrl = import.meta.env.VITE_QUESTIONS_DB_URL;
const questionsDbKey = import.meta.env.VITE_QUESTIONS_DB_ANON_KEY;

// Create client only if credentials are available
export const questionsDb = questionsDbUrl && questionsDbKey
  ? createClient(questionsDbUrl, questionsDbKey)
  : null;

export const isQuestionsDbConfigured = (): boolean => {
  return !!questionsDb;
};
