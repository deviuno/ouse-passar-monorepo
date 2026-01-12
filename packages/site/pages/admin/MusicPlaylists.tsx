import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ListMusic,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  Music,
  Clock,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import * as musicAdminService from '../../services/musicAdminService';

export const MusicPlaylists: React.FC = () => {
  const toast = useToast();
  const { currentPreparatorio } = useAuth();
  const [playlists, setPlaylists] = useState<musicAdminService.MusicPlaylist[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingPlaylist, setEditingPlaylist] = useState<musicAdminService.MusicPlaylist | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  // Track selection modal
  const [showTrackModal, setShowTrackModal] = useState(false);
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<string | null>(null);
  const [availableTracks, setAvailableTracks] = useState<musicAdminService.MusicTrack[]>([]);
  const [selectedTracks, setSelectedTracks] = useState<string[]>([]);
  const [loadingTracks, setLoadingTracks] = useState(false);

  useEffect(() => {
    if (currentPreparatorio?.id) {
      loadPlaylists();
    }
  }, [currentPreparatorio?.id]);

  const loadPlaylists = async () => {
    if (!currentPreparatorio?.id) return;

    setLoading(true);
    try {
      const data = await musicAdminService.getPlaylists(currentPreparatorio.id, true);
      setPlaylists(data);
    } catch (error) {
      console.error('Error loading playlists:', error);
      toast.error('Erro ao carregar playlists');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingPlaylist(null);
    setFormData({ name: '', description: '' });
    setShowModal(true);
  };

  const openEditModal = (playlist: musicAdminService.MusicPlaylist) => {
    setEditingPlaylist(playlist);
    setFormData({
      name: playlist.name,
      description: playlist.description || '',
    });
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPreparatorio?.id) return;

    setSaving(true);
    try {
      if (editingPlaylist) {
        await musicAdminService.updatePlaylist(editingPlaylist.id, formData);
        toast.success('Playlist atualizada!');
      } else {
        await musicAdminService.createPlaylist(currentPreparatorio.id, formData);
        toast.success('Playlist criada!');
      }

      setShowModal(false);
      loadPlaylists();
    } catch (error) {
      console.error('Error saving playlist:', error);
      toast.error('Erro ao salvar playlist');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (playlist: musicAdminService.MusicPlaylist) => {
    if (!confirm(`Excluir "${playlist.name}"?`)) return;

    try {
      await musicAdminService.deletePlaylist(playlist.id);
      toast.success('Playlist excluida!');
      loadPlaylists();
    } catch (error) {
      console.error('Error deleting playlist:', error);
      toast.error('Erro ao excluir playlist');
    }
  };

  const openAddTracksModal = async (playlistId: string) => {
    if (!currentPreparatorio?.id) return;

    setSelectedPlaylistId(playlistId);
    setSelectedTracks([]);
    setLoadingTracks(true);
    setShowTrackModal(true);

    try {
      const { tracks } = await musicAdminService.getTracks(currentPreparatorio.id, {}, 1, 100);
      setAvailableTracks(tracks);
    } catch (error) {
      console.error('Error loading tracks:', error);
      toast.error('Erro ao carregar faixas');
    } finally {
      setLoadingTracks(false);
    }
  };

  const handleAddTracks = async () => {
    if (!selectedPlaylistId || selectedTracks.length === 0) return;

    try {
      await musicAdminService.addTracksToPlaylist(selectedPlaylistId, selectedTracks);
      toast.success(`${selectedTracks.length} faixa(s) adicionada(s)!`);
      setShowTrackModal(false);
      loadPlaylists();
    } catch (error) {
      console.error('Error adding tracks:', error);
      toast.error('Erro ao adicionar faixas');
    }
  };

  const toggleTrackSelection = (trackId: string) => {
    setSelectedTracks((prev) =>
      prev.includes(trackId) ? prev.filter((id) => id !== trackId) : [...prev, trackId]
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/admin/music" className="text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Playlists</h1>
          </div>
          <p className="text-gray-400 mt-1 ml-8">Gerencie playlists do preparatorio</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-dark text-black font-bold uppercase text-sm rounded-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Playlist
        </button>
      </div>

      {/* List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
        </div>
      ) : playlists.length === 0 ? (
        <div className="bg-brand-card border border-white/10 rounded-sm text-center py-12">
          <ListMusic className="w-12 h-12 mx-auto mb-4 text-gray-400 opacity-50" />
          <p className="text-gray-400">Nenhuma playlist criada</p>
          <button
            onClick={openCreateModal}
            className="mt-4 text-brand-yellow hover:text-white transition-colors"
          >
            Criar primeira playlist
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {playlists.map((playlist) => (
            <div
              key={playlist.id}
              className="bg-brand-card border border-white/10 rounded-sm overflow-hidden hover:border-brand-yellow/30 transition-colors"
            >
              {/* Cover */}
              <div className="aspect-square bg-brand-dark flex items-center justify-center">
                {playlist.cover_url ? (
                  <img
                    src={playlist.cover_url}
                    alt={playlist.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <ListMusic className="w-16 h-16 text-gray-600" />
                )}
              </div>

              {/* Info */}
              <div className="p-4">
                <h3 className="text-white font-bold text-lg truncate">{playlist.name}</h3>
                {playlist.description && (
                  <p className="text-gray-400 text-sm mt-1 line-clamp-2">{playlist.description}</p>
                )}

                <div className="flex items-center gap-4 mt-3 text-gray-400 text-sm">
                  <span className="flex items-center gap-1">
                    <Music className="w-4 h-4" />
                    {playlist.track_count} faixas
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {musicAdminService.formatTotalDuration(playlist.total_duration_seconds)}
                  </span>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
                  <button
                    onClick={() => openAddTracksModal(playlist.id)}
                    className="text-brand-yellow text-sm font-bold hover:text-white transition-colors"
                  >
                    + Adicionar Faixas
                  </button>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => openEditModal(playlist)}
                      className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(playlist)}
                      className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-sm w-full max-w-md">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white uppercase">
                {editingPlaylist ? 'Editar Playlist' : 'Nova Playlist'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData((f) => ({ ...f, name: e.target.value }))}
                  required
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                  placeholder="Ex: Estudos Noturnos"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">Descricao</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50 resize-none"
                  placeholder="Descricao opcional da playlist..."
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-brand-dark border border-white/10 text-white font-bold uppercase text-sm rounded-sm hover:border-white/30 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-dark text-black font-bold uppercase text-sm rounded-sm transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingPlaylist ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tracks Modal */}
      {showTrackModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-sm w-full max-w-lg max-h-[80vh] flex flex-col">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white uppercase">Adicionar Faixas</h2>
              <button onClick={() => setShowTrackModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              {loadingTracks ? (
                <div className="flex items-center justify-center h-32">
                  <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
                </div>
              ) : availableTracks.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <Music className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhuma faixa disponivel</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {availableTracks.map((track) => (
                    <label
                      key={track.id}
                      className={`flex items-center gap-3 p-3 rounded-sm cursor-pointer transition-colors ${
                        selectedTracks.includes(track.id)
                          ? 'bg-brand-yellow/20 border border-brand-yellow/50'
                          : 'bg-brand-dark/50 border border-transparent hover:bg-brand-dark'
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={selectedTracks.includes(track.id)}
                        onChange={() => toggleTrackSelection(track.id)}
                        className="w-4 h-4 rounded border-white/20 bg-transparent text-brand-yellow focus:ring-brand-yellow"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-white font-medium truncate">{track.title}</p>
                        <p className="text-gray-400 text-sm truncate">
                          {track.artist || 'Artista desconhecido'} • {musicAdminService.formatDuration(track.duration_seconds)}
                        </p>
                      </div>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex items-center justify-between">
              <span className="text-gray-400 text-sm">
                {selectedTracks.length} faixa(s) selecionada(s)
              </span>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setShowTrackModal(false)}
                  className="px-4 py-2 bg-brand-dark border border-white/10 text-white font-bold uppercase text-sm rounded-sm hover:border-white/30 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleAddTracks}
                  disabled={selectedTracks.length === 0}
                  className="px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-dark text-black font-bold uppercase text-sm rounded-sm transition-colors disabled:opacity-50"
                >
                  Adicionar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
