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

import { Agent } from "@mastra/core/agent";
import { vertex } from "../../lib/modelProvider.js";
import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-loaded Supabase client (banco unificado)
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL?.trim() || '';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY?.trim() || '';

        console.log(`[EditalAutoConfig] Inicializando Supabase client com URL: "${supabaseUrl.substring(0, 50)}..."`);

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL and Key are required. Check your .env file.');
        }

        _supabase = createClient(supabaseUrl, supabaseKey, {
            db: {
                schema: 'public',
            },
            global: {
                headers: {
                    // Aumentar timeout para 30 segundos
                    'x-client-info': 'edital-auto-config',
                },
                fetch: (url, options = {}) => {
                    return fetch(url, {
                        ...options,
                        signal: AbortSignal.timeout(30000), // 30 segundos
                    });
                },
            },
        });
    }
    return _supabase;
}

// Cache de matérias para evitar queries repetidas
let _cachedMaterias: string[] | null = null;
let _cachedAssuntos: Map<string, { assunto: string; materia: string }[]> = new Map();

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
    foundInDifferentMateria?: boolean;  // Flag se encontrou em matéria diferente
    originalMateria?: string;            // Matéria original (do pai)
    foundMateria?: string;               // Matéria onde foi encontrado
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
    id: "editalFilterAutoConfigAgent",
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
    model: vertex("gemini-2.5-flash-lite"),
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
 * Busca matérias distintas disponíveis no banco de questões (com cache)
 */
async function getDistinctMaterias(): Promise<string[]> {
    // Usar cache se disponível
    if (_cachedMaterias) {
        console.log(`[EditalAutoConfig] Usando cache de matérias (${_cachedMaterias.length} matérias)`);
        return _cachedMaterias;
    }

    const supabase = getSupabaseClient();

    console.log('[EditalAutoConfig] Buscando matérias distintas do banco...');
    const startTime = Date.now();

    const { data, error } = await supabase.rpc('get_distinct_materias');

    if (error) {
        console.error('[EditalAutoConfig] Erro ao buscar matérias:', error);
        throw error;
    }

    const materias = (data || []).map((d: { materia: string }) => d.materia).filter(Boolean);
    const elapsed = Date.now() - startTime;
    console.log(`[EditalAutoConfig] ${materias.length} matérias encontradas em ${elapsed}ms`);

    // Salvar no cache
    _cachedMaterias = materias;

    return materias;
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
 * Busca assuntos de TODAS as matérias (para busca cross-matéria)
 */
async function getAllAssuntos(): Promise<{ assunto: string; materia: string }[]> {
    // Usar cache se disponível
    const cacheKey = '__all__';
    if (_cachedAssuntos.has(cacheKey)) {
        console.log('[EditalAutoConfig] Usando cache de todos os assuntos');
        return _cachedAssuntos.get(cacheKey)!;
    }

    const supabase = getSupabaseClient();
    const { data, error } = await supabase.rpc('get_distinct_assuntos', {
        p_materias: null  // null = todas as matérias
    });

    if (error) {
        console.error('[EditalAutoConfig] Erro ao buscar todos os assuntos:', error);
        throw error;
    }

    const assuntos = data || [];
    _cachedAssuntos.set(cacheKey, assuntos);
    console.log(`[EditalAutoConfig] ${assuntos.length} assuntos totais carregados`);

    return assuntos;
}

/**
 * Busca um assunto em outra matéria diferente da original
 * Retorna o assunto encontrado e a matéria onde foi encontrado
 */
async function findAssuntoInOtherMaterias(
    titulo: string,
    excludeMaterias: string[]
): Promise<{ assunto: string | null; materia: string | null; matchType: 'exact' | 'partial' | 'ai' | 'none' }> {
    const allAssuntos = await getAllAssuntos();

    // Filtrar assuntos excluindo as matérias do pai
    const excludeSet = new Set(excludeMaterias.map(m => normalizeText(m)));
    const otherAssuntos = allAssuntos.filter(a => !excludeSet.has(normalizeText(a.materia)));

    if (otherAssuntos.length === 0) {
        return { assunto: null, materia: null, matchType: 'none' };
    }

    const assuntoNames = [...new Set(otherAssuntos.map(a => a.assunto))].filter(Boolean);

    // Tentar match exato
    let matchedAssunto = findExactMatch(titulo, assuntoNames);
    if (matchedAssunto) {
        const materiaMatch = otherAssuntos.find(a => a.assunto === matchedAssunto);
        return {
            assunto: matchedAssunto,
            materia: materiaMatch?.materia || null,
            matchType: 'exact'
        };
    }

    // Tentar match parcial
    matchedAssunto = findPartialMatch(titulo, assuntoNames);
    if (matchedAssunto) {
        const materiaMatch = otherAssuntos.find(a => a.assunto === matchedAssunto);
        return {
            assunto: matchedAssunto,
            materia: materiaMatch?.materia || null,
            matchType: 'partial'
        };
    }

    // Tentar match por IA (limitado para performance)
    if (assuntoNames.length > 0) {
        const aiResult = await findAIMatch(titulo, assuntoNames.slice(0, 300), 'assunto');
        if (aiResult.termo) {
            const materiaMatch = otherAssuntos.find(a => a.assunto === aiResult.termo);
            return {
                assunto: aiResult.termo,
                materia: materiaMatch?.materia || null,
                matchType: 'ai'
            };
        }
    }

    return { assunto: null, materia: null, matchType: 'none' };
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

    const updateData = {
        filtro_materias: materias.length > 0 ? materias : null,
        filtro_assuntos: assuntos.length > 0 ? assuntos : null,
    };

    console.log(`[EditalAutoConfig] Atualizando item ${itemId}:`, JSON.stringify(updateData));

    const { data, error, count } = await supabase
        .from('edital_verticalizado_items')
        .update(updateData)
        .eq('id', itemId)
        .select();

    if (error) {
        console.error('[EditalAutoConfig] Erro ao atualizar filtros:', error);
        throw error;
    }

    console.log(`[EditalAutoConfig] Update result - rows affected: ${data?.length ?? 0}, data:`, JSON.stringify(data));

    if (!data || data.length === 0) {
        console.warn(`[EditalAutoConfig] AVISO: Nenhuma linha atualizada para item ${itemId}`);
    }
}

// ==================== MATCHING FUNCTIONS ====================

/**
 * Mapeamentos especiais para casos que não são pegos por exact/partial match
 * Chave: termo normalizado (lowercase sem acentos)
 * Valor: lista de termos possíveis (retorna o primeiro que existir na lista de disponíveis)
 */
const SPECIAL_MAPPINGS: Record<string, string[]> = {
    // Língua estrangeira genérica -> pode ser inglês OU espanhol
    'lingua estrangeira ingles ou espanhol': ['Língua Inglesa (Inglês)', 'Língua Espanhola (Espanhol)'],
    'lingua estrangeira': ['Língua Inglesa (Inglês)', 'Língua Espanhola (Espanhol)'],
    // Legislação de trânsito
    'legislacao de transito': ['Legislação de Trânsito', 'Direito de Trânsito', 'Código de Trânsito Brasileiro'],
    // Legislação especial
    'legislacao especial': ['Legislação Penal Especial', 'Legislação Especial'],
};

/**
 * Tenta encontrar match usando mapeamentos especiais
 */
function findSpecialMapping(titulo: string, disponiveis: string[]): string | null {
    const tituloNorm = normalizeText(titulo);

    for (const [key, possibleMatches] of Object.entries(SPECIAL_MAPPINGS)) {
        if (tituloNorm.includes(key) || key.includes(tituloNorm)) {
            for (const match of possibleMatches) {
                const found = disponiveis.find(d => normalizeText(d) === normalizeText(match));
                if (found) {
                    return found;
                }
            }
        }
    }

    return null;
}

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
 * Helper para adicionar timeout a uma Promise
 */
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, errorMsg: string): Promise<T> {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMsg)), timeoutMs)
        )
    ]);
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

        // Adiciona timeout de 30 segundos para evitar travamentos
        const result = await withTimeout(
            editalFilterAutoConfigAgent.generate([
                { role: "user", content: prompt }
            ]),
            30000,
            `Timeout ao buscar match IA para "${titulo}"`
        );

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
 * Callback para reportar progresso durante a auto-configuração
 */
export type AutoConfigProgressCallback = (current: number, total: number, item?: string) => void;

/**
 * Função principal que auto-configura os filtros de todos os itens do edital
 * @param preparatorioId ID do preparatório
 * @param onProgress Callback opcional para reportar progresso
 */
export async function autoConfigureEditalFilters(
    preparatorioId: string,
    onProgress?: AutoConfigProgressCallback
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
        const topicoItems = items.filter(i => i.tipo === 'topico');
        const totalToProcess = materiaItems.length + topicoItems.length;
        let processedCount = 0;

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

            // Tentar mapeamento especial (para casos como "LÍNGUA ESTRANGEIRA")
            if (!matchedMateria) {
                matchedMateria = findSpecialMapping(item.titulo, availableMaterias);
                if (matchedMateria) {
                    matchType = 'partial';
                    observacao = `Mapeamento especial: "${item.titulo}" -> "${matchedMateria}"`;
                    console.log(`[EditalAutoConfig] ESPECIAL: "${item.titulo}" -> "${matchedMateria}"`);
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

            // Reportar progresso
            processedCount++;
            if (onProgress) {
                onProgress(processedCount, totalToProcess, item.titulo);
            }
        }

        // 5. Processar itens do tipo TÓPICO (dependem da matéria pai)
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
            let foundInDifferentMateria = false;
            let foundMateria: string | null = null;

            if (filtrosAssuntos.length === 0) {
                const multipleMatches = findMultipleMatches(item.titulo, assuntoNames);
                if (multipleMatches.length > 0) {
                    filtrosAssuntos = multipleMatches;
                    matchType = 'partial';
                    observacao = `Múltiplos assuntos relacionados (${multipleMatches.length})`;
                    console.log(`[EditalAutoConfig] MULTI: "${item.titulo}" -> [${multipleMatches.slice(0, 2).join(', ')}${multipleMatches.length > 2 ? '...' : ''}]`);
                }
            }

            // BUSCA CROSS-MATÉRIA: Se ainda não encontrou, buscar em outras matérias
            if (filtrosAssuntos.length === 0 && parentMaterias.length > 0) {
                console.log(`[EditalAutoConfig] CROSS-SEARCH: Buscando "${item.titulo}" em outras matérias...`);

                const crossResult = await findAssuntoInOtherMaterias(item.titulo, parentMaterias);

                if (crossResult.assunto && crossResult.materia) {
                    filtrosAssuntos = [crossResult.assunto];
                    matchType = crossResult.matchType;
                    foundInDifferentMateria = true;
                    foundMateria = crossResult.materia;
                    observacao = `CROSS-MATÉRIA: Encontrado em "${crossResult.materia}" (original: ${parentMaterias.join(', ')})`;
                    console.log(`[EditalAutoConfig] CROSS-MATCH: "${item.titulo}" -> "${crossResult.assunto}" em "${crossResult.materia}"`);
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
                foundInDifferentMateria,
                originalMateria: parentMaterias.length > 0 ? parentMaterias[0] : undefined,
                foundMateria: foundMateria || undefined,
            });

            // Reportar progresso
            processedCount++;
            if (onProgress) {
                onProgress(processedCount, totalToProcess, item.titulo);
            }
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
