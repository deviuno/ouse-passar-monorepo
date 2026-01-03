/**
 * Script para inativar questões inválidas no banco de questões
 *
 * IMPORTANTE: Antes de executar este script, você precisa:
 * 1. Executar a migration 001_add_ativo_column.sql no Supabase Dashboard
 *    para criar a coluna 'ativo' na tabela questoes_concurso
 *
 * Uso: node inativar-questoes.mjs [--dry-run]
 *
 * --dry-run: Apenas mostra contagens, sem modificar o banco
 */

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Carrega .env do diretório do package
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
config({ path: join(__dirname, '..', '.env') });

// Configuração do banco de questões
const QUESTIONS_DB_URL = 'https://swzosaapqtyhmwdiwdje.supabase.co';
const QUESTIONS_DB_KEY = process.env.QUESTIONS_DB_SERVICE_KEY || process.env.VITE_QUESTIONS_DB_ANON_KEY;

if (!QUESTIONS_DB_KEY) {
  console.error('Erro: Defina QUESTIONS_DB_SERVICE_KEY ou VITE_QUESTIONS_DB_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(QUESTIONS_DB_URL, QUESTIONS_DB_KEY);

const BATCH_SIZE = 1000;

async function countQuestions(filter) {
  // Supabase não suporta count diretamente, vamos usar um workaround
  let count = 0;
  let lastId = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from('questoes_concurso')
      .select('id')
      .gt('id', lastId)
      .order('id', { ascending: true })
      .limit(BATCH_SIZE);

    // Aplica filtros
    if (filter.enunciado) {
      query = query.eq('enunciado', filter.enunciado);
    }
    if (filter.gabaritoNull) {
      query = query.is('gabarito', null);
    }
    if (filter.ativo !== undefined) {
      query = query.eq('ativo', filter.ativo);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao contar:', error.message);
      return -1;
    }

    count += data.length;

    if (data.length < BATCH_SIZE) {
      hasMore = false;
    } else {
      lastId = data[data.length - 1].id;
    }
  }

  return count;
}

async function inativarQuestoes(filter, reason) {
  let updated = 0;
  let lastId = 0;
  let hasMore = true;

  console.log(`\nInativando questões: ${reason}`);

  while (hasMore) {
    // Primeiro, busca IDs das questões que precisam ser inativadas
    let query = supabase
      .from('questoes_concurso')
      .select('id')
      .gt('id', lastId)
      .eq('ativo', true) // Apenas questões ativas
      .order('id', { ascending: true })
      .limit(BATCH_SIZE);

    // Aplica filtros
    if (filter.enunciado) {
      query = query.eq('enunciado', filter.enunciado);
    }
    if (filter.gabaritoNull) {
      query = query.is('gabarito', null);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Erro ao buscar questões:', error.message);
      return updated;
    }

    if (data.length === 0) {
      hasMore = false;
      continue;
    }

    // Atualiza em batch
    const ids = data.map(q => q.id);

    const { error: updateError } = await supabase
      .from('questoes_concurso')
      .update({ ativo: false })
      .in('id', ids);

    if (updateError) {
      console.error('Erro ao atualizar:', updateError.message);
      return updated;
    }

    updated += ids.length;
    lastId = data[data.length - 1].id;
    console.log(`  Inativadas ${updated} questões...`);

    if (data.length < BATCH_SIZE) {
      hasMore = false;
    }
  }

  return updated;
}

async function verificarColunaAtivo() {
  // Tenta buscar uma questão com o campo ativo
  const { data, error } = await supabase
    .from('questoes_concurso')
    .select('ativo')
    .limit(1);

  if (error && error.message.includes('ativo')) {
    return false;
  }

  return true;
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');

  console.log('='.repeat(60));
  console.log('SCRIPT DE INATIVACAO DE QUESTOES');
  console.log('='.repeat(60));

  // Verifica se a coluna ativo existe
  console.log('\nVerificando se a coluna "ativo" existe...');
  const colunaExiste = await verificarColunaAtivo();

  if (!colunaExiste) {
    console.error('\nERRO: A coluna "ativo" nao existe na tabela questoes_concurso!');
    console.error('Execute primeiro a migration 001_add_ativo_column.sql no Supabase Dashboard.');
    console.error('\nLocal do arquivo:');
    console.error('  packages/questoes/scripts/migrations/001_add_ativo_column.sql');
    process.exit(1);
  }

  console.log('Coluna "ativo" encontrada!\n');

  // Contagens antes
  console.log('Contando questoes...');

  const deletedCount = await countQuestions({ enunciado: 'deleted' });
  console.log(`  - Questoes com enunciado "deleted": ${deletedCount}`);

  const nullGabaritoCount = await countQuestions({ gabaritoNull: true });
  console.log(`  - Questoes sem gabarito (NULL): ${nullGabaritoCount}`);

  if (dryRun) {
    console.log('\n[DRY-RUN] Nenhuma alteracao foi feita.');
    console.log('Execute sem --dry-run para aplicar as alteracoes.');
    return;
  }

  // Executa inativações
  console.log('\n' + '-'.repeat(60));

  const inativadasDeleted = await inativarQuestoes(
    { enunciado: 'deleted' },
    'enunciado = "deleted"'
  );

  const inativadasSemGabarito = await inativarQuestoes(
    { gabaritoNull: true },
    'gabarito = NULL'
  );

  // Resumo
  console.log('\n' + '='.repeat(60));
  console.log('RESUMO');
  console.log('='.repeat(60));
  console.log(`Questoes inativadas (enunciado "deleted"): ${inativadasDeleted}`);
  console.log(`Questoes inativadas (sem gabarito): ${inativadasSemGabarito}`);
  console.log(`Total de questoes inativadas: ${inativadasDeleted + inativadasSemGabarito}`);
  console.log('='.repeat(60));
}

main().catch(console.error);
