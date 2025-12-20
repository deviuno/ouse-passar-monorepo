import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-loaded Supabase client
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

export interface Materia {
    id: string;
    materia: string;
    ordem: number;
    total_topicos: number;
    topicos_disponiveis: number;
}

export interface Topico {
    id: string;
    nome: string;
    ordem: number;
    nivel_dificuldade: string | null;
    sub_topicos: any;
}

export interface Missao {
    id: string;
    rodada_id: string;
    numero: string;
    tipo: 'padrao' | 'revisao' | 'acao' | 'estudo' | 'tecnicas' | 'simulado';
    materia: string | null;
    materia_id: string | null;
    assunto: string | null;
    instrucoes: string | null;
    tema: string | null;
    acao: string | null;
    assuntos_ids: string[];
    revisao_parte: number | null;
    ordem: number;
}

export interface Rodada {
    id: string;
    preparatorio_id: string;
    numero: number;
    titulo: string;
    ordem: number;
    missoes?: Missao[];
}

export interface BuilderState {
    preparatorio: {
        id: string;
        nome: string;
        cargo: string | null;
        montagem_status: string;
    };
    rodadas: Rodada[];
    materias: Materia[];
    topicos_usados: string[];
}

export interface CreateMissaoPayload {
    rodada_id: string;
    materia_id: string;
    assuntos_ids: string[];
    tipo?: 'estudo' | 'revisao' | 'tecnicas' | 'simulado';
}

export interface CreateRodadaPayload {
    numero?: number;
    titulo?: string;
}

// ==================== FUNÇÕES DO SERVIÇO ====================

/**
 * Obtém o estado completo do builder para um preparatório
 */
export async function getBuilderState(preparatorioId: string): Promise<BuilderState> {
    const supabase = getSupabaseClient();

    // 1. Buscar preparatório
    const { data: preparatorio, error: prepError } = await supabase
        .from('preparatorios')
        .select('id, nome, cargo, montagem_status')
        .eq('id', preparatorioId)
        .single();

    if (prepError || !preparatorio) {
        throw new Error(`Preparatório não encontrado: ${prepError?.message}`);
    }

    // 2. Buscar rodadas com missões
    const { data: rodadas, error: rodadasError } = await supabase
        .from('rodadas')
        .select(`
            id, preparatorio_id, numero, titulo, ordem,
            missoes (
                id, rodada_id, numero, tipo, materia, materia_id,
                assunto, instrucoes, tema, acao, assuntos_ids,
                revisao_parte, ordem
            )
        `)
        .eq('preparatorio_id', preparatorioId)
        .order('ordem', { ascending: true });

    if (rodadasError) {
        throw new Error(`Erro ao buscar rodadas: ${rodadasError.message}`);
    }

    // 3. Buscar matérias do edital_verticalizado_items (tipo = 'materia')
    const { data: materias, error: materiasError } = await supabase
        .from('edital_verticalizado_items')
        .select('id, titulo, ordem')
        .eq('preparatorio_id', preparatorioId)
        .eq('tipo', 'materia')
        .order('ordem', { ascending: true });

    if (materiasError) {
        throw new Error(`Erro ao buscar matérias: ${materiasError.message}`);
    }

    // 4. Para cada matéria, contar tópicos disponíveis
    const topicosUsados = await getTopicosUsados(preparatorioId);

    const materiasComContagem: Materia[] = await Promise.all(
        (materias || []).map(async (m: any) => {
            // Contar tópicos que são filhos desta matéria (diretos ou indiretos)
            const totalTopicos = await contarTopicosMateria(m.id);
            const topicosDisponiveis = await contarTopicosDisponiveisMateria(m.id, topicosUsados);

            return {
                id: m.id,
                materia: m.titulo,
                ordem: m.ordem,
                total_topicos: totalTopicos,
                topicos_disponiveis: topicosDisponiveis,
            };
        })
    );

    return {
        preparatorio: {
            id: preparatorio.id,
            nome: preparatorio.nome,
            cargo: preparatorio.cargo || null,
            montagem_status: preparatorio.montagem_status || 'pendente',
        },
        rodadas: (rodadas || []).map((r: any) => ({
            ...r,
            missoes: r.missoes?.sort((a: Missao, b: Missao) => a.ordem - b.ordem) || [],
        })),
        materias: materiasComContagem,
        topicos_usados: topicosUsados,
    };
}

/**
 * Conta todos os tópicos de uma matéria (recursivamente)
 */
async function contarTopicosMateria(materiaId: string): Promise<number> {
    const supabase = getSupabaseClient();

    // Buscar todos os tópicos que são descendentes desta matéria
    const { data, error } = await supabase
        .from('edital_verticalizado_items')
        .select('id')
        .eq('tipo', 'topico');

    if (error || !data) return 0;

    // Precisamos verificar quais tópicos pertencem a esta matéria
    // Vamos buscar a árvore de filhos
    const topicos = await buscarTopicosDescendentes(materiaId);
    return topicos.length;
}

/**
 * Busca todos os tópicos descendentes de um item (recursivamente)
 */
async function buscarTopicosDescendentes(parentId: string): Promise<string[]> {
    const supabase = getSupabaseClient();

    const { data: filhos, error } = await supabase
        .from('edital_verticalizado_items')
        .select('id, tipo')
        .eq('parent_id', parentId);

    if (error || !filhos) return [];

    const topicos: string[] = [];

    for (const filho of filhos) {
        if (filho.tipo === 'topico') {
            topicos.push(filho.id);
        }
        // Buscar recursivamente
        const descendentes = await buscarTopicosDescendentes(filho.id);
        topicos.push(...descendentes);
    }

    return topicos;
}

/**
 * Conta tópicos disponíveis (não usados) de uma matéria
 */
async function contarTopicosDisponiveisMateria(materiaId: string, topicosUsados: string[]): Promise<number> {
    const todosTopicos = await buscarTopicosDescendentes(materiaId);
    const disponiveis = todosTopicos.filter(id => !topicosUsados.includes(id));
    return disponiveis.length;
}

/**
 * Obtém todos os tópicos já usados em missões do preparatório
 */
async function getTopicosUsados(preparatorioId: string): Promise<string[]> {
    const supabase = getSupabaseClient();

    // Buscar todas as rodadas do preparatório
    const { data: rodadas, error: rodadasError } = await supabase
        .from('rodadas')
        .select('id')
        .eq('preparatorio_id', preparatorioId);

    if (rodadasError || !rodadas?.length) {
        return [];
    }

    const rodadaIds = rodadas.map(r => r.id);

    // Buscar todas as missões dessas rodadas que têm assuntos_ids
    const { data: missoes, error: missoesError } = await supabase
        .from('missoes')
        .select('assuntos_ids')
        .in('rodada_id', rodadaIds)
        .not('assuntos_ids', 'is', null);

    if (missoesError) {
        console.error('Erro ao buscar tópicos usados:', missoesError);
        return [];
    }

    // Extrair todos os IDs de tópicos usados
    const topicosUsados: string[] = [];
    for (const missao of missoes || []) {
        if (missao.assuntos_ids && Array.isArray(missao.assuntos_ids)) {
            topicosUsados.push(...missao.assuntos_ids);
        }
    }

    return [...new Set(topicosUsados)]; // Remover duplicatas
}


/**
 * Busca tópicos disponíveis de uma matéria (do edital_verticalizado_items)
 */
export async function getTopicosDisponiveis(
    materiaId: string,
    preparatorioId: string
): Promise<Topico[]> {
    const supabase = getSupabaseClient();

    // Buscar tópicos usados
    const topicosUsados = await getTopicosUsados(preparatorioId);

    // Buscar todos os tópicos descendentes da matéria
    const topicosIds = await buscarTopicosDescendentes(materiaId);

    if (topicosIds.length === 0) {
        return [];
    }

    // Buscar dados completos dos tópicos
    const { data, error } = await supabase
        .from('edital_verticalizado_items')
        .select('id, titulo, ordem')
        .in('id', topicosIds)
        .order('ordem', { ascending: true });

    if (error) {
        throw new Error(`Erro ao buscar tópicos: ${error.message}`);
    }

    // Mapear para o formato Topico e filtrar os não usados
    return (data || [])
        .filter(t => !topicosUsados.includes(t.id))
        .map(t => ({
            id: t.id,
            nome: t.titulo,
            ordem: t.ordem,
            nivel_dificuldade: null,
            sub_topicos: null,
        }));
}

/**
 * Cria uma nova missão de conteúdo
 */
export async function createMissao(
    preparatorioId: string,
    payload: CreateMissaoPayload
): Promise<Missao> {
    const supabase = getSupabaseClient();

    // 1. Buscar matéria do edital_verticalizado_items para pegar o nome
    const { data: materia, error: materiaError } = await supabase
        .from('edital_verticalizado_items')
        .select('id, titulo')
        .eq('id', payload.materia_id)
        .eq('tipo', 'materia')
        .single();

    if (materiaError || !materia) {
        throw new Error(`Matéria não encontrada: ${materiaError?.message}`);
    }

    // 2. Buscar tópicos selecionados do edital_verticalizado_items para montar o assunto
    const { data: topicos, error: topicosError } = await supabase
        .from('edital_verticalizado_items')
        .select('id, titulo')
        .in('id', payload.assuntos_ids);

    if (topicosError) {
        throw new Error(`Erro ao buscar tópicos: ${topicosError.message}`);
    }

    // 3. Contar missões de estudo existentes na rodada para definir o número (ignorar revisão, ação, etc)
    const { data: missoesEstudo } = await supabase
        .from('missoes')
        .select('id')
        .eq('rodada_id', payload.rodada_id)
        .in('tipo', ['estudo', 'padrao']);

    const proximoNumero = (missoesEstudo?.length || 0) + 1;

    // 4. Criar a missão
    const novaMissao = {
        rodada_id: payload.rodada_id,
        numero: String(proximoNumero),
        tipo: payload.tipo || 'estudo',
        materia: materia.titulo,
        materia_id: materia.id,
        assunto: topicos?.map(t => t.titulo).join('\n') || null,
        instrucoes: 'Estudar os tópicos indicados e resolver questões relacionadas.',
        tema: null,
        acao: null,
        assuntos_ids: payload.assuntos_ids,
        revisao_parte: null,
        ordem: proximoNumero,
    };

    const { data: missaoCriada, error: createError } = await supabase
        .from('missoes')
        .insert(novaMissao)
        .select()
        .single();

    if (createError) {
        throw new Error(`Erro ao criar missão: ${createError.message}`);
    }

    // 5. Atualizar status do preparatório
    await supabase
        .from('preparatorios')
        .update({ montagem_status: 'em_andamento' })
        .eq('id', preparatorioId);

    return missaoCriada;
}

/**
 * Deleta uma missão e libera seus tópicos
 */
export async function deleteMissao(missaoId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('missoes')
        .delete()
        .eq('id', missaoId);

    if (error) {
        throw new Error(`Erro ao deletar missão: ${error.message}`);
    }
}

/**
 * Cria uma nova rodada com as 3 missões obrigatórias
 */
export async function createRodada(
    preparatorioId: string,
    payload?: CreateRodadaPayload
): Promise<Rodada> {
    const supabase = getSupabaseClient();

    // 1. Contar rodadas existentes
    const { count } = await supabase
        .from('rodadas')
        .select('id', { count: 'exact', head: true })
        .eq('preparatorio_id', preparatorioId);

    const proximoNumero = payload?.numero || (count || 0) + 1;
    const titulo = payload?.titulo || `${proximoNumero}ª RODADA`;

    // 2. Criar a rodada
    const { data: rodada, error: rodadaError } = await supabase
        .from('rodadas')
        .insert({
            preparatorio_id: preparatorioId,
            numero: proximoNumero,
            titulo: titulo,
            ordem: proximoNumero,
        })
        .select()
        .single();

    if (rodadaError) {
        throw new Error(`Erro ao criar rodada: ${rodadaError.message}`);
    }

    // 3. Criar as 3 missões obrigatórias (posições 8, 9, 10)
    const missoesObrigatorias = [
        {
            rodada_id: rodada.id,
            numero: '8',
            tipo: 'revisao',
            tema: 'REVISÃO OUSE PASSAR',
            ordem: 8,
        },
        {
            rodada_id: rodada.id,
            numero: '9',
            tipo: 'acao', // tecnicas usa 'acao' por compatibilidade
            acao: 'APLICAR AS TÉCNICAS OUSE PASSAR',
            ordem: 9,
        },
        {
            rodada_id: rodada.id,
            numero: '10',
            tipo: 'acao', // simulado usa 'acao' por compatibilidade
            acao: 'SIMULADO COM ASSUNTOS DA RODADA e CORREÇÃO DO SIMULADO',
            ordem: 10,
        },
    ];

    const { error: missoesError } = await supabase
        .from('missoes')
        .insert(missoesObrigatorias);

    if (missoesError) {
        console.error('Erro ao criar missões obrigatórias:', missoesError);
    }

    // 4. Buscar rodada completa com missões
    const { data: rodadaCompleta } = await supabase
        .from('rodadas')
        .select(`
            id, preparatorio_id, numero, titulo, ordem,
            missoes (
                id, rodada_id, numero, tipo, materia, materia_id,
                assunto, instrucoes, tema, acao, assuntos_ids,
                revisao_parte, ordem
            )
        `)
        .eq('id', rodada.id)
        .single();

    return rodadaCompleta || rodada;
}

/**
 * Deleta uma rodada e todas suas missões
 */
export async function deleteRodada(rodadaId: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('rodadas')
        .delete()
        .eq('id', rodadaId);

    if (error) {
        throw new Error(`Erro ao deletar rodada: ${error.message}`);
    }
}

/**
 * Adiciona uma missão extra de revisão
 */
export async function addRevisaoExtra(rodadaId: string): Promise<Missao> {
    const supabase = getSupabaseClient();

    // Contar revisões existentes na rodada
    const { data: revisoesExistentes } = await supabase
        .from('missoes')
        .select('id, revisao_parte')
        .eq('rodada_id', rodadaId)
        .eq('tipo', 'revisao');

    const parteAtual = (revisoesExistentes?.length || 1);

    // Criar nova revisão
    const { data: novaRevisao, error } = await supabase
        .from('missoes')
        .insert({
            rodada_id: rodadaId,
            numero: `8.${parteAtual}`,
            tipo: 'revisao',
            tema: `REVISÃO OUSE PASSAR - Parte ${parteAtual}`,
            revisao_parte: parteAtual,
            ordem: 8 + (parteAtual * 0.1), // 8.1, 8.2, etc.
        })
        .select()
        .single();

    if (error) {
        throw new Error(`Erro ao criar revisão extra: ${error.message}`);
    }

    return novaRevisao;
}

/**
 * Conta missões por matéria em uma rodada
 */
export async function getMissoesCountPorMateria(rodadaId: string): Promise<Record<string, number>> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .rpc('get_missoes_count_por_materia', { p_rodada_id: rodadaId });

    if (error) {
        console.error('Erro ao contar missões:', error);
        return {};
    }

    return (data || []).reduce((acc: Record<string, number>, item: any) => {
        acc[item.materia_id] = Number(item.count);
        return acc;
    }, {});
}

/**
 * Finaliza a montagem do preparatório
 */
export async function finalizarMontagem(preparatorioId: string): Promise<{ success: boolean; message: string }> {
    const supabase = getSupabaseClient();

    // 1. Verificar se há pelo menos uma rodada
    const { count: rodadasCount } = await supabase
        .from('rodadas')
        .select('id', { count: 'exact', head: true })
        .eq('preparatorio_id', preparatorioId);

    if (!rodadasCount || rodadasCount === 0) {
        return { success: false, message: 'É necessário ter pelo menos uma rodada.' };
    }

    // 2. Verificar se cada rodada tem pelo menos 1 missão de estudo
    const { data: rodadas } = await supabase
        .from('rodadas')
        .select('id, numero')
        .eq('preparatorio_id', preparatorioId);

    for (const rodada of rodadas || []) {
        const { count: missoesEstudo } = await supabase
            .from('missoes')
            .select('id', { count: 'exact', head: true })
            .eq('rodada_id', rodada.id)
            .in('tipo', ['estudo', 'padrao']);

        if (!missoesEstudo || missoesEstudo === 0) {
            return {
                success: false,
                message: `A rodada ${rodada.numero} não possui missões de estudo.`
            };
        }
    }

    // 3. Atualizar status para concluída
    const { error } = await supabase
        .from('preparatorios')
        .update({
            montagem_status: 'concluida',
            is_active: true,
        })
        .eq('id', preparatorioId);

    if (error) {
        return { success: false, message: `Erro ao finalizar: ${error.message}` };
    }

    return { success: true, message: 'Montagem finalizada com sucesso!' };
}

/**
 * Atualiza a ordem de uma missão
 */
export async function updateMissaoOrdem(missaoId: string, novaOrdem: number): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('missoes')
        .update({ ordem: novaOrdem })
        .eq('id', missaoId);

    if (error) {
        throw new Error(`Erro ao atualizar ordem: ${error.message}`);
    }
}

/**
 * Busca missões de uma rodada específica
 */
export async function getMissoesPorRodada(rodadaId: string): Promise<Missao[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('missoes')
        .select('*')
        .eq('rodada_id', rodadaId)
        .order('ordem', { ascending: true });

    if (error) {
        throw new Error(`Erro ao buscar missões: ${error.message}`);
    }

    return data || [];
}
