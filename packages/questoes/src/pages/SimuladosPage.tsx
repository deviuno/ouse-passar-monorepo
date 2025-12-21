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
      className={simulado.is_premium ? 'relative overflow-hidden' : ''}
    >
      {/* Premium Badge */}
      {simulado.is_premium && (
        <div className="absolute top-0 right-0 bg-[#FFB800] text-black text-xs font-bold px-3 py-1 rounded-bl-xl">
          PREMIUM
        </div>
      )}

      <div className="flex items-start gap-4">
        {/* Icon */}
        <div
          className={`
            w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0
            ${isCompleted ? 'bg-[#2ECC71]/20' : simulado.is_premium ? 'bg-[#FFB800]/20' : 'bg-[#3498DB]/20'}
          `}
        >
          {isCompleted ? (
            <CheckCircle size={24} className="text-[#2ECC71]" />
          ) : simulado.is_premium ? (
            <Lock size={24} className="text-[#FFB800]" />
          ) : (
            <FileText size={24} className="text-[#3498DB]" />
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="text-white font-medium mb-1 truncate">{simulado.nome}</h3>

          <div className="flex items-center gap-4 text-sm text-[#6E6E6E]">
            <div className="flex items-center gap-1">
              <Clock size={14} />
              <span>{formatDuration(simulado.duracao_minutos)}</span>
            </div>
            <div className="flex items-center gap-1">
              <FileText size={14} />
              <span>{simulado.total_questoes} questoes</span>
            </div>
          </div>

          {/* Completed Stats */}
          {isCompleted && score !== undefined && (
            <div className="flex items-center gap-4 mt-2">
              <div className="flex items-center gap-1">
                <span className="text-[#2ECC71] font-bold">{Math.round(score)}%</span>
                <span className="text-[#6E6E6E] text-sm">acerto</span>
              </div>
              {ranking && (
                <div className="flex items-center gap-1">
                  <Trophy size={14} className="text-[#FFB800]" />
                  <span className="text-[#A0A0A0] text-sm">#{ranking}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Action Button */}
        <div className="flex-shrink-0">
          {isCompleted ? (
            <button
              className="text-[#3498DB] text-sm hover:underline"
              onClick={(e) => {
                e.stopPropagation();
                onViewResult(simulado.id);
              }}
            >
              Ver Resultado
            </button>
          ) : simulado.is_premium ? (
            <Button size="sm" variant="secondary">
              Desbloquear
            </Button>
          ) : (
            <Button
              size="sm"
              leftIcon={<Play size={16} />}
              onClick={(e) => {
                e.stopPropagation();
                onStart(simulado.id);
              }}
            >
              Iniciar
            </Button>
          )}
        </div>
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
          <h2 className="text-lg font-semibold text-white mb-3">Disponiveis</h2>
          <StaggerContainer className="space-y-3">
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
          <StaggerContainer className="space-y-3">
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
          <StaggerContainer className="space-y-3">
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
