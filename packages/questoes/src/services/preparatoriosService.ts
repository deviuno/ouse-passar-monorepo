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

export const preparatoriosService = {
  getAll: getPreparatorios,
  getById: getPreparatorioById,
  getBySlug: getPreparatorioBySlug,
};
