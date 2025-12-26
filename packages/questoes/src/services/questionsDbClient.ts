// Cliente Supabase para o banco de questões externo
import { createClient } from '@supabase/supabase-js';

const questionsDbUrl = import.meta.env.VITE_QUESTIONS_DB_URL;
const questionsDbAnonKey = import.meta.env.VITE_QUESTIONS_DB_ANON_KEY;

console.log('[questionsDbClient] Inicializando cliente do banco de questões...');
console.log('[questionsDbClient] URL:', questionsDbUrl ? questionsDbUrl.substring(0, 40) + '...' : '❌ NÃO DEFINIDA');
console.log('[questionsDbClient] Key:', questionsDbAnonKey ? '✅ DEFINIDA (' + questionsDbAnonKey.length + ' chars)' : '❌ NÃO DEFINIDA');

if (!questionsDbUrl || !questionsDbAnonKey) {
  console.error('');
  console.error('❌❌❌ ERRO CRÍTICO: Variáveis do banco de questões não configuradas! ❌❌❌');
  console.error('');
  console.error('As seguintes variáveis precisam ser configuradas:');
  console.error('  - VITE_QUESTIONS_DB_URL');
  console.error('  - VITE_QUESTIONS_DB_ANON_KEY');
  console.error('');
  console.error('Se você está rodando na Vercel, configure em:');
  console.error('  Settings → Environment Variables');
  console.error('');
  throw new Error('Questions DB configuration missing. Please set VITE_QUESTIONS_DB_URL and VITE_QUESTIONS_DB_ANON_KEY');
}

export const questionsDb = createClient(questionsDbUrl, questionsDbAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
});

console.log('[questionsDbClient] ✅ Cliente do banco de questões criado com sucesso');

export default questionsDb;
