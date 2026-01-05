import { supabase } from './supabase';

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
  filtro_materias: string[];
  filtro_assuntos: string[];
}

export interface EditalItemWithChildren extends EditalItem {
  children: EditalItemWithChildren[];
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

    if (error) {
      console.error('[EditalService] Erro ao buscar itens:', error);
      throw error;
    }
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

  // Contar itens por tipo
  countByTipo(items: EditalItem[]): { blocos: number; materias: number; topicos: number } {
    return {
      blocos: items.filter(i => i.tipo === 'bloco').length,
      materias: items.filter(i => i.tipo === 'materia').length,
      topicos: items.filter(i => i.tipo === 'topico').length
    };
  }
};
