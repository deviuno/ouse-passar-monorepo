// Cliente Supabase para o banco de questões
// NOTA: Banco de questões foi unificado com o banco principal
// O projeto secundário (swzosaapqtyhmwdiwdje) foi descontinuado
// Agora sempre usamos o banco principal (avlttxzppcywybiaxxzd)
import { createClient } from '@supabase/supabase-js';

// SEMPRE usa o banco principal (projeto secundário foi descontinuado)
const questionsDbUrl = import.meta.env.VITE_SUPABASE_URL;
const questionsDbAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[questionsDbClient] Inicializando cliente do banco de questões...');
console.log('[questionsDbClient] Modo: 🔗 Banco Unificado (principal)');
console.log('[questionsDbClient] URL:', questionsDbUrl ? questionsDbUrl.substring(0, 40) + '...' : '❌ NÃO DEFINIDA');
console.log('[questionsDbClient] Key:', questionsDbAnonKey ? '✅ DEFINIDA (' + questionsDbAnonKey.length + ' chars)' : '❌ NÃO DEFINIDA');

if (!questionsDbUrl || !questionsDbAnonKey) {
  console.error('');
  console.error('❌❌❌ ERRO CRÍTICO: Variáveis do Supabase não configuradas! ❌❌❌');
  console.error('');
  console.error('Configure as variáveis de ambiente:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
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
