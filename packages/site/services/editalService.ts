import { supabase } from '../lib/supabase';

// ==================== TIPOS ====================

export type EditalItemTipo = 'bloco' | 'materia' | 'topico';

export interface EditalItem {
  id: string;
  preparatorio_id: string | null;
  tipo: EditalItemTipo;
  titulo: string;
  ordem: number;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
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
    return data || [];
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
    return data;
  },

  // Criar novo item
  async create(input: CreateEditalItemInput): Promise<EditalItem> {
    // Se não passou ordem, calcular a próxima
    let ordem = input.ordem;
    if (ordem === undefined) {
      const { data: siblings } = await supabase
        .from('edital_verticalizado_items')
        .select('ordem')
        .eq('preparatorio_id', input.preparatorio_id)
        .eq('parent_id', input.parent_id || null)
        .order('ordem', { ascending: false })
        .limit(1);

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
    return data;
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
    return data;
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

    const { data: siblings } = await supabase
      .from('edital_verticalizado_items')
      .select('ordem')
      .eq('preparatorio_id', item.preparatorio_id)
      .eq('parent_id', newParentId)
      .order('ordem', { ascending: false })
      .limit(1);

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
  }
};
