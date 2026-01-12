import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Music, ListMusic, FolderOpen, Play, Heart, Settings, Loader2, ArrowRight, ChevronDown } from 'lucide-react';
import { musicAdminService, type MusicStats } from '../../../services/musicAdminService';
import { useMusicPreparatorio } from '../../../hooks/useMusicPreparatorio';

export const MusicDashboard: React.FC = () => {
  const { preparatorios, selectedId, selectedPreparatorio, selectPreparatorio, loading: loadingPrep } = useMusicPreparatorio();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<MusicStats | null>(null);
  const [showSelector, setShowSelector] = useState(false);

  useEffect(() => {
    if (selectedId) {
      loadStats();
    }
  }, [selectedId]);

  const loadStats = async () => {
    if (!selectedId) return;

    setLoading(true);
    try {
      const data = await musicAdminService.getStats(selectedId);
      setStats(data);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loadingPrep) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  if (preparatorios.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <p className="text-gray-400">Nenhum preparatorio encontrado.</p>
        </div>
      </div>
    );
  }

  const statCards = [
    {
      label: 'Total de Faixas',
      value: stats?.totalTracks || 0,
      icon: Music,
      color: 'bg-blue-500',
      link: '/admin/music/tracks',
    },
    {
      label: 'Podcasts',
      value: stats?.totalPodcasts || 0,
      icon: Music,
      color: 'bg-purple-500',
      link: '/admin/music/tracks',
    },
    {
      label: 'Playlists',
      value: stats?.totalPlaylists || 0,
      icon: ListMusic,
      color: 'bg-green-500',
      link: '/admin/music/playlists',
    },
    {
      label: 'Categorias',
      value: stats?.totalCategories || 0,
      icon: FolderOpen,
      color: 'bg-orange-500',
      link: '/admin/music/categorias',
    },
    {
      label: 'Total de Plays',
      value: stats?.totalPlays || 0,
      icon: Play,
      color: 'bg-pink-500',
      link: null,
    },
    {
      label: 'Total de Favoritos',
      value: stats?.totalFavorites || 0,
      icon: Heart,
      color: 'bg-red-500',
      link: null,
    },
  ];

  const quickLinks = [
    { label: 'Adicionar Faixa', path: '/admin/music/tracks', icon: Music },
    { label: 'Criar Playlist', path: '/admin/music/playlists', icon: ListMusic },
    { label: 'Nova Categoria', path: '/admin/music/categorias', icon: FolderOpen },
    { label: 'Configuracoes', path: '/admin/music/configuracoes', icon: Settings },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Ouse Music
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie faixas, playlists e podcasts
          </p>
        </div>

        {/* Preparatorio Selector */}
        <div className="relative">
          <button
            onClick={() => setShowSelector(!showSelector)}
            className="flex items-center gap-2 bg-brand-card border border-white/10 rounded-lg px-4 py-2 hover:border-brand-yellow/30 transition-colors"
          >
            <span className="text-gray-400 text-sm">Preparatorio:</span>
            <span className="text-white font-medium truncate max-w-[200px]">
              {selectedPreparatorio?.nome || 'Selecionar'}
            </span>
            <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showSelector ? 'rotate-180' : ''}`} />
          </button>

          {showSelector && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setShowSelector(false)} />
              <div className="absolute right-0 top-full mt-2 w-72 bg-brand-card border border-white/10 rounded-lg shadow-xl z-20 max-h-80 overflow-y-auto">
                {preparatorios.map((prep) => (
                  <button
                    key={prep.id}
                    onClick={() => {
                      selectPreparatorio(prep.id);
                      setShowSelector(false);
                    }}
                    className={`w-full text-left px-4 py-3 hover:bg-white/5 transition-colors ${
                      prep.id === selectedId ? 'bg-brand-yellow/10 text-brand-yellow' : 'text-white'
                    }`}
                  >
                    {prep.nome}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      {loading ? (
        <div className="flex items-center justify-center h-32">
          <Loader2 className="w-6 h-6 text-brand-yellow animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            const content = (
              <div
                className={`bg-brand-card border border-white/5 rounded-lg p-4 ${stat.link ? 'hover:border-brand-yellow/30 transition-colors cursor-pointer' : ''}`}
              >
                <div className={`w-10 h-10 ${stat.color} rounded-lg flex items-center justify-center mb-3`}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
                <p className="text-2xl font-bold text-white">{stat.value.toLocaleString()}</p>
                <p className="text-gray-400 text-sm">{stat.label}</p>
              </div>
            );

            return stat.link ? (
              <Link key={stat.label} to={stat.link}>
                {content}
              </Link>
            ) : (
              <div key={stat.label}>{content}</div>
            );
          })}
        </div>
      )}

      {/* Quick Links */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Acoes Rapidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {quickLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.path}
                to={link.path}
                className="bg-brand-card border border-white/5 rounded-lg p-4 hover:border-brand-yellow/30 transition-colors group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Icon className="w-5 h-5 text-brand-yellow" />
                    <span className="text-white font-medium">{link.label}</span>
                  </div>
                  <ArrowRight className="w-4 h-4 text-gray-500 group-hover:text-brand-yellow transition-colors" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-brand-card border border-white/5 rounded-lg p-6">
        <h3 className="text-lg font-bold text-white mb-2">Como funciona?</h3>
        <div className="text-gray-400 space-y-2">
          <p>
            1. <strong className="text-white">Crie categorias</strong> para organizar seu conteudo (ex: Musicas de Estudo, Podcasts de Revisao)
          </p>
          <p>
            2. <strong className="text-white">Faca upload das faixas</strong> de audio (MP3, WAV, OGG, M4A)
          </p>
          <p>
            3. <strong className="text-white">Crie playlists publicas</strong> para seus alunos
          </p>
          <p>
            4. <strong className="text-white">Configure o modulo</strong> nas configuracoes (gratuito, pago, ou incluso no plano)
          </p>
        </div>
      </div>
    </div>
  );
};

export default MusicDashboard;
