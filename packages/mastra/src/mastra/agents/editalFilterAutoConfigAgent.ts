/**
 * Agente de Auto-Configuração de Filtros do Edital Verticalizado
 *
 * Este agente é responsável por automaticamente mapear os títulos
 * dos itens do edital (matérias e tópicos) para os valores correspondentes
 * no banco de questões.
 *
 * Estratégia de Matching (3 níveis):
 * 1. Match Exato - comparação case-insensitive com normalização de acentos
 * 2. Match Parcial - contains, primeiros 5 chars, acrônimos
 * 3. Match Semântico (IA) - usa Gemini para correspondências como "Língua Portuguesa" → "Português"
 *
 * Se não encontrar correspondência, deixa o filtro vazio.
 */

import { Agent } from "@mastra/core";
import { google } from "@ai-sdk/google";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-loaded Supabase client (banco unificado)
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL and Key are required. Check your .env file.');
        }

        _supabase = createClient(supabaseUrl, supabaseKey);
    }
    return _supabase;
}

// ==================== TIPOS ====================

interface EditalItem {
    id: string;
    preparatorio_id: string;
    tipo: 'bloco' | 'materia' | 'topico';
    titulo: string;
    ordem: number;
    parent_id: string | null;
    filtro_materias: string[] | null;
    filtro_assuntos: string[] | null;
}

interface ConfigResult {
    itemId: string;
    titulo: string;
    tipo: string;
    filtrosMaterias: string[];
    filtrosAssuntos: string[];
    matchType: 'exact' | 'partial' | 'ai' | 'none';
    observacao?: string;
}

interface AutoConfigResult {
    success: boolean;
    itemsProcessed: number;
    itemsConfigured: number;
    results: ConfigResult[];
    error?: string;
}

// ==================== AGENT ====================

export const editalFilterAutoConfigAgent = new Agent({
    name: "EditalFilterAutoConfigAgent",
    instructions: `Voce e um especialista em concursos publicos brasileiros. Sua funcao e encontrar correspondencias entre termos de editais e termos usados em bancos de questoes.

Regras:
1. Busque correspondencia semantica, nao apenas textual
2. "Lingua Portuguesa" = "Portugues"
3. "Raciocinio Logico" = "Logica" = "Raciocinio Logico-Quantitativo"
4. "Direito Constitucional" pode ser "Constitucional" ou "Direito Constitucional"
5. "Informatica" = "Informatica Basica" = "Nocoes de Informatica"
6. "Direito Administrativo" = "Administrativo"
7. "Direito Penal" = "Penal"
8. "Legislacao de Transito" = "Codigo de Transito Brasileiro" = "CTB"
9. Considere variacoes de acentuacao e capitalizacao
10. Se nao encontrar correspondencia clara, retorne null
11. Retorne apenas o termo exato da lista disponivel

Responda APENAS em JSON no formato:
{
  "termoEncontrado": "termo exato da lista ou null",
  "confianca": "alta" | "media" | "baixa",
  "explicacao": "breve explicacao"
}`,
    model: google("gemini-3-flash-preview"),
});

// ==================== HELPER FUNCTIONS ====================

/**
 * Normaliza texto removendo acentos e convertendo para minúsculas
 */
function normalizeText(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .trim();
}

/**
 * Busca matérias distintas disponíveis no banco de questões
 */
async function getDistinctMaterias(): Promise<string[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_distinct_materias');

    if (error) {
        console.error('[EditalAutoConfig] Erro ao buscar matérias:', error);
        throw error;
    }

    return (data || []).map((d: { materia: string }) => d.materia).filter(Boolean);
}

/**
 * Busca assuntos distintos para as matérias especificadas
 */
async function getDistinctAssuntos(materias: string[]): Promise<{ assunto: string; materia: string }[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_distinct_assuntos', {
        p_materias: materias.length > 0 ? materias : null
    });

    if (error) {
        console.error('[EditalAutoConfig] Erro ao buscar assuntos:', error);
        throw error;
    }

    return data || [];
}

/**
 * Busca todos os itens do edital de um preparatório
 */
async function getEditalItems(preparatorioId: string): Promise<EditalItem[]> {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
        .from('edital_verticalizado_items')
        .select('*')
        .eq('preparatorio_id', preparatorioId)
        .order('ordem');

    if (error) {
        console.error('[EditalAutoConfig] Erro ao buscar itens do edital:', error);
        throw error;
    }

    return data || [];
}

/**
 * Atualiza os filtros de um item do edital
 */
async function updateItemFilters(
    itemId: string,
    materias: string[],
    assuntos: string[]
): Promise<void> {
    const supabase = getSupabaseClient();
    const { error } = await supabase
        .from('edital_verticalizado_items')
        .update({
            filtro_materias: materias.length > 0 ? materias : null,
            filtro_assuntos: assuntos.length > 0 ? assuntos : null,
        })
        .eq('id', itemId);

    if (error) {
        console.error('[EditalAutoConfig] Erro ao atualizar filtros:', error);
        throw error;
    }
}

// ==================== MATCHING FUNCTIONS ====================

/**
 * Tenta encontrar match exato (case-insensitive, sem acentos)
 */
function findExactMatch(titulo: string, disponiveis: string[]): string | null {
    const tituloNorm = normalizeText(titulo);

    for (const d of disponiveis) {
        if (normalizeText(d) === tituloNorm) {
            return d;
        }
    }

    return null;
}

/**
 * Palavras-chave que indicam conflito (não devem ser ignoradas no matching)
 * Se o título tem uma dessas palavras, o match deve ter a mesma ou uma equivalente
 */
const CONFLICTING_TERMS: Record<string, string[]> = {
    // Idiomas - muito importante distinguir!
    'portuguesa': ['portugues', 'portuguesa'],
    'portugues': ['portugues', 'portuguesa'],
    'espanhol': ['espanhol', 'espanhola'],
    'espanhola': ['espanhol', 'espanhola'],
    'ingles': ['ingles', 'inglesa'],
    'inglesa': ['ingles', 'inglesa'],
    // Áreas do Direito
    'penal': ['penal'],
    'civil': ['civil'],
    'constitucional': ['constitucional'],
    'administrativo': ['administrativo'],
    'tributario': ['tributario'],
    'trabalhista': ['trabalhista', 'trabalho'],
};

/**
 * Verifica se há conflito de termos entre título e disponível
 * Retorna true se há conflito (não devem fazer match)
 */
function hasConflictingTerms(tituloNorm: string, disponNorm: string): boolean {
    for (const [term, validMatches] of Object.entries(CONFLICTING_TERMS)) {
        // Se o título contém o termo conflitante
        if (tituloNorm.includes(term)) {
            // O disponível precisa ter pelo menos um dos termos válidos
            const hasValidMatch = validMatches.some(valid => disponNorm.includes(valid));
            if (!hasValidMatch) {
                // O título tem o termo mas o disponível não tem nenhum equivalente
                // Verifica se o disponível tem algum termo conflitante diferente
                const conflictingCategories = Object.entries(CONFLICTING_TERMS)
                    .filter(([t, _]) => t !== term && disponNorm.includes(t));
                if (conflictingCategories.length > 0) {
                    return true; // Conflito detectado!
                }
            }
        }
    }
    return false;
}

/**
 * Tenta encontrar match parcial (contains, primeiros chars, palavras-chave, etc.)
 */
function findPartialMatch(titulo: string, disponiveis: string[]): string | null {
    const tituloNorm = normalizeText(titulo);
    const tituloWords = tituloNorm.split(/\s+/).filter(w => w.length > 3);

    for (const d of disponiveis) {
        const dNorm = normalizeText(d);

        // IMPORTANTE: Verificar conflitos primeiro!
        if (hasConflictingTerms(tituloNorm, dNorm)) {
            continue; // Pular este - há conflito de termos
        }

        // Um contém o outro
        if (dNorm.includes(tituloNorm) || tituloNorm.includes(dNorm)) {
            return d;
        }

        // Primeiros 5 caracteres iguais (mas só se não houver palavras distinguidoras)
        if (tituloNorm.length >= 5 && dNorm.length >= 5) {
            if (tituloNorm.substring(0, 5) === dNorm.substring(0, 5)) {
                return d;
            }
        }

        // Match por palavras-chave (>= 70% das palavras do título)
        if (tituloWords.length >= 2) {
            const matchedWords = tituloWords.filter(word => dNorm.includes(word));
            if (matchedWords.length / tituloWords.length >= 0.7) {
                return d;
            }
        }
    }

    return null;
}

/**
 * Para termos genéricos, encontra TODOS os assuntos relacionados
 * Retorna múltiplos assuntos se o termo for muito curto/genérico
 */
function findMultipleMatches(titulo: string, disponiveis: string[]): string[] {
    const tituloNorm = normalizeText(titulo);
    const matches: string[] = [];

    // Se o título é muito curto (1-2 palavras), buscar todos que contêm o termo
    const wordCount = tituloNorm.split(/\s+/).filter(w => w.length > 2).length;

    if (wordCount <= 2) {
        for (const d of disponiveis) {
            const dNorm = normalizeText(d);
            // O assunto contém o termo do edital
            if (dNorm.includes(tituloNorm)) {
                matches.push(d);
            }
        }
    }

    // Limitar a 5 assuntos para não ficar muito amplo
    return matches.slice(0, 5);
}

/**
 * Ordena assuntos por relevância ao título (assuntos com palavras em comum primeiro)
 */
function sortByRelevance(titulo: string, disponiveis: string[]): string[] {
    const tituloNorm = normalizeText(titulo);
    const tituloWords = tituloNorm.split(/\s+/).filter(w => w.length > 3);

    return [...disponiveis].sort((a, b) => {
        const aNorm = normalizeText(a);
        const bNorm = normalizeText(b);

        // Contar palavras em comum
        const aMatches = tituloWords.filter(word => aNorm.includes(word)).length;
        const bMatches = tituloWords.filter(word => bNorm.includes(word)).length;

        // Ordenar por mais matches primeiro
        return bMatches - aMatches;
    });
}

/**
 * Usa IA para encontrar correspondência semântica
 */
async function findAIMatch(
    titulo: string,
    disponiveis: string[],
    tipo: string
): Promise<{ termo: string | null; explicacao: string }> {
    try {
        // Ordenar por relevância e limitar a lista para não sobrecarregar o prompt
        const sortedList = sortByRelevance(titulo, disponiveis);
        const listaLimitada = sortedList.slice(0, 200);

        const prompt = `
Termo do edital (${tipo}): "${titulo}"

Lista de ${tipo}s disponiveis no banco de questoes:
${listaLimitada.join('\n')}

Qual item da lista corresponde semanticamente ao termo "${titulo}"?
Lembre-se de considerar sinonimos e variacoes comuns em concursos.`;

        const result = await editalFilterAutoConfigAgent.generate([
            { role: "user", content: prompt }
        ]);

        const responseText = result.text || '';
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);

        if (jsonMatch) {
            try {
                const parsed = JSON.parse(jsonMatch[0]);

                if (parsed.termoEncontrado && parsed.termoEncontrado !== 'null' && parsed.termoEncontrado !== null) {
                    // Validar que o termo existe na lista
                    const termoValido = disponiveis.find(
                        d => normalizeText(d) === normalizeText(parsed.termoEncontrado)
                    );

                    if (termoValido) {
                        return { termo: termoValido, explicacao: parsed.explicacao || '' };
                    }
                }
            } catch (parseError) {
                console.error('[EditalAutoConfig] Erro ao parsear JSON da IA:', parseError);
            }
        }

        return { termo: null, explicacao: 'Sem correspondencia encontrada' };
    } catch (error) {
        console.error('[EditalAutoConfig] Erro no match por IA:', error);
        return { termo: null, explicacao: 'Erro na IA' };
    }
}

// ==================== MAIN FUNCTION ====================

/**
 * Função principal que auto-configura os filtros de todos os itens do edital
 */
export async function autoConfigureEditalFilters(
    preparatorioId: string
): Promise<AutoConfigResult> {
    console.log(`[EditalAutoConfig] Iniciando para preparatório: ${preparatorioId}`);

    try {
        // 1. Buscar todos os itens do edital
        const items = await getEditalItems(preparatorioId);

        if (items.length === 0) {
            console.log('[EditalAutoConfig] Nenhum item encontrado no edital');
            return {
                success: true,
                itemsProcessed: 0,
                itemsConfigured: 0,
                results: [],
            };
        }

        console.log(`[EditalAutoConfig] ${items.length} itens encontrados`);

        // 2. Buscar matérias disponíveis no banco de questões
        const availableMaterias = await getDistinctMaterias();
        console.log(`[EditalAutoConfig] ${availableMaterias.length} matérias disponíveis no banco`);

        // 3. Criar mapa de itens para lookup de pais
        const itemMap = new Map<string, EditalItem>();
        items.forEach(item => itemMap.set(item.id, item));

        const results: ConfigResult[] = [];
        let itemsConfigured = 0;

        // 4. Processar itens do tipo MATÉRIA primeiro
        const materiaItems = items.filter(i => i.tipo === 'materia');
        console.log(`[EditalAutoConfig] Processando ${materiaItems.length} matérias...`);

        for (const item of materiaItems) {
            let matchedMateria: string | null = null;
            let matchType: 'exact' | 'partial' | 'ai' | 'none' = 'none';
            let observacao = '';

            // Tentar match exato
            matchedMateria = findExactMatch(item.titulo, availableMaterias);
            if (matchedMateria) {
                matchType = 'exact';
                console.log(`[EditalAutoConfig] EXATO: "${item.titulo}" -> "${matchedMateria}"`);
            }

            // Tentar match parcial
            if (!matchedMateria) {
                matchedMateria = findPartialMatch(item.titulo, availableMaterias);
                if (matchedMateria) {
                    matchType = 'partial';
                    observacao = `Match parcial: "${item.titulo}" -> "${matchedMateria}"`;
                    console.log(`[EditalAutoConfig] PARCIAL: "${item.titulo}" -> "${matchedMateria}"`);
                }
            }

            // Tentar match por IA
            if (!matchedMateria) {
                const aiResult = await findAIMatch(item.titulo, availableMaterias, 'materia');
                if (aiResult.termo) {
                    matchedMateria = aiResult.termo;
                    matchType = 'ai';
                    observacao = aiResult.explicacao;
                    console.log(`[EditalAutoConfig] IA: "${item.titulo}" -> "${matchedMateria}" (${observacao})`);
                } else {
                    console.log(`[EditalAutoConfig] SEM MATCH: "${item.titulo}"`);
                }
            }

            // Atualizar filtros no banco
            const filtrosMaterias = matchedMateria ? [matchedMateria] : [];
            if (filtrosMaterias.length > 0) {
                await updateItemFilters(item.id, filtrosMaterias, []);
                itemsConfigured++;

                // Atualizar o item no mapa local para uso posterior
                item.filtro_materias = filtrosMaterias;
            }

            results.push({
                itemId: item.id,
                titulo: item.titulo,
                tipo: item.tipo,
                filtrosMaterias,
                filtrosAssuntos: [],
                matchType,
                observacao,
            });
        }

        // 5. Processar itens do tipo TÓPICO (dependem da matéria pai)
        const topicoItems = items.filter(i => i.tipo === 'topico');
        console.log(`[EditalAutoConfig] Processando ${topicoItems.length} tópicos...`);

        for (const item of topicoItems) {
            // Encontrar filtros da matéria pai
            let parentMaterias: string[] = [];
            let currentParentId = item.parent_id;

            while (currentParentId) {
                const parent = itemMap.get(currentParentId);
                if (!parent) break;

                if (parent.tipo === 'materia' && parent.filtro_materias && parent.filtro_materias.length > 0) {
                    parentMaterias = parent.filtro_materias;
                    break;
                }
                currentParentId = parent.parent_id;
            }

            // Se não tem matéria pai configurada, pular
            if (parentMaterias.length === 0) {
                results.push({
                    itemId: item.id,
                    titulo: item.titulo,
                    tipo: item.tipo,
                    filtrosMaterias: [],
                    filtrosAssuntos: [],
                    matchType: 'none',
                    observacao: 'Sem matéria pai configurada',
                });
                continue;
            }

            // Buscar assuntos disponíveis para as matérias do pai
            const availableAssuntos = await getDistinctAssuntos(parentMaterias);
            const assuntoNames = [...new Set(availableAssuntos.map(a => a.assunto))].filter(Boolean);

            if (assuntoNames.length === 0) {
                results.push({
                    itemId: item.id,
                    titulo: item.titulo,
                    tipo: item.tipo,
                    filtrosMaterias: [],
                    filtrosAssuntos: [],
                    matchType: 'none',
                    observacao: `Nenhum assunto disponível para ${parentMaterias.join(', ')}`,
                });
                continue;
            }

            let matchedAssunto: string | null = null;
            let matchType: 'exact' | 'partial' | 'ai' | 'none' = 'none';
            let observacao = '';

            // Tentar match exato
            matchedAssunto = findExactMatch(item.titulo, assuntoNames);
            if (matchedAssunto) {
                matchType = 'exact';
                console.log(`[EditalAutoConfig] EXATO: "${item.titulo}" -> "${matchedAssunto}"`);
            }

            // Tentar match parcial
            if (!matchedAssunto) {
                matchedAssunto = findPartialMatch(item.titulo, assuntoNames);
                if (matchedAssunto) {
                    matchType = 'partial';
                    observacao = `Match parcial: "${item.titulo}" -> "${matchedAssunto}"`;
                    console.log(`[EditalAutoConfig] PARCIAL: "${item.titulo}" -> "${matchedAssunto}"`);
                }
            }

            // Tentar match por IA
            if (!matchedAssunto && assuntoNames.length > 0) {
                const aiResult = await findAIMatch(item.titulo, assuntoNames, 'assunto');
                if (aiResult.termo) {
                    matchedAssunto = aiResult.termo;
                    matchType = 'ai';
                    observacao = aiResult.explicacao;
                    console.log(`[EditalAutoConfig] IA: "${item.titulo}" -> "${matchedAssunto}" (${observacao})`);
                } else {
                    console.log(`[EditalAutoConfig] SEM MATCH: "${item.titulo}"`);
                }
            }

            // Para termos genéricos sem match, tentar múltiplos assuntos relacionados
            let filtrosAssuntos: string[] = matchedAssunto ? [matchedAssunto] : [];
            if (filtrosAssuntos.length === 0) {
                const multipleMatches = findMultipleMatches(item.titulo, assuntoNames);
                if (multipleMatches.length > 0) {
                    filtrosAssuntos = multipleMatches;
                    matchType = 'partial';
                    observacao = `Múltiplos assuntos relacionados (${multipleMatches.length})`;
                    console.log(`[EditalAutoConfig] MULTI: "${item.titulo}" -> [${multipleMatches.slice(0, 2).join(', ')}${multipleMatches.length > 2 ? '...' : ''}]`);
                }
            }

            // Atualizar filtros no banco
            if (filtrosAssuntos.length > 0) {
                await updateItemFilters(item.id, [], filtrosAssuntos);
                itemsConfigured++;
            }

            results.push({
                itemId: item.id,
                titulo: item.titulo,
                tipo: item.tipo,
                filtrosMaterias: [],
                filtrosAssuntos: filtrosAssuntos,
                matchType,
                observacao,
            });
        }

        console.log(`[EditalAutoConfig] Concluído: ${itemsConfigured}/${items.length} itens configurados`);

        return {
            success: true,
            itemsProcessed: items.length,
            itemsConfigured,
            results,
        };

    } catch (error: any) {
        console.error('[EditalAutoConfig] Erro:', error);
        return {
            success: false,
            itemsProcessed: 0,
            itemsConfigured: 0,
            results: [],
            error: error.message || 'Erro ao configurar filtros',
        };
    }
}

export default {
    editalFilterAutoConfigAgent,
    autoConfigureEditalFilters,
};
