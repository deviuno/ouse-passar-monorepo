#!/usr/bin/env node
/**
 * Script para processar fila de gabaritos usando IA
 *
 * Uso:
 *   node processar-fila-gabaritos.mjs [opções]
 *
 * Opções:
 *   --limite=N       Número de questões por batch (padrão: 50)
 *   --max=N          Máximo total de questões a processar (padrão: ilimitado)
 *   --delay=N        Delay entre batches em ms (padrão: 2000)
 *   --local          Usar servidor local (localhost:4000)
 *   --dry-run        Apenas mostra status sem processar
 *
 * Exemplos:
 *   node processar-fila-gabaritos.mjs --limite=100
 *   node processar-fila-gabaritos.mjs --max=500 --delay=3000
 *   node processar-fila-gabaritos.mjs --local --dry-run
 */

const MASTRA_URL_PROD = 'https://mastra.ousepassar.com.br';
const MASTRA_URL_LOCAL = 'http://localhost:4000';

// Parse argumentos
const args = process.argv.slice(2);
const getArg = (name, defaultValue) => {
    const arg = args.find(a => a.startsWith(`--${name}=`));
    return arg ? arg.split('=')[1] : defaultValue;
};
const hasFlag = (name) => args.includes(`--${name}`);

const CONFIG = {
    limite: parseInt(getArg('limite', '50')),
    maxTotal: getArg('max', null) ? parseInt(getArg('max', '0')) : null,
    delay: parseInt(getArg('delay', '2000')),
    baseUrl: hasFlag('local') ? MASTRA_URL_LOCAL : MASTRA_URL_PROD,
    dryRun: hasFlag('dry-run'),
};

console.log('═'.repeat(60));
console.log('🤖 PROCESSADOR DE FILA DE GABARITOS');
console.log('═'.repeat(60));
console.log(`📡 Servidor: ${CONFIG.baseUrl}`);
console.log(`📦 Batch size: ${CONFIG.limite}`);
console.log(`⏱️  Delay entre batches: ${CONFIG.delay}ms`);
if (CONFIG.maxTotal) console.log(`🔢 Máximo total: ${CONFIG.maxTotal}`);
if (CONFIG.dryRun) console.log(`🔍 Modo DRY-RUN (apenas status)`);
console.log('═'.repeat(60));
console.log('');

async function getStatus() {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/api/questoes/fila-gabaritos/status`);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        return await response.json();
    } catch (error) {
        console.error(`❌ Erro ao buscar status: ${error.message}`);
        return null;
    }
}

async function processarBatch(limite) {
    try {
        const response = await fetch(`${CONFIG.baseUrl}/api/questoes/processar-fila-gabaritos`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ limite }),
        });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`❌ Erro ao processar batch: ${error.message}`);
        return null;
    }
}

function formatTime(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    } else {
        return `${seconds}s`;
    }
}

async function main() {
    const startTime = Date.now();

    // Buscar status inicial
    console.log('📊 Buscando status inicial...\n');
    const statusInicial = await getStatus();

    if (!statusInicial || !statusInicial.success) {
        console.error('❌ Não foi possível conectar ao servidor Mastra');
        console.error('   Verifique se o servidor está rodando e acessível.');
        process.exit(1);
    }

    console.log('┌─────────────────────────────────────┐');
    console.log('│         STATUS INICIAL              │');
    console.log('├─────────────────────────────────────┤');
    console.log(`│ 📋 Total na fila:    ${String(statusInicial.total).padStart(10)} │`);
    console.log(`│ ⏳ Pendentes:        ${String(statusInicial.pendente).padStart(10)} │`);
    console.log(`│ 🔄 Processando:      ${String(statusInicial.processando).padStart(10)} │`);
    console.log(`│ ✅ Concluídos:       ${String(statusInicial.concluido).padStart(10)} │`);
    console.log(`│ ❌ Falhas:           ${String(statusInicial.falha).padStart(10)} │`);
    console.log('└─────────────────────────────────────┘');
    console.log('');

    if (statusInicial.pendente === 0) {
        console.log('✨ Nenhuma questão pendente para processar!');
        process.exit(0);
    }

    if (CONFIG.dryRun) {
        console.log('🔍 Modo DRY-RUN: Nenhum processamento realizado.');
        process.exit(0);
    }

    // Processar batches
    let totalProcessadas = 0;
    let totalSucesso = 0;
    let totalFalha = 0;
    let batchNum = 0;
    let continuar = true;

    console.log('🚀 Iniciando processamento...\n');

    while (continuar) {
        batchNum++;

        // Calcular limite do batch (respeitar maxTotal)
        let limiteAtual = CONFIG.limite;
        if (CONFIG.maxTotal) {
            const restante = CONFIG.maxTotal - totalProcessadas;
            if (restante <= 0) {
                console.log(`\n🔢 Limite máximo de ${CONFIG.maxTotal} questões atingido.`);
                break;
            }
            limiteAtual = Math.min(CONFIG.limite, restante);
        }

        console.log(`📦 Batch #${batchNum} (processando até ${limiteAtual} questões)...`);

        const resultado = await processarBatch(limiteAtual);

        if (!resultado || !resultado.success) {
            console.error('   ❌ Erro no batch. Tentando novamente em 5s...');
            await new Promise(r => setTimeout(r, 5000));
            continue;
        }

        if (resultado.processadas === 0) {
            console.log('   ✨ Fila vazia!');
            continuar = false;
            break;
        }

        totalProcessadas += resultado.processadas;
        totalSucesso += resultado.sucesso;
        totalFalha += resultado.falha;

        const tempoDecorrido = Date.now() - startTime;
        const velocidade = (totalProcessadas / (tempoDecorrido / 1000)).toFixed(2);

        console.log(`   ✅ ${resultado.sucesso} sucesso | ❌ ${resultado.falha} falha | ⚡ ${velocidade} q/s`);

        // Verificar se ainda há pendentes
        if (resultado.processadas < limiteAtual) {
            console.log('\n✨ Todas as questões pendentes foram processadas!');
            continuar = false;
            break;
        }

        // Delay entre batches
        if (continuar) {
            process.stdout.write(`   ⏳ Aguardando ${CONFIG.delay}ms...`);
            await new Promise(r => setTimeout(r, CONFIG.delay));
            console.log(' OK\n');
        }
    }

    // Estatísticas finais
    const tempoTotal = Date.now() - startTime;

    console.log('\n' + '═'.repeat(60));
    console.log('📊 RESUMO FINAL');
    console.log('═'.repeat(60));
    console.log(`⏱️  Tempo total:          ${formatTime(tempoTotal)}`);
    console.log(`📦 Batches processados:   ${batchNum}`);
    console.log(`📋 Total processadas:     ${totalProcessadas}`);
    console.log(`✅ Gabaritos extraídos:   ${totalSucesso} (${((totalSucesso/totalProcessadas)*100).toFixed(1)}%)`);
    console.log(`❌ Falhas:                ${totalFalha} (${((totalFalha/totalProcessadas)*100).toFixed(1)}%)`);

    if (totalProcessadas > 0) {
        const velocidadeMedia = (totalProcessadas / (tempoTotal / 1000)).toFixed(2);
        console.log(`⚡ Velocidade média:      ${velocidadeMedia} questões/segundo`);
    }

    console.log('═'.repeat(60));

    // Buscar status final
    console.log('\n📊 Status final da fila:');
    const statusFinal = await getStatus();
    if (statusFinal && statusFinal.success) {
        console.log(`   ⏳ Pendentes: ${statusFinal.pendente}`);
        console.log(`   ✅ Concluídos: ${statusFinal.concluido}`);
        console.log(`   ❌ Falhas: ${statusFinal.falha}`);
    }

    console.log('\n✨ Processamento concluído!');
}

main().catch(error => {
    console.error('❌ Erro fatal:', error);
    process.exit(1);
});
