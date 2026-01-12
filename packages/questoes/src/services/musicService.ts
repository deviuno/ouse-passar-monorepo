/**
 * Music Service - Serviço para o módulo de música/podcasts
 *
 * Gerencia faixas, playlists, favoritos e histórico de reprodução
 */

import { supabase } from './supabaseClient';

// ============================================================================
// TYPES
// ============================================================================

export interface MusicCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  color: string | null;
  sort_order: number;
  preparatorio_id: string;
  created_at: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string | null;
  album: string | null;
  duration_seconds: number;
  audio_url: string;
  cover_url: string | null;
  category_id: string | null;
  preparatorio_id: string;
  is_podcast: boolean;
  lesson_id: string | null;
  materia: string | null;
  assunto: string | null;
  play_count: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Relations
  category?: MusicCategory;
}

export interface MusicPlaylist {
  id: string;
  name: string;
  description: string | null;
  cover_url: string | null;
  preparatorio_id: string;
  user_id: string | null;
  is_public: boolean;
  is_auto_generated: boolean;
  auto_filter: Record<string, string> | null;
  track_count: number;
  total_duration_seconds: number;
  created_at: string;
  updated_at: string;
  // Relations
  tracks?: MusicTrack[];
}

export interface MusicFavorite {
  id: string;
  user_id: string;
  track_id: string;
  created_at: string;
  track?: MusicTrack;
}

export interface MusicHistory {
  id: string;
  user_id: string;
  track_id: string;
  played_at: string;
  duration_listened_seconds: number;
  track?: MusicTrack;
}

export interface MusicSettings {
  id: string;
  preparatorio_id: string;
  is_enabled: boolean;
  billing_type: 'free' | 'paid' | 'subscription';
  price_cents: number | null;
  allow_user_playlists: boolean;
  show_lesson_podcasts: boolean;
}

export interface TrackFilters {
  category_id?: string;
  is_podcast?: boolean;
  materia?: string;
  search?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

export const musicService = {
  // --------------------------------------------------------------------------
  // CATEGORIES
  // --------------------------------------------------------------------------

  async getCategories(preparatorioId: string): Promise<MusicCategory[]> {
    const { data, error } = await supabase
      .from('music_categories')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data || [];
  },

  async getCategoryBySlug(preparatorioId: string, slug: string): Promise<MusicCategory | null> {
    const { data, error } = await supabase
      .from('music_categories')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .eq('slug', slug)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  // --------------------------------------------------------------------------
  // TRACKS
  // --------------------------------------------------------------------------

  async getTracks(preparatorioId: string, filters?: TrackFilters): Promise<MusicTrack[]> {
    let query = supabase
      .from('music_tracks')
      .select('*, category:music_categories(*)')
      .eq('preparatorio_id', preparatorioId)
      .eq('is_active', true);

    if (filters?.category_id) {
      query = query.eq('category_id', filters.category_id);
    }

    if (filters?.is_podcast !== undefined) {
      query = query.eq('is_podcast', filters.is_podcast);
    }

    if (filters?.materia) {
      query = query.eq('materia', filters.materia);
    }

    if (filters?.search) {
      query = query.or(`title.ilike.%${filters.search}%,artist.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getTrackById(trackId: string): Promise<MusicTrack | null> {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('*, category:music_categories(*)')
      .eq('id', trackId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getTracksByCategory(preparatorioId: string, categorySlug: string): Promise<MusicTrack[]> {
    // First get the category by slug
    const category = await this.getCategoryBySlug(preparatorioId, categorySlug);
    if (!category) return [];

    return this.getTracks(preparatorioId, { category_id: category.id });
  },

  async getLessonPodcasts(preparatorioId: string, materia?: string): Promise<MusicTrack[]> {
    let query = supabase
      .from('music_tracks')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .eq('is_podcast', true)
      .not('lesson_id', 'is', null)
      .eq('is_active', true);

    if (materia) {
      query = query.eq('materia', materia);
    }

    const { data, error } = await query.order('materia').order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getLessonPodcastsMaterias(preparatorioId: string): Promise<{ materia: string; count: number }[]> {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('materia')
      .eq('preparatorio_id', preparatorioId)
      .eq('is_podcast', true)
      .not('lesson_id', 'is', null)
      .not('materia', 'is', null)
      .eq('is_active', true);

    if (error) throw error;

    // Group by materia
    const counts: Record<string, number> = {};
    (data || []).forEach((item) => {
      if (item.materia) {
        counts[item.materia] = (counts[item.materia] || 0) + 1;
      }
    });

    return Object.entries(counts)
      .map(([materia, count]) => ({ materia, count }))
      .sort((a, b) => b.count - a.count);
  },

  async searchTracks(preparatorioId: string, query: string): Promise<MusicTrack[]> {
    return this.getTracks(preparatorioId, { search: query });
  },

  async searchPlaylists(preparatorioId: string, searchQuery: string): Promise<MusicPlaylist[]> {
    const { data, error } = await supabase
      .from('music_playlists')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .eq('is_public', true)
      .ilike('name', `%${searchQuery}%`)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // --------------------------------------------------------------------------
  // PLAYLISTS
  // --------------------------------------------------------------------------

  async getPlaylists(preparatorioId: string, userId?: string): Promise<MusicPlaylist[]> {
    let query = supabase
      .from('music_playlists')
      .select('*')
      .eq('preparatorio_id', preparatorioId);

    if (userId) {
      // Get public playlists + user's own playlists
      query = query.or(`is_public.eq.true,user_id.eq.${userId}`);
    } else {
      query = query.eq('is_public', true);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPublicPlaylists(preparatorioId: string): Promise<MusicPlaylist[]> {
    const { data, error } = await supabase
      .from('music_playlists')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .eq('is_public', true)
      .is('user_id', null)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getUserPlaylists(userId: string): Promise<MusicPlaylist[]> {
    const { data, error } = await supabase
      .from('music_playlists')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async getPlaylistById(playlistId: string): Promise<MusicPlaylist | null> {
    const { data, error } = await supabase
      .from('music_playlists')
      .select('*')
      .eq('id', playlistId)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
  },

  async getPlaylistWithTracks(playlistId: string): Promise<MusicPlaylist | null> {
    // Get playlist
    const playlist = await this.getPlaylistById(playlistId);
    if (!playlist) return null;

    // Get tracks
    const { data: playlistTracks, error } = await supabase
      .from('music_playlist_tracks')
      .select('position, track:music_tracks(*)')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: true });

    if (error) throw error;

    // Extract tracks with proper typing
    const tracks = (playlistTracks || [])
      .map((pt) => pt.track as unknown as MusicTrack)
      .filter(Boolean);

    return { ...playlist, tracks };
  },

  async createPlaylist(
    preparatorioId: string,
    userId: string,
    data: { name: string; description?: string; cover_url?: string }
  ): Promise<MusicPlaylist> {
    const { data: playlist, error } = await supabase
      .from('music_playlists')
      .insert({
        preparatorio_id: preparatorioId,
        user_id: userId,
        name: data.name,
        description: data.description || null,
        cover_url: data.cover_url || null,
        is_public: false,
        is_auto_generated: false,
      })
      .select()
      .single();

    if (error) throw error;
    return playlist;
  },

  async updatePlaylist(
    playlistId: string,
    userId: string,
    data: { name?: string; description?: string; cover_url?: string }
  ): Promise<MusicPlaylist> {
    const { data: playlist, error } = await supabase
      .from('music_playlists')
      .update(data)
      .eq('id', playlistId)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return playlist;
  },

  async deletePlaylist(playlistId: string, userId: string): Promise<void> {
    const { error } = await supabase
      .from('music_playlists')
      .delete()
      .eq('id', playlistId)
      .eq('user_id', userId);

    if (error) throw error;
  },

  async addTrackToPlaylist(playlistId: string, trackId: string): Promise<void> {
    // Get current max position
    const { data: existing } = await supabase
      .from('music_playlist_tracks')
      .select('position')
      .eq('playlist_id', playlistId)
      .order('position', { ascending: false })
      .limit(1);

    const nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

    const { error } = await supabase.from('music_playlist_tracks').insert({
      playlist_id: playlistId,
      track_id: trackId,
      position: nextPosition,
    });

    if (error) throw error;

    // Update playlist track count
    await this.updatePlaylistStats(playlistId);
  },

  async removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
    const { error } = await supabase
      .from('music_playlist_tracks')
      .delete()
      .eq('playlist_id', playlistId)
      .eq('track_id', trackId);

    if (error) throw error;

    // Update playlist track count
    await this.updatePlaylistStats(playlistId);
  },

  async updatePlaylistStats(playlistId: string): Promise<void> {
    // Get count and total duration
    const { data: tracks } = await supabase
      .from('music_playlist_tracks')
      .select('track:music_tracks(duration_seconds)')
      .eq('playlist_id', playlistId);

    const trackCount = tracks?.length || 0;
    const totalDuration = (tracks || []).reduce((sum, t) => {
      const track = t.track as unknown as { duration_seconds: number };
      return sum + (track?.duration_seconds || 0);
    }, 0);

    await supabase
      .from('music_playlists')
      .update({
        track_count: trackCount,
        total_duration_seconds: totalDuration,
      })
      .eq('id', playlistId);
  },

  // --------------------------------------------------------------------------
  // FAVORITES
  // --------------------------------------------------------------------------

  async getFavorites(userId: string): Promise<MusicTrack[]> {
    const { data, error } = await supabase
      .from('music_favorites')
      .select('track:music_tracks(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    return (data || [])
      .map((f) => f.track as unknown as MusicTrack)
      .filter(Boolean);
  },

  async isFavorite(userId: string, trackId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('music_favorites')
      .select('id')
      .eq('user_id', userId)
      .eq('track_id', trackId)
      .maybeSingle();

    if (error) throw error;
    return !!data;
  },

  async toggleFavorite(userId: string, trackId: string): Promise<boolean> {
    const exists = await this.isFavorite(userId, trackId);

    if (exists) {
      const { error } = await supabase
        .from('music_favorites')
        .delete()
        .eq('user_id', userId)
        .eq('track_id', trackId);

      if (error) throw error;
      return false;
    } else {
      const { error } = await supabase.from('music_favorites').insert({
        user_id: userId,
        track_id: trackId,
      });

      if (error) throw error;
      return true;
    }
  },

  // --------------------------------------------------------------------------
  // HISTORY
  // --------------------------------------------------------------------------

  async getHistory(userId: string, limit = 50): Promise<MusicTrack[]> {
    const { data, error } = await supabase
      .from('music_history')
      .select('track:music_tracks(*)')
      .eq('user_id', userId)
      .order('played_at', { ascending: false })
      .limit(limit);

    if (error) throw error;

    // Remove duplicates, keeping most recent
    const seen = new Set<string>();
    return (data || [])
      .map((h) => h.track as unknown as MusicTrack)
      .filter((track) => {
        if (!track || seen.has(track.id)) return false;
        seen.add(track.id);
        return true;
      });
  },

  async recordPlay(userId: string, trackId: string, durationListened = 0): Promise<void> {
    const { error } = await supabase.from('music_history').insert({
      user_id: userId,
      track_id: trackId,
      duration_listened_seconds: durationListened,
    });

    if (error) throw error;

    // Increment play count
    await supabase.rpc('increment_play_count', { track_id: trackId }).catch(() => {
      // RPC might not exist, try direct update
      supabase
        .from('music_tracks')
        .update({ play_count: supabase.rpc('increment', { x: 1 }) })
        .eq('id', trackId);
    });
  },

  // --------------------------------------------------------------------------
  // USER-GENERATED PODCASTS
  // --------------------------------------------------------------------------

  /**
   * Salva um podcast gerado pelo usuário na tabela music_tracks
   * para que apareça no módulo de música organizado por matéria
   */
  async saveUserGeneratedPodcast(params: {
    title: string;
    audioUrl: string;
    preparatorioId: string;
    materia?: string;
    assunto?: string;
    durationSeconds?: number;
  }): Promise<MusicTrack | null> {
    const { title, audioUrl, preparatorioId, materia, assunto, durationSeconds } = params;

    // Verificar se já existe um podcast com essa URL (evitar duplicatas)
    const { data: existing } = await supabase
      .from('music_tracks')
      .select('id')
      .eq('audio_url', audioUrl)
      .maybeSingle();

    if (existing) {
      console.log('[MusicService] Podcast já existe:', existing.id);
      return null; // Já existe, não precisa criar
    }

    // Criar o podcast
    const { data, error } = await supabase
      .from('music_tracks')
      .insert({
        title: title.substring(0, 255),
        artist: 'Podcast IA',
        audio_url: audioUrl,
        preparatorio_id: preparatorioId,
        is_podcast: true,
        materia: materia || null,
        assunto: assunto || null,
        duration_seconds: durationSeconds || 0,
        is_active: true,
        play_count: 0,
      })
      .select()
      .single();

    if (error) {
      console.error('[MusicService] Erro ao salvar podcast:', error);
      return null;
    }

    console.log('[MusicService] Podcast salvo com sucesso:', data.id);
    return data as MusicTrack;
  },

  /**
   * Busca podcasts gerados por matéria
   */
  async getPodcastsByMateria(preparatorioId: string, materia?: string): Promise<MusicTrack[]> {
    let query = supabase
      .from('music_tracks')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .eq('is_podcast', true)
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (materia) {
      query = query.eq('materia', materia);
    }

    const { data, error } = await query;

    if (error) throw error;
    return (data || []) as MusicTrack[];
  },

  /**
   * Busca lista de matérias que têm podcasts
   */
  async getPodcastMaterias(preparatorioId: string): Promise<{ materia: string; count: number }[]> {
    const { data, error } = await supabase
      .from('music_tracks')
      .select('materia')
      .eq('preparatorio_id', preparatorioId)
      .eq('is_podcast', true)
      .eq('is_active', true)
      .not('materia', 'is', null);

    if (error) throw error;

    // Agrupar por matéria e contar
    const materiaMap = new Map<string, number>();
    (data || []).forEach((row) => {
      const mat = row.materia as string;
      materiaMap.set(mat, (materiaMap.get(mat) || 0) + 1);
    });

    return Array.from(materiaMap.entries())
      .map(([materia, count]) => ({ materia, count }))
      .sort((a, b) => b.count - a.count);
  },

  // --------------------------------------------------------------------------
  // SETTINGS
  // --------------------------------------------------------------------------

  async getSettings(preparatorioId: string): Promise<MusicSettings | null> {
    const { data, error } = await supabase
      .from('music_settings')
      .select('*')
      .eq('preparatorio_id', preparatorioId)
      .maybeSingle();

    if (error) throw error;
    return data;
  },

  async isModuleEnabled(preparatorioId: string): Promise<boolean> {
    const settings = await this.getSettings(preparatorioId);
    return settings?.is_enabled ?? true;
  },
};

export default musicService;
