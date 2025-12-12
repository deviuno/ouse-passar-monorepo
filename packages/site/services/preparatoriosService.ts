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
  preco?: number;
  preco_desconto?: number;
  checkout_url?: string;
  descricao_curta?: string;
  descricao_vendas?: string;
}

export interface UpdatePreparatorioInput extends Partial<CreatePreparatorioInput> {}

export const preparatoriosService = {
  async getAll(includeInactive = false): Promise<Preparatorio[]> {
    let query = supabase
      .from('preparatorios')
      .select('*')
      .order('ordem', { ascending: true });

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
        ordem: input.ordem ?? 0
      })
      .select()
      .single();

    if (error) throw error;
    return data;
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
    const { error } = await supabase
      .from('preparatorios')
      .delete()
      .eq('id', id);

    if (error) throw error;
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

  async getStats(id: string): Promise<{ rodadas: number; missoes: number; mensagens: number }> {
    const [rodadasResult, mensagensResult] = await Promise.all([
      supabase.from('rodadas').select('id', { count: 'exact' }).eq('preparatorio_id', id),
      supabase.from('mensagens_incentivo').select('id', { count: 'exact' }).eq('preparatorio_id', id)
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
      mensagens: mensagensResult.count || 0
    };
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

export interface UpdateRodadaInput extends Partial<Omit<CreateRodadaInput, 'preparatorio_id'>> {}

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
  materia?: string;
  assunto?: string;
  instrucoes?: string;
  tema?: string;
  acao?: string;
  extra?: string[];
  obs?: string;
  ordem?: number;
}

export interface UpdateMissaoInput extends Partial<Omit<CreateMissaoInput, 'rodada_id'>> {}

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
        ordem: input.ordem ?? 0
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
        ordem: missao.ordem + 1
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  }
};

// ==================== MENSAGENS DE INCENTIVO ====================

export interface CreateMensagemIncentivoInput {
  preparatorio_id: string;
  mensagem: string;
  ordem?: number;
  is_active?: boolean;
}

export interface UpdateMensagemIncentivoInput extends Partial<Omit<CreateMensagemIncentivoInput, 'preparatorio_id'>> {}

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
  email?: string;
  mensagem_incentivo?: string;
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
        mensagem_incentivo: mensagem
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
