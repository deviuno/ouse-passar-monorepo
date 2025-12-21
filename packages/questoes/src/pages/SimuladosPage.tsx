import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, FileText, Trophy, Lock, Play, CheckCircle, Loader2, Package } from 'lucide-react';
import { Card, Button, StaggerContainer, StaggerItem } from '../components/ui';
import { useAuthStore } from '../stores';
import {
  getSimuladosWithUserData,
  getUserSimuladoStats,
  SimuladoWithUserData,
} from '../services/simuladosService';

function SimuladoCard({
  simulado,
  onStart,
  onViewResult,
}: {
  simulado: SimuladoWithUserData;
  onStart: (id: string) => void;
  onViewResult: (id: string) => void;
}) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;
  };

  const isCompleted = simulado.isCompleted;
  const score = simulado.userResult?.score;
  const ranking = simulado.userResult?.ranking_position;

  // Get cover image from preparatorio
  const coverImage = simulado.preparatorio?.logo_url || simulado.preparatorio?.imagem_capa;

  return (
    <Card
      hoverable
      onClick={() => {
        if (isCompleted) {
          onViewResult(simulado.id);
        } else if (!simulado.is_premium) {
          onStart(simulado.id);
        }
      }}
      className="relative overflow-hidden h-full"
    >
      {/* Cover Image */}
      <div className="relative w-full aspect-[16/10] rounded-xl overflow-hidden mb-3 bg-[#3A3A3A]">
        {coverImage ? (
          <img
            src={coverImage}
            alt={simulado.preparatorio?.nome || simulado.nome}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#3498DB]/30 to-[#8B5CF6]/30">
            <FileText size={40} className="text-white/50" />
          </div>
        )}

        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

        {/* Premium Badge */}
        {simulado.is_premium && (
          <div className="absolute top-2 right-2 bg-[#FFB800] text-black text-xs font-bold px-2 py-0.5 rounded-full">
            PREMIUM
          </div>
        )}

        {/* Completed Badge */}
        {isCompleted && (
          <div className="absolute top-2 left-2 bg-[#2ECC71] text-white text-xs font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
            <CheckCircle size={12} />
            Realizado
          </div>
        )}

        {/* Score overlay for completed */}
        {isCompleted && score !== undefined && (
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
            <div className="bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
              <span className="text-[#2ECC71] font-bold text-sm">{Math.round(score)}%</span>
            </div>
            {ranking && (
              <div className="bg-black/70 rounded-full px-2 py-1 flex items-center gap-1">
                <Trophy size={12} className="text-[#FFB800]" />
                <span className="text-white text-sm">#{ranking}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-col flex-1">
        {/* Preparatorio name */}
        {simulado.preparatorio?.nome && (
          <p className="text-[#6E6E6E] text-xs mb-1 truncate">{simulado.preparatorio.nome}</p>
        )}

        <h3 className="text-white font-medium text-sm mb-2 line-clamp-2">{simulado.nome}</h3>

        <div className="flex items-center gap-3 text-xs text-[#6E6E6E] mt-auto">
          <div className="flex items-center gap-1">
            <Clock size={12} />
            <span>{formatDuration(simulado.duracao_minutos)}</span>
          </div>
          <div className="flex items-center gap-1">
            <FileText size={12} />
            <span>{simulado.total_questoes}q</span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className="mt-3 pt-3 border-t border-[#3A3A3A]">
        {isCompleted ? (
          <Button
            size="sm"
            variant="ghost"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              onViewResult(simulado.id);
            }}
          >
            Ver Resultado
          </Button>
        ) : simulado.is_premium ? (
          <Button size="sm" variant="secondary" fullWidth leftIcon={<Lock size={14} />}>
            Desbloquear
          </Button>
        ) : (
          <Button
            size="sm"
            fullWidth
            leftIcon={<Play size={14} />}
            onClick={(e) => {
              e.stopPropagation();
              onStart(simulado.id);
            }}
          >
            Iniciar
          </Button>
        )}
      </div>
    </Card>
  );
}

export default function SimuladosPage() {
  const { profile } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [simulados, setSimulados] = useState<SimuladoWithUserData[]>([]);
  const [stats, setStats] = useState({
    totalCompleted: 0,
    averageScore: 0,
    bestRanking: null as number | null,
  });

  useEffect(() => {
    if (profile?.id) {
      loadData();
    }
  }, [profile?.id]);

  const loadData = async () => {
    if (!profile?.id) return;

    setLoading(true);
    try {
      const [simuladosData, statsData] = await Promise.all([
        getSimuladosWithUserData(profile.id),
        getUserSimuladoStats(profile.id),
      ]);

      setSimulados(simuladosData);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading simulados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStart = (simuladoId: string) => {
    // TODO: Navigate to simulado execution page
    console.log('Start simulado:', simuladoId);
  };

  const handleViewResult = (simuladoId: string) => {
    // TODO: Navigate to result page
    console.log('View result:', simuladoId);
  };

  const completedSimulados = simulados.filter((s) => s.isCompleted);
  const availableSimulados = simulados.filter((s) => !s.isCompleted && !s.is_premium);
  const premiumSimulados = simulados.filter((s) => s.is_premium && !s.isCompleted);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white mb-2">Meus Simulados</h1>
        <p className="text-[#A0A0A0]">
          Simule a prova real com cronometro e ranking
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <Card className="text-center">
          <p className="text-2xl font-bold text-white">{stats.totalCompleted}</p>
          <p className="text-[#6E6E6E] text-xs">Realizados</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[#2ECC71]">
            {stats.averageScore}%
          </p>
          <p className="text-[#6E6E6E] text-xs">Media Geral</p>
        </Card>
        <Card className="text-center">
          <p className="text-2xl font-bold text-[#FFB800]">
            {stats.bestRanking ? `#${stats.bestRanking}` : '-'}
          </p>
          <p className="text-[#6E6E6E] text-xs">Melhor Ranking</p>
        </Card>
      </div>

      {/* Empty State */}
      {simulados.length === 0 && (
        <div className="text-center py-12 text-[#6E6E6E]">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="mb-2">Nenhum simulado disponivel</p>
          <p className="text-sm">Novos simulados serao adicionados em breve!</p>
        </div>
      )}

      {/* Available Simulados */}
      {availableSimulados.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Disponíveis</h2>
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {availableSimulados.map((simulado) => (
              <StaggerItem key={simulado.id}>
                <SimuladoCard
                  simulado={simulado}
                  onStart={handleStart}
                  onViewResult={handleViewResult}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}

      {/* Completed Simulados */}
      {completedSimulados.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3">Realizados</h2>
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {completedSimulados.map((simulado) => (
              <StaggerItem key={simulado.id}>
                <SimuladoCard
                  simulado={simulado}
                  onStart={handleStart}
                  onViewResult={handleViewResult}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}

      {/* Premium Simulados */}
      {premiumSimulados.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
            Premium
            <span className="text-[#FFB800]">✨</span>
          </h2>
          <StaggerContainer className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {premiumSimulados.map((simulado) => (
              <StaggerItem key={simulado.id}>
                <SimuladoCard
                  simulado={simulado}
                  onStart={handleStart}
                  onViewResult={handleViewResult}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      )}
    </div>
  );
}
