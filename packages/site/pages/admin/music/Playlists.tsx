import React, { useState, useEffect } from 'react';
import {
  ListMusic,
  Plus,
  Search,
  Loader2,
  Play,
  X,
  Edit2,
  Trash2,
  Music,
  Clock,
} from 'lucide-react';
import { musicAdminService, type MusicPlaylist, type MusicTrack } from '../../../services/musicAdminService';

export const MusicPlaylists: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [playlists, setPlaylists] = useState<MusicPlaylist[]>([]);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<MusicPlaylist | null>(null);
  const [saving, setSaving] = useState(false);
  const [showTrackSelector, setShowTrackSelector] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [coverFile, setCoverFile] = useState<File | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [playlistsData, tracksData] = await Promise.all([
        musicAdminService.getPlaylists(), // Sem filtro de preparatorio
        musicAdminService.getTracks(), // Sem filtro de preparatorio
      ]);
      setPlaylists(playlistsData);
      setTracks(tracksData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (playlist?: MusicPlaylist) => {
    if (playlist) {
      setEditingPlaylist(playlist);
      setFormData({
        name: playlist.name,
        description: playlist.description || '',
      });
    } else {
      setEditingPlaylist(null);
      setFormData({
        name: '',
        description: '',
      });
    }
    setCoverFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      let coverUrl = editingPlaylist?.cover_url;

      if (coverFile) {
        coverUrl = await musicAdminService.uploadCoverImage(coverFile);
      }

      if (editingPlaylist) {
        await musicAdminService.updatePlaylist(editingPlaylist.id, {
          ...formData,
          cover_url: coverUrl,
        });
      } else {
        await musicAdminService.createPlaylist(undefined, {
          ...formData,
          cover_url: coverUrl,
          is_public: true,
        });
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving playlist:', error);
      alert('Erro ao salvar playlist.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (playlist: MusicPlaylist) => {
    if (!confirm(`Tem certeza que deseja excluir "${playlist.name}"?`)) return;

    try {
      await musicAdminService.deletePlaylist(playlist.id);
      loadData();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      alert('Erro ao excluir playlist.');
    }
  };

  const handleOpenTrackSelector = (playlistId: string) => {
    setSelectedPlaylistId(playlistId);
    setShowTrackSelector(true);
  };

  const handleAddTrack = async (trackId: string) => {
    if (!selectedPlaylistId) return;

    try {
      await musicAdminService.addTrackToPlaylist(selectedPlaylistId, trackId);
      loadData();
    } catch (error) {
      console.error('Error adding track:', error);
    }
  };

  const handleRemoveTrack = async (playlistId: string, trackId: string) => {
    try {
      await musicAdminService.removeTrackFromPlaylist(playlistId, trackId);
      loadData();
    } catch (error) {
      console.error('Error removing track:', error);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}min`;
    }
    return `${mins}min`;
  };

  // Filter playlists
  const filteredPlaylists = playlists.filter((playlist) =>
    playlist.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Playlists
          </h1>
          <p className="text-gray-400 mt-1">
            Crie e gerencie playlists publicas para seus alunos
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-brand-darker font-bold rounded-lg hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Playlist
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Buscar playlists..."
          className="w-full pl-10 pr-4 py-2 bg-brand-card border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
        />
      </div>

      {/* Playlists Grid */}
      {filteredPlaylists.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <ListMusic className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma playlist encontrada</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPlaylists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-brand-card border border-white/5 rounded-lg overflow-hidden hover:border-brand-yellow/30 transition-colors"
            >
              {/* Cover */}
              <div className="aspect-square bg-brand-dark relative">
                {playlist.cover_url ? (
                  <img
                    src={playlist.cover_url}
                    alt=""
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <ListMusic className="w-16 h-16 text-gray-500" />
                  </div>
                )}
                <button
                  onClick={() => handleOpenTrackSelector(playlist.id)}
                  className="absolute bottom-4 right-4 w-12 h-12 bg-brand-yellow rounded-full flex items-center justify-center hover:scale-110 transition-transform shadow-lg"
                >
                  <Plus className="w-6 h-6 text-brand-darker" />
                </button>
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-bold text-lg truncate">{playlist.name}</h3>
                {playlist.description && (
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{playlist.description}</p>
                )}
                <div className="flex items-center gap-4 mt-3 text-gray-400 text-sm">
                  <span>{playlist.track_count} faixas</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatDuration(playlist.total_duration_seconds)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4">
                  <button
                    onClick={() => handleOpenModal(playlist)}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-white/5 text-white rounded-lg hover:bg-white/10 transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(playlist)}
                    className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    title="Excluir"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {editingPlaylist ? 'Editar Playlist' : 'Nova Playlist'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Cover */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Imagem de Capa</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  className="w-full text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-yellow file:text-brand-darker file:font-bold hover:file:bg-brand-yellow/90"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
                  placeholder="Nome da playlist"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Descricao</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50 resize-none"
                  placeholder="Descricao opcional"
                />
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-brand-yellow text-brand-darker font-bold rounded-lg hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Salvando...' : editingPlaylist ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Track Selector Modal */}
      {showTrackSelector && selectedPlaylistId && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-2xl max-h-[80vh] overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">Adicionar Faixas</h2>
              <button
                onClick={() => setShowTrackSelector(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 max-h-[60vh] overflow-y-auto">
              {tracks.length === 0 ? (
                <p className="text-center text-gray-400 py-8">
                  Nenhuma faixa disponivel. Crie faixas primeiro.
                </p>
              ) : (
                <div className="space-y-2">
                  {tracks.map((track) => {
                    const playlist = playlists.find((p) => p.id === selectedPlaylistId);
                    const isInPlaylist = playlist?.tracks?.some((t) => t.id === track.id);

                    return (
                      <div
                        key={track.id}
                        className="flex items-center justify-between p-3 bg-brand-dark rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-brand-card rounded overflow-hidden">
                            {track.cover_url ? (
                              <img
                                src={track.cover_url}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Music className="w-4 h-4 text-gray-500" />
                              </div>
                            )}
                          </div>
                          <div>
                            <p className="text-white font-medium">{track.title}</p>
                            <p className="text-gray-400 text-sm">{track.artist || 'Artista'}</p>
                          </div>
                        </div>
                        <button
                          onClick={() =>
                            isInPlaylist
                              ? handleRemoveTrack(selectedPlaylistId, track.id)
                              : handleAddTrack(track.id)
                          }
                          className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                            isInPlaylist
                              ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30'
                              : 'bg-brand-yellow text-brand-darker hover:bg-brand-yellow/90'
                          }`}
                        >
                          {isInPlaylist ? 'Remover' : 'Adicionar'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicPlaylists;
