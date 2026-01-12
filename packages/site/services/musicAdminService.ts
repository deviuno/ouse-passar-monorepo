/**
 * Music Admin Service - Gerenciamento de músicas e podcasts
 *
 * Serviço para administração do módulo de música/podcasts
 */

import { supabase } from '../lib/supabase';

// Usar cliente sem tipos para tabelas de música (tipos ainda não gerados)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

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
  tracks?: MusicTrack[];
}

export interface MusicSettings {
  id: string;
  preparatorio_id: string;
  is_enabled: boolean;
  billing_type: 'free' | 'paid' | 'subscription';
  price_cents: number | null;
  allow_user_playlists: boolean;
  show_lesson_podcasts: boolean;
  created_at: string;
  updated_at: string;
}

export interface MusicStats {
  totalTracks: number;
  totalPodcasts: number;
  totalPlaylists: number;
  totalPlays: number;
  totalFavorites: number;
  totalCategories: number;
}

export interface TrackFilters {
  category_id?: string;
  is_podcast?: boolean;
  is_active?: boolean;
  search?: string;
}

// ============================================================================
// STATISTICS
// ============================================================================

export async function getMusicStats(preparatorioId: string): Promise<MusicStats> {
  const [
    { count: totalTracks },
    { count: totalPodcasts },
    { count: totalPlaylists },
    { count: totalCategories },
    { data: playCountData },
    { count: totalFavorites },
  ] = await Promise.all([
    db
      .from('music_tracks')
      .select('*', { count: 'exact', head: true })
      .eq('preparatorio_id', preparatorioId)
      .eq('is_podcast', false),
    db
      .from('music_tracks')
      .select('*', { count: 'exact', head: true })
      .eq('preparatorio_id', preparatorioId)
      .eq('is_podcast', true),
    db
      .from('music_playlists')
      .select('*', { count: 'exact', head: true })
      .eq('preparatorio_id', preparatorioId)
      .is('user_id', null),
    db
      .from('music_categories')
      .select('*', { count: 'exact', head: true })
      .eq('preparatorio_id', preparatorioId),
    db
      .from('music_tracks')
      .select('play_count')
      .eq('preparatorio_id', preparatorioId),
    db
      .from('music_favorites')
      .select('*, track:music_tracks!inner(preparatorio_id)', { count: 'exact', head: true })
      .eq('track.preparatorio_id', preparatorioId),
  ]);

  const totalPlays = (playCountData || []).reduce((sum: number, t: any) => sum + (t.play_count || 0), 0);

  return {
    totalTracks: totalTracks || 0,
    totalPodcasts: totalPodcasts || 0,
    totalPlaylists: totalPlaylists || 0,
    totalPlays,
    totalFavorites: totalFavorites || 0,
    totalCategories: totalCategories || 0,
  };
}

// ============================================================================
// CATEGORIES
// ============================================================================

export async function getCategories(preparatorioId: string): Promise<MusicCategory[]> {
  const { data, error } = await db
    .from('music_categories')
    .select('*')
    .eq('preparatorio_id', preparatorioId)
    .order('sort_order', { ascending: true });

  if (error) throw error;
  return data || [];
}

export async function getCategoryById(id: string): Promise<MusicCategory | null> {
  const { data, error } = await db
    .from('music_categories')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createCategory(
  preparatorioId: string,
  category: {
    name: string;
    slug: string;
    description?: string;
    icon?: string;
    color?: string;
  }
): Promise<MusicCategory> {
  // Get next sort_order
  const { data: existing } = await db
    .from('music_categories')
    .select('sort_order')
    .eq('preparatorio_id', preparatorioId)
    .order('sort_order', { ascending: false })
    .limit(1);

  const nextOrder = existing && existing.length > 0 ? existing[0].sort_order + 1 : 0;

  const { data, error } = await db
    .from('music_categories')
    .insert({
      preparatorio_id: preparatorioId,
      name: category.name,
      slug: category.slug,
      description: category.description || null,
      icon: category.icon || null,
      color: category.color || null,
      sort_order: nextOrder,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updateCategory(
  id: string,
  category: Partial<{
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    sort_order: number;
  }>
): Promise<MusicCategory> {
  const { data, error } = await db
    .from('music_categories')
    .update(category)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deleteCategory(id: string): Promise<void> {
  const { error } = await db.from('music_categories').delete().eq('id', id);
  if (error) throw error;
}

export async function reorderCategories(categories: { id: string; sort_order: number }[]): Promise<void> {
  for (const cat of categories) {
    const { error } = await db
      .from('music_categories')
      .update({ sort_order: cat.sort_order })
      .eq('id', cat.id);

    if (error) throw error;
  }
}

// ============================================================================
// TRACKS
// ============================================================================

export async function getTracks(
  preparatorioId: string,
  filters?: TrackFilters,
  page = 1,
  limit = 20
): Promise<{ tracks: MusicTrack[]; total: number }> {
  let query = db
    .from('music_tracks')
    .select('*, category:music_categories(*)', { count: 'exact' })
    .eq('preparatorio_id', preparatorioId);

  if (filters?.category_id) {
    query = query.eq('category_id', filters.category_id);
  }

  if (filters?.is_podcast !== undefined) {
    query = query.eq('is_podcast', filters.is_podcast);
  }

  if (filters?.is_active !== undefined) {
    query = query.eq('is_active', filters.is_active);
  }

  if (filters?.search) {
    query = query.or(`title.ilike.%${filters.search}%,artist.ilike.%${filters.search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, error, count } = await query
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw error;

  return {
    tracks: data || [],
    total: count || 0,
  };
}

export async function getTrackById(id: string): Promise<MusicTrack | null> {
  const { data, error } = await db
    .from('music_tracks')
    .select('*, category:music_categories(*)')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function createTrack(
  preparatorioId: string,
  track: {
    title: string;
    artist?: string;
    album?: string;
    duration_seconds: number;
    audio_url: string;
    cover_url?: string;
    category_id?: string;
    is_podcast?: boolean;
    materia?: string;
    assunto?: string;
  }
): Promise<MusicTrack> {
  const { data, error } = await db
    .from('music_tracks')
    .insert({
      preparatorio_id: preparatorioId,
      title: track.title,
      artist: track.artist || null,
      album: track.album || null,
      duration_seconds: track.duration_seconds,
      audio_url: track.audio_url,
      cover_url: track.cover_url || null,
      category_id: track.category_id || null,
      is_podcast: track.is_podcast || false,
      materia: track.materia || null,
      assunto: track.assunto || null,
      is_active: true,
    })
    .select('*, category:music_categories(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function updateTrack(
  id: string,
  track: Partial<{
    title: string;
    artist: string;
    album: string;
    duration_seconds: number;
    audio_url: string;
    cover_url: string;
    category_id: string;
    is_podcast: boolean;
    materia: string;
    assunto: string;
    is_active: boolean;
  }>
): Promise<MusicTrack> {
  const { data, error } = await db
    .from('music_tracks')
    .update(track)
    .eq('id', id)
    .select('*, category:music_categories(*)')
    .single();

  if (error) throw error;
  return data;
}

export async function deleteTrack(id: string): Promise<void> {
  const { error } = await db.from('music_tracks').delete().eq('id', id);
  if (error) throw error;
}

export async function toggleTrackActive(id: string): Promise<MusicTrack> {
  // Get current status
  const track = await getTrackById(id);
  if (!track) throw new Error('Track not found');

  return updateTrack(id, { is_active: !track.is_active });
}

// ============================================================================
// PLAYLISTS
// ============================================================================

export async function getPlaylists(
  preparatorioId: string,
  adminOnly = true
): Promise<MusicPlaylist[]> {
  let query = db
    .from('music_playlists')
    .select('*')
    .eq('preparatorio_id', preparatorioId);

  if (adminOnly) {
    query = query.is('user_id', null);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function getPlaylistById(id: string): Promise<MusicPlaylist | null> {
  const { data, error } = await db
    .from('music_playlists')
    .select('*')
    .eq('id', id)
    .single();

  if (error && error.code !== 'PGRST116') throw error;
  return data;
}

export async function getPlaylistWithTracks(id: string): Promise<MusicPlaylist | null> {
  const playlist = await getPlaylistById(id);
  if (!playlist) return null;

  const { data: playlistTracks, error } = await db
    .from('music_playlist_tracks')
    .select('position, track:music_tracks(*, category:music_categories(*))')
    .eq('playlist_id', id)
    .order('position', { ascending: true });

  if (error) throw error;

  const tracks = (playlistTracks || [])
    .map((pt: any) => pt.track as MusicTrack)
    .filter(Boolean);

  return { ...playlist, tracks };
}

export async function createPlaylist(
  preparatorioId: string,
  playlist: {
    name: string;
    description?: string;
    cover_url?: string;
    is_auto_generated?: boolean;
    auto_filter?: Record<string, string>;
  }
): Promise<MusicPlaylist> {
  const { data, error } = await db
    .from('music_playlists')
    .insert({
      preparatorio_id: preparatorioId,
      user_id: null, // Admin playlist
      name: playlist.name,
      description: playlist.description || null,
      cover_url: playlist.cover_url || null,
      is_public: true,
      is_auto_generated: playlist.is_auto_generated || false,
      auto_filter: playlist.auto_filter || null,
    })
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function updatePlaylist(
  id: string,
  playlist: Partial<{
    name: string;
    description: string;
    cover_url: string;
    is_public: boolean;
    is_auto_generated: boolean;
    auto_filter: Record<string, string>;
  }>
): Promise<MusicPlaylist> {
  const { data, error } = await db
    .from('music_playlists')
    .update(playlist)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function deletePlaylist(id: string): Promise<void> {
  const { error } = await db.from('music_playlists').delete().eq('id', id);
  if (error) throw error;
}

export async function addTracksToPlaylist(playlistId: string, trackIds: string[]): Promise<void> {
  // Get current max position
  const { data: existing } = await db
    .from('music_playlist_tracks')
    .select('position')
    .eq('playlist_id', playlistId)
    .order('position', { ascending: false })
    .limit(1);

  let nextPosition = existing && existing.length > 0 ? existing[0].position + 1 : 0;

  const inserts = trackIds.map((trackId) => ({
    playlist_id: playlistId,
    track_id: trackId,
    position: nextPosition++,
  }));

  const { error } = await db.from('music_playlist_tracks').insert(inserts);
  if (error) throw error;

  // Update playlist stats
  await updatePlaylistStats(playlistId);
}

export async function removeTrackFromPlaylist(playlistId: string, trackId: string): Promise<void> {
  const { error } = await db
    .from('music_playlist_tracks')
    .delete()
    .eq('playlist_id', playlistId)
    .eq('track_id', trackId);

  if (error) throw error;

  // Update playlist stats
  await updatePlaylistStats(playlistId);
}

export async function reorderPlaylistTracks(
  playlistId: string,
  tracks: { track_id: string; position: number }[]
): Promise<void> {
  for (const t of tracks) {
    const { error } = await db
      .from('music_playlist_tracks')
      .update({ position: t.position })
      .eq('playlist_id', playlistId)
      .eq('track_id', t.track_id);

    if (error) throw error;
  }
}

async function updatePlaylistStats(playlistId: string): Promise<void> {
  const { data: tracks } = await db
    .from('music_playlist_tracks')
    .select('track:music_tracks(duration_seconds)')
    .eq('playlist_id', playlistId);

  const trackCount = tracks?.length || 0;
  const totalDuration = (tracks || []).reduce((sum, t) => {
    const track = t.track as unknown as { duration_seconds: number };
    return sum + (track?.duration_seconds || 0);
  }, 0);

  await db
    .from('music_playlists')
    .update({
      track_count: trackCount,
      total_duration_seconds: totalDuration,
    })
    .eq('id', playlistId);
}

// ============================================================================
// SETTINGS
// ============================================================================

export async function getSettings(preparatorioId: string): Promise<MusicSettings | null> {
  const { data, error } = await db
    .from('music_settings')
    .select('*')
    .eq('preparatorio_id', preparatorioId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

export async function upsertSettings(
  preparatorioId: string,
  settings: Partial<{
    is_enabled: boolean;
    billing_type: 'free' | 'paid' | 'subscription';
    price_cents: number;
    allow_user_playlists: boolean;
    show_lesson_podcasts: boolean;
  }>
): Promise<MusicSettings> {
  const { data, error } = await db
    .from('music_settings')
    .upsert(
      {
        preparatorio_id: preparatorioId,
        ...settings,
      },
      { onConflict: 'preparatorio_id' }
    )
    .select()
    .single();

  if (error) throw error;
  return data;
}

// ============================================================================
// FILE UPLOAD
// ============================================================================

export async function uploadAudioFile(
  file: File,
  preparatorioId: string
): Promise<{ url: string; duration: number }> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `tracks/${preparatorioId}/${fileName}`;

  const { error: uploadError } = await db.storage
    .from('music')
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('music').getPublicUrl(filePath);

  // Get audio duration
  const duration = await getAudioDuration(file);

  return {
    url: urlData.publicUrl,
    duration,
  };
}

export async function uploadCoverImage(
  file: File,
  preparatorioId: string
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${crypto.randomUUID()}.${fileExt}`;
  const filePath = `covers/${preparatorioId}/${fileName}`;

  const { error: uploadError } = await db.storage
    .from('music')
    .upload(filePath, file, {
      cacheControl: '31536000',
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: urlData } = supabase.storage.from('music').getPublicUrl(filePath);

  return urlData.publicUrl;
}

async function getAudioDuration(file: File): Promise<number> {
  return new Promise((resolve) => {
    const audio = new Audio();
    audio.preload = 'metadata';

    audio.onloadedmetadata = () => {
      resolve(Math.round(audio.duration));
    };

    audio.onerror = () => {
      resolve(0);
    };

    audio.src = URL.createObjectURL(file);
  });
}

// ============================================================================
// HELPERS
// ============================================================================

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

export function formatDuration(seconds: number): string {
  if (!seconds) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function formatTotalDuration(seconds: number): string {
  if (!seconds) return '0 min';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (hours > 0) {
    return `${hours}h ${minutes}min`;
  }
  return `${minutes} min`;
}

// ============================================================================
// DEFAULT EXPORT - Object with all methods for convenience
// ============================================================================

export const musicAdminService = {
  // Stats
  getStats: getMusicStats,

  // Categories
  getCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  reorderCategories,

  // Tracks
  getTracks: async (preparatorioId: string, filters?: TrackFilters) => {
    const result = await getTracks(preparatorioId, filters);
    return result.tracks;
  },
  getTrackById,
  createTrack,
  updateTrack,
  deleteTrack,
  toggleTrackActive,
  uploadAudioFile: async (preparatorioId: string, file: File) => {
    return uploadAudioFile(file, preparatorioId);
  },
  uploadCoverImage: async (preparatorioId: string, file: File, folder = 'covers') => {
    return uploadCoverImage(file, preparatorioId);
  },

  // Playlists
  getPlaylists,
  getPlaylistById,
  getPlaylistWithTracks,
  createPlaylist,
  updatePlaylist,
  deletePlaylist,
  addTrackToPlaylist: async (playlistId: string, trackId: string) => {
    return addTracksToPlaylist(playlistId, [trackId]);
  },
  addTracksToPlaylist,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,

  // Settings
  getSettings,
  updateSettings: upsertSettings,

  // Helpers
  generateSlug,
  formatDuration,
  formatTotalDuration,
};

export default musicAdminService;
