import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Music,
  Mic2,
  Plus,
  Search,
  Loader2,
  Play,
  Pause,
  Edit2,
  Trash2,
  Upload,
  X,
  ChevronLeft,
  ChevronRight,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import * as musicAdminService from '../../services/musicAdminService';

export const MusicTracks: React.FC = () => {
  const toast = useToast();
  const { currentPreparatorio } = useAuth();

  // Debug log
  console.log('[MusicTracks] currentPreparatorio:', currentPreparatorio);
  const [tracks, setTracks] = useState<musicAdminService.MusicTrack[]>([]);
  const [categories, setCategories] = useState<musicAdminService.MusicCategory[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'music' | 'podcast'>('all');

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<musicAdminService.MusicTrack | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    artist: '',
    album: '',
    category_id: '',
    is_podcast: false,
    materia: '',
    assunto: '',
  });
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  // Audio player
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  const LIMIT = 20;

  useEffect(() => {
    if (currentPreparatorio?.id) {
      loadCategories();
    }
  }, [currentPreparatorio?.id]);

  useEffect(() => {
    if (currentPreparatorio?.id) {
      loadTracks();
    }
  }, [currentPreparatorio?.id, page, search, filterCategory, filterType]);

  const loadCategories = async () => {
    if (!currentPreparatorio?.id) return;
    try {
      const data = await musicAdminService.getCategories(currentPreparatorio.id);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const loadTracks = async () => {
    console.log('[MusicTracks] loadTracks called, preparatorioId:', currentPreparatorio?.id);
    if (!currentPreparatorio?.id) {
      console.log('[MusicTracks] Sem preparatório, abortando loadTracks');
      return;
    }

    setLoading(true);
    try {
      const filters: musicAdminService.TrackFilters = {};
      if (search) filters.search = search;
      if (filterCategory) filters.category_id = filterCategory;
      if (filterType === 'music') filters.is_podcast = false;
      if (filterType === 'podcast') filters.is_podcast = true;

      console.log('[MusicTracks] Chamando getTracks com:', { preparatorioId: currentPreparatorio.id, filters, page, LIMIT });
      const { tracks: data, total: totalCount } = await musicAdminService.getTracks(
        currentPreparatorio.id,
        filters,
        page,
        LIMIT
      );
      console.log('[MusicTracks] Resultado getTracks:', { tracksCount: data.length, totalCount });
      setTracks(data);
      setTotal(totalCount);
    } catch (error) {
      console.error('[MusicTracks] Error loading tracks:', error);
      toast.error('Erro ao carregar faixas');
    } finally {
      setLoading(false);
    }
  };

  const handlePlay = (track: musicAdminService.MusicTrack) => {
    if (playingTrackId === track.id) {
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.audio_url;
        audioRef.current.play();
        setPlayingTrackId(track.id);
      }
    }
  };

  const openCreateModal = () => {
    setEditingTrack(null);
    setFormData({
      title: '',
      artist: '',
      album: '',
      category_id: '',
      is_podcast: false,
      materia: '',
      assunto: '',
    });
    setAudioFile(null);
    setCoverFile(null);
    setShowModal(true);
  };

  const openEditModal = (track: musicAdminService.MusicTrack) => {
    setEditingTrack(track);
    setFormData({
      title: track.title,
      artist: track.artist || '',
      album: track.album || '',
      category_id: track.category_id || '',
      is_podcast: track.is_podcast,
      materia: track.materia || '',
      assunto: track.assunto || '',
    });
    setAudioFile(null);
    setCoverFile(null);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPreparatorio?.id) return;

    if (!editingTrack && !audioFile) {
      toast.error('Selecione um arquivo de audio');
      return;
    }

    setUploading(true);
    try {
      let audio_url = editingTrack?.audio_url || '';
      let duration_seconds = editingTrack?.duration_seconds || 0;
      let cover_url = editingTrack?.cover_url || '';

      // Upload audio if new file
      if (audioFile) {
        const result = await musicAdminService.uploadAudioFile(audioFile, currentPreparatorio.id);
        audio_url = result.url;
        duration_seconds = result.duration;
      }

      // Upload cover if new file
      if (coverFile) {
        cover_url = await musicAdminService.uploadCoverImage(coverFile, currentPreparatorio.id);
      }

      if (editingTrack) {
        await musicAdminService.updateTrack(editingTrack.id, {
          title: formData.title,
          artist: formData.artist || undefined,
          album: formData.album || undefined,
          category_id: formData.category_id || undefined,
          is_podcast: formData.is_podcast,
          materia: formData.materia || undefined,
          assunto: formData.assunto || undefined,
          audio_url: audioFile ? audio_url : undefined,
          duration_seconds: audioFile ? duration_seconds : undefined,
          cover_url: coverFile ? cover_url : undefined,
        });
        toast.success('Faixa atualizada!');
      } else {
        await musicAdminService.createTrack(currentPreparatorio.id, {
          title: formData.title,
          artist: formData.artist || undefined,
          album: formData.album || undefined,
          category_id: formData.category_id || undefined,
          is_podcast: formData.is_podcast,
          materia: formData.materia || undefined,
          assunto: formData.assunto || undefined,
          audio_url,
          duration_seconds,
          cover_url: cover_url || undefined,
        });
        toast.success('Faixa criada!');
      }

      setShowModal(false);
      loadTracks();
    } catch (error) {
      console.error('Error saving track:', error);
      toast.error('Erro ao salvar faixa');
    } finally {
      setUploading(false);
    }
  };

  const handleToggleActive = async (track: musicAdminService.MusicTrack) => {
    try {
      await musicAdminService.toggleTrackActive(track.id);
      toast.success(track.is_active ? 'Faixa desativada' : 'Faixa ativada');
      loadTracks();
    } catch (error) {
      console.error('Error toggling track:', error);
      toast.error('Erro ao alterar status');
    }
  };

  const handleDelete = async (track: musicAdminService.MusicTrack) => {
    if (!confirm(`Excluir "${track.title}"?`)) return;

    try {
      await musicAdminService.deleteTrack(track.id);
      toast.success('Faixa excluida!');
      loadTracks();
    } catch (error) {
      console.error('Error deleting track:', error);
      toast.error('Erro ao excluir faixa');
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingTrackId(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/admin/music" className="text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Faixas</h1>
          </div>
          <p className="text-gray-400 mt-1 ml-8">Gerencie musicas e podcasts</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-dark text-black font-bold uppercase text-sm rounded-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Faixa
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="flex-1 min-w-[200px]">
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar faixas..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-10 pr-4 py-2 bg-brand-card border border-white/10 rounded-sm text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
            />
          </div>
        </div>

        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value as 'all' | 'music' | 'podcast');
            setPage(1);
          }}
          className="px-4 py-2 bg-brand-card border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
        >
          <option value="all">Todos os tipos</option>
          <option value="music">Musicas</option>
          <option value="podcast">Podcasts</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setPage(1);
          }}
          className="px-4 py-2 bg-brand-card border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
        >
          <option value="">Todas categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="bg-brand-card border border-white/10 rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
          </div>
        ) : tracks.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma faixa encontrada</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-brand-dark/50 border-b border-white/10">
              <tr>
                <th className="px-4 py-3 text-left text-gray-400 text-sm uppercase">Faixa</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm uppercase">Tipo</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm uppercase">Categoria</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm uppercase">Duracao</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm uppercase">Plays</th>
                <th className="px-4 py-3 text-left text-gray-400 text-sm uppercase">Status</th>
                <th className="px-4 py-3 text-right text-gray-400 text-sm uppercase">Acoes</th>
              </tr>
            </thead>
            <tbody>
              {tracks.map((track) => (
                <tr key={track.id} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handlePlay(track)}
                        className="w-10 h-10 bg-brand-dark rounded-sm flex items-center justify-center hover:bg-brand-yellow/20 transition-colors"
                      >
                        {playingTrackId === track.id ? (
                          <Pause className="w-4 h-4 text-brand-yellow" />
                        ) : (
                          <Play className="w-4 h-4 text-white" />
                        )}
                      </button>
                      <div>
                        <p className="text-white font-medium">{track.title}</p>
                        {track.artist && <p className="text-gray-400 text-sm">{track.artist}</p>}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                        track.is_podcast
                          ? 'bg-purple-500/20 text-purple-400'
                          : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {track.is_podcast ? <Mic2 className="w-3 h-3" /> : <Music className="w-3 h-3" />}
                      {track.is_podcast ? 'Podcast' : 'Musica'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {track.category?.name || '-'}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">
                    {musicAdminService.formatDuration(track.duration_seconds)}
                  </td>
                  <td className="px-4 py-3 text-gray-400 text-sm">{track.play_count}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs ${
                        track.is_active
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {track.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleToggleActive(track)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title={track.is_active ? 'Desativar' : 'Ativar'}
                      >
                        {track.is_active ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => openEditModal(track)}
                        className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(track)}
                        className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-gray-400 text-sm">
            Mostrando {(page - 1) * LIMIT + 1} - {Math.min(page * LIMIT, total)} de {total}
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="p-2 bg-brand-card border border-white/10 rounded-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand-yellow/50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-gray-400 text-sm px-3">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="p-2 bg-brand-card border border-white/10 rounded-sm text-white disabled:opacity-50 disabled:cursor-not-allowed hover:border-brand-yellow/50 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-sm w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white uppercase">
                {editingTrack ? 'Editar Faixa' : 'Nova Faixa'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">Titulo *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData((f) => ({ ...f, title: e.target.value }))}
                  required
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm uppercase mb-2">Artista</label>
                  <input
                    type="text"
                    value={formData.artist}
                    onChange={(e) => setFormData((f) => ({ ...f, artist: e.target.value }))}
                    className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 text-sm uppercase mb-2">Album</label>
                  <input
                    type="text"
                    value={formData.album}
                    onChange={(e) => setFormData((f) => ({ ...f, album: e.target.value }))}
                    className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-gray-400 text-sm uppercase mb-2">Categoria</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData((f) => ({ ...f, category_id: e.target.value }))}
                    className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-gray-400 text-sm uppercase mb-2">Tipo</label>
                  <select
                    value={formData.is_podcast ? 'podcast' : 'music'}
                    onChange={(e) =>
                      setFormData((f) => ({ ...f, is_podcast: e.target.value === 'podcast' }))
                    }
                    className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                  >
                    <option value="music">Musica</option>
                    <option value="podcast">Podcast</option>
                  </select>
                </div>
              </div>

              {formData.is_podcast && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-400 text-sm uppercase mb-2">Materia</label>
                    <input
                      type="text"
                      value={formData.materia}
                      onChange={(e) => setFormData((f) => ({ ...f, materia: e.target.value }))}
                      className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm uppercase mb-2">Assunto</label>
                    <input
                      type="text"
                      value={formData.assunto}
                      onChange={(e) => setFormData((f) => ({ ...f, assunto: e.target.value }))}
                      className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">
                  Arquivo de Audio {!editingTrack && '*'}
                </label>
                <label className="flex items-center justify-center gap-2 px-4 py-6 bg-brand-dark border border-dashed border-white/20 rounded-sm cursor-pointer hover:border-brand-yellow/50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">
                    {audioFile ? audioFile.name : 'Clique para selecionar (MP3, WAV, OGG, M4A)'}
                  </span>
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
              </div>

              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">Capa (opcional)</label>
                <label className="flex items-center justify-center gap-2 px-4 py-6 bg-brand-dark border border-dashed border-white/20 rounded-sm cursor-pointer hover:border-brand-yellow/50 transition-colors">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-gray-400">
                    {coverFile ? coverFile.name : 'Clique para selecionar (JPG, PNG, WebP)'}
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                  />
                </label>
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
                  disabled={uploading}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-dark text-black font-bold uppercase text-sm rounded-sm transition-colors disabled:opacity-50"
                >
                  {uploading && <Loader2 className="w-4 h-4 animate-spin" />}
                  {uploading ? 'Enviando...' : editingTrack ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
