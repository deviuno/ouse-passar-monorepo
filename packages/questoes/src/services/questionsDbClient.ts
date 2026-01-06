// Cliente Supabase para o banco de questões
// Após unificação dos bancos, usa o banco principal como fallback
import { createClient } from '@supabase/supabase-js';

// Usa QUESTIONS_DB se definido, senão fallback para o banco principal
const questionsDbUrl = import.meta.env.VITE_QUESTIONS_DB_URL || import.meta.env.VITE_SUPABASE_URL;
const questionsDbAnonKey = import.meta.env.VITE_QUESTIONS_DB_ANON_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY;

const isUsingMainDb = !import.meta.env.VITE_QUESTIONS_DB_URL;

console.log('[questionsDbClient] Inicializando cliente do banco de questões...');
console.log('[questionsDbClient] Modo:', isUsingMainDb ? '🔗 Banco Unificado (principal)' : '📦 Banco Separado');
console.log('[questionsDbClient] URL:', questionsDbUrl ? questionsDbUrl.substring(0, 40) + '...' : '❌ NÃO DEFINIDA');
console.log('[questionsDbClient] Key:', questionsDbAnonKey ? '✅ DEFINIDA (' + questionsDbAnonKey.length + ' chars)' : '❌ NÃO DEFINIDA');

if (!questionsDbUrl || !questionsDbAnonKey) {
  console.error('');
  console.error('❌❌❌ ERRO CRÍTICO: Variáveis do Supabase não configuradas! ❌❌❌');
  console.error('');
  console.error('Configure pelo menos uma das opções:');
  console.error('  Opção 1 (Recomendado - Banco Unificado):');
  console.error('    - VITE_SUPABASE_URL');
  console.error('    - VITE_SUPABASE_ANON_KEY');
  console.error('');
  console.error('  Opção 2 (Banco Separado - Legado):');
  console.error('    - VITE_QUESTIONS_DB_URL');
  console.error('    - VITE_QUESTIONS_DB_ANON_KEY');
  console.error('');
  throw new Error('Supabase configuration missing');
}

export const questionsDb = createClient(questionsDbUrl, questionsDbAnonKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false,
  },
  global: {
    headers: {
      'x-client-info': 'ouse-questoes-app',
    },
    fetch: (url, options = {}) => {
      // Timeout de 30 segundos para evitar conexões pendentes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000);

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
});

console.log('[questionsDbClient] ✅ Cliente do banco de questões criado com sucesso');

export default questionsDb;
