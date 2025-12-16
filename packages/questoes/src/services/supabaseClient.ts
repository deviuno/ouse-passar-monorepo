import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('[supabaseClient] Inicializando...');
console.log('[supabaseClient] URL:', supabaseUrl ? supabaseUrl.substring(0, 30) + '...' : 'NÃO DEFINIDA');
console.log('[supabaseClient] Key:', supabaseAnonKey ? 'DEFINIDA (' + supabaseAnonKey.length + ' chars)' : 'NÃO DEFINIDA');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('[supabaseClient] ERRO: Variáveis de ambiente do Supabase não configuradas!');
}

export const supabase = createClient(
  supabaseUrl || '',
  supabaseAnonKey || ''
);

console.log('[supabaseClient] Cliente criado com sucesso');

export default supabase;
