/**
 * Script de Importação de Questões
 *
 * Importa questões de um arquivo JSON (formato TecConcursos/extensão)
 * para o banco de dados Supabase, processando imagens e enfileirando
 * para formatação automática.
 *
 * Uso:
 *   npx tsx src/scripts/importarQuestoes.ts <caminho-do-json>
 *
 * Exemplo:
 *   npx tsx src/scripts/importarQuestoes.ts ../../docs/questoes/progresso_diogotrader.json
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Configuração do Supabase (prioriza VITE_* que é o projeto principal ativo)
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Erro: SUPABASE_URL/VITE_SUPABASE_URL e SUPABASE_SERVICE_KEY/VITE_SUPABASE_ANON_KEY são obrigatórios');
  console.error('Configure as variáveis no arquivo .env');
  process.exit(1);
}

// Aviso sobre service key para upload de imagens
if (!process.env.SUPABASE_SERVICE_KEY) {
  console.warn('\n[AVISO] Usando ANON_KEY. Para upload de imagens, pode ser necessário SUPABASE_SERVICE_KEY.\n');
}

// Regex para extrair imagens do HTML
const IMG_REGEX = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;

// URLs a ignorar (ícones, etc)
const URLS_IGNORAR = ['icone-aviso', 'icon-', 'logo-'];

// Interface do JSON de entrada
interface QuestaoJSON {
  id: number;
  data: {
    questao: {
      idQuestao: number;
      enunciado: string;
      alternativas: string[];
      numeroAlternativaCorreta: number;
      tipoQuestao: 'CERTO_ERRADO' | 'MULTIPLA_ESCOLHA';
      nomeMateria: string;
      nomeAssunto?: string;
      bancaSigla: string;
      orgaoNome: string;
      orgaoSigla: string;
      cargoSigla: string;
      concursoAno: number;
      urlConcurso: string;
      anulada?: boolean;
      desatualizada?: boolean;
    };
  };
  comentarios?: any;
  alternativa_selecionada: number;
  alternativa_correta: number;
  timestamp: string;
  metadata: {
    possuiComentario: boolean;
    possuiComentarioVideo: boolean;
    possuiComentarioIA: boolean;
    numeroPosts: number;
    alternativaCorreta: number;
    tipoQuestao: string;
  };
  conta_responsavel: string;
}

// Interface da alternativa no formato do banco
interface AlternativaBanco {
  text: string;
  letter: string;
}

/**
 * Extrai URLs de imagens do HTML
 */
function extrairImagens(html: string): string[] {
  const urls: string[] = [];
  let match;

  // Reset do regex
  IMG_REGEX.lastIndex = 0;

  while ((match = IMG_REGEX.exec(html)) !== null) {
    const url = match[1];

    // Ignorar ícones e logos
    const deveIgnorar = URLS_IGNORAR.some(termo => url.toLowerCase().includes(termo));
    if (!deveIgnorar && url.startsWith('http')) {
      urls.push(url);
    }
  }

  return [...new Set(urls)]; // Remove duplicatas
}

/**
 * Faz download de uma imagem
 */
async function downloadImagem(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`  [ERRO] Download falhou para ${url}: HTTP ${response.status}`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  } catch (error) {
    console.error(`  [ERRO] Exceção ao baixar ${url}:`, error);
    return null;
  }
}

/**
 * Faz upload de uma imagem para o Supabase Storage
 */
async function uploadImagem(
  db: SupabaseClient,
  buffer: Buffer,
  filename: string,
  bucket: string = 'imagem_enunciado'
): Promise<string | null> {
  try {
    // Detectar tipo de imagem pelo magic number
    let contentType = 'image/jpeg';
    if (buffer[0] === 0x89 && buffer[1] === 0x50) {
      contentType = 'image/png';
    } else if (buffer[0] === 0x47 && buffer[1] === 0x49) {
      contentType = 'image/gif';
    }

    const { data, error } = await db.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error(`  [ERRO] Upload falhou para ${filename}:`, error.message);
      return null;
    }

    // Retornar URL pública
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucket}/${data.path}`;
    return publicUrl;
  } catch (error) {
    console.error(`  [ERRO] Exceção ao fazer upload ${filename}:`, error);
    return null;
  }
}

/**
 * Converte alternativas do formato JSON para o formato do banco
 */
function converterAlternativas(questao: QuestaoJSON['data']['questao']): AlternativaBanco[] {
  const isCertoErrado = questao.tipoQuestao === 'CERTO_ERRADO';

  return questao.alternativas.map((text, idx) => ({
    text,
    letter: isCertoErrado
      ? (idx === 0 ? 'C' : 'E')
      : String.fromCharCode(65 + idx) // A, B, C, D, E...
  }));
}

/**
 * Converte o gabarito do formato JSON (índice 1-based) para letra
 * Usa múltiplas fontes: numeroAlternativaCorreta, alternativa_correta, metadata.alternativaCorreta
 */
function converterGabarito(questao: QuestaoJSON['data']['questao'], item: QuestaoJSON): string | null {
  // Tentar múltiplas fontes de gabarito
  const idx = questao.numeroAlternativaCorreta || item.alternativa_correta || item.metadata?.alternativaCorreta;
  if (!idx || idx < 1) return null;

  const isCertoErrado = questao.tipoQuestao === 'CERTO_ERRADO';

  if (isCertoErrado) {
    return idx === 1 ? 'C' : 'E';
  }

  return String.fromCharCode(64 + idx); // 1->A, 2->B, etc.
}

/**
 * Extrai o texto do comentário da estrutura aninhada
 * Estrutura: item.comentarios.comentario.textoComentario
 */
function extrairComentario(item: QuestaoJSON): string | null {
  if (!item.comentarios) return null;

  // Estrutura: { comentario: { textoComentario: "...", nomeProfessor: "...", ... } }
  const comentarioObj = (item.comentarios as any)?.comentario;
  if (!comentarioObj) return null;

  const texto = comentarioObj.textoComentario;
  if (!texto || typeof texto !== 'string') return null;

  return texto;
}

/**
 * Extrai metadados do professor do comentário
 */
function extrairMetadadosProfessor(item: QuestaoJSON): { nome?: string; foto?: string } | null {
  if (!item.comentarios) return null;

  const comentarioObj = (item.comentarios as any)?.comentario;
  if (!comentarioObj) return null;

  return {
    nome: comentarioObj.nomeProfessor || undefined,
    foto: comentarioObj.fotoProfessor || undefined,
  };
}

/**
 * Limpa HTML básico (entidades) - formatação completa será feita pelo agente
 */
function limparHtmlBasico(html: string): string {
  return html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&aacute;/g, 'á')
    .replace(/&eacute;/g, 'é')
    .replace(/&iacute;/g, 'í')
    .replace(/&oacute;/g, 'ó')
    .replace(/&uacute;/g, 'ú')
    .replace(/&atilde;/g, 'ã')
    .replace(/&otilde;/g, 'õ')
    .replace(/&ccedil;/g, 'ç')
    .replace(/&Aacute;/g, 'Á')
    .replace(/&Eacute;/g, 'É')
    .replace(/&Iacute;/g, 'Í')
    .replace(/&Oacute;/g, 'Ó')
    .replace(/&Uacute;/g, 'Ú')
    .replace(/&Atilde;/g, 'Ã')
    .replace(/&Otilde;/g, 'Õ')
    .replace(/&Ccedil;/g, 'Ç')
    .replace(/&agrave;/g, 'à')
    .replace(/&egrave;/g, 'è')
    .replace(/&igrave;/g, 'ì')
    .replace(/&ograve;/g, 'ò')
    .replace(/&ugrave;/g, 'ù')
    .replace(/&acirc;/g, 'â')
    .replace(/&ecirc;/g, 'ê')
    .replace(/&icirc;/g, 'î')
    .replace(/&ocirc;/g, 'ô')
    .replace(/&ucirc;/g, 'û')
    .trim();
}

/**
 * Verifica se a questão já existe no banco (por external_id ou hash do enunciado)
 */
async function questaoJaExiste(
  db: SupabaseClient,
  idQuestaoExterno: number,
  enunciado: string
): Promise<boolean> {
  // Criar hash simples do enunciado para comparação
  const enunciadoLimpo = enunciado.replace(/\s+/g, ' ').trim().substring(0, 500);

  const { data } = await db
    .from('questoes_concurso')
    .select('id')
    .or(`enunciado.ilike.%${enunciadoLimpo.substring(0, 100)}%`)
    .limit(1);

  return !!(data && data.length > 0);
}

/**
 * Importa uma única questão
 */
async function importarQuestao(
  db: SupabaseClient,
  item: QuestaoJSON,
  index: number,
  total: number
): Promise<{ sucesso: boolean; id?: number; motivo?: string }> {
  const q = item.data.questao;

  console.log(`\n[${index + 1}/${total}] Processando questão ${q.idQuestao}...`);

  // Verificar se já existe
  const existe = await questaoJaExiste(db, q.idQuestao, q.enunciado);
  if (existe) {
    console.log(`  [SKIP] Questão já existe no banco`);
    return { sucesso: false, motivo: 'duplicada' };
  }

  // Extrair imagens do enunciado
  const imagensOriginais = extrairImagens(q.enunciado);
  console.log(`  Imagens encontradas: ${imagensOriginais.length}`);

  let enunciadoProcessado = limparHtmlBasico(q.enunciado);
  const imagensLocais: string[] = [];

  // Processar cada imagem
  for (let i = 0; i < imagensOriginais.length; i++) {
    const urlOriginal = imagensOriginais[i];
    console.log(`  Processando imagem ${i + 1}/${imagensOriginais.length}...`);

    const buffer = await downloadImagem(urlOriginal);
    if (buffer) {
      const ext = urlOriginal.includes('.png') ? 'png' : 'jpg';
      const filename = `import_${q.idQuestao}_${i}.${ext}`;
      const urlLocal = await uploadImagem(db, buffer, filename);

      if (urlLocal) {
        // Substituir URL original pela local no enunciado
        enunciadoProcessado = enunciadoProcessado.replace(urlOriginal, urlLocal);
        imagensLocais.push(urlLocal);
        console.log(`  [OK] Imagem ${i + 1} processada`);
      }
    }
  }

  // Converter alternativas e gabarito
  const alternativas = converterAlternativas(q);
  const gabarito = converterGabarito(q, item);

  // Extrair comentário (estrutura aninhada: comentarios.comentario.textoComentario)
  const comentarioTexto = extrairComentario(item);
  const comentarioLimpo = comentarioTexto ? limparHtmlBasico(comentarioTexto) : null;

  // Log de debug para comentário
  if (comentarioTexto) {
    console.log(`  Comentário encontrado: ${comentarioTexto.length} caracteres`);
  }

  // Preparar dados para inserção
  const dadosQuestao = {
    materia: q.nomeMateria,
    assunto: q.nomeAssunto || null,
    enunciado: enunciadoProcessado,
    enunciado_original: q.enunciado, // Guardar original para referência
    alternativas: alternativas,
    gabarito: gabarito,
    comentario: comentarioLimpo, // Comentário extraído
    comentario_original: comentarioTexto, // Guardar HTML original
    banca: q.bancaSigla,
    orgao: q.orgaoNome,
    cargo_area_especialidade_edicao: q.cargoSigla,
    ano: q.concursoAno,
    concurso: q.urlConcurso,
    imagens_enunciado: imagensOriginais.length > 0 ? JSON.stringify(imagensOriginais) : null,
    imagens_enunciado_local: imagensLocais.length > 0 ? `{${imagensLocais.join(',')}}` : null,
    enunciado_formatado: false,
    comentario_formatado: false,
    ativo: true,
    created_at: new Date().toISOString(),
  };

  // Inserir no banco
  const { data: inserted, error: insertError } = await db
    .from('questoes_concurso')
    .insert(dadosQuestao)
    .select('id')
    .single();

  if (insertError) {
    console.error(`  [ERRO] Falha ao inserir:`, insertError.message);
    return { sucesso: false, motivo: insertError.message };
  }

  const questaoId = inserted.id;
  console.log(`  [OK] Questão inserida com ID: ${questaoId}`);

  // Adicionar à fila de formatação de enunciados (upsert para evitar duplicatas)
  const { error: filaEnunciadoError } = await db
    .from('enunciados_pendentes_formatacao')
    .upsert({
      questao_id: questaoId,
      status: 'pendente',
      tentativas: 0,
      created_at: new Date().toISOString(),
    }, {
      onConflict: 'questao_id',
      ignoreDuplicates: true
    });

  if (filaEnunciadoError) {
    console.warn(`  [WARN] Erro ao adicionar à fila de enunciados:`, filaEnunciadoError.message);
  } else {
    console.log(`  [OK] Adicionada à fila de formatação de enunciados`);
  }

  // Se a questão tem comentário, adicionar à fila de formatação de comentários
  // Se NÃO tem comentário, adicionar à fila de geração por IA
  if (comentarioTexto) {
    const { error: filaComentarioError } = await db
      .from('comentarios_pendentes_formatacao')
      .upsert({
        questao_id: questaoId,
        status: 'pendente',
        tentativas: 0,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'questao_id',
        ignoreDuplicates: true
      });

    if (filaComentarioError) {
      console.warn(`  [WARN] Erro ao adicionar à fila de comentários:`, filaComentarioError.message);
    } else {
      console.log(`  [OK] Adicionada à fila de formatação de comentários`);
    }
  } else {
    // Questão sem comentário - adicionar à fila de geração por IA
    const { error: filaIAError } = await db
      .from('questoes_pendentes_ia')
      .upsert({
        questao_id: questaoId,
        status: 'pendente',
        tentativas: 0,
        created_at: new Date().toISOString(),
      }, {
        onConflict: 'questao_id',
        ignoreDuplicates: true
      });

    if (filaIAError) {
      console.warn(`  [WARN] Erro ao adicionar à fila de IA:`, filaIAError.message);
    } else {
      console.log(`  [OK] Adicionada à fila de geração de explicação por IA`);
    }
  }

  return { sucesso: true, id: questaoId };
}

/**
 * Verifica se uma questão tem gabarito válido
 */
function temGabarito(item: QuestaoJSON): boolean {
  const q = item.data.questao;
  const idx = q.numeroAlternativaCorreta || item.alternativa_correta || item.metadata?.alternativaCorreta;
  return idx !== undefined && idx !== null && idx >= 1;
}

/**
 * Função principal de importação
 */
async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Uso: npx tsx src/scripts/importarQuestoes.ts <caminho-do-json> [--limit N]');
    console.log('Exemplo: npx tsx src/scripts/importarQuestoes.ts ../../docs/questoes/questoes_completas.json --limit 50');
    process.exit(1);
  }

  const jsonPath = path.resolve(args[0]);

  // Parse do limite opcional
  let limite = 0; // 0 = sem limite
  const limitIndex = args.indexOf('--limit');
  if (limitIndex !== -1 && args[limitIndex + 1]) {
    limite = parseInt(args[limitIndex + 1], 10);
  }

  if (!fs.existsSync(jsonPath)) {
    console.error(`Erro: Arquivo não encontrado: ${jsonPath}`);
    process.exit(1);
  }

  console.log('='.repeat(60));
  console.log('IMPORTADOR DE QUESTÕES');
  console.log('='.repeat(60));
  console.log(`Arquivo: ${jsonPath}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  if (limite > 0) {
    console.log(`Limite: ${limite} questões`);
  }
  console.log('='.repeat(60));

  // Carregar JSON
  const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
  const todasQuestoes: QuestaoJSON[] = JSON.parse(jsonContent);

  console.log(`\nTotal de questões no arquivo: ${todasQuestoes.length}`);

  // Filtrar apenas questões COM gabarito
  const questoesComGabarito = todasQuestoes.filter(temGabarito);
  const questoesSemGabarito = todasQuestoes.filter(q => !temGabarito(q));

  console.log(`Questões COM gabarito: ${questoesComGabarito.length}`);
  console.log(`Questões SEM gabarito: ${questoesSemGabarito.length} (ignoradas)`);

  // Salvar lista de questões sem gabarito para análise posterior
  if (questoesSemGabarito.length > 0) {
    const semGabaritoPath = jsonPath.replace('.json', '_sem_gabarito.json');
    const semGabaritoIds = questoesSemGabarito.map(q => ({
      id: q.id,
      idQuestao: q.data.questao.idQuestao,
      materia: q.data.questao.nomeMateria,
      assunto: q.data.questao.nomeAssunto,
      banca: q.data.questao.bancaSigla,
    }));
    fs.writeFileSync(semGabaritoPath, JSON.stringify(semGabaritoIds, null, 2));
    console.log(`\n[INFO] Lista de questões sem gabarito salva em: ${semGabaritoPath}`);
  }

  // Aplicar limite se especificado
  const questoesParaImportar = limite > 0
    ? questoesComGabarito.slice(0, limite)
    : questoesComGabarito;

  console.log(`\nQuestões a processar: ${questoesParaImportar.length}`);

  // Criar cliente Supabase
  const db = createClient(SUPABASE_URL!, SUPABASE_KEY!);

  // Estatísticas
  const stats = {
    total: questoesParaImportar.length,
    sucesso: 0,
    duplicadas: 0,
    erros: 0,
    comComentario: 0,
    semComentario: 0,
    idsImportados: [] as number[],
  };

  // Processar cada questão
  for (let i = 0; i < questoesParaImportar.length; i++) {
    const item = questoesParaImportar[i];
    const resultado = await importarQuestao(db, item, i, questoesParaImportar.length);

    if (resultado.sucesso) {
      stats.sucesso++;
      if (resultado.id) stats.idsImportados.push(resultado.id);

      // Contar se tem comentário
      const temComentario = extrairComentario(item) !== null;
      if (temComentario) {
        stats.comComentario++;
      } else {
        stats.semComentario++;
      }
    } else if (resultado.motivo === 'duplicada') {
      stats.duplicadas++;
    } else {
      stats.erros++;
    }

    // Pequeno delay para não sobrecarregar
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  // Resumo final
  console.log('\n' + '='.repeat(60));
  console.log('RESUMO DA IMPORTAÇÃO');
  console.log('='.repeat(60));
  console.log(`Total processado: ${stats.total}`);
  console.log(`Importadas com sucesso: ${stats.sucesso}`);
  console.log(`  - Com comentário: ${stats.comComentario}`);
  console.log(`  - Sem comentário: ${stats.semComentario}`);
  console.log(`Duplicadas (ignoradas): ${stats.duplicadas}`);
  console.log(`Erros: ${stats.erros}`);
  console.log('='.repeat(60));

  if (stats.idsImportados.length > 0) {
    console.log(`\nIDs das questões importadas: ${stats.idsImportados.join(', ')}`);
  }

  if (stats.sucesso > 0) {
    console.log('\n[INFO] As questões foram adicionadas às filas de formatação.');
    console.log('[INFO] O cron job do Mastra irá formatá-las automaticamente.');
  }
}

// Executar
main().catch(error => {
  console.error('Erro fatal:', error);
  process.exit(1);
});
