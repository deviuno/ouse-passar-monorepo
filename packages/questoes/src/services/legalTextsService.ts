// Service for fetching legal texts from Supabase
import { supabase } from './supabaseClient';

export interface LegalText {
  id: string;
  title: string;
  content: string;
  last_updated: string;
}

export type LegalTextId = 'terms_of_service' | 'privacy_policy';

/**
 * Get a legal text by ID for public display
 */
export async function getLegalText(id: LegalTextId): Promise<{
  title: string;
  content: string;
  lastUpdated: string;
} | null> {
  try {
    const { data, error } = await supabase
      .from('legal_texts')
      .select('title, content, last_updated')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[legalTextsService] Error fetching legal text:', error);
      return null;
    }

    if (!data) {
      console.warn('[legalTextsService] No legal text found for:', id);
      return null;
    }

    return {
      title: data.title,
      content: data.content,
      lastUpdated: new Date(data.last_updated).toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      }),
    };
  } catch (err: any) {
    console.error('[legalTextsService] Exception:', err);
    return null;
  }
}
