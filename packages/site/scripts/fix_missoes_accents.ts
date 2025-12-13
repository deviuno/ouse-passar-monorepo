
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis - tentar múltiplos caminhos
const envPath = path.resolve(process.cwd(), '.env.local');
dotenv.config({ path: envPath });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Erro: Variáveis SUPABASE ausentes.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const OUTPUT_SQL = path.resolve(__dirname, 'fix_missoes.sql');

// Dicionário de correções (Regex -> Replacement)
// ORDEM IMPORTA: Regex mais específicos primeiro se necessário
const REPLACEMENTS: [RegExp, string][] = [
    // --- Fix acentos errados (agudo onde deveria ser til) ---
    [/Legisláção/g, 'Legislação'],
    [/Legislácao/g, 'Legislação'],
    [/Circuláção/gi, 'Circulação'],
    [/Circulácao/gi, 'Circulação'],
    [/Habilitáção/gi, 'Habilitação'],
    [/Habilitácao/gi, 'Habilitação'],

    // --- Numerais Ordinais ---
    [/(\d+)o\b/g, '$1º'], // ex: 5o -> 5º
    [/(\d+)a\b/g, '$1ª'], // ex: 1a -> 1ª

    // --- Termos Jurídicos e Legais ---
    [/Lei no (\d+)/gi, 'Lei nº $1'],
    [/Decreto no (\d+)/gi, 'Decreto nº $1'],
    [/Resolucao/gi, 'Resolução'],
    [/Instrucao/gi, 'Instrução'],
    [/Portaria/gi, 'Portaria'],
    [/Constituicao/gi, 'Constituição'],
    [/Codigo/gi, 'Código'],
    [/Legislacao/g, 'Legislação'], [/legislacao/g, 'legislação'],
    [/Disposicoes/g, 'Disposições'], [/disposicoes/g, 'disposições'],
    [/Infracoes/g, 'Infrações'], [/infracoes/g, 'infrações'],
    [/Fiscalizacao/g, 'Fiscalização'], [/fiscalizacao/g, 'fiscalização'],
    [/Capitulo/g, 'Capítulo'], [/capitulo/g, 'capítulo'],
    [/Secao/g, 'Seção'], [/secao/g, 'seção'],
    [/Jurisprudencia/gi, 'Jurisprudência'],
    [/Sumula/gi, 'Súmula'],
    [/Acordao/gi, 'Acórdão'],
    [/Habilitacao/gi, 'Habilitação'],
    [/Licitacao/gi, 'Licitação'],
    [/Sancao/gi, 'Sanção'],
    [/Detencao/gi, 'Detenção'],
    [/Reclusao/gi, 'Reclusão'],
    [/Prisao/gi, 'Prisão'],

    // --- Matérias e Áreas ---
    [/Portugues/g, 'Português'],
    [/Matematica/g, 'Matemática'],
    [/Raciocinio/g, 'Raciocínio'], [/Logico/g, 'Lógico'],
    [/Informatica/g, 'Informática'],
    [/Fisica/g, 'Física'],
    [/Quimica/g, 'Química'],
    [/Biologia/g, 'Biologia'],
    [/Historia/g, 'História'],
    [/Geografia/g, 'Geografia'],
    [/Transito/g, 'Trânsito'], [/transito/g, 'trânsito'],
    [/Policia/g, 'Polícia'], [/policia/g, 'polícia'],
    [/Rodoviaria/g, 'Rodoviária'],
    [/Administracao/g, 'Administração'],
    [/Contabilidade/g, 'Contabilidade'],
    [/Economia/g, 'Economia'],
    [/Estatistica/g, 'Estatística'],
    [/Arquivologia/g, 'Arquivologia'],
    [/Etica/g, 'Ética'],
    [/Cidadania/g, 'Cidadania'],
    [/Ingles/g, 'Inglês'],
    [/Espanhol/g, 'Espanhol'],
    [/Frances/g, 'Francês'],
    [/Redacao/g, 'Redação'],

    // --- Palavras Comuns ---
    [/questoes/gi, 'questões'],
    [/missao/gi, 'missão'], [/missoes/gi, 'missões'],
    [/revisao/gi, 'revisão'],
    [/conteudo/gi, 'conteúdo'],
    [/teoria/gi, 'teoria'],
    [/pratica/gi, 'prática'],
    [/exercicio/gi, 'exercício'],
    [/modulo/gi, 'módulo'],
    [/video/gi, 'vídeo'],
    [/pagina/gi, 'página'],
    [/numero/gi, 'número'],
    [/periodo/gi, 'período'],
    [/horario/gi, 'horário'],
    [/calendario/gi, 'calendário'],
    [/cronograma/gi, 'cronograma'],
    [/metodo/gi, 'método'],
    [/analise/gi, 'análise'],
    [/sintaxe/gi, 'sintaxe'],
    [/morfologia/gi, 'morfologia'],
    [/semantica/gi, 'semântica'],
    [/acentuacao/gi, 'acentuação'],
    [/pontuacao/gi, 'pontuação'],
    [/regencia/gi, 'regência'],
    [/concordancia/gi, 'concordância'],
    [/hifen/gi, 'hífen'],
    [/cras/gi, 'crase'], // cuidado com cras
    [/sinonimo/gi, 'sinônimo'],
    [/antonimo/gi, 'antônimo'],
    [/paronimo/gi, 'parônimo'],
    [/homonimo/gi, 'homônimo'],

    // --- Palavras "ão", "ções", etc ---
    [/Publica/g, 'Pública'], [/publica\b/g, 'pública'], [/Publicas/g, 'Públicas'], [/publicas\b/g, 'públicas'],
    [/Orgao/g, 'Órgão'], [/orgao/g, 'órgão'],
    [/Uniao/g, 'União'], [/uniao/g, 'união'],
    [/Nacao/g, 'Nação'], [/nacao/g, 'nação'],
    [/Cidadao/g, 'Cidadão'], [/cidadao/g, 'cidadão'],
    [/Educacao/g, 'Educação'], [/educacao/g, 'educação'],
    [/Saude/g, 'Saúde'], [/saude/g, 'saúde'],
    [/Previdencia/g, 'Previdência'],
    [/Assistencia/g, 'Assistência'],
    [/Veiculo/g, 'Veículo'], [/veiculo/g, 'veículo'],
    [/Circulacao/g, 'Circulação'], [/circulacao/g, 'circulação'],
    [/Sinalizacao/g, 'Sinalização'], [/sinalizacao/g, 'sinalização'],
    [/Exclusao/g, 'Exclusão'], [/exclusao/g, 'exclusão'],
    [/Funcao/g, 'Função'], [/funcao/g, 'função'],
    [/Acao/g, 'Ação'], [/acao/g, 'ação'],
    [/Relacao/g, 'Relação'], [/relacao/g, 'relação'],
    [/Situacao/g, 'Situação'], [/situacao/g, 'situação'],
    [/Condicao/g, 'Condição'], [/condicao/g, 'condição'],
    [/Posicao/g, 'Posição'], [/posicao/g, 'posição'],
    [/Direcao/g, 'Direção'], [/direcao/g, 'direção'],
    [/Comissao/g, 'Comissão'], [/comissao/g, 'comissão'],
    [/Demissao/g, 'Demissão'], [/demissao/g, 'demissão'],
    [/Admissao/g, 'Admissão'], [/admissao/g, 'admissão'],
    [/Concessao/g, 'Concessão'], [/concessao/g, 'concessão'],
    [/Permissao/g, 'Permissão'], [/permissao/g, 'permissão'],
    [/Discussao/g, 'Discussão'], [/discussao/g, 'discussão'],
    [/Transmissao/g, 'Transmissão'], [/transmissao/g, 'transmissão'],
    [/Sucessao/g, 'Sucessão'], [/sucessao/g, 'sucessão'],
    [/Expressao/g, 'Expressão'], [/expressao/g, 'expressão'],
    [/Impressao/g, 'Impressão'], [/impressao/g, 'impressão'],
    [/Classificacao/g, 'Classificação'], [/classificacao/g, 'classificação'],

    // --- Palavras diversas ---
    [/Especies/g, 'Espécies'], [/especies/g, 'espécies'],
    [/Serie/g, 'Série'], [/serie/g, 'série'],
    [/Historia/g, 'História'], [/historia/g, 'história'],
    [/Memoria/g, 'Memória'], [/memoria/g, 'memória'],
    [/Proprio/g, 'Próprio'], [/proprio/g, 'próprio'],
    [/Varios/g, 'Vários'], [/varios/g, 'vários'],
    [/Agua/g, 'Água'], [/agua/g, 'água'],
    [/Area/g, 'Área'], [/area/g, 'área'],
    [/Aereo/g, 'Aéreo'],
    [/Apos\b/g, 'Após'], [/apos\b/g, 'após'],
    [/Ate\b/g, 'Até'], [/ate\b/g, 'até'],
    [/Ja\b/g, 'Já'], [/ja\b/g, 'já'],
    [/La\b/g, 'Lá'], [/la\b/g, 'lá'],
    [/So\b/g, 'Só'], [/so\b/g, 'só'],
    [/Nao\b/g, 'Não'], [/nao\b/g, 'não'],
    [/Sao\b/g, 'São'], [/sao\b/g, 'são'],
    [/Estao\b/g, 'Estão'], [/estao\b/g, 'estão'],
    [/Vao\b/g, 'Vão'], [/vao\b/g, 'vão'],
    [/Entao/g, 'Então'], [/entao/g, 'então'],
    [/Tambem/g, 'Também'], [/tambem/g, 'também'],
    [/Porem/g, 'Porém'], [/porem/g, 'porém'],
    [/Alguem/g, 'Alguém'], [/alguem/g, 'alguém'],
    [/Ninguem/g, 'Ninguém'], [/ninguem/g, 'ninguém'],
    [/Alem/g, 'Além'], [/alem/g, 'além'],
    [/Tres/g, 'Três'], [/tres/g, 'três'],
    [/Mes/g, 'Mês'], [/mes/g, 'mês'], [/Meses/g, 'Meses'], [/meses/g, 'meses'],
    [/Pais/g, 'País'], // Cuidado com 'Pais' (fathers). Mas em "O Pais" é País. Contexto. Deixar manual para revisão? "País" vs "Pais".
    [/Paises/g, 'Países'],
    [/Familia/g, 'Família'], [/familia/g, 'família'],
    [/Gabinete/gi, 'Gabinete'],
    [/Concurso/gi, 'Concurso'],
    [/Policia Civil/gi, 'Polícia Civil'],
    [/Policia Federal/gi, 'Polícia Federal'],

    // Fix specific cases found
    [/disposicoes/gi, 'disposições'],
    [/preliminares/gi, 'preliminares'],
    [/veiculos/gi, 'veículos'],
    [/velocidades/gi, 'velocidades'],
    [/circulacao/gi, 'circulação'],
    [/conduta/gi, 'conduta'],
    [/conducao/gi, 'condução'],
    [/motoristas/gi, 'motoristas'],
    [/profissionais/gi, 'profissionais'],
];

function correctsText(text: string | null): string | null {
    if (!text) return null;
    let newText = text;
    for (const [regex, replacement] of REPLACEMENTS) {
        newText = newText.replace(regex, replacement);
    }
    return newText;
}

async function run() {
    console.log('--- Iniciando Correção em Massa de Acentuação (Missões) ---');

    // 1. Buscar todas as missões
    const { data: missoes, error } = await supabase
        .from('missoes')
        .select('*');

    if (error) {
        console.error('Erro ao buscar missões:', error);
        return;
    }

    console.log(`Total de missões analisadas: ${missoes.length}`);

    // Limpar arquivo
    if (fs.existsSync(OUTPUT_SQL)) fs.unlinkSync(OUTPUT_SQL);

    let updateCount = 0;

    for (const missao of missoes) {
        let changed = false;

        const newMateria = correctsText(missao.materia);
        const newAssunto = correctsText(missao.assunto);
        const newInstrucoes = correctsText(missao.instrucoes);
        const newTema = correctsText(missao.tema);
        const newAcao = correctsText(missao.acao);

        const updates: any = {};

        if (newMateria !== missao.materia) { updates.materia = newMateria; changed = true; }
        if (newAssunto !== missao.assunto) { updates.assunto = newAssunto; changed = true; }
        if (newInstrucoes !== missao.instrucoes) { updates.instrucoes = newInstrucoes; changed = true; }
        if (newTema !== missao.tema) { updates.tema = newTema; changed = true; }
        if (newAcao !== missao.acao) { updates.acao = newAcao; changed = true; }

        if (changed) {
            console.log(`Correção Missão [${missao.id}]:`);
            if (updates.materia) console.log(`  Mat: ${missao.materia} -> ${updates.materia}`);
            if (updates.assunto) console.log(`  Ass: ${missao.assunto} -> ${updates.assunto}`);

            const sets: string[] = [];
            if (updates.materia) sets.push(`materia = '${updates.materia.replace(/'/g, "''")}'`);
            if (updates.assunto) sets.push(`assunto = '${updates.assunto.replace(/'/g, "''")}'`);
            if (updates.instrucoes) sets.push(`instrucoes = '${updates.instrucoes.replace(/'/g, "''")}'`);
            if (updates.tema) sets.push(`tema = '${updates.tema.replace(/'/g, "''")}'`);
            if (updates.acao) sets.push(`acao = '${updates.acao.replace(/'/g, "''")}'`);

            const sql = `UPDATE missoes SET ${sets.join(', ')} WHERE id = '${missao.id}';\n`;
            fs.appendFileSync(OUTPUT_SQL, sql);
            updateCount++;
        }
    }

    console.log('--- Finalizado ---');
    console.log(`Missões corrigidas: ${updateCount}`);
    if (updateCount > 0) {
        console.log(`SQL gerado em: ${OUTPUT_SQL}`);
    }
}

run().catch(console.error);
