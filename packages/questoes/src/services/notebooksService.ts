import { supabase } from './supabase';
import { FilterOptions } from '../pages/PracticePage'; // Will be defined in page

export interface Notebook {
    id: string;
    user_id: string;
    title: string;
    filters: FilterOptions;
    questions_count: number;
    is_favorite: boolean;
    created_at: string;
}

export async function createNotebook(title: string, filters: FilterOptions, count: number) {
    const { data, error } = await supabase
        .from('cadernos')
        .insert({
            title,
            filters,
            questions_count: count
        })
        .select()
        .single();

    if (error) throw error;
    return data as Notebook;
}

export async function getUserNotebooks() {
    const { data, error } = await supabase
        .from('cadernos')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data as Notebook[];
}

export async function deleteNotebook(id: string) {
    const { error } = await supabase
        .from('cadernos')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

export async function toggleFavoriteNotebook(id: string, isFavorite: boolean) {
    const { error } = await supabase
        .from('cadernos')
        .update({ is_favorite: isFavorite })
        .eq('id', id);

    if (error) throw error;
}