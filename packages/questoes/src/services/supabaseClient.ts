import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[supabaseClient] Inicializando...');
console.log('[supabaseClient] URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : '❌ NÃO DEFINIDA');
console.log('[supabaseClient] Key:', supabaseAnonKey ? '✅ DEFINIDA (' + supabaseAnonKey.length + ' chars)' : '❌ NÃO DEFINIDA');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('');
  console.error('❌❌❌ ERRO CRÍTICO: Variáveis de ambiente do Supabase não configuradas! ❌❌❌');
  console.error('');
  console.error('As seguintes variáveis precisam ser configuradas:');
  console.error('  - VITE_SUPABASE_URL');
  console.error('  - VITE_SUPABASE_ANON_KEY');
  console.error('');
  console.error('Se você está rodando na Vercel, configure em:');
  console.error('  Settings → Environment Variables');
  console.error('');
  throw new Error('Supabase configuration missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'sb-avlttxzppcywybiaxxzd-auth-token',
  },
  global: {
    headers: {
      'x-client-info': 'ouse-questoes-app',
    },
    fetch: (url, options = {}) => {
      // Timeout de 15 segundos para evitar conexões pendentes
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000);

      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).finally(() => clearTimeout(timeoutId));
    },
  },
});

console.log('[supabaseClient] ✅ Cliente criado com sucesso');

export default supabase;
