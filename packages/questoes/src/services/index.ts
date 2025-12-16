// Re-export all services
export { supabase } from './supabaseClient';
export { questionsDb } from './questionsDbClient';
export { trailService } from './trailService';
export { preparatoriosService, getPreparatorios } from './preparatoriosService';
export { userPreparatoriosService } from './userPreparatoriosService';

// Question-related services
export * from './commentsService';
export * from './geminiService';
export * from './questionsService';
export * from './questionFeedbackService';
