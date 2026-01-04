/**
 * Script de Migração: Banco de Questões
 *
 * Migra dados do projeto secundário (jvlbnetrpfbolqfgswhe)
 * para o projeto principal (avlttxzppcywybiaxxzd)
 *
 * Uso: npx tsx scripts/migrate-questoes.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Configuração dos projetos
// Source: Projeto de Questões (swzosaapqtyhmwdiwdje)
const SOURCE_URL = 'https://swzosaapqtyhmwdiwdje.supabase.co';
const SOURCE_KEY = process.env.SUPABASE_QUESTOES_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN3em9zYWFwcXR5aG13ZGl3ZGplIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTI0NzE3MiwiZXhwIjoyMDc2ODIzMTcyfQ.6dIdM7zeNcJU2P-wqdkJYvfdxKsnvpjrCPrFU4T0zv4';

// Target: Projeto Principal (avlttxzppcywybiaxxzd)
const TARGET_URL = 'https://avlttxzppcywybiaxxzd.supabase.co';
const TARGET_KEY = process.env.SUPABASE_SERVICE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2bHR0eHpwcGN5d3liaWF4eHpkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MTU3NjY2NSwiZXhwIjoyMDc3MTUyNjY1fQ.AVPtuYiXPvekXBsJ3E40roJqq4Vdfj0-35PW5BCnVSU';

// Tamanho do lote para migração
const BATCH_SIZE = 500;

interface MigrationResult {
  table: string;
  total: number;
  migrated: number;
  errors: number;
  duration: number;
}

async function migrateTable(
  source: SupabaseClient,
  target: SupabaseClient,
  tableName: string,
  orderBy: string = 'id'
): Promise<MigrationResult> {
  console.log(`\n📦 Migrando tabela: ${tableName}`);
  const startTime = Date.now();

  let totalMigrated = 0;
  let totalErrors = 0;
  let hasMore = true;

  // Contar total de registros na origem
  const { count } = await source
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  const total = count || 0;

  // Verificar quantos já existem no destino para continuar de onde parou
  const { count: existingCount } = await target
    .from(tableName)
    .select('*', { count: 'exact', head: true });

  const existing = existingCount || 0;
  let offset = existing > 0 ? existing : 0;

  console.log(`   Total na origem: ${total}`);
  console.log(`   Já migrados: ${existing}`);
  console.log(`   Faltam: ${total - existing}`);

  while (hasMore) {
    // Buscar lote do source
    const { data, error: fetchError } = await source
      .from(tableName)
      .select('*')
      .order(orderBy, { ascending: true })
      .range(offset, offset + BATCH_SIZE - 1);

    if (fetchError) {
      console.error(`   ❌ Erro ao buscar dados: ${fetchError.message}`);
      totalErrors++;
      break;
    }

    if (!data || data.length === 0) {
      hasMore = false;
      break;
    }

    // Inserir no target
    const { error: insertError } = await target
      .from(tableName)
      .upsert(data, { onConflict: 'id' });

    if (insertError) {
      console.error(`   ❌ Erro ao inserir lote (offset ${offset}): ${insertError.message}`);
      totalErrors++;
    } else {
      totalMigrated += data.length;
      const progress = ((totalMigrated / total) * 100).toFixed(1);
      process.stdout.write(`\r   ✅ Progresso: ${totalMigrated}/${total} (${progress}%)`);
    }

    offset += BATCH_SIZE;

    // Pequeno delay para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(''); // Nova linha após progresso

  const duration = (Date.now() - startTime) / 1000;
  console.log(`   ⏱️  Duração: ${duration.toFixed(1)}s`);

  return {
    table: tableName,
    total,
    migrated: totalMigrated,
    errors: totalErrors,
    duration
  };
}

async function main() {
  console.log('🚀 Iniciando migração do banco de questões\n');
  console.log('━'.repeat(50));

  // Validar chaves
  if (!SOURCE_KEY) {
    console.error('❌ SUPABASE_QUESTOES_SERVICE_KEY não configurada');
    process.exit(1);
  }
  if (!TARGET_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY não configurada');
    process.exit(1);
  }

  // Criar clientes
  const source = createClient(SOURCE_URL, SOURCE_KEY);
  const target = createClient(TARGET_URL, TARGET_KEY);

  console.log('📡 Source: Projeto Questões (jvlbnetrpfbolqfgswhe)');
  console.log('📡 Target: Projeto Principal (avlttxzppcywybiaxxzd)');
  console.log('━'.repeat(50));

  const results: MigrationResult[] = [];

  try {
    // 1. Migrar assuntos_taxonomia primeiro (tem foreign keys)
    results.push(await migrateTable(source, target, 'assuntos_taxonomia'));

    // 2. Migrar assuntos_mapeamento (depende de assuntos_taxonomia)
    results.push(await migrateTable(source, target, 'assuntos_mapeamento'));

    // 3. Migrar assuntos_sinonimos
    results.push(await migrateTable(source, target, 'assuntos_sinonimos'));

    // 4. Migrar filter_options_cache
    results.push(await migrateTable(source, target, 'filter_options_cache'));

    // 5. Migrar questoes_concurso (a maior tabela)
    results.push(await migrateTable(source, target, 'questoes_concurso'));

    // 6. Migrar questoes_pendentes_ia
    results.push(await migrateTable(source, target, 'questoes_pendentes_ia', 'id'));

    // 7. Migrar comentarios_pendentes_formatacao
    results.push(await migrateTable(source, target, 'comentarios_pendentes_formatacao', 'id'));

  } catch (error) {
    console.error('\n❌ Erro fatal durante migração:', error);
    process.exit(1);
  }

  // Resumo final
  console.log('\n' + '━'.repeat(50));
  console.log('📊 RESUMO DA MIGRAÇÃO');
  console.log('━'.repeat(50));

  let totalRecords = 0;
  let totalMigrated = 0;
  let totalErrors = 0;
  let totalDuration = 0;

  for (const r of results) {
    const status = r.errors > 0 ? '⚠️' : '✅';
    console.log(`${status} ${r.table}: ${r.migrated}/${r.total} (${r.duration.toFixed(1)}s)`);
    totalRecords += r.total;
    totalMigrated += r.migrated;
    totalErrors += r.errors;
    totalDuration += r.duration;
  }

  console.log('━'.repeat(50));
  console.log(`📈 Total: ${totalMigrated}/${totalRecords} registros`);
  console.log(`⏱️  Tempo total: ${totalDuration.toFixed(1)}s`);

  if (totalErrors > 0) {
    console.log(`⚠️  Erros: ${totalErrors}`);
  }

  console.log('\n✅ Migração concluída!');
}

main().catch(console.error);
