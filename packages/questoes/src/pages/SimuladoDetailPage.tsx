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
  AlertCircle,
  Target,
  Download,
  Edit3,
  ChevronRight,
  Check,
  X,
} from 'lucide-react';
import { Card, Button, CircularProgress } from '../components/ui';
import { useAuthStore } from '../stores';
import {
  getSimuladoWithDetails,
  SimuladoWithUserData,
  ProvaStatus,
  SimuladoResult,
  getUserSimuladoResultsBySimulado,
} from '../services/simuladosService';
import { getOptimizedImageUrl } from '../utils/image';

function ProvaCard({
  prova,
  simulado,
  onStart,
  onDownloadPdf,
  onManualResponse,
}: {
  prova: ProvaStatus;
  simulado: SimuladoWithUserData;
  onStart: (variationIndex: number) => void;
  onDownloadPdf: (variationIndex: number) => void;
  onManualResponse: (variationIndex: number) => void;
}) {
  const getStatusIcon = () => {
    if (prova.isCompleted) return <CheckCircle size={20} className="text-[#2ECC71]" />;
    if (prova.isInProgress) return <Clock size={20} className="text-[#FFB800]" />;
    return <Target size={20} className="text-[#6E6E6E]" />;
  };

  const getStatusText = () => {
    if (prova.isCompleted) return 'Concluída';
    if (prova.isInProgress) return 'Em andamento';
    return 'Disponível';
  };

  const getScoreColor = (score: number) => {
    if (score >= 70) return 'text-[#2ECC71]';
    if (score >= 50) return 'text-[#FFB800]';
    return 'text-[#E74C3C]';
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4 hover:border-[#3A3A3A] transition-colors"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {getStatusIcon()}
          <span className="text-white font-medium">{prova.label}</span>
        </div>
        <span className="text-[#6E6E6E] text-xs">{getStatusText()}</span>
      </div>

      {/* Score if completed */}
      {prova.isCompleted && prova.result && (
        <div className="flex items-center justify-between mb-3 py-2 px-3 bg-[#252525] rounded-lg">
          <span className="text-[#6E6E6E] text-sm">Nota</span>
          <span className={`font-bold text-lg ${getScoreColor(prova.result.score)}`}>
            {Math.round(prova.result.score)}%
          </span>
        </div>
      )}

      {/* Progress if in progress */}
      {prova.isInProgress && prova.attempt && (
        <div className="mb-3 py-2 px-3 bg-[#FFB800]/10 rounded-lg">
          <div className="flex items-center justify-between text-sm mb-1">
            <span className="text-[#FFB800]">Progresso</span>
            <span className="text-white">
              {prova.attempt.current_index + 1}/{simulado.total_questoes}
            </span>
          </div>
          <div className="h-1.5 bg-[#1A1A1A] rounded-full overflow-hidden">
            <div
              className="h-full bg-[#FFB800] rounded-full"
              style={{
                width: `${((prova.attempt.current_index + 1) / simulado.total_questoes) * 100}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="space-y-2">
        {prova.isInProgress ? (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onStart(prova.variationIndex)}
          >
            <Play size={16} className="mr-2" />
            Continuar
          </Button>
        ) : (
          <Button
            size="sm"
            className="w-full"
            onClick={() => onStart(prova.variationIndex)}
          >
            <Play size={16} className="mr-2" />
            {prova.isCompleted ? 'Refazer' : 'Iniciar'}
          </Button>
        )}

        <div className="grid grid-cols-2 gap-2">
          <Button
            size="sm"
            variant="secondary"
            className="text-xs"
            onClick={() => onDownloadPdf(prova.variationIndex)}
          >
            <Download size={14} className="mr-1" />
            PDF
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="text-xs"
            onClick={() => onManualResponse(prova.variationIndex)}
          >
            <Edit3 size={14} className="mr-1" />
            Manual
          </Button>
        </div>
      </div>
    </motion.div>
  );
}

function HistoryItem({
  result,
  totalQuestoes,
  onClick,
}: {
  result: SimuladoResult & { prova_label?: string };
  totalQuestoes: number;
  onClick: () => void;
}) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
    });
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    if (hours > 0) return `${hours}h ${remainingMins}m`;
    return `${mins}min`;
  };

  const acertos = result.acertos ?? Math.round((result.score / 100) * totalQuestoes);
  const erros = result.erros ?? totalQuestoes - acertos;
  const scoreColor =
    result.score >= 70
      ? 'text-[#2ECC71]'
      : result.score >= 50
      ? 'text-[#FFB800]'
      : 'text-[#E74C3C]';

  return (
    <motion.div
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      whileHover={{ backgroundColor: 'rgba(255,255,255,0.03)' }}
      onClick={onClick}
      className="p-3 rounded-xl border border-[#2A2A2A] cursor-pointer transition-colors"
    >
      {/* Header with date and score */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-white text-sm font-medium">{result.prova_label}</span>
          {result.is_manual && (
            <span className="text-[10px] bg-[#3498DB]/20 text-[#3498DB] px-1.5 py-0.5 rounded">
              Manual
            </span>
          )}
        </div>
        <span className={`font-bold ${scoreColor}`}>{Math.round(result.score)}%</span>
      </div>

      {/* Stats row */}
      <div className="flex items-center gap-3 text-xs text-[#6E6E6E]">
        <div className="flex items-center gap-1">
          <Clock size={12} />
          <span>{formatTime(result.tempo_gasto)}</span>
        </div>
        <div className="flex items-center gap-1 text-[#2ECC71]">
          <Check size={12} />
          <span>{acertos}</span>
        </div>
        <div className="flex items-center gap-1 text-[#E74C3C]">
          <X size={12} />
          <span>{erros}</span>
        </div>
        <span className="text-[#4A4A4A]">•</span>
        <span>{formatDate(result.completed_at)}</span>
      </div>

      {/* Ranking if available */}
      {result.ranking_position && (
        <div className="flex items-center gap-1 mt-2 text-[#FFB800] text-xs">
          <Trophy size={12} />
          <span>#{result.ranking_position} no ranking</span>
        </div>
      )}

      {/* View more indicator */}
      <div className="flex items-center justify-end mt-2 text-[#6E6E6E] text-xs">
        <span>Ver detalhes</span>
        <ChevronRight size={14} />
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
  const [settings, setSettings] = useState({
    different_exams_per_user: 3,
    questions_per_simulado: 120,
    time_limit_minutes: 180,
  });
  const [history, setHistory] = useState<SimuladoResult[]>([]);

  useEffect(() => {
    if (profile?.id && id) {
      loadData();
    }
  }, [profile?.id, id]);

  const loadData = async () => {
    if (!profile?.id || !id) return;

    setLoading(true);
    try {
      const [detailsData, historyData] = await Promise.all([
        getSimuladoWithDetails(profile.id, id),
        getUserSimuladoResultsBySimulado(profile.id, id),
      ]);

      setSimulado(detailsData.simulado);
      setProvas(detailsData.provas);
      setStats(detailsData.stats);
      setSettings(detailsData.settings);
      setHistory(historyData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleStartProva = (variationIndex: number) => {
    // TODO: Implement start prova flow
    console.log('Starting prova', variationIndex);
    // navigate(`/simulados/${id}/prova/${variationIndex}`);
  };

  const handleDownloadPdf = (variationIndex: number) => {
    // TODO: Implement PDF download
    console.log('Downloading PDF for prova', variationIndex);
  };

  const handleManualResponse = (variationIndex: number) => {
    // TODO: Implement manual response flow
    console.log('Manual response for prova', variationIndex);
    // navigate(`/simulados/${id}/gabarito/${variationIndex}`);
  };

  const handleViewResultDetails = (result: SimuladoResult) => {
    // TODO: Implement view result details
    console.log('Viewing result details', result);
    // navigate(`/simulados/${id}/resultado/${result.id}`);
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
        <Button onClick={() => navigate('/simulados')}>Voltar para Simulados</Button>
      </div>
    );
  }

  const coverImage = getOptimizedImageUrl(
    simulado.preparatorio?.imagem_capa || simulado.preparatorio?.logo_url,
    800
  );
  const progressPercent =
    stats.total > 0 ? Math.round((stats.completed / stats.total) * 100) : 0;

  return (
    <div className="min-h-full pb-24">
      {/* Hero Section */}
      <div className="relative">
        <div className="h-48 w-full overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={simulado.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#3498DB] to-[#8B5CF6]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/60 to-transparent" />
        </div>

        {/* Back button */}
        <button
          onClick={() => navigate('/simulados')}
          className="absolute top-4 left-4 p-2 rounded-full bg-black/40 backdrop-blur-sm hover:bg-black/60 transition-colors z-10"
        >
          <ChevronLeft size={24} className="text-white" />
        </button>

        {/* Premium badge */}
        {simulado.is_premium && (
          <div className="absolute top-4 right-4 bg-[#FFB800] text-black text-xs font-bold px-3 py-1 rounded-full z-10">
            PREMIUM
          </div>
        )}

        {/* Title section */}
        <div className="absolute bottom-0 left-0 right-0 p-4">
          {simulado.preparatorio?.nome && (
            <p className="text-[#FFB800] text-sm font-medium mb-1">
              {simulado.preparatorio.nome}
            </p>
          )}
          <h1 className="text-xl font-bold text-white">{simulado.nome}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 pt-4">
        {/* Quick Stats Bar */}
        <div className="flex items-center justify-between bg-[#1A1A1A] rounded-xl p-4 mb-6">
          <div className="flex items-center gap-2">
            <CircularProgress value={progressPercent} size={40} strokeWidth={3} color="brand" />
            <div>
              <p className="text-white font-medium text-sm">{stats.completed}/{stats.total}</p>
              <p className="text-[#6E6E6E] text-xs">provas</p>
            </div>
          </div>
          <div className="h-8 w-px bg-[#2A2A2A]" />
          <div className="text-center">
            <p className="text-[#FFB800] font-medium text-sm">{formatDuration(simulado.duracao_minutos)}</p>
            <p className="text-[#6E6E6E] text-xs">por prova</p>
          </div>
          <div className="h-8 w-px bg-[#2A2A2A]" />
          <div className="text-center">
            <p className="text-[#3498DB] font-medium text-sm">{simulado.total_questoes}</p>
            <p className="text-[#6E6E6E] text-xs">questões</p>
          </div>
          <div className="h-8 w-px bg-[#2A2A2A]" />
          <div className="text-center">
            <p
              className={`font-medium text-sm ${
                stats.averageScore >= 70
                  ? 'text-[#2ECC71]'
                  : stats.averageScore >= 50
                  ? 'text-[#FFB800]'
                  : stats.averageScore > 0
                  ? 'text-[#E74C3C]'
                  : 'text-[#6E6E6E]'
              }`}
            >
              {stats.averageScore > 0 ? `${stats.averageScore}%` : '-'}
            </p>
            <p className="text-[#6E6E6E] text-xs">média</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Left Column - Provas */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <FileText size={20} className="text-[#FFB800]" />
              Provas Disponíveis
            </h2>

            {provas.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {provas.map((prova) => (
                  <ProvaCard
                    key={prova.variationIndex}
                    prova={prova}
                    simulado={simulado}
                    onStart={handleStartProva}
                    onDownloadPdf={handleDownloadPdf}
                    onManualResponse={handleManualResponse}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#6E6E6E] bg-[#1A1A1A] rounded-xl">
                <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm">Nenhuma prova configurada</p>
              </div>
            )}
          </div>

          {/* Right Column - History */}
          <div>
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Clock size={20} className="text-[#3498DB]" />
              Histórico de Provas
            </h2>

            {history.length > 0 ? (
              <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-[#3A3A3A] scrollbar-track-transparent">
                {history.map((result, index) => (
                  <HistoryItem
                    key={result.id}
                    result={{
                      ...result,
                      prova_label: `Prova ${(result.variation_index ?? index % settings.different_exams_per_user) + 1}`,
                    }}
                    totalQuestoes={simulado.total_questoes}
                    onClick={() => handleViewResultDetails(result)}
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-[#6E6E6E] bg-[#1A1A1A] rounded-xl">
                <Clock className="w-10 h-10 mx-auto mb-3 opacity-50" />
                <p className="text-sm mb-1">Nenhuma prova realizada</p>
                <p className="text-xs">Complete uma prova para ver seu histórico</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
