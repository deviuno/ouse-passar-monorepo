
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Erro: VITE_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são necessários.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

const PREPARATORIO_ID = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
const EDITAL_FILE = path.resolve(__dirname, '../docs/edital_verticalizado_prf.md');

async function seedEdital() {
    console.log('Iniciando seed do Edital Verticalizado...');

    // 1. Limpar itens existentes para este preparatório (cuidado em produção!)
    const { error: deleteError } = await supabase
        .from('edital_verticalizado_items')
        .delete()
        .eq('preparatorio_id', PREPARATORIO_ID);

    if (deleteError) {
        console.error('Erro ao limpar itens antigos:', deleteError);
        return;
    }
    console.log('Itens antigos removidos.');

    // 2. Ler o arquivo markdown
    const content = fs.readFileSync(EDITAL_FILE, 'utf-8');
    const lines = content.split('\n');

    let currentBlocoId: string | null = null;
    let currentMateriaId: string | null = null;
    let currentTopicoId: string | null = null;

    let ordem = 0;

    for (let line of lines) {
        line = line.trim();
        if (!line || line.startsWith('***') || line.startsWith('Letras') || line.startsWith('Aqui está') || line.startsWith('# [cite_start]EDITAL')) continue;

        // Remover citações [cite: ...] e marcadores [cite_start]
        line = line.replace(/\[cite_start\]/g, '').replace(/\[cite:.*?\]/g, '').trim();

        // BLOCO
        if (line.startsWith('## ')) {
            const titulo = line.replace('## ', '').trim();
            const { data, error } = await supabase
                .from('edital_verticalizado_items')
                .insert({
                    preparatorio_id: PREPARATORIO_ID,
                    tipo: 'bloco',
                    titulo: titulo,
                    ordem: ordem++,
                    parent_id: null
                })
                .select()
                .single();

            if (error) {
                console.error(`Erro ao inserir bloco ${titulo}:`, error);
                continue;
            }
            currentBlocoId = data.id;
            currentMateriaId = null;
            currentTopicoId = null;
            console.log(`Bloco inserido: ${titulo}`);
        }
        // MATÉRIA
        else if (line.startsWith('### ')) {
            if (!currentBlocoId) {
                console.error('Erro: Matéria encontrada sem bloco pai.');
                continue;
            }
            const titulo = line.replace('### ', '').trim();
            const { data, error } = await supabase
                .from('edital_verticalizado_items')
                .insert({
                    preparatorio_id: PREPARATORIO_ID,
                    tipo: 'materia',
                    titulo: titulo,
                    ordem: ordem++,
                    parent_id: currentBlocoId
                })
                .select()
                .single();

            if (error) {
                console.error(`Erro ao inserir matéria ${titulo}:`, error);
                continue;
            }
            currentMateriaId = data.id;
            currentTopicoId = null;
            console.log(`  Matéria inserida: ${titulo}`);
        }
        // TÓPICO NIVEL 1
        else if (line.startsWith('* **')) {
            if (!currentMateriaId) {
                console.error('Erro: Tópico encontrado sem matéria pai.');
                continue;
            }
            // Remove * **X** ou **X.X**
            const titulo = line.replace(/^\* \*\*[0-9.]+\*\*/, '').trim();
            const { data, error } = await supabase
                .from('edital_verticalizado_items')
                .insert({
                    preparatorio_id: PREPARATORIO_ID,
                    tipo: 'topico',
                    titulo: titulo,
                    ordem: ordem++,
                    parent_id: currentMateriaId
                })
                .select()
                .single();

            if (error) {
                console.error(`Erro ao inserir tópico ${titulo}:`, error);
                continue;
            }
            currentTopicoId = data.id;
            // console.log(`    Tópico inserido: ${titulo}`);
        }
        // TÓPICO NIVEL 2 (SUBTÓPICO)
        else if (line.startsWith('* ') && !line.startsWith('* **')) {
            // As vezes indentation issue, check deeper
            // Nada a fazer, geralmente é o Subtopico abaixo
        }

        // Check indentation for Subtopics (usually 4 spaces)
        // Mas no meu split, o trim() removeu os espaços. Preciso checar a logica de subtopicos.
        // No arquivo original: "    * **4.1** ..."

        // Melhor abordagem: checar se começa com um marcador numérico de subtópico
        // Mas espere, eu fiz trim() no começo do loop.
        // Se a linha original tinha indentação, era subtópico.

        // Vamos refazer a lógica do loop para pegar a indentação da linha original?
        // Ou simplesmente confiar no padrão * **X.X**

        // O padrão é:
        // * **1** Topico
        //     * **1.1** Subtopico

        // Se eu fiz trim(), ambos começam com * **. 
        // A diferença é que o subtópico geralmente tem pontos no numero (ex 4.1), mas o topico principal tambem pode ter (ex 10).
        // O ideal é confiar que se eu já tenho um tópico aberto, e vem outro, se era indentado...

        // Vamos usar regex para capturar o numero.
        // * **(Numero)** Texto

        // Se o numero tem um ponto (ex 4.1), e eu tenho um currentTopicoId que é o (4)? 
        // Mas o parser de markdown as vezes varia.

        // Simplificação: Vou considerar tudo como topico filho da materia, pois o edital verticalizado geralmente lista tudo.
        // No seu pedido: "cada assunto aparece em uma linha diferente".
        // Se eu colocar hierarquia de 3 niveis (Bloco -> Materia -> Topico -> Subtopico), fica mais complexo de renderizar a tabela plana.
        // Se eu colocar todos os tópicos e subtópicos como filhos da MATÉRIA, eles aparecem na ordem correta na lista.
        // Isso simplifica a visualização "Tabela" onde a esquerda é o assunto.
        // Se eu tiver hierarquia profunda, a tabela fica aninhada.
        // O usuário disse: "estruturados de uma maneira de lista, onde cada assunto aparece em uma linha diferente".

        // Então vou achatar os tópicos e subtópicos todos no nível de tópico (filhos da matéria).
        // A ordem (campo `ordem`) vai manter a sequencia correta.

        if (line.match(/^\* \*\*[0-9.]+\*\*/)) {
            if (!currentMateriaId) continue;

            const tituloLimpo = line.replace(/^\* \*\*[0-9.]+\*\*/, '').trim();
            // Se sobrar apenas um ponto ou espaço no inicio
            const tituloFinal = tituloLimpo.replace(/^[\s.]/, '').trim();

            await supabase.from('edital_verticalizado_items').insert({
                preparatorio_id: PREPARATORIO_ID,
                tipo: 'topico',
                titulo: tituloFinal,
                ordem: ordem++,
                parent_id: currentMateriaId // Sempre filho da matéria para lista plana
            });
        }
    }

    console.log('Seed concluído com sucesso!');
}

seedEdital().catch(console.error);
