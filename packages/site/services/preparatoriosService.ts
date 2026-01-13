// @ts-nocheck
// TODO: Regenerar tipos do Supabase para incluir tabelas de preparatorios atualizadas
import { supabase } from '../lib/supabase';
import {
  Preparatorio,
  Rodada,
  Missao,
  MensagemIncentivo,
  Planejamento,
  MissaoTipo,
  RodadaComMissoes,
  PreparatorioCompleto
} from '../lib/database.types';

// ==================== SIMULADO PRODUCT CREATION ====================

async function createSimuladoProduct(preparatorio: Preparatorio): Promise<void> {
  try {
    // Check if auto-create is enabled
    const { data: autoCreateSetting } = await supabase
      .from('system_settings')
      .select('value')
      .eq('category', 'store')
      .eq('key', 'auto_create_simulado_product')
      .single();

    if (autoCreateSetting?.value === 'false' || autoCreateSetting?.value === false) {
      console.log('[createSimuladoProduct] Auto-create disabled, skipping');
      return;
    }

    // Get simulado settings from system_settings
    const { data: simuladoSettings } = await supabase
      .from('system_settings')
      .select('key, value')
      .eq('category', 'simulado')
      .in('key', ['questions_per_simulado', 'time_limit_minutes']);

    let questionsPerSimulado = 120;
    let timeLimitMinutes = 180;

    if (simuladoSettings) {
      for (const setting of simuladoSettings) {
        if (setting.key === 'questions_per_simulado') {
          questionsPerSimulado = parseInt(setting.value) || 120;
        }
        if (setting.key === 'time_limit_minutes') {
          timeLimitMinutes = parseInt(setting.value) || 180;
        }
      }
    }

    // Usar preço do preparatório (preco_simulados) ou valor padrão
    // @ts-ignore - campo novo
    const priceReal = (preparatorio as any).preco_simulados || 29.90;
    const priceCoins = Math.round(priceReal * 20); // Conversão: 1 real = 20 moedas

    // Get simulados category
    const { data: category } = await supabase
      .from('store_categories')
      .select('id')
      .eq('slug', 'simulados')
      .single();

    if (!category) {
      console.log('[createSimuladoProduct] Simulados category not found, skipping');
      return;
    }

    // 1. Create the simulado record (for the student panel)
    const { data: simuladoRecord, error: simuladoError } = await supabase
      .from('simulados')
      .insert({
        nome: `Simulado ${preparatorio.nome}`,
        preparatorio_id: preparatorio.id,
        duracao_minutos: timeLimitMinutes,
        total_questoes: questionsPerSimulado,
        is_premium: false,
        preco: null
      })
      .select()
      .single();

    if (simuladoError) {
      console.error('[createSimuladoProduct] Error creating simulado record:', simuladoError);
    } else {
      console.log('[createSimuladoProduct] Simulado record created for:', preparatorio.nome);
    }

    // 2. Create the simulado product (for the store)
    const { error: productError } = await supabase
      .from('store_items')
      .insert({
        name: `Simulado ${preparatorio.nome}`,
        description: `Simulado completo para o concurso ${preparatorio.nome}. Estrutura identica a prova real com ${preparatorio.orgao ? `questoes do ${preparatorio.orgao}` : 'questoes selecionadas'}.`,
        item_type: 'simulado',
        product_type: 'digital',
        price_coins: priceCoins,
        price_real: priceReal,
        icon: '📝',
        is_active: true,
        is_featured: false,
        category_id: category.id,
        metadata: {
          preparatorio_id: preparatorio.id,
          preparatorio_slug: preparatorio.slug,
          preparatorio_nome: preparatorio.nome,
          simulado_id: simuladoRecord?.id,
          banca: preparatorio.banca,
          orgao: preparatorio.orgao,
          cargo: preparatorio.cargo,
        }
      });

    if (productError) {
      console.error('[createSimuladoProduct] Error creating product:', productError);
    } else {
      console.log('[createSimuladoProduct] Simulado product created for:', preparatorio.nome);
    }
  } catch (error) {
    console.error('[createSimuladoProduct] Error:', error);
  }
}

// ==================== PREPARATORIOS ====================

export interface CreatePreparatorioInput {
  nome: string;
  slug: string;
  descricao?: string;
  icone?: string;
  cor?: string;
  is_active?: boolean;
  ordem?: number;
  imagem_capa?: string;
  logo_url?: string; // Logo quadrada do órgão
  descricao_curta?: string;
  descricao_vendas?: string;
  content_types?: string[];
  // Campos técnicos
  banca?: string;
  orgao?: string;
  cargo?: string;
  nivel?: 'fundamental' | 'medio' | 'superior';
  escolaridade?: string;
  modalidade?: 'presencial' | 'remoto' | 'hibrido';
  regiao?: string;
  // Detalhes do concurso
  salario?: number | null;
  carga_horaria?: string;
  vagas?: number | null;
  taxa_inscricao?: number | null;
  inscricoes_inicio?: string | null;
  inscricoes_fim?: string | null;
  data_prevista?: string | null;
  ano_previsto?: number | null;
  // Preços por produto
  preco_planejador?: number | null;
  preco_planejador_desconto?: number | null;
  checkout_planejador?: string;
  guru_product_id_planejador?: string;
  preco_8_questoes?: number | null;
  preco_8_questoes_desconto?: number | null;
  checkout_ouse_questoes?: string;
  guru_product_id_8_questoes?: string;
  preco_simulados?: number | null;
  preco_simulados_desconto?: number | null;
  checkout_simulados?: string;
  guru_product_id_simulados?: string;
  preco_reta_final?: number | null;
  preco_reta_final_desconto?: number | null;
  checkout_reta_final?: string;
  guru_product_id_reta_final?: string;
  preco_plataforma_completa?: number | null;
  preco_plataforma_completa_desconto?: number | null;
  checkout_plataforma_completa?: string;
  guru_product_id_plataforma_completa?: string;
  // Campos legados
  preco?: number | null;
  preco_desconto?: number | null;
  checkout_url?: string;
}

// Input para criar preparatório via N8N (sem slug obrigatório)
export interface CreatePreparatorioN8NInput {
  nome: string;
  descricao?: string;
  imagem_url?: string;
  preco?: number;
  orgao: string;
  banca: string;
  nivel: 'fundamental' | 'medio' | 'superior';
  cargo: string;
  requisitos?: string;
  areas_conhecimento?: string[];
  data_prevista?: string;
}

export interface UpdatePreparatorioInput {
  nome?: string;
  slug?: string;
  descricao?: string;
  icone?: string;
  cor?: string;
  is_active?: boolean;
  ordem?: number;
  imagem_capa?: string;
  logo_url?: string; // Logo quadrada do órgão
  descricao_curta?: string;
  descricao_vendas?: string;
  content_types?: string[];
  // Campos técnicos
  banca?: string;
  orgao?: string;
  cargo?: string;
  nivel?: 'fundamental' | 'medio' | 'superior';
  escolaridade?: string;
  modalidade?: 'presencial' | 'remoto' | 'hibrido';
  regiao?: string;
  // Detalhes do concurso
  salario?: number | null;
  carga_horaria?: string;
  vagas?: number | null;
  taxa_inscricao?: number | null;
  inscricoes_inicio?: string | null;
  inscricoes_fim?: string | null;
  data_prevista?: string | null;
  ano_previsto?: number | null;
  // Preços por produto
  preco_planejador?: number | null;
  preco_planejador_desconto?: number | null;
  checkout_planejador?: string;
  guru_product_id_planejador?: string;
  preco_8_questoes?: number | null;
  preco_8_questoes_desconto?: number | null;
  checkout_ouse_questoes?: string;
  guru_product_id_8_questoes?: string;
  preco_simulados?: number | null;
  preco_simulados_desconto?: number | null;
  checkout_simulados?: string;
  guru_product_id_simulados?: string;
  preco_reta_final?: number | null;
  preco_reta_final_desconto?: number | null;
  checkout_reta_final?: string;
  guru_product_id_reta_final?: string;
  preco_plataforma_completa?: number | null;
  preco_plataforma_completa_desconto?: number | null;
  checkout_plataforma_completa?: string;
  guru_product_id_plataforma_completa?: string;
  // Campos legados
  preco?: number | null;
  preco_desconto?: number | null;
  checkout_url?: string;
}

export const preparatoriosService = {
  async getAll(includeInactive = false): Promise<Preparatorio[]> {
    let query = supabase
      .from('preparatorios')
      .select('*')
      .order('created_at', { ascending: false }); // Mais recentes primeiro

    if (!includeInactive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Preparatorio | null> {
    const { data, error } = await supabase
      .from('preparatorios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async getBySlug(slug: string): Promise<Preparatorio | null> {
    const { data, error } = await supabase
      .from('preparatorios')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(input: CreatePreparatorioInput): Promise<Preparatorio> {
    const { data, error } = await supabase
      .from('preparatorios')
      .insert({
        nome: input.nome,
        slug: input.slug,
        descricao: input.descricao,
        icone: input.icone || 'book',
        cor: input.cor || '#3B82F6',
        is_active: input.is_active ?? true,
        ordem: input.ordem ?? 0,
        imagem_capa: input.imagem_capa,
        logo_url: input.logo_url,
        preco: input.preco,
        preco_desconto: input.preco_desconto,
        checkout_url: input.checkout_url,
        descricao_curta: input.descricao_curta,
        descricao_vendas: input.descricao_vendas,
        content_types: input.content_types || ['plano'],
        // Campos técnicos
        banca: input.banca,
        orgao: input.orgao,
        cargo: input.cargo,
        nivel: input.nivel,
        escolaridade: input.escolaridade,
        modalidade: input.modalidade,
        regiao: input.regiao,
        // Detalhes do concurso
        salario: input.salario,
        carga_horaria: input.carga_horaria,
        vagas: input.vagas,
        taxa_inscricao: input.taxa_inscricao,
        inscricoes_inicio: input.inscricoes_inicio,
        inscricoes_fim: input.inscricoes_fim,
        data_prevista: input.data_prevista,
        ano_previsto: input.ano_previsto,
      })
      .select()
      .single();

    if (error) throw error;

    // Auto-create simulado product
    if (data) {
      await createSimuladoProduct(data as Preparatorio);
    }

    return data as Preparatorio;
  },

  async update(id: string, input: UpdatePreparatorioInput): Promise<Preparatorio> {
    const { data, error } = await supabase
      .from('preparatorios')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    // First, deactivate to ensure it won't show to students even if delete fails
    await supabase
      .from('preparatorios')
      .update({ is_active: false })
      .eq('id', id);

    // Then attempt hard delete
    const { error } = await supabase
      .from('preparatorios')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[preparatoriosService.delete] Hard delete failed (may have dependent data), but preparatorio was deactivated:', error.message);
      // Don't throw - the preparatorio is already deactivated and won't show to students
    }
  },

  async toggleActive(id: string, is_active: boolean): Promise<void> {
    const { error } = await supabase
      .from('preparatorios')
      .update({ is_active })
      .eq('id', id);

    if (error) throw error;
  },

  async getCompleto(slug: string): Promise<PreparatorioCompleto | null> {
    // Buscar preparatorio
    const preparatorio = await this.getBySlug(slug);
    if (!preparatorio) return null;

    // Buscar rodadas com missoes
    const rodadas = await rodadasService.getByPreparatorio(preparatorio.id);
    const rodadasComMissoes: RodadaComMissoes[] = [];

    for (const rodada of rodadas) {
      const missoes = await missoesService.getByRodada(rodada.id);
      rodadasComMissoes.push({
        ...rodada,
        missoes
      });
    }

    // Buscar mensagens de incentivo
    const mensagens = await mensagensIncentivoService.getByPreparatorio(preparatorio.id);

    return {
      ...preparatorio,
      rodadas: rodadasComMissoes,
      mensagens_incentivo: mensagens
    };
  },

  async getCompletoById(id: string): Promise<PreparatorioCompleto | null> {
    // Buscar preparatorio
    const preparatorio = await this.getById(id);
    if (!preparatorio) return null;

    // Buscar rodadas com missoes (incluindo tópicos do edital)
    const rodadas = await rodadasService.getByPreparatorio(preparatorio.id);
    const rodadasComMissoes: RodadaComMissoes[] = [];

    for (const rodada of rodadas) {
      const missoes = await missoesService.getByRodadaWithEditalTopics(rodada.id);
      rodadasComMissoes.push({
        ...rodada,
        missoes
      });
    }

    // Buscar mensagens de incentivo
    const mensagens = await mensagensIncentivoService.getByPreparatorio(preparatorio.id);

    return {
      ...preparatorio,
      rodadas: rodadasComMissoes,
      mensagens_incentivo: mensagens
    };
  },

  async getStats(id: string): Promise<{ rodadas: number; missoes: number; mensagens: number; edital_items: number }> {
    const [rodadasResult, mensagensResult, editalResult] = await Promise.all([
      supabase.from('rodadas').select('id', { count: 'exact' }).eq('preparatorio_id', id),
      supabase.from('mensagens_incentivo').select('id', { count: 'exact' }).eq('preparatorio_id', id),
      supabase.from('edital_verticalizado_items').select('id', { count: 'exact', head: true }).eq('preparatorio_id', id)
    ]);

    const rodadasIds = rodadasResult.data?.map(r => r.id) || [];
    let missoesCount = 0;

    if (rodadasIds.length > 0) {
      const { count } = await supabase
        .from('missoes')
        .select('id', { count: 'exact', head: true })
        .in('rodada_id', rodadasIds);
      missoesCount = count || 0;
    }

    return {
      rodadas: rodadasResult.count || 0,
      missoes: missoesCount,
      mensagens: mensagensResult.count || 0,
      edital_items: editalResult.count || 0
    };
  },

  /**
   * Cria um preparatório via N8N (com campos específicos para geração automática)
   */
  async createPreparatorio(input: CreatePreparatorioN8NInput): Promise<{ preparatorio: Preparatorio | null; error: string | null }> {
    try {
      // Gerar slug a partir do nome
      const slug = input.nome
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
        .replace(/\s+/g, '-') // Substitui espaços por hífens
        .replace(/-+/g, '-') // Remove hífens duplicados
        .trim();

      // Verificar se slug já existe
      const { data: existing } = await supabase
        .from('preparatorios')
        .select('id')
        .eq('slug', slug)
        .maybeSingle();

      // Se já existir, adicionar timestamp
      const finalSlug = existing ? `${slug}-${Date.now()}` : slug;

      const { data, error } = await supabase
        .from('preparatorios')
        .insert({
          nome: input.nome,
          slug: finalSlug,
          descricao: input.descricao,
          imagem_capa: input.imagem_url,
          preco: input.preco,
          icone: 'sparkles',
          cor: '#8B5CF6', // Roxo para indicar N8N
          is_active: false, // Inicialmente inativo até processamento
          ordem: 0,
          // Campos N8N
          orgao: input.orgao,
          banca: input.banca,
          nivel: input.nivel,
          cargo: input.cargo,
          requisitos: input.requisitos,
          areas_conhecimento: input.areas_conhecimento,
          data_prevista: input.data_prevista,
          n8n_status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('Erro ao criar preparatório:', error);
        return { preparatorio: null, error: error.message };
      }

      // Auto-create simulado product
      if (data) {
        await createSimuladoProduct(data);
      }

      return { preparatorio: data, error: null };
    } catch (err: any) {
      console.error('Erro ao criar preparatório:', err);
      return { preparatorio: null, error: err.message };
    }
  }
};

// ==================== RODADAS ====================

export interface CreateRodadaInput {
  preparatorio_id: string;
  numero: number;
  titulo: string;
  nota?: string;
  ordem?: number;
}

export interface UpdateRodadaInput extends Partial<Omit<CreateRodadaInput, 'preparatorio_id'>> { }

export const rodadasService = {
  async getByPreparatorio(preparatorioId: string): Promise<Rodada[]> {
    const { data, error } = await supabase
      .from('rodadas')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Rodada | null> {
    const { data, error } = await supabase
      .from('rodadas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: CreateRodadaInput): Promise<Rodada> {
    const { data, error } = await supabase
      .from('rodadas')
      .insert({
        preparatorio_id: input.preparatorio_id,
        numero: input.numero,
        titulo: input.titulo,
        nota: input.nota,
        ordem: input.ordem ?? input.numero
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateRodadaInput): Promise<Rodada> {
    const { data, error } = await supabase
      .from('rodadas')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('rodadas')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateOrdem(updates: { id: string; ordem: number }[]): Promise<void> {
    for (const update of updates) {
      const { error } = await supabase
        .from('rodadas')
        .update({ ordem: update.ordem })
        .eq('id', update.id);

      if (error) throw error;
    }
  },

  async getMissoesCount(id: string): Promise<number> {
    const { count, error } = await supabase
      .from('missoes')
      .select('id', { count: 'exact', head: true })
      .eq('rodada_id', id);

    if (error) throw error;
    return count || 0;
  }
};

// ==================== MISSOES ====================

export interface CreateMissaoInput {
  rodada_id: string;
  numero: string;
  tipo?: MissaoTipo;
  materia?: string | null;
  assunto?: string | null;
  instrucoes?: string | null;
  tema?: string | null;
  acao?: string | null;
  extra?: string[] | null;
  obs?: string | null;
  ordem?: number;
  gerar_imagem?: boolean;
}

export interface UpdateMissaoInput {
  numero?: string;
  tipo?: MissaoTipo;
  materia?: string | null;
  assunto?: string | null;
  instrucoes?: string | null;
  tema?: string | null;
  acao?: string | null;
  extra?: string[] | null;
  obs?: string | null;
  ordem?: number;
  gerar_imagem?: boolean;
}

export const missoesService = {
  async getByRodada(rodadaId: string): Promise<Missao[]> {
    const { data, error } = await supabase
      .from('missoes')
      .select('*')
      .eq('rodada_id', rodadaId)
      .order('ordem', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getByRodadaWithEditalTopics(rodadaId: string): Promise<(Missao & { edital_topicos?: string[] })[]> {
    const { data: missoes, error } = await supabase
      .from('missoes')
      .select('*')
      .eq('rodada_id', rodadaId)
      .order('ordem', { ascending: true });

    if (error) throw error;
    if (!missoes || missoes.length === 0) return [];

    // Buscar os tópicos do edital para cada missão
    const missoesIds = missoes.map(m => m.id);

    // Query direta para buscar os vínculos e tópicos
    const { data: editalLinks } = await (supabase as any)
      .from('missao_edital_items')
      .select('missao_id, edital_item_id')
      .in('missao_id', missoesIds) as { data: { missao_id: string; edital_item_id: string }[] | null };

    if (!editalLinks || editalLinks.length === 0) {
      return missoes;
    }

    // Buscar os títulos dos tópicos
    const editalItemIds = [...new Set(editalLinks.map(l => l.edital_item_id))];
    const { data: editalItems } = await supabase
      .from('edital_verticalizado_items')
      .select('id, titulo')
      .in('id', editalItemIds);

    // Criar mapa de id -> titulo
    const tituloMap: Record<string, string> = {};
    if (editalItems) {
      for (const item of editalItems) {
        tituloMap[item.id] = item.titulo;
      }
    }

    // Agrupar tópicos por missão
    const topicosPerMissao: Record<string, string[]> = {};
    for (const link of editalLinks) {
      if (!topicosPerMissao[link.missao_id]) {
        topicosPerMissao[link.missao_id] = [];
      }
      const titulo = tituloMap[link.edital_item_id];
      if (titulo) {
        topicosPerMissao[link.missao_id].push(titulo);
      }
    }

    // Combinar missões com seus tópicos
    return missoes.map(m => ({
      ...m,
      edital_topicos: topicosPerMissao[m.id] || []
    }));
  },

  async getById(id: string): Promise<Missao | null> {
    const { data, error } = await supabase
      .from('missoes')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: CreateMissaoInput): Promise<Missao> {
    const { data, error } = await supabase
      .from('missoes')
      .insert({
        rodada_id: input.rodada_id,
        numero: input.numero,
        tipo: input.tipo || 'padrao',
        materia: input.materia,
        assunto: input.assunto,
        instrucoes: input.instrucoes,
        tema: input.tema,
        acao: input.acao,
        extra: input.extra,
        obs: input.obs,
        ordem: input.ordem ?? 0,
        gerar_imagem: input.gerar_imagem ?? true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateMissaoInput): Promise<Missao> {
    const { data, error } = await supabase
      .from('missoes')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('missoes')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async updateOrdem(updates: { id: string; ordem: number }[]): Promise<void> {
    for (const update of updates) {
      const { error } = await supabase
        .from('missoes')
        .update({ ordem: update.ordem })
        .eq('id', update.id);

      if (error) throw error;
    }
  },

  async duplicate(id: string): Promise<Missao> {
    const missao = await this.getById(id);
    if (!missao) throw new Error('Missao nao encontrada');

    const { data, error } = await supabase
      .from('missoes')
      .insert({
        rodada_id: missao.rodada_id,
        numero: `${missao.numero}-copia`,
        tipo: missao.tipo,
        materia: missao.materia,
        assunto: missao.assunto,
        instrucoes: missao.instrucoes,
        tema: missao.tema,
        acao: missao.acao,
        extra: missao.extra,
        obs: missao.obs,
        ordem: missao.ordem + 1,
        gerar_imagem: missao.gerar_imagem ?? true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // ==================== TOPICOS DO EDITAL ====================

  // Buscar topicos vinculados a uma missao
  async getEditalItems(missaoId: string): Promise<string[]> {
    const { data, error } = await supabase
      .from('missao_edital_items')
      .select('edital_item_id')
      .eq('missao_id', missaoId);

    if (error) throw error;
    return (data || []).map(d => d.edital_item_id);
  },

  // Vincular topicos a uma missao
  async setEditalItems(missaoId: string, editalItemIds: string[]): Promise<void> {
    // Primeiro remove todos os vinculos existentes
    await supabase
      .from('missao_edital_items')
      .delete()
      .eq('missao_id', missaoId);

    // Se nao houver novos itens, encerra
    if (editalItemIds.length === 0) return;

    // Insere os novos vinculos
    const inserts = editalItemIds.map(editalItemId => ({
      missao_id: missaoId,
      edital_item_id: editalItemId
    }));

    const { error } = await supabase
      .from('missao_edital_items')
      .insert(inserts);

    if (error) throw error;
  },

  // Buscar todos os topicos ja usados em missoes de um preparatorio
  async getUsedEditalItemIds(preparatorioId: string): Promise<string[]> {
    // Buscar todas as rodadas do preparatorio
    const { data: rodadas } = await supabase
      .from('rodadas')
      .select('id')
      .eq('preparatorio_id', preparatorioId);

    if (!rodadas || rodadas.length === 0) return [];

    const rodadaIds = rodadas.map(r => r.id);

    // Buscar todas as missoes dessas rodadas
    const { data: missoes } = await supabase
      .from('missoes')
      .select('id')
      .in('rodada_id', rodadaIds);

    if (!missoes || missoes.length === 0) return [];

    const missaoIds = missoes.map(m => m.id);

    // Buscar todos os edital_item_ids usados
    const { data: usedItems } = await supabase
      .from('missao_edital_items')
      .select('edital_item_id')
      .in('missao_id', missaoIds);

    return (usedItems || []).map(u => u.edital_item_id);
  },

  // ==================== FILTROS DE QUESTOES ====================

  // Buscar filtros de questoes de uma missao
  async getQuestaoFiltros(missaoId: string): Promise<MissaoQuestaoFiltros | null> {
    const { data, error } = await supabase
      .from('missao_questao_filtros')
      .select('*')
      .eq('missao_id', missaoId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  // Salvar/atualizar filtros de questoes de uma missao
  async setQuestaoFiltros(
    missaoId: string,
    filtros: QuestaoFiltrosData,
    questoesCount: number
  ): Promise<MissaoQuestaoFiltros> {
    // Verificar se ja existe
    const existing = await this.getQuestaoFiltros(missaoId);

    if (existing) {
      // Atualizar
      const { data, error } = await supabase
        .from('missao_questao_filtros')
        .update({
          filtros,
          questoes_count: questoesCount,
          updated_at: new Date().toISOString()
        })
        .eq('missao_id', missaoId)
        .select()
        .single();

      if (error) throw error;
      return data;
    } else {
      // Inserir
      const { data, error } = await supabase
        .from('missao_questao_filtros')
        .insert({
          missao_id: missaoId,
          filtros,
          questoes_count: questoesCount
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    }
  },

  // Remover filtros de questoes de uma missao
  async removeQuestaoFiltros(missaoId: string): Promise<void> {
    const { error } = await supabase
      .from('missao_questao_filtros')
      .delete()
      .eq('missao_id', missaoId);

    if (error) throw error;
  },

  // ==================== MULTI-TURMA ====================

  /**
   * Buscar todos os preparatórios ativos com suas rodadas
   */
  async getAllPreparatoriosWithRodadas(): Promise<PreparatorioWithRodadas[]> {
    const { data: preparatorios, error: prepError } = await supabase
      .from('preparatorios')
      .select('id, nome, slug')
      .eq('is_active', true)
      .order('nome');

    if (prepError) throw prepError;
    if (!preparatorios || preparatorios.length === 0) return [];

    // Buscar rodadas de todos os preparatórios
    const prepIds = preparatorios.map(p => p.id);
    const { data: rodadas, error: rodError } = await supabase
      .from('rodadas')
      .select('id, preparatorio_id, numero, titulo')
      .in('preparatorio_id', prepIds)
      .order('numero');

    if (rodError) throw rodError;

    // Agrupar rodadas por preparatório
    const rodadasMap: Record<string, Rodada[]> = {};
    for (const rodada of rodadas || []) {
      if (!rodadasMap[rodada.preparatorio_id]) {
        rodadasMap[rodada.preparatorio_id] = [];
      }
      rodadasMap[rodada.preparatorio_id].push(rodada as Rodada);
    }

    // Combinar preparatórios com suas rodadas
    return preparatorios.map(prep => ({
      ...prep,
      rodadas: rodadasMap[prep.id] || []
    })) as PreparatorioWithRodadas[];
  },

  /**
   * Buscar próximo número de missão disponível em uma rodada
   */
  async getNextMissaoNumero(rodadaId: string): Promise<string> {
    const { data: missoes } = await supabase
      .from('missoes')
      .select('numero')
      .eq('rodada_id', rodadaId)
      .order('ordem', { ascending: false });

    if (!missoes || missoes.length === 0) return '1';

    // Tentar extrair o maior número
    let maxNum = 0;
    for (const m of missoes) {
      const num = parseInt(m.numero);
      if (!isNaN(num) && num > maxNum) {
        maxNum = num;
      }
    }

    return String(maxNum + 1);
  },

  /**
   * Normaliza string para comparação fuzzy
   * Remove acentos, converte para minúsculas, remove pontuação extra
   */
  normalizeForComparison(str: string): string {
    return str
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s]/g, ' ')    // Remove pontuação
      .replace(/\s+/g, ' ')            // Normaliza espaços
      .trim();
  },

  /**
   * Calcula similaridade entre duas strings (0 a 1)
   * Usa distância de Levenshtein normalizada
   */
  calculateSimilarity(str1: string, str2: string): number {
    const s1 = this.normalizeForComparison(str1);
    const s2 = this.normalizeForComparison(str2);

    if (s1 === s2) return 1;
    if (s1.length === 0 || s2.length === 0) return 0;

    // Verifica se um contém o outro
    if (s1.includes(s2) || s2.includes(s1)) {
      const minLen = Math.min(s1.length, s2.length);
      const maxLen = Math.max(s1.length, s2.length);
      return minLen / maxLen;
    }

    // Distância de Levenshtein
    const matrix: number[][] = [];
    for (let i = 0; i <= s1.length; i++) {
      matrix[i] = [i];
    }
    for (let j = 0; j <= s2.length; j++) {
      matrix[0][j] = j;
    }
    for (let i = 1; i <= s1.length; i++) {
      for (let j = 1; j <= s2.length; j++) {
        const cost = s1[i - 1] === s2[j - 1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i - 1][j] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j - 1] + cost
        );
      }
    }

    const distance = matrix[s1.length][s2.length];
    const maxLen = Math.max(s1.length, s2.length);
    return 1 - distance / maxLen;
  },

  /**
   * Busca o melhor match para um título de edital em uma lista
   * Retorna o item com maior similaridade acima do threshold
   */
  findBestEditalMatch(
    titulo: string,
    candidatos: { id: string; titulo: string }[],
    threshold: number = 0.7
  ): { id: string; titulo: string; similarity: number } | null {
    let bestMatch: { id: string; titulo: string; similarity: number } | null = null;

    for (const candidato of candidatos) {
      const similarity = this.calculateSimilarity(titulo, candidato.titulo);
      if (similarity >= threshold && (!bestMatch || similarity > bestMatch.similarity)) {
        bestMatch = { ...candidato, similarity };
      }
    }

    return bestMatch;
  },

  /**
   * Clonar missão para múltiplas rodadas de outros preparatórios
   * Suporta criar nova rodada se target.rodadaId === "new"
   * Tenta fazer correspondência fuzzy dos itens do edital
   */
  async cloneToMultipleRodadas(
    missaoData: Omit<CreateMissaoInput, 'rodada_id'>,
    questaoFiltros: QuestaoFiltrosData | null,
    questoesCount: number,
    targets: MultiTurmaTarget[],
    editalItemTitulos?: string[] // Títulos dos itens do edital da missão original
  ): Promise<{ success: CloneResult[]; errors: CloneError[] }> {
    const success: CloneResult[] = [];
    const errors: CloneError[] = [];

    for (const target of targets) {
      try {
        let rodadaId = target.rodadaId;

        // Se precisa criar nova rodada
        if (rodadaId === 'new' && target.novaRodada) {
          const { data: novaRodada, error: rodadaError } = await supabase
            .from('rodadas')
            .insert({
              preparatorio_id: target.preparatorioId,
              numero: target.novaRodada.numero,
              titulo: target.novaRodada.titulo || `Rodada ${target.novaRodada.numero}`
            })
            .select()
            .single();

          if (rodadaError) throw new Error(`Erro ao criar rodada: ${rodadaError.message}`);
          rodadaId = novaRodada.id;
        }

        // Criar a missão no destino
        const { data: novaMissao, error: missaoError } = await supabase
          .from('missoes')
          .insert({
            rodada_id: rodadaId,
            numero: target.missaoNumero,
            tipo: missaoData.tipo || 'padrao',
            materia: missaoData.materia,
            assunto: missaoData.assunto,
            instrucoes: missaoData.instrucoes,
            tema: missaoData.tema,
            acao: missaoData.acao,
            extra: missaoData.extra,
            obs: missaoData.obs,
            ordem: parseInt(target.missaoNumero) || 0
          })
          .select()
          .single();

        if (missaoError) throw missaoError;

        // Copiar filtros de questões (se existirem)
        if (questaoFiltros && novaMissao) {
          await supabase
            .from('missao_questao_filtros')
            .insert({
              missao_id: novaMissao.id,
              filtros: questaoFiltros,
              questoes_count: questoesCount
            });
        }

        // Tentar fazer correspondência dos itens do edital
        const unmatchedEditalItems: string[] = [];
        const matchedEditalItemIds: string[] = [];

        if (editalItemTitulos && editalItemTitulos.length > 0) {
          // Buscar todos os itens do edital do preparatório destino
          const { data: editalItemsDestino } = await supabase
            .from('edital_verticalizado_items')
            .select('id, titulo')
            .eq('preparatorio_id', target.preparatorioId);

          if (editalItemsDestino && editalItemsDestino.length > 0) {
            for (const titulo of editalItemTitulos) {
              const match = this.findBestEditalMatch(titulo, editalItemsDestino);
              if (match) {
                matchedEditalItemIds.push(match.id);
              } else {
                unmatchedEditalItems.push(titulo);
              }
            }

            // Vincular itens encontrados à missão
            if (matchedEditalItemIds.length > 0) {
              const inserts = matchedEditalItemIds.map(editalItemId => ({
                missao_id: novaMissao.id,
                edital_item_id: editalItemId
              }));

              await supabase
                .from('missao_edital_items')
                .insert(inserts);
            }
          } else {
            // Preparatório não tem edital configurado
            unmatchedEditalItems.push(...editalItemTitulos);
          }
        }

        success.push({
          preparatorioId: target.preparatorioId,
          preparatorioNome: target.preparatorioNome,
          rodadaId: rodadaId,
          missaoId: novaMissao.id,
          missaoNumero: target.missaoNumero,
          unmatchedEditalItems: unmatchedEditalItems.length > 0 ? unmatchedEditalItems : undefined,
          matchedCount: matchedEditalItemIds.length,
          totalEditalItems: editalItemTitulos?.length || 0
        });
      } catch (err: any) {
        errors.push({
          preparatorioId: target.preparatorioId,
          preparatorioNome: target.preparatorioNome,
          error: err.message || 'Erro desconhecido'
        });
      }
    }

    return { success, errors };
  }
};

// Tipos para filtros de questoes
export interface QuestaoFiltrosData {
  materias?: string[];
  assuntos?: string[];
  bancas?: string[];
  banca_ids?: string[]; // UUIDs das bancas (mais eficiente para filtragem)
  orgaos?: string[];
  anos?: number[];
  escolaridade?: string[];
  modalidade?: string[];
  questao_revisada?: boolean;
}

export interface MissaoQuestaoFiltros {
  id: string;
  missao_id: string;
  filtros: QuestaoFiltrosData;
  questoes_count: number;
  created_at: string;
  updated_at: string;
  // Campos de otimização por IA
  adaptacoes_observacoes?: string | null;
  otimizado_por_ia?: boolean;
  filtros_originais?: QuestaoFiltrosData | null;
}

// ==================== TIPOS MULTI-TURMA ====================

export interface PreparatorioWithRodadas {
  id: string;
  nome: string;
  slug: string;
  rodadas: Rodada[];
}

export interface MultiTurmaTarget {
  preparatorioId: string;
  preparatorioNome: string;
  rodadaId: string; // "new" para criar nova rodada
  rodadaNumero: number;
  missaoNumero: string;
  // Campos para criar nova rodada (quando rodadaId === "new")
  novaRodada?: {
    numero: number;
    titulo?: string;
  };
}

export interface CloneResult {
  preparatorioId: string;
  preparatorioNome: string;
  rodadaId: string;
  missaoId: string;
  missaoNumero: string;
  // Informações sobre correspondência de edital
  unmatchedEditalItems?: string[]; // Títulos que não encontraram correspondência
  matchedCount: number;            // Quantidade de itens que encontraram correspondência
  totalEditalItems: number;        // Total de itens do edital na missão original
}

export interface CloneError {
  preparatorioId: string;
  preparatorioNome: string;
  error: string;
}

// ==================== MENSAGENS DE INCENTIVO ====================

export interface CreateMensagemIncentivoInput {
  preparatorio_id: string;
  mensagem: string;
  ordem?: number;
  is_active?: boolean;
}

export interface UpdateMensagemIncentivoInput extends Partial<Omit<CreateMensagemIncentivoInput, 'preparatorio_id'>> { }

export const mensagensIncentivoService = {
  async getByPreparatorio(preparatorioId: string, onlyActive = false): Promise<MensagemIncentivo[]> {
    let query = supabase
      .from('mensagens_incentivo')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .order('ordem', { ascending: true });

    if (onlyActive) {
      query = query.eq('is_active', true);
    }

    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<MensagemIncentivo | null> {
    const { data, error } = await supabase
      .from('mensagens_incentivo')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  async create(input: CreateMensagemIncentivoInput): Promise<MensagemIncentivo> {
    const { data, error } = await supabase
      .from('mensagens_incentivo')
      .insert({
        preparatorio_id: input.preparatorio_id,
        mensagem: input.mensagem,
        ordem: input.ordem ?? 0,
        is_active: input.is_active ?? true
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async update(id: string, input: UpdateMensagemIncentivoInput): Promise<MensagemIncentivo> {
    const { data, error } = await supabase
      .from('mensagens_incentivo')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('mensagens_incentivo')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  async toggleActive(id: string, is_active: boolean): Promise<void> {
    const { error } = await supabase
      .from('mensagens_incentivo')
      .update({ is_active })
      .eq('id', id);

    if (error) throw error;
  },

  async getRandomMensagem(preparatorioId: string): Promise<string> {
    const mensagens = await this.getByPreparatorio(preparatorioId, true);
    if (mensagens.length === 0) {
      return 'Boa sorte nos estudos!';
    }
    const randomIndex = Math.floor(Math.random() * mensagens.length);
    return mensagens[randomIndex].mensagem;
  }
};

// ==================== PLANEJAMENTOS ====================

export interface CreatePlanejamentoInput {
  preparatorio_id: string;
  nome_aluno: string;
  email?: string | null;
  mensagem_incentivo?: string | null;
  lead_id?: string | null;
  hora_acordar?: string | null;
  hora_dormir?: string | null;
}

export const planejamentosService = {
  async getAll(): Promise<Planejamento[]> {
    const { data, error } = await supabase
      .from('planejamentos')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getByPreparatorio(preparatorioId: string): Promise<Planejamento[]> {
    const { data, error } = await supabase
      .from('planejamentos')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getById(id: string): Promise<Planejamento | null> {
    const { data, error } = await supabase
      .from('planejamentos')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async create(input: CreatePlanejamentoInput): Promise<Planejamento> {
    // Se nao houver mensagem, buscar uma aleatoria
    let mensagem = input.mensagem_incentivo;
    if (!mensagem) {
      mensagem = await mensagensIncentivoService.getRandomMensagem(input.preparatorio_id);
    }

    const { data, error } = await supabase
      .from('planejamentos')
      .insert({
        preparatorio_id: input.preparatorio_id,
        nome_aluno: input.nome_aluno,
        email: input.email,
        mensagem_incentivo: mensagem,
        lead_id: input.lead_id || null,
        hora_acordar: input.hora_acordar || '06:00',
        hora_dormir: input.hora_dormir || '22:00'
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('planejamentos')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
};
