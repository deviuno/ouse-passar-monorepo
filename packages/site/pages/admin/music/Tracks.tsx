import React, { useState, useEffect, useRef } from 'react';
import {
  Music,
  Plus,
  Search,
  Loader2,
  Play,
  Pause,
  Upload,
  X,
  Edit2,
  Trash2,
  Mic,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import { musicAdminService, type MusicTrack, type MusicCategory } from '../../../services/musicAdminService';

export const MusicTracks: React.FC = () => {
  console.log('[MusicTracks] ========== COMPONENTE MONTADO ==========');

  const [loading, setLoading] = useState(true);
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [categories, setCategories] = useState<MusicCategory[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'music' | 'podcast'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [showModal, setShowModal] = useState(false);
  const [editingTrack, setEditingTrack] = useState<MusicTrack | null>(null);
  const [saving, setSaving] = useState(false);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Form state
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
  const [uploadProgress, setUploadProgress] = useState(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('[MusicTracks] loadData chamado');
    setLoading(true);
    try {
      console.log('[MusicTracks] Chamando getTracks e getCategories...');
      const [tracksData, categoriesData] = await Promise.all([
        musicAdminService.getTracks(), // Sem filtro de preparatorio
        musicAdminService.getCategories(), // Sem filtro de preparatorio
      ]);
      console.log('[MusicTracks] Dados recebidos:', { tracksCount: tracksData.length, categoriesCount: categoriesData.length });
      setTracks(tracksData);
      setCategories(categoriesData);
    } catch (error) {
      console.error('[MusicTracks] ERRO ao carregar dados:', error);
    } finally {
      setLoading(false);
      console.log('[MusicTracks] loadData finalizado');
    }
  };

  const handlePlay = (track: MusicTrack) => {
    if (playingId === track.id) {
      audioRef.current?.pause();
      setPlayingId(null);
    } else {
      if (audioRef.current) {
        audioRef.current.src = track.audio_url;
        audioRef.current.play();
      }
      setPlayingId(track.id);
    }
  };

  const handleOpenModal = (track?: MusicTrack) => {
    if (track) {
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
    } else {
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
    }
    setAudioFile(null);
    setCoverFile(null);
    setUploadProgress(0);
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      let audioUrl = editingTrack?.audio_url;
      let coverUrl = editingTrack?.cover_url;
      let duration = editingTrack?.duration_seconds || 0;

      // Upload audio if new file
      if (audioFile) {
        setUploadProgress(10);
        const result = await musicAdminService.uploadAudioFile(audioFile);
        audioUrl = result.url;
        duration = result.duration;
        setUploadProgress(50);
      }

      // Upload cover if new file
      if (coverFile) {
        coverUrl = await musicAdminService.uploadCoverImage(coverFile);
        setUploadProgress(75);
      }

      if (editingTrack) {
        // Update existing track
        await musicAdminService.updateTrack(editingTrack.id, {
          ...formData,
          audio_url: audioUrl,
          cover_url: coverUrl,
          duration_seconds: duration,
        });
      } else {
        // Create new track
        if (!audioUrl) {
          alert('Por favor, selecione um arquivo de audio.');
          setSaving(false);
          return;
        }

        await musicAdminService.createTrack(undefined, {
          ...formData,
          audio_url: audioUrl,
          cover_url: coverUrl,
          duration_seconds: duration,
        });
      }

      setUploadProgress(100);
      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving track:', error);
      alert('Erro ao salvar faixa. Tente novamente.');
    } finally {
      setSaving(false);
      setUploadProgress(0);
    }
  };

  const handleDelete = async (track: MusicTrack) => {
    if (!confirm(`Tem certeza que deseja excluir "${track.title}"?`)) return;

    try {
      await musicAdminService.deleteTrack(track.id);
      loadData();
    } catch (error) {
      console.error('Error deleting track:', error);
      alert('Erro ao excluir faixa.');
    }
  };

  const handleToggleActive = async (track: MusicTrack) => {
    try {
      await musicAdminService.updateTrack(track.id, {
        is_active: !track.is_active,
      });
      // Update local state immediately for better UX
      setTracks(tracks.map(t =>
        t.id === track.id ? { ...t, is_active: !t.is_active } : t
      ));
    } catch (error) {
      console.error('Error toggling track status:', error);
      alert('Erro ao alterar status da faixa.');
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter tracks
  const filteredTracks = tracks.filter((track) => {
    const matchesSearch =
      track.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (track.artist?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);

    const matchesType =
      filterType === 'all' ||
      (filterType === 'podcast' && track.is_podcast) ||
      (filterType === 'music' && !track.is_podcast);

    const matchesCategory = !filterCategory || track.category_id === filterCategory;

    return matchesSearch && matchesType && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Hidden audio element */}
      <audio ref={audioRef} onEnded={() => setPlayingId(null)} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Faixas
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie as faixas de audio do modulo Music
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-brand-darker font-bold rounded-lg hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Faixa
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar faixas..."
            className="w-full pl-10 pr-4 py-2 bg-brand-card border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
          />
        </div>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as 'all' | 'music' | 'podcast')}
          className="px-4 py-2 bg-brand-card border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-yellow/50"
        >
          <option value="all">Todos os tipos</option>
          <option value="music">Musicas</option>
          <option value="podcast">Podcasts</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="px-4 py-2 bg-brand-card border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-yellow/50"
        >
          <option value="">Todas as categorias</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Tracks List */}
      <div className="bg-brand-card border border-white/5 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 text-xs uppercase font-bold px-4 py-3 w-12"></th>
              <th className="text-left text-gray-400 text-xs uppercase font-bold px-4 py-3">
                Titulo
              </th>
              <th className="text-left text-gray-400 text-xs uppercase font-bold px-4 py-3 hidden md:table-cell">
                Categoria
              </th>
              <th className="text-left text-gray-400 text-xs uppercase font-bold px-4 py-3 hidden lg:table-cell">
                Duracao
              </th>
              <th className="text-left text-gray-400 text-xs uppercase font-bold px-4 py-3 hidden lg:table-cell">
                Plays
              </th>
              <th className="text-center text-gray-400 text-xs uppercase font-bold px-4 py-3">
                Status
              </th>
              <th className="text-right text-gray-400 text-xs uppercase font-bold px-4 py-3">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredTracks.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-400">
                  <Music className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma faixa encontrada</p>
                </td>
              </tr>
            ) : (
              filteredTracks.map((track) => (
                <tr
                  key={track.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handlePlay(track)}
                      className="w-8 h-8 bg-brand-yellow rounded-full flex items-center justify-center hover:scale-110 transition-transform"
                    >
                      {playingId === track.id ? (
                        <Pause className="w-4 h-4 text-brand-darker" />
                      ) : (
                        <Play className="w-4 h-4 text-brand-darker ml-0.5" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-dark rounded overflow-hidden flex-shrink-0">
                        {track.cover_url ? (
                          <img
                            src={track.cover_url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            {track.is_podcast ? (
                              <Mic className="text-gray-500" style={{ width: '1.5rem', height: '1.5rem' }} />
                            ) : (
                              <Music className="w-4 h-4 text-gray-500" />
                            )}
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-white font-medium">{track.title}</p>
                        <p className="text-gray-400 text-sm">
                          {track.artist || (track.is_podcast ? 'Podcast' : 'Artista desconhecido')}
                        </p>
                      </div>
                      {track.is_podcast && (
                        <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded-full">
                          Podcast
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-gray-400">
                      {categories.find((c) => c.id === track.category_id)?.name || '-'}
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-gray-400">{formatDuration(track.duration_seconds)}</span>
                  </td>
                  <td className="px-4 py-3 hidden lg:table-cell">
                    <span className="text-gray-400">{track.play_count.toLocaleString()}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggleActive(track)}
                      className={`transition-colors ${track.is_active ? 'text-green-400 hover:text-green-300' : 'text-gray-500 hover:text-gray-400'}`}
                      title={track.is_active ? 'Ativo - Clique para desativar' : 'Inativo - Clique para ativar'}
                    >
                      {track.is_active ? (
                        <ToggleRight className="w-8 h-8" />
                      ) : (
                        <ToggleLeft className="w-8 h-8" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleOpenModal(track)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(track)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {editingTrack ? 'Editar Faixa' : 'Nova Faixa'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Audio Upload */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">
                  Arquivo de Audio {!editingTrack && '*'}
                </label>
                <div className="relative">
                  <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setAudioFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="audio-upload"
                  />
                  <label
                    htmlFor="audio-upload"
                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-brand-yellow/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <Upload className="w-5 h-5" />
                    {audioFile ? audioFile.name : editingTrack ? 'Substituir audio' : 'Selecionar arquivo'}
                  </label>
                </div>
              </div>

              {/* Cover Upload */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Imagem de Capa</label>
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="cover-upload"
                  />
                  <label
                    htmlFor="cover-upload"
                    className="flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-white/20 rounded-lg text-gray-400 hover:border-brand-yellow/50 hover:text-white transition-colors cursor-pointer"
                  >
                    <Upload className="w-5 h-5" />
                    {coverFile ? coverFile.name : editingTrack?.cover_url ? 'Substituir capa' : 'Selecionar imagem'}
                  </label>
                </div>
              </div>

              {/* Title */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Titulo *</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
                  placeholder="Nome da faixa"
                />
              </div>

              {/* Artist */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Artista</label>
                <input
                  type="text"
                  value={formData.artist}
                  onChange={(e) => setFormData({ ...formData, artist: e.target.value })}
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
                  placeholder="Nome do artista"
                />
              </div>

              {/* Category */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Categoria</label>
                <select
                  value={formData.category_id}
                  onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-yellow/50"
                >
                  <option value="">Sem categoria</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Is Podcast */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="is_podcast"
                  checked={formData.is_podcast}
                  onChange={(e) => setFormData({ ...formData, is_podcast: e.target.checked })}
                  className="w-4 h-4 rounded border-white/10 bg-brand-dark text-brand-yellow focus:ring-brand-yellow"
                />
                <label htmlFor="is_podcast" className="text-gray-400">
                  Esta faixa e um podcast
                </label>
              </div>

              {/* Podcast fields */}
              {formData.is_podcast && (
                <>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Materia</label>
                    <input
                      type="text"
                      value={formData.materia}
                      onChange={(e) => setFormData({ ...formData, materia: e.target.value })}
                      className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
                      placeholder="Ex: Direito Constitucional"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-400 text-sm mb-2">Assunto</label>
                    <input
                      type="text"
                      value={formData.assunto}
                      onChange={(e) => setFormData({ ...formData, assunto: e.target.value })}
                      className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
                      placeholder="Ex: Principios Fundamentais"
                    />
                  </div>
                </>
              )}

              {/* Progress */}
              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="w-full bg-brand-dark rounded-full h-2">
                  <div
                    className="bg-brand-yellow h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
              )}

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
                  {saving ? 'Salvando...' : editingTrack ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicTracks;
