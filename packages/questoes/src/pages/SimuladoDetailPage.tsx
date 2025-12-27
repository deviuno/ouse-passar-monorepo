import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ChevronLeft,
  Clock,
  FileText,
  Trophy,
  Play,
  CheckCircle,
  Loader2,
  Lock,
  BarChart2,
  Calendar,
  AlertCircle,
} from 'lucide-react';
import { Card, Button, CircularProgress } from '../components/ui';
import { useAuthStore } from '../stores';
import {
  getSimuladoWithDetails,
  SimuladoWithUserData,
  ProvaStatus,
} from '../services/simuladosService';
import { getOptimizedImageUrl } from '../utils/image';

function ProvaCard({
  prova,
  simulado,
  onStart,
  onContinue,
  onViewResult,
}: {
  prova: ProvaStatus;
  simulado: SimuladoWithUserData;
  onStart: (variationIndex: number) => void;
  onContinue: (attemptId: string) => void;
  onViewResult: (prova: ProvaStatus) => void;
}) {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-[#1A1A1A] rounded-2xl border border-[#2A2A2A] overflow-hidden"
    >
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                prova.isCompleted
                  ? 'bg-[#2ECC71]/20'
                  : prova.isInProgress
                  ? 'bg-[#FFB800]/20'
                  : 'bg-[#3A3A3A]'
              }`}
            >
              {prova.isCompleted ? (
                <CheckCircle size={24} className="text-[#2ECC71]" />
              ) : prova.isInProgress ? (
                <Clock size={24} className="text-[#FFB800]" />
              ) : (
                <FileText size={24} className="text-[#6E6E6E]" />
              )}
            </div>
            <div>
              <h3 className="text-white font-medium">{prova.label}</h3>
              <div className="flex items-center gap-2 text-[#6E6E6E] text-sm">
                <Clock size={12} />
                <span>{formatDuration(simulado.duracao_minutos)}</span>
                <span className="text-[#3A3A3A]">|</span>
                <FileText size={12} />
                <span>{simulado.total_questoes} questões</span>
              </div>
            </div>
          </div>

          {/* Score badge for completed */}
          {prova.isCompleted && prova.result && (
            <div className="text-right">
              <div
                className={`text-2xl font-bold ${
                  prova.result.score >= 70
                    ? 'text-[#2ECC71]'
                    : prova.result.score >= 50
                    ? 'text-[#FFB800]'
                    : 'text-[#E74C3C]'
                }`}
              >
                {Math.round(prova.result.score)}%
              </div>
              {prova.result.ranking_position && (
                <div className="flex items-center gap-1 text-[#FFB800] text-sm">
                  <Trophy size={12} />
                  <span>#{prova.result.ranking_position}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Status info */}
        {prova.isInProgress && prova.attempt && (
          <div className="bg-[#FFB800]/10 rounded-lg p-3 mb-3 flex items-center gap-2">
            <AlertCircle size={16} className="text-[#FFB800]" />
            <span className="text-[#FFB800] text-sm">
              Prova em andamento - {prova.attempt.current_index + 1}/{simulado.total_questoes} questões
            </span>
          </div>
        )}

        {prova.isCompleted && prova.result && (
          <div className="flex items-center gap-4 text-[#6E6E6E] text-sm mb-3">
            <div className="flex items-center gap-1">
              <Calendar size={12} />
              <span>Realizado em {formatDate(prova.result.completed_at)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Clock size={12} />
              <span>{Math.floor(prova.result.tempo_gasto / 60)}min</span>
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-2">
          {prova.isInProgress && prova.attempt ? (
            <>
              <Button
                size="sm"
                className="flex-1"
                onClick={() => onContinue(prova.attempt!.id)}
              >
                <Play size={16} className="mr-1" />
                Continuar
              </Button>
              <Button
                size="sm"
                variant="secondary"
                onClick={() => onViewResult(prova)}
              >
                Abandonar
              </Button>
            </>
          ) : prova.isCompleted ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                className="flex-1"
                onClick={() => onViewResult(prova)}
              >
                <BarChart2 size={16} className="mr-1" />
                Ver Resultado
              </Button>
              <Button
                size="sm"
                onClick={() => onStart(prova.variationIndex)}
              >
                Refazer
              </Button>
            </>
          ) : (
            <Button
              size="sm"
              className="flex-1"
              onClick={() => onStart(prova.variationIndex)}
            >
              <Play size={16} className="mr-1" />
              Iniciar Prova
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default function SimuladoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { profile } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [simulado, setSimulado] = useState<SimuladoWithUserData | null>(null);
  const [provas, setProvas] = useState<ProvaStatus[]>([]);
  const [stats, setStats] = useState({ completed: 0, total: 0, averageScore: 0 });
  const [settings, setSettings] = useState({ different_exams_per_user: 3, questions_per_simulado: 120, time_limit_minutes: 180 });

  useEffect(() => {
    if (profile?.id && id) {
      loadSimuladoDetails();
    }
  }, [profile?.id, id]);

  const loadSimuladoDetails = async () => {
    if (!profile?.id || !id) return;

    setLoading(true);
    try {
      const data = await getSimuladoWithDetails(profile.id, id);
      setSimulado(data.simulado);
      setProvas(data.provas);
      setStats(data.stats);
      setSettings(data.settings);
    } catch (error) {
      console.error('Error loading simulado details:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProva = (variationIndex: number) => {
    // TODO: Implement start prova flow
    console.log('Starting prova', variationIndex);
    // navigate(`/simulados/${id}/prova/${variationIndex}`);
  };

  const handleContinueProva = (attemptId: string) => {
    // TODO: Implement continue prova flow
    console.log('Continuing attempt', attemptId);
    // navigate(`/simulados/${id}/attempt/${attemptId}`);
  };

  const handleViewResult = (prova: ProvaStatus) => {
    // TODO: Implement view result flow
    console.log('Viewing result', prova);
    // navigate(`/simulados/${id}/resultado/${prova.variationIndex}`);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h${mins > 0 ? ` ${mins}min` : ''}` : `${mins}min`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  if (!simulado) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-4 text-center">
        <AlertCircle size={48} className="text-[#E74C3C] mb-4" />
        <h2 className="text-xl font-bold text-white mb-2">Simulado não encontrado</h2>
        <p className="text-[#6E6E6E] mb-4">
          O simulado que você está procurando não existe ou foi removido.
        </p>
        <Button onClick={() => navigate('/simulados')}>
          Voltar para Simulados
        </Button>
      </div>
    );
  }

  const coverImage = getOptimizedImageUrl(
    simulado.preparatorio?.logo_url || simulado.preparatorio?.imagem_capa,
    600
  );
  const progressPercent = stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-full pb-24">
      {/* Header with back button */}
      <div className="sticky top-0 bg-[#121212] z-30 border-b border-[#2A2A2A]">
        <div className="flex items-center gap-4 p-4">
          <button
            onClick={() => navigate('/simulados')}
            className="p-2 rounded-full hover:bg-[#252525] transition-colors"
          >
            <ChevronLeft size={24} className="text-white" />
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-bold text-white truncate">{simulado.nome}</h1>
            {simulado.preparatorio?.nome && (
              <p className="text-[#6E6E6E] text-sm truncate">{simulado.preparatorio.nome}</p>
            )}
          </div>
        </div>
      </div>

      {/* Hero section */}
      <div className="relative">
        {coverImage && (
          <div className="h-40 overflow-hidden">
            <img
              src={coverImage}
              alt={simulado.nome}
              className="w-full h-full object-cover opacity-40"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/80 to-transparent" />
          </div>
        )}

        <div className={`px-4 ${coverImage ? '-mt-20 relative z-10' : 'pt-4'}`}>
          {/* Stats cards */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <Card className="text-center">
              <CircularProgress
                value={progressPercent}
                size={56}
                strokeWidth={4}
                color="brand"
              />
              <p className="text-[#6E6E6E] text-xs mt-2">Progresso</p>
            </Card>
            <Card className="text-center">
              <p className="text-2xl font-bold text-white">{stats.completed}/{stats.total}</p>
              <p className="text-[#6E6E6E] text-xs">Provas feitas</p>
            </Card>
            <Card className="text-center">
              <p className={`text-2xl font-bold ${
                stats.averageScore >= 70
                  ? 'text-[#2ECC71]'
                  : stats.averageScore >= 50
                  ? 'text-[#FFB800]'
                  : stats.averageScore > 0
                  ? 'text-[#E74C3C]'
                  : 'text-[#6E6E6E]'
              }`}>
                {stats.averageScore > 0 ? `${stats.averageScore}%` : '-'}
              </p>
              <p className="text-[#6E6E6E] text-xs">Média geral</p>
            </Card>
          </div>

          {/* Info section */}
          <Card className="mb-6">
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-2 text-[#A0A0A0]">
                <Clock size={16} />
                <span>{formatDuration(simulado.duracao_minutos)} por prova</span>
              </div>
              <div className="flex items-center gap-2 text-[#A0A0A0]">
                <FileText size={16} />
                <span>{simulado.total_questoes} questões por prova</span>
              </div>
            </div>
            {simulado.is_premium && (
              <div className="mt-3 pt-3 border-t border-[#2A2A2A] flex items-center gap-2">
                <span className="bg-[#FFB800] text-black text-xs font-bold px-2 py-0.5 rounded-full">
                  PREMIUM
                </span>
                <span className="text-[#6E6E6E] text-sm">
                  Conteúdo exclusivo para assinantes
                </span>
              </div>
            )}
          </Card>

          {/* Provas list */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-[#FFB800]" />
              Provas Disponíveis
              <span className="text-[#6E6E6E] text-sm font-normal">
                ({stats.total} {stats.total === 1 ? 'prova' : 'provas'})
              </span>
            </h2>

            <div className="space-y-3">
              {provas.map((prova) => (
                <ProvaCard
                  key={prova.variationIndex}
                  prova={prova}
                  simulado={simulado}
                  onStart={handleStartProva}
                  onContinue={handleContinueProva}
                  onViewResult={handleViewResult}
                />
              ))}
            </div>
          </div>

          {/* Empty state if no provas */}
          {provas.length === 0 && (
            <div className="text-center py-12 text-[#6E6E6E]">
              <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="mb-2">Nenhuma prova disponível</p>
              <p className="text-sm">Este pacote de simulados ainda não possui provas configuradas.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
