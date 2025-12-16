// Cliente Supabase para o banco de questões externo
import { createClient } from '@supabase/supabase-js';

const questionsDbUrl = import.meta.env.VITE_QUESTIONS_DB_URL;
const questionsDbAnonKey = import.meta.env.VITE_QUESTIONS_DB_ANON_KEY;

console.log('[questionsDbClient] Inicializando cliente do banco de questões...');
console.log('[questionsDbClient] URL:', questionsDbUrl ? questionsDbUrl.substring(0, 40) + '...' : 'NÃO DEFINIDA');
console.log('[questionsDbClient] Key:', questionsDbAnonKey ? 'DEFINIDA (' + questionsDbAnonKey.length + ' chars)' : 'NÃO DEFINIDA');

if (!questionsDbUrl || !questionsDbAnonKey) {
  console.error('[questionsDbClient] ERRO: Variáveis de ambiente do banco de questões não configuradas!');
  console.error('[questionsDbClient] Certifique-se de definir VITE_QUESTIONS_DB_URL e VITE_QUESTIONS_DB_ANON_KEY');
}

export const questionsDb = createClient(
  questionsDbUrl || '',
  questionsDbAnonKey || ''
);

console.log('[questionsDbClient] Cliente do banco de questões criado com sucesso');

export default questionsDb;
