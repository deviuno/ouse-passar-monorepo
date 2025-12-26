// Service for managing legal texts (terms of service, privacy policy)
import { supabase } from '../lib/supabase';

export interface LegalText {
  id: string;
  title: string;
  content: string;
  last_updated: string;
  updated_by?: string;
  created_at: string;
}

export type LegalTextId = 'terms_of_service' | 'privacy_policy';

/**
 * Get a legal text by ID
 */
export async function getLegalText(id: LegalTextId): Promise<{ text: LegalText | null; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('legal_texts' as any)
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('[legalTextsService] Error fetching legal text:', error);
      return { text: null, error: error.message };
    }

    return { text: data as unknown as LegalText, error: null };
  } catch (err: any) {
    console.error('[legalTextsService] Exception:', err);
    return { text: null, error: err.message };
  }
}

/**
 * Get all legal texts
 */
export async function getAllLegalTexts(): Promise<{ texts: LegalText[]; error: string | null }> {
  try {
    const { data, error } = await supabase
      .from('legal_texts' as any)
      .select('*')
      .order('id');

    if (error) {
      console.error('[legalTextsService] Error fetching legal texts:', error);
      return { texts: [], error: error.message };
    }

    return { texts: (data || []) as unknown as LegalText[], error: null };
  } catch (err: any) {
    console.error('[legalTextsService] Exception:', err);
    return { texts: [], error: err.message };
  }
}

/**
 * Update a legal text
 * Requires admin authentication
 */
export async function updateLegalText(
  id: LegalTextId,
  updates: { title?: string; content?: string }
): Promise<{ success: boolean; error: string | null }> {
  try {
    // Get current user
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    const { error } = await supabase
      .from('legal_texts' as any)
      .update({
        ...updates,
        last_updated: new Date().toISOString(),
        updated_by: user.id,
      })
      .eq('id', id);

    if (error) {
      console.error('[legalTextsService] Error updating legal text:', error);
      return { success: false, error: error.message };
    }

    return { success: true, error: null };
  } catch (err: any) {
    console.error('[legalTextsService] Exception:', err);
    return { success: false, error: err.message };
  }
}

/**
 * Get legal text formatted for display
 * Returns the content as markdown
 */
export async function getLegalTextForDisplay(id: LegalTextId): Promise<{
  title: string;
  content: string;
  lastUpdated: string;
} | null> {
  const { text, error } = await getLegalText(id);

  if (error || !text) {
    return null;
  }

  return {
    title: text.title,
    content: text.content,
    lastUpdated: new Date(text.last_updated).toLocaleDateString('pt-BR'),
  };
}
