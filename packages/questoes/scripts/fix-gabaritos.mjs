/**
 * Script para extrair gabaritos dos comentários e atualizar questões
 *
 * Uso: node fix-gabaritos.mjs [--dry-run] [--limit=N]
 *
 * --dry-run: Apenas mostra o que seria atualizado, sem modificar o banco
 * --limit=N: Limita a N questões processadas (padrão: todas)
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
  console.error('❌ Erro: Defina QUESTIONS_DB_SERVICE_KEY ou VITE_QUESTIONS_DB_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(QUESTIONS_DB_URL, QUESTIONS_DB_KEY);

// Padrões para extrair gabarito do comentário
const PATTERNS = [
  // Padrão: "Gabarito: Letra "B"" ou "Gabarito: Letra B" (com ou sem aspas)
  { regex: /gabarito\s*[;:]?\s*letra\s*["']?([A-Ea-e])["']?/i, group: 1 },

  // Padrão: "GABARITO LETRA A" ou "gabarito A" ou "Gabarito: A"
  { regex: /gabarito\s*[;:]?\s*["']?([A-Ea-e])["']?/i, group: 1 },

  // Padrão: "Portanto, gabarito letra \"A\""
  { regex: /portanto,?\s*gabarito\s*(?:letra)?\s*["']?([A-Ea-e])["']?/i, group: 1 },

  // Padrão: "Resposta: A" ou "Resposta correta: B"
  { regex: /resposta\s*(?:correta)?\s*[:\-]?\s*["']?([A-Ea-e])["']?/i, group: 1 },

  // Padrão: "Resposta: Letra B"
  { regex: /resposta\s*[:\-]?\s*letra\s*["']?([A-Ea-e])["']?/i, group: 1 },

  // Padrão: Questões Certo/Errado - "Errado:" no início
  { regex: /^[\s]*errado[\s]*[:\.\-]/i, value: 'E' },

  // Padrão: Questões Certo/Errado - "Certo:" no início
  { regex: /^[\s]*certo[\s]*[:\.\-]/i, value: 'C' },

  // Padrão: "ITEM CERTO" ou "ITEM ERRADO" (comum em questões CESPE)
  { regex: /ITEM\s+CERTO/i, value: 'C' },
  { regex: /ITEM\s+ERRADO/i, value: 'E' },

  // Padrão: "A alternativa correta é a letra A"
  { regex: /alternativa\s*correta\s*(?:é\s*)?(?:a\s*)?(?:letra\s*)?["']?([A-Ea-e])["']?/i, group: 1 },

  // Padrão: "a) Correto" ou "b) Correto" - alternativa marcada como correta
  { regex: /\b([a-eA-E])\s*\)\s*Correto\b/i, group: 1 },

  // Padrão: "Letra A está correta" ou "A letra B está correta"
  { regex: /(?:a\s+)?letra\s+([A-Ea-e])\s+(?:está\s+)?correta/i, group: 1 },

  // Padrão: "assertiva está CORRETA" ou "assertiva CORRETA" (questões CESPE/Cebraspe)
  { regex: /assertiva\s+(?:está\s+)?correta/i, value: 'C' },
  { regex: /assertiva\s+(?:está\s+)?(?:incorreta|errada)/i, value: 'E' },

  // Padrão: "afirmativa está correta" ou "afirmativa correta"
  { regex: /afirmativa\s+(?:está\s+)?correta/i, value: 'C' },
  { regex: /afirmativa\s+(?:está\s+)?(?:incorreta|errada)/i, value: 'E' },

  // Padrão: "está correta" ou "está errada" no final do comentário
  { regex: /está\s+correta\.?\s*$/i, value: 'C' },
  { regex: /está\s+(?:errada|incorreta)\.?\s*$/i, value: 'E' },

  // Padrão: "Alternativa incorreta" (início de explicação da resposta errada)
  // Cuidado: este padrão precisa confirmar que é uma questão de múltipla escolha
  // onde o comentário explica POR QUE a alternativa está incorreta
  // Não vamos usar por ser ambíguo

  // Padrão: "(CORRETA)" após alternativa - precisa do contexto das alternativas
  // Este é mais complexo e será tratado separadamente
];

// Padrão especial para encontrar "CORRETA" após uma letra
function findCorrectFromAlternatives(comentario) {
  // Procura por padrões como "a) ... CORRETA" ou "A) ... CORRETA"
  const match = comentario.match(/([a-eA-E])\s*\).*?(?:CORRETA|correta|Correta)(?:\s*[,.]|\s*$)/);
  if (match) {
    return match[1].toUpperCase();
  }
  return null;
}

function extractGabaritoFromComment(comentario) {
  if (!comentario) return null;

  // Tenta cada padrão
  for (const pattern of PATTERNS) {
    const match = comentario.match(pattern.regex);
    if (match) {
      if (pattern.value) {
        return pattern.value;
      }
      if (pattern.group && match[pattern.group]) {
        return match[pattern.group].toUpperCase();
      }
    }
  }

  // Tenta o padrão especial de CORRETA
  const correctFromAlt = findCorrectFromAlternatives(comentario);
  if (correctFromAlt) {
    return correctFromAlt;
  }

  return null;
}

const BATCH_SIZE = 500;

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run');
  const limitArg = args.find(a => a.startsWith('--limit='));
  const limit = limitArg ? parseInt(limitArg.split('=')[1]) : BATCH_SIZE;

  console.log('🔍 Buscando questões com gabarito nulo...\n');

  // Busca questões com gabarito nulo e comentário não nulo
  // Ignora questões com enunciado "deleted"
  const { data: questions, error } = await supabase
    .from('questoes_concurso')
    .select('id, comentario, alternativas')
    .is('gabarito', null)
    .not('comentario', 'is', null)
    .neq('enunciado', 'deleted')
    .limit(limit);

  if (error) {
    console.error('❌ Erro ao buscar questões:', error.message);
    process.exit(1);
  }

  console.log(`📊 Total de questões encontradas: ${questions.length}\n`);

  let found = 0;
  let notFound = 0;
  let updated = 0;
  let errors = 0;

  const results = {
    success: [],
    notFound: [],
    errors: []
  };

  for (const question of questions) {
    const gabarito = extractGabaritoFromComment(question.comentario);

    if (gabarito) {
      found++;

      // Valida se o gabarito encontrado é uma alternativa válida
      const alternativas = question.alternativas || [];
      const validLetters = alternativas.map(a => a.letter?.toUpperCase());

      if (validLetters.length > 0 && !validLetters.includes(gabarito)) {
        console.log(`⚠️  ID ${question.id}: Gabarito "${gabarito}" não está nas alternativas [${validLetters.join(', ')}]`);
        results.errors.push({ id: question.id, gabarito, reason: 'invalid_letter' });
        errors++;
        continue;
      }

      if (dryRun) {
        console.log(`✅ ID ${question.id}: Gabarito encontrado = "${gabarito}"`);
        results.success.push({ id: question.id, gabarito });
      } else {
        // Atualiza o gabarito
        const { error: updateError } = await supabase
          .from('questoes_concurso')
          .update({ gabarito })
          .eq('id', question.id);

        if (updateError) {
          console.log(`❌ ID ${question.id}: Erro ao atualizar - ${updateError.message}`);
          results.errors.push({ id: question.id, gabarito, reason: updateError.message });
          errors++;
        } else {
          console.log(`✅ ID ${question.id}: Atualizado para "${gabarito}"`);
          results.success.push({ id: question.id, gabarito });
          updated++;
        }
      }
    } else {
      notFound++;
      results.notFound.push(question.id);
    }
  }

  console.log('\n' + '='.repeat(50));
  console.log('📈 RESUMO');
  console.log('='.repeat(50));
  console.log(`Total processado:     ${questions.length}`);
  console.log(`Gabaritos encontrados: ${found}`);
  console.log(`Gabaritos não encontrados: ${notFound}`);

  if (!dryRun) {
    console.log(`Atualizados com sucesso: ${updated}`);
    console.log(`Erros ao atualizar: ${errors}`);
  } else {
    console.log('\n⚠️  Modo DRY-RUN: Nenhuma alteração foi feita');
    console.log('   Execute sem --dry-run para aplicar as alterações');
  }

  // Mostra alguns exemplos de questões sem gabarito identificável
  if (results.notFound.length > 0) {
    console.log('\n📝 Exemplos de IDs sem gabarito identificável (primeiros 10):');
    console.log(results.notFound.slice(0, 10).join(', '));
  }
}

main().catch(console.error);
