#!/usr/bin/env node

/**
 * Aplica políticas RLS via API REST do Supabase
 */

import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis
const envPath = join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseKey;

try {
  let envFile = readFileSync(envPath, 'utf-8');
  if (envFile.charCodeAt(0) === 0xFEFF) envFile = envFile.slice(1);

  envFile.split('\n').forEach(line => {
    line = line.trim();
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '').replace(/\r/g, '');
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '').replace(/\r/g, '');
    }
  });
} catch (error) {
  console.error('❌ Erro:', error.message);
  process.exit(1);
}

console.log('\n🚀 Aplicando políticas RLS no Supabase Storage...\n');

const sql = `
-- Política 1: Leitura pública
CREATE POLICY IF NOT EXISTS "Public read access"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'blog-images');

-- Política 2: Upload para autenticados
CREATE POLICY IF NOT EXISTS "Authenticated upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'blog-images');

-- Política 3: Delete para autenticados
CREATE POLICY IF NOT EXISTS "Authenticated delete"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'blog-images');
`;

console.log('📋 SQL a ser executado:');
console.log('─'.repeat(60));
console.log(sql);
console.log('─'.repeat(60));
console.log('\n💡 Para aplicar estas políticas:\n');
console.log('1️⃣  Acesse: https://supabase.com/dashboard/project/avlttxzppcywybiaxxzd/sql/new');
console.log('2️⃣  Cole o SQL acima');
console.log('3️⃣  Clique em "Run" (ou pressione F5)');
console.log('4️⃣  Teste o upload em: http://localhost:5174/admin/articles/new\n');

console.log('✨ As políticas permitirão:');
console.log('   • Leitura pública das imagens (qualquer pessoa pode ver)');
console.log('   • Upload apenas para usuários autenticados');
console.log('   • Remoção apenas para usuários autenticados\n');
