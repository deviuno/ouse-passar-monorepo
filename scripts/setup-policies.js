#!/usr/bin/env node

/**
 * Script para configurar políticas RLS do Supabase Storage
 * Executa SQL direto para criar as políticas necessárias
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente
const envPath = join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseKey;

try {
  let envFile = readFileSync(envPath, 'utf-8');
  if (envFile.charCodeAt(0) === 0xFEFF) {
    envFile = envFile.slice(1);
  }
  const lines = envFile.split('\n');

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('VITE_SUPABASE_URL=')) {
      supabaseUrl = line.split('=')[1].trim().replace(/['"]/g, '').replace(/\r/g, '');
    }
    if (line.startsWith('VITE_SUPABASE_ANON_KEY=')) {
      supabaseKey = line.split('=')[1].trim().replace(/['"]/g, '').replace(/\r/g, '');
    }
  }
} catch (error) {
  console.error('❌ Erro ao ler .env.local:', error.message);
  process.exit(1);
}

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const policies = [
  {
    name: 'Leitura Pública',
    sql: `
      CREATE POLICY IF NOT EXISTS "Public read access"
      ON storage.objects FOR SELECT
      TO public
      USING (bucket_id = 'blog-images');
    `
  },
  {
    name: 'Upload Autenticado',
    sql: `
      CREATE POLICY IF NOT EXISTS "Authenticated upload"
      ON storage.objects FOR INSERT
      TO authenticated
      WITH CHECK (bucket_id = 'blog-images');
    `
  },
  {
    name: 'Delete Autenticado',
    sql: `
      CREATE POLICY IF NOT EXISTS "Authenticated delete"
      ON storage.objects FOR DELETE
      TO authenticated
      USING (bucket_id = 'blog-images');
    `
  }
];

async function setupPolicies() {
  console.log('🔐 Configurando políticas RLS do Storage...\n');

  for (const policy of policies) {
    try {
      console.log(`📝 Criando política: ${policy.name}`);

      const { data, error } = await supabase.rpc('exec_sql', {
        sql_string: policy.sql
      });

      if (error) {
        console.log(`   ⚠️  Nota: ${error.message}`);
        console.log(`   💡 Execute manualmente no SQL Editor:`);
        console.log(`   ${policy.sql.trim()}\n`);
      } else {
        console.log(`   ✅ Política criada com sucesso\n`);
      }
    } catch (err) {
      console.log(`   ⚠️  Não foi possível criar automaticamente`);
      console.log(`   💡 Execute no SQL Editor do Supabase:`);
      console.log(`   ${policy.sql.trim()}\n`);
    }
  }

  console.log('\n📚 Instruções Manuais:');
  console.log('   1. Acesse: https://supabase.com/dashboard');
  console.log('   2. SQL Editor → New Query');
  console.log('   3. Cole e execute este SQL:\n');

  console.log('```sql');
  policies.forEach(p => console.log(p.sql.trim() + '\n'));
  console.log('```\n');

  console.log('✨ Após executar, teste o upload em: http://localhost:5174/admin/articles/new\n');
}

setupPolicies();
