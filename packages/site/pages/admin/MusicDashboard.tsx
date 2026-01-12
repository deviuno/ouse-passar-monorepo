import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Music,
  Mic2,
  ListMusic,
  FolderOpen,
  Play,
  Heart,
  Loader2,
  ArrowRight,
  Settings,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import * as musicAdminService from '../../services/musicAdminService';

export const MusicDashboard: React.FC = () => {
  const toast = useToast();
  const { currentPreparatorio } = useAuth();
  const [stats, setStats] = useState<musicAdminService.MusicStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentPreparatorio?.id) {
      loadData();
    }
  }, [currentPreparatorio?.id]);

  const loadData = async () => {
    if (!currentPreparatorio?.id) return;

    setLoading(true);
    try {
      const statsData = await musicAdminService.getMusicStats(currentPreparatorio.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading music stats:', error);
      toast.error('Erro ao carregar estatisticas');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Music
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie musicas, podcasts e playlists do preparatorio
          </p>
        </div>
        <Link
          to="/admin/music/settings"
          className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-white/10 hover:border-brand-yellow/50 text-white font-bold uppercase text-sm rounded-sm transition-colors"
        >
          <Settings className="w-4 h-4" />
          Configuracoes
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6">
        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Musicas</p>
              <p className="text-3xl font-black text-white mt-1">{stats?.totalTracks || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-sm flex items-center justify-center">
              <Music className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Podcasts</p>
              <p className="text-3xl font-black text-white mt-1">{stats?.totalPodcasts || 0}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-sm flex items-center justify-center">
              <Mic2 className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Playlists</p>
              <p className="text-3xl font-black text-white mt-1">{stats?.totalPlaylists || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-sm flex items-center justify-center">
              <ListMusic className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Categorias</p>
              <p className="text-3xl font-black text-white mt-1">{stats?.totalCategories || 0}</p>
            </div>
            <div className="w-12 h-12 bg-orange-500/20 rounded-sm flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-orange-500" />
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Reproducoes</p>
              <p className="text-3xl font-black text-white mt-1">{stats?.totalPlays || 0}</p>
            </div>
            <div className="w-12 h-12 bg-brand-yellow/20 rounded-sm flex items-center justify-center">
              <Play className="w-6 h-6 text-brand-yellow" />
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Favoritos</p>
              <p className="text-3xl font-black text-white mt-1">{stats?.totalFavorites || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-500/20 rounded-sm flex items-center justify-center">
              <Heart className="w-6 h-6 text-red-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Link
          to="/admin/music/tracks"
          className="bg-brand-card border border-white/10 rounded-sm p-6 hover:border-brand-yellow/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-sm flex items-center justify-center">
                <Music className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-white font-bold">Faixas</h3>
                <p className="text-gray-400 text-sm">
                  {(stats?.totalTracks || 0) + (stats?.totalPodcasts || 0)} faixas
                </p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-yellow transition-colors" />
          </div>
        </Link>

        <Link
          to="/admin/music/playlists"
          className="bg-brand-card border border-white/10 rounded-sm p-6 hover:border-brand-yellow/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-sm flex items-center justify-center">
                <ListMusic className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-white font-bold">Playlists</h3>
                <p className="text-gray-400 text-sm">{stats?.totalPlaylists || 0} playlists</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-yellow transition-colors" />
          </div>
        </Link>

        <Link
          to="/admin/music/categories"
          className="bg-brand-card border border-white/10 rounded-sm p-6 hover:border-brand-yellow/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-sm flex items-center justify-center">
                <FolderOpen className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-white font-bold">Categorias</h3>
                <p className="text-gray-400 text-sm">{stats?.totalCategories || 0} categorias</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-yellow transition-colors" />
          </div>
        </Link>

        <Link
          to="/admin/music/settings"
          className="bg-brand-card border border-white/10 rounded-sm p-6 hover:border-brand-yellow/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-gray-500/20 rounded-sm flex items-center justify-center">
                <Settings className="w-6 h-6 text-gray-500" />
              </div>
              <div>
                <h3 className="text-white font-bold">Configuracoes</h3>
                <p className="text-gray-400 text-sm">Modulo e cobranca</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-yellow transition-colors" />
          </div>
        </Link>
      </div>

      {/* Info Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Getting Started */}
        <div className="bg-brand-card border border-white/10 rounded-sm">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white uppercase">Primeiros Passos</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="flex items-start gap-4 p-4 bg-brand-dark/50 border border-white/5 rounded-sm">
              <div className="w-8 h-8 bg-blue-500/20 rounded-sm flex items-center justify-center text-blue-500 font-bold">
                1
              </div>
              <div>
                <h4 className="text-white font-bold">Crie Categorias</h4>
                <p className="text-gray-400 text-sm">
                  Organize suas faixas em categorias como Relaxamento, Foco, Motivacao, etc.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-brand-dark/50 border border-white/5 rounded-sm">
              <div className="w-8 h-8 bg-green-500/20 rounded-sm flex items-center justify-center text-green-500 font-bold">
                2
              </div>
              <div>
                <h4 className="text-white font-bold">Faca Upload de Faixas</h4>
                <p className="text-gray-400 text-sm">
                  Adicione musicas e podcasts. Formatos suportados: MP3, WAV, OGG, M4A.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-4 p-4 bg-brand-dark/50 border border-white/5 rounded-sm">
              <div className="w-8 h-8 bg-purple-500/20 rounded-sm flex items-center justify-center text-purple-500 font-bold">
                3
              </div>
              <div>
                <h4 className="text-white font-bold">Monte Playlists</h4>
                <p className="text-gray-400 text-sm">
                  Crie playlists tematicas para seus alunos, como "Estudos Noturno" ou "Revisao Intensiva".
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Tips */}
        <div className="bg-brand-card border border-white/10 rounded-sm">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-bold text-white uppercase">Dicas</h2>
          </div>
          <div className="p-6 space-y-4">
            <div className="p-4 bg-brand-yellow/10 border border-brand-yellow/30 rounded-sm">
              <h4 className="text-brand-yellow font-bold mb-2">Podcasts das Aulas</h4>
              <p className="text-gray-300 text-sm">
                Os podcasts gerados automaticamente das aulas do EAD aparecerao automaticamente no modulo Music,
                agrupados por materia.
              </p>
            </div>
            <div className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-sm">
              <h4 className="text-blue-400 font-bold mb-2">Capas de Alta Qualidade</h4>
              <p className="text-gray-300 text-sm">
                Use imagens de 500x500 pixels para as capas. Formatos aceitos: JPG, PNG, WebP.
              </p>
            </div>
            <div className="p-4 bg-green-500/10 border border-green-500/30 rounded-sm">
              <h4 className="text-green-400 font-bold mb-2">Playlists Automaticas</h4>
              <p className="text-gray-300 text-sm">
                Crie playlists com filtro automatico para adicionar novas faixas de uma categoria automaticamente.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
