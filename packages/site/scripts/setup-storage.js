#!/usr/bin/env node

/**
 * Script para configurar o Supabase Storage
 * Cria o bucket blog-images e configura as políticas de acesso
 *
 * Uso: npm run setup:storage
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Carregar variáveis de ambiente do .env.local
const envPath = join(__dirname, '..', '.env.local');
let supabaseUrl, supabaseServiceKey;

try {
  let envFile = readFileSync(envPath, 'utf-8');
  // Remove BOM if present
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
      supabaseServiceKey = line.split('=')[1].trim().replace(/['"]/g, '').replace(/\r/g, '');
    }
    if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
      supabaseServiceKey = line.split('=')[1].trim().replace(/['"]/g, '').replace(/\r/g, '');
    }
  }
} catch (error) {
  console.error('❌ Erro ao ler .env.local:', error.message);
}

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Erro: Variáveis de ambiente não encontradas');
  console.error('');
  console.error('Certifique-se de que o arquivo .env.local contém:');
  console.error('  VITE_SUPABASE_URL=...');
  console.error('  VITE_SUPABASE_ANON_KEY=...');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupStorage() {
  console.log('🚀 Iniciando configuração do Supabase Storage...\n');

  try {
    // 1. Verificar se o bucket já existe
    console.log('📦 Verificando bucket "blog-images"...');
    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
      console.error('❌ Erro ao listar buckets:', listError.message);
      throw listError;
    }

    const bucketExists = buckets?.some(b => b.name === 'blog-images');

    if (bucketExists) {
      console.log('✅ Bucket "blog-images" já existe');
    } else {
      // 2. Criar o bucket
      console.log('📦 Criando bucket "blog-images"...');
      const { data: bucket, error: createError } = await supabase.storage.createBucket('blog-images', {
        public: true,
        fileSizeLimit: 5242880, // 5MB em bytes
        allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
      });

      if (createError) {
        console.error('❌ Erro ao criar bucket:', createError.message);
        throw createError;
      }

      console.log('✅ Bucket "blog-images" criado com sucesso');
    }

    console.log('\n✨ Bucket configurado com sucesso!\n');
    console.log('📝 Próximos passos:');
    console.log('   1. Acesse o Dashboard: https://supabase.com/dashboard');
    console.log('   2. Vá em Storage → blog-images → Policies');
    console.log('   3. Execute o SQL em: supabase/setup-storage.sql');
    console.log('   4. Teste o upload em: http://localhost:5174/admin/articles/new\n');

    // 3. Testar upload
    console.log('🧪 Testando permissões de upload...');
    const testContent = new Uint8Array([0x74, 0x65, 0x73, 0x74]); // 'test' em bytes
    const { error: uploadError } = await supabase.storage
      .from('blog-images')
      .upload('test/test.txt', testContent, {
        upsert: true,
        contentType: 'text/plain'
      });

    if (uploadError) {
      console.log('⚠️  Erro ao testar upload:', uploadError.message);
      console.log('   Você precisa configurar as políticas manualmente');
      console.log('   Execute o SQL em: supabase/setup-storage.sql\n');
    } else {
      console.log('✅ Teste de upload bem-sucedido');

      // Limpar arquivo de teste
      await supabase.storage.from('blog-images').remove(['test/test.txt']);
    }

  } catch (error) {
    console.error('\n❌ Erro durante a configuração:', error.message);
    console.error('\n📚 Para configurar manualmente:');
    console.error('   1. Acesse: https://supabase.com/dashboard');
    console.error('   2. Vá em Storage → New bucket');
    console.error('   3. Nome: blog-images, Public: ✅');
    console.error('   4. Execute o SQL em: supabase/setup-storage.sql\n');
    process.exit(1);
  }
}

// Executar
setupStorage();
