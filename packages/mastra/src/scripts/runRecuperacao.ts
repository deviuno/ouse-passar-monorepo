import { recuperarImagensPerdidas } from './recuperarImagensPerdidas.js';

async function main() {
  console.log('Iniciando recuperação de imagens perdidas...\n');

  try {
    const result = await recuperarImagensPerdidas();

    console.log('\n========================================');
    console.log('RESULTADO FINAL');
    console.log('========================================');
    console.log(`Total: ${result.total}`);
    console.log(`Sucesso: ${result.sucesso}`);
    console.log(`Falha: ${result.falha}`);
    console.log('\nDetalhes:');

    for (const r of result.resultados) {
      if (r.success) {
        console.log(`✅ Questão ${r.id}: ${r.urlsLocais?.length || 0} imagens recuperadas`);
      } else {
        console.log(`❌ Questão ${r.id}: ${r.error}`);
      }
    }

    process.exit(result.falha > 0 ? 1 : 0);
  } catch (error) {
    console.error('Erro fatal:', error);
    process.exit(1);
  }
}

main();
