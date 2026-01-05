import { supabase } from './supabaseClient';
import { Preparatorio } from '../types';

/**
 * Busca todos os preparatórios ativos do Supabase
 * Ordenados por 'ordem' e depois por 'nome'
 */
export async function getPreparatorios(): Promise<Preparatorio[]> {
  try {
    console.log('[preparatoriosService] Iniciando busca de preparatórios...');
    console.log('[preparatoriosService] Supabase URL configurada:', !!import.meta.env.VITE_SUPABASE_URL);

    // Buscar todos os preparatórios ativos
    const { data, error } = await supabase
      .from('preparatorios')
      .select('*')
      .eq('is_active', true)
      .order('ordem', { ascending: true, nullsFirst: false })
      .order('nome', { ascending: true });

    console.log('[preparatoriosService] Resposta recebida:', { data, error });

    if (error) {
      console.error('[preparatoriosService] Erro do Supabase:', error.message, error.code, error.details);
      return [];
    }

    if (!data || data.length === 0) {
      console.warn('[preparatoriosService] Nenhum preparatório encontrado com is_active=true');

      // Tenta buscar sem filtro
      console.log('[preparatoriosService] Tentando buscar todos...');
      const { data: allData, error: allError } = await supabase
        .from('preparatorios')
        .select('*')
        .order('ordem', { ascending: true, nullsFirst: false })
        .order('nome', { ascending: true });

      console.log('[preparatoriosService] Todos os preparatórios:', { allData, allError });

      if (allError) {
        console.error('[preparatoriosService] Erro ao buscar todos:', allError);
        return [];
      }

      return (allData || []) as Preparatorio[];
    }

    console.log('[preparatoriosService] Preparatórios encontrados:', data.length);
    return data as Preparatorio[];
  } catch (err) {
    console.error('[preparatoriosService] Exceção:', err);
    return [];
  }
}

/**
 * Busca um preparatório específico pelo ID
 */
export async function getPreparatorioById(id: string): Promise<Preparatorio | null> {
  try {
    const { data, error } = await supabase
      .from('preparatorios')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('Erro ao buscar preparatório:', error.message);
      return null;
    }

    return data as Preparatorio;
  } catch (err) {
    console.error('Erro ao buscar preparatório:', err);
    return null;
  }
}

/**
 * Busca um preparatório específico pelo slug
 */
export async function getPreparatorioBySlug(slug: string): Promise<Preparatorio | null> {
  try {
    const { data, error } = await supabase
      .from('preparatorios')
      .select('*')
      .eq('slug', slug)
      .single();

    if (error) {
      console.error('Erro ao buscar preparatório:', error.message);
      return null;
    }

    return data as Preparatorio;
  } catch (err) {
    console.error('Erro ao buscar preparatório:', err);
    return null;
  }
}

/**
 * Dados de um preparatório para a loja de trilhas
 */
export interface TrilhasStoreItem {
  id: string;
  nome: string;
  slug: string;
  descricao_curta?: string;
  banca?: string;
  orgao?: string;
  imagem_capa?: string;
  logo_url?: string;
  preco_trilhas?: number;
  preco_trilhas_desconto?: number;
  checkout_trilhas?: string;
  userHasAccess: boolean;
}

/**
 * Busca preparatórios para a loja de trilhas
 * Retorna todos os preparatórios que têm preco_trilhas configurado
 * e indica se o usuário já tem acesso (via user_trails)
 */
export async function getPreparatoriosForTrilhasStore(userId?: string): Promise<TrilhasStoreItem[]> {
  try {
    // Buscar preparatórios ativos com preço de trilhas configurado
    const { data: preparatorios, error } = await supabase
      .from('preparatorios')
      .select('id, nome, slug, descricao_curta, banca, orgao, imagem_capa, logo_url, preco_trilhas, preco_trilhas_desconto, checkout_trilhas')
      .eq('is_active', true)
      .not('preco_trilhas', 'is', null)
      .order('ordem', { ascending: true, nullsFirst: false })
      .order('nome', { ascending: true });

    if (error) {
      console.error('[preparatoriosService] Erro ao buscar preparatórios para trilhas:', error);
      return [];
    }

    if (!preparatorios || preparatorios.length === 0) {
      return [];
    }

    // Se não há userId, retornar sem verificar acesso
    if (!userId) {
      return preparatorios.map((p) => ({
        ...p,
        userHasAccess: false,
      }));
    }

    // Buscar user_trails do usuário para verificar acesso
    const { data: userTrails, error: trailsError } = await supabase
      .from('user_trails')
      .select('preparatorio_id')
      .eq('user_id', userId);

    if (trailsError) {
      console.error('[preparatoriosService] Erro ao buscar user_trails:', trailsError);
    }

    // Criar set de preparatórios que o usuário já tem
    const userPreparatorioIds = new Set(
      (userTrails || []).map((t) => t.preparatorio_id)
    );

    // Mapear com informação de acesso
    return preparatorios.map((p) => ({
      ...p,
      userHasAccess: userPreparatorioIds.has(p.id),
    }));
  } catch (err) {
    console.error('[preparatoriosService] Exceção ao buscar trilhas store:', err);
    return [];
  }
}

export const preparatoriosService = {
  getAll: getPreparatorios,
  getById: getPreparatorioById,
  getBySlug: getPreparatorioBySlug,
  getForTrilhasStore: getPreparatoriosForTrilhasStore,
};
