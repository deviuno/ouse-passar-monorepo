import { supabase } from '../lib/supabase';
import { questionsDb } from '../lib/questionsDb';

// ==================== TIPOS ====================

export type EditalItemTipo = 'bloco' | 'materia' | 'topico';

// Tipo para nó da taxonomia hierárquica
export interface TaxonomyNode {
  id: number;
  codigo: string;
  nome: string;
  nivel: number;
  ordem: number;
  materia: string;
  parent_id: number | null;
  filhos: TaxonomyNode[];
  assuntos_originais?: string[];
}

export interface EditalItem {
  id: string;
  preparatorio_id: string | null;
  tipo: EditalItemTipo;
  titulo: string;
  ordem: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  filtro_materias: string[];
  filtro_assuntos: string[];
}

export interface EditalItemWithChildren extends EditalItem {
  children: EditalItemWithChildren[];
}

export interface CreateEditalItemInput {
  preparatorio_id: string;
  tipo: EditalItemTipo;
  titulo: string;
  ordem?: number;
  parent_id?: string | null;
}

export interface UpdateEditalItemInput {
  titulo?: string;
  ordem?: number;
  parent_id?: string | null;
}

// ==================== SERVIÇO ====================

export const editalService = {
  // Buscar todos os itens de um preparatório
  async getByPreparatorio(preparatorioId: string): Promise<EditalItem[]> {
    const { data, error } = await supabase
      .from('edital_verticalizado_items')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .order('ordem');

    if (error) throw error;
    return (data as any) || [];
  },

  // Buscar itens organizados em árvore
  async getTreeByPreparatorio(preparatorioId: string): Promise<EditalItemWithChildren[]> {
    const items = await this.getByPreparatorio(preparatorioId);
    return this.buildTree(items);
  },

  // Construir árvore a partir de lista plana
  buildTree(items: EditalItem[]): EditalItemWithChildren[] {
    const itemMap = new Map<string, EditalItemWithChildren>();
    const roots: EditalItemWithChildren[] = [];

    // Criar mapa de itens com children vazio
    items.forEach(item => {
      itemMap.set(item.id, { ...item, children: [] });
    });

    // Organizar em árvore
    items.forEach(item => {
      const node = itemMap.get(item.id)!;
      if (item.parent_id && itemMap.has(item.parent_id)) {
        itemMap.get(item.parent_id)!.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Ordenar children por ordem
    const sortChildren = (nodes: EditalItemWithChildren[]) => {
      nodes.sort((a, b) => a.ordem - b.ordem);
      nodes.forEach(node => sortChildren(node.children));
    };
    sortChildren(roots);

    return roots;
  },

  // Buscar item por ID
  async getById(id: string): Promise<EditalItem | null> {
    const { data, error } = await supabase
      .from('edital_verticalizado_items')
      .select('*')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data as any;
  },

  // Criar novo item
  async create(input: CreateEditalItemInput): Promise<EditalItem> {
    // Se não passou ordem, calcular a próxima
    let ordem = input.ordem;
    if (ordem === undefined) {
      let query = supabase
        .from('edital_verticalizado_items')
        .select('ordem')
        .eq('preparatorio_id', input.preparatorio_id)
        .order('ordem', { ascending: false })
        .limit(1);

      if (input.parent_id) {
        query = query.eq('parent_id', input.parent_id);
      } else {
        query = query.is('parent_id', null);
      }

      const { data: siblings } = await query;

      ordem = siblings && siblings.length > 0 ? siblings[0].ordem + 1 : 0;
    }

    const { data, error } = await supabase
      .from('edital_verticalizado_items')
      .insert({
        preparatorio_id: input.preparatorio_id,
        tipo: input.tipo,
        titulo: input.titulo,
        ordem,
        parent_id: input.parent_id || null
      })
      .select()
      .single();

    if (error) throw error;
    return data as any;
  },

  // Atualizar item
  async update(id: string, input: UpdateEditalItemInput): Promise<EditalItem> {
    const { data, error } = await supabase
      .from('edital_verticalizado_items')
      .update(input)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  },

  // Deletar item (e todos os filhos)
  async delete(id: string): Promise<void> {
    // Primeiro deletar todos os filhos recursivamente
    const { data: children } = await supabase
      .from('edital_verticalizado_items')
      .select('id')
      .eq('parent_id', id);

    if (children) {
      for (const child of children) {
        await this.delete(child.id);
      }
    }

    // Deletar o item
    const { error } = await supabase
      .from('edital_verticalizado_items')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Reordenar itens
  async reorder(items: { id: string; ordem: number }[]): Promise<void> {
    for (const item of items) {
      await supabase
        .from('edital_verticalizado_items')
        .update({ ordem: item.ordem })
        .eq('id', item.id);
    }
  },

  // Contar itens por tipo
  async countByTipo(preparatorioId: string): Promise<{ blocos: number; materias: number; topicos: number }> {
    const items = await this.getByPreparatorio(preparatorioId);
    return {
      blocos: items.filter(i => i.tipo === 'bloco').length,
      materias: items.filter(i => i.tipo === 'materia').length,
      topicos: items.filter(i => i.tipo === 'topico').length
    };
  },

  // Mover item para outro parent
  async moveToParent(id: string, newParentId: string | null): Promise<EditalItem> {
    // Calcular nova ordem no destino
    const item = await this.getById(id);
    if (!item) throw new Error('Item não encontrado');
    if (!item.preparatorio_id) throw new Error('Item sem preparatorio_id');

    let query = supabase
      .from('edital_verticalizado_items')
      .select('ordem')
      .eq('preparatorio_id', item.preparatorio_id)
      .order('ordem', { ascending: false })
      .limit(1);

    if (newParentId) {
      query = query.eq('parent_id', newParentId);
    } else {
      query = query.is('parent_id', null);
    }

    const { data: siblings } = await query;

    const newOrdem = siblings && siblings.length > 0 ? siblings[0].ordem + 1 : 0;

    return this.update(id, { parent_id: newParentId, ordem: newOrdem });
  },

  // Duplicar item (e filhos)
  async duplicate(id: string): Promise<EditalItem> {
    const item = await this.getById(id);
    if (!item) throw new Error('Item não encontrado');

    // Criar cópia
    const copy = await this.create({
      preparatorio_id: item.preparatorio_id!,
      tipo: item.tipo,
      titulo: `${item.titulo} (cópia)`,
      parent_id: item.parent_id
    });

    // Duplicar filhos recursivamente
    const { data: children } = await supabase
      .from('edital_verticalizado_items')
      .select('*')
      .eq('parent_id', id)
      .order('ordem');

    if (children) {
      for (const child of children) {
        await this.duplicateWithNewParent(child.id, copy.id);
      }
    }

    return copy;
  },

  // Helper: duplicar com novo parent
  async duplicateWithNewParent(id: string, newParentId: string): Promise<EditalItem> {
    const item = await this.getById(id);
    if (!item) throw new Error('Item não encontrado');

    const copy = await this.create({
      preparatorio_id: item.preparatorio_id!,
      tipo: item.tipo,
      titulo: item.titulo,
      parent_id: newParentId
    });

    // Duplicar filhos
    const { data: children } = await supabase
      .from('edital_verticalizado_items')
      .select('*')
      .eq('parent_id', id)
      .order('ordem');

    if (children) {
      for (const child of children) {
        await this.duplicateWithNewParent(child.id, copy.id);
      }
    }

    return copy;
  },

  // ==================== FILTROS ====================

  // Atualizar filtros de um item
  async updateFilters(id: string, filtros: { materias: string[]; assuntos: string[] }): Promise<EditalItem> {
    const { data, error } = await supabase
      .from('edital_verticalizado_items')
      .update({
        filtro_materias: filtros.materias,
        filtro_assuntos: filtros.assuntos
      })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as any;
  },

  // Buscar matérias distintas do banco de questões
  async getDistinctMaterias(): Promise<string[]> {
    if (!questionsDb) {
      console.error('questionsDb not configured');
      return [];
    }
    const { data, error } = await questionsDb.rpc('get_distinct_materias');
    if (error) throw error;
    return (data || []).map((d: { materia: string }) => d.materia);
  },

  // Buscar assuntos distintos (opcionalmente filtrados por matérias)
  async getDistinctAssuntos(materias?: string[]): Promise<{ assunto: string; materia: string }[]> {
    if (!questionsDb) {
      console.error('questionsDb not configured');
      return [];
    }
    const { data, error } = await questionsDb.rpc('get_distinct_assuntos', {
      p_materias: materias && materias.length > 0 ? materias : null
    });
    if (error) throw error;
    return data || [];
  },

  // Contar questões com base nos filtros (para preview)
  async countQuestoesByFilter(materias?: string[], assuntos?: string[], banca?: string): Promise<number> {
    if (!questionsDb) {
      console.error('questionsDb not configured');
      return 0;
    }
    const { data, error } = await questionsDb.rpc('count_questoes_by_filter', {
      p_materias: materias && materias.length > 0 ? materias : null,
      p_assuntos: assuntos && assuntos.length > 0 ? assuntos : null,
      p_banca: banca || null
    });
    if (error) throw error;
    return data || 0;
  },

  // Auto-configurar filtros via IA
  async autoConfigureFilters(preparatorioId: string): Promise<{
    success: boolean;
    itemsConfigured: number;
    itemsProcessed: number;
    error?: string;
  }> {
    const MASTRA_URL = getMastraApiUrl('');

    const response = await fetch(`${MASTRA_URL}/api/edital/${preparatorioId}/auto-configure-filters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
    });

    return response.json();
  },

  // ==================== TAXONOMIA HIERÁRQUICA ====================

  // Busca toda a taxonomia de todas as matérias
  async fetchAllTaxonomia(): Promise<Map<string, TaxonomyNode[]>> {
    try {
      const API_URL = getMastraApiUrl('/api/taxonomia/all');

      const response = await fetch(API_URL);
      if (!response.ok) {
        console.error('[fetchAllTaxonomia] Erro na resposta:', response.status);
        return new Map();
      }

      const data = await response.json();
      if (!data.success) {
        console.error('[fetchAllTaxonomia] API retornou erro:', data.error);
        return new Map();
      }

      // Converter objeto para Map
      const result = new Map<string, TaxonomyNode[]>();
      for (const [materia, nodes] of Object.entries(data.taxonomiaByMateria)) {
        result.set(materia, nodes as TaxonomyNode[]);
      }

      console.log('[fetchAllTaxonomia] Taxonomia carregada:', result.size, 'matérias');
      return result;
    } catch (error) {
      console.error('[fetchAllTaxonomia] Erro:', error);
      return new Map();
    }
  },

  // Busca taxonomia para múltiplas matérias específicas
  async fetchTaxonomiaByMaterias(materias: string[]): Promise<Map<string, TaxonomyNode[]>> {
    const result = new Map<string, TaxonomyNode[]>();

    if (!materias || materias.length === 0) return result;

    // Buscar em paralelo para todas as matérias
    const promises = materias.map(async (materia) => {
      try {
        const API_URL = getMastraApiUrl(`/api/taxonomia/${encodeURIComponent(materia)}`);
        const response = await fetch(API_URL);

        if (!response.ok) return { materia, taxonomia: [] };

        const data = await response.json();
        if (!data.success) return { materia, taxonomia: [] };

        return { materia, taxonomia: data.taxonomia || [] };
      } catch {
        return { materia, taxonomia: [] };
      }
    });

    const results = await Promise.all(promises);

    for (const { materia, taxonomia } of results) {
      result.set(materia, taxonomia);
    }

    return result;
  }
};

// URL base do Mastra API (com fallback para produção)
const getMastraApiUrl = (path: string): string => {
  // Se VITE_MASTRA_URL está definido, usar
  if (import.meta.env.VITE_MASTRA_URL) {
    return `${import.meta.env.VITE_MASTRA_URL}${path}`;
  }

  // Em produção (hostname não é localhost), usar VPS
  if (typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
    return `http://72.61.217.225:4000${path}`;
  }

  // Desenvolvimento local
  return `http://localhost:4000${path}`;
};
