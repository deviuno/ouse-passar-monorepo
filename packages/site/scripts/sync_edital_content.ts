
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Carregar variáveis de ambiente
const envPath = path.resolve(process.cwd(), '.env.local');
console.log('Tentando carregar .env de:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Erro ao carregar .env:', result.error);
} else {
    console.log('Variáveis carregadas:', Object.keys(result.parsed || {}));
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Erro: Variáveis de ambiente SUPABASE ausentes.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

const PREPARATORIO_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const EDITAL_FILE = path.resolve(__dirname, '../docs/edital_verticalizado_prf.md');
const OUTPUT_SQL = path.resolve(__dirname, 'fix_edital.sql');

async function syncContent() {
    console.log('--- Gerando SQL de Correção ---');

    // Limpar arquivo anterior
    if (fs.existsSync(OUTPUT_SQL)) fs.unlinkSync(OUTPUT_SQL);

    // ... (parsing logic remains) ...

    // 1. Ler e Parsear Markdown (Fonte da Verdade)
    const content = fs.readFileSync(EDITAL_FILE, 'utf-8');
    const lines = content.split('\n');
    const sourceItems: { type: string, title: string }[] = [];

    let currentMateria = false;

    for (let line of lines) {
        line = line.trim();
        // Ignorar metadados e linhas vazias
        if (!line || line.startsWith('***') || line.startsWith('Letras') || line.startsWith('Aqui está') || line.startsWith('# [cite_start]')) continue;
        line = line.replace(/\[cite_start\]/g, '').replace(/\[cite:.*?\]/g, '').trim();

        // BLOCO
        if (line.startsWith('## ')) {
            sourceItems.push({ type: 'bloco', title: line.replace('## ', '').trim() });
            currentMateria = false;
        }
        // MATÉRIA
        else if (line.startsWith('### ')) {
            sourceItems.push({ type: 'materia', title: line.replace('### ', '').trim() });
            currentMateria = true;
        }
        // TÓPICO
        else if (line.match(/^\* \*\*[0-9.]+\*\*/)) {
            if (!currentMateria) continue; // Deve estar dentro de matéria
            const tituloLimpo = line.replace(/^\* \*\*[0-9.]+\*\*/, '').trim();
            const tituloFinal = tituloLimpo.replace(/^[\s.]/, '').trim();
            sourceItems.push({ type: 'topico', title: tituloFinal });
        }
    }

    console.log(`Itens no Markdown: ${sourceItems.length}`);

    // 2. Buscar Itens do Banco de Dados
    const { data: dbItems, error } = await supabase
        .from('edital_verticalizado_items')
        .select('*')
        .eq('preparatorio_id', PREPARATORIO_ID)
        .order('ordem', { ascending: true }); // A ordem sequencial deve bater com a leitura do arquivo

    if (error) {
        console.error('Erro ao buscar itens do DB:', error);
        return;
    }

    console.log(`Itens no Banco de Dados: ${dbItems.length}`);

    // 3. Comparar e Atualizar
    // Assumimos que a ordem sequencial é a mesma.
    // Se o número de itens diferir drasticamente, abortamos.
    if (Math.abs(dbItems.length - sourceItems.length) > 5) {
        console.warn('ALERTA: Diferença grande no número de itens. Verifique se o seed foi feito com este arquivo.');
        console.warn(`DB: ${dbItems.length} vs MD: ${sourceItems.length}`);
        // return; // Não abortar, tentar sincronizar o possível
    }

    let updates = 0;
    const limit = Math.min(dbItems.length, sourceItems.length);

    for (let i = 0; i < limit; i++) {
        const dbItem = dbItems[i];
        const srcItem = sourceItems[i];

        // Verificação básica de tipo
        if (dbItem.tipo !== srcItem.type) {
            console.warn(`[Index ${i}] Descompasso de tipo! DB: ${dbItem.tipo} | SRC: ${srcItem.type}. Pulando...`);
            continue;
        }

        // Se título diferente, atualiza
        // Comparação sensível a acentos
        if (dbItem.titulo !== srcItem.title) {
            console.log(`Gerando update para [${dbItem.id}]:`);
            // Escape single quotes in title
            const safeTitle = srcItem.title.replace(/'/g, "''");
            const sql = `UPDATE edital_verticalizado_items SET titulo = '${safeTitle}' WHERE id = '${dbItem.id}';\n`;

            fs.appendFileSync(OUTPUT_SQL, sql);
            updates++;
        }
    }

    console.log('--- Geração Finalizada ---');
    console.log(`Total de instruções SQL geradas: ${updates}`);
    if (updates > 0) {
        console.log(`Arquivo SQL gerado em: ${OUTPUT_SQL}`);
    }
}

syncContent().catch(console.error);
