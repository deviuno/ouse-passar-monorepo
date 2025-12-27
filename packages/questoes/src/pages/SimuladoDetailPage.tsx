import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  Clock,
  FileText,
  Trophy,
  Play,
  CheckCircle,
  Loader2,
  BarChart2,
  Calendar,
  AlertCircle,
  History,
  Target,
  TrendingUp,
  Award,
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

type TabType = 'provas' | 'historico';

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
  const getStatusColor = () => {
    if (prova.isCompleted) return '#2ECC71';
    if (prova.isInProgress) return '#FFB800';
    return '#3A3A3A';
  };

  const getStatusBg = () => {
    if (prova.isCompleted) return 'bg-[#2ECC71]/10';
    if (prova.isInProgress) return 'bg-[#FFB800]/10';
    return 'bg-[#252525]';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-2xl border overflow-hidden ${getStatusBg()}`}
      style={{ borderColor: getStatusColor() }}
    >
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `${getStatusColor()}20` }}
            >
              {prova.isCompleted ? (
                <CheckCircle size={24} style={{ color: getStatusColor() }} />
              ) : prova.isInProgress ? (
                <Clock size={24} style={{ color: getStatusColor() }} />
              ) : (
                <Target size={24} className="text-[#6E6E6E]" />
              )}
            </div>
            <div>
              <h3 className="text-white font-semibold text-lg">{prova.label}</h3>
              <p className="text-[#6E6E6E] text-sm">
                {prova.isCompleted
                  ? 'Concluída'
                  : prova.isInProgress
                  ? 'Em andamento'
                  : 'Disponível'}
              </p>
            </div>
          </div>

          {/* Score badge for completed */}
          {prova.isCompleted && prova.result && (
            <div className="text-right">
              <div
                className={`text-3xl font-bold ${
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
                <div className="flex items-center justify-end gap-1 text-[#FFB800] text-sm">
                  <Trophy size={14} />
                  <span>#{prova.result.ranking_position}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Progress info for in-progress */}
        {prova.isInProgress && prova.attempt && (
          <div className="bg-[#FFB800]/20 rounded-xl p-3 mb-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-[#FFB800]">Progresso</span>
              <span className="text-white font-medium">
                {prova.attempt.current_index + 1}/{simulado.total_questoes}
              </span>
            </div>
            <div className="mt-2 h-2 bg-[#1A1A1A] rounded-full overflow-hidden">
              <div
                className="h-full bg-[#FFB800] rounded-full transition-all"
                style={{
                  width: `${((prova.attempt.current_index + 1) / simulado.total_questoes) * 100}%`,
                }}
              />
            </div>
          </div>
        )}

        {/* Action buttons */}
        <div className="flex gap-3">
          {prova.isInProgress && prova.attempt ? (
            <>
              <Button
                className="flex-1"
                onClick={() => onContinue(prova.attempt!.id)}
              >
                <Play size={18} className="mr-2" />
                Continuar
              </Button>
              <Button
                variant="secondary"
                onClick={() => onViewResult(prova)}
              >
                Abandonar
              </Button>
            </>
          ) : prova.isCompleted ? (
            <>
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => onViewResult(prova)}
              >
                <BarChart2 size={18} className="mr-2" />
                Ver Resultado
              </Button>
              <Button onClick={() => onStart(prova.variationIndex)}>
                <Play size={18} className="mr-2" />
                Refazer
              </Button>
            </>
          ) : (
            <Button
              className="flex-1"
              onClick={() => onStart(prova.variationIndex)}
            >
              <Play size={18} className="mr-2" />
              Iniciar Prova
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function HistoryCard({ result, index }: { result: SimuladoResult & { prova_label?: string }; index: number }) {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const hours = Math.floor(mins / 60);
    const remainingMins = mins % 60;
    return hours > 0 ? `${hours}h ${remainingMins}min` : `${mins}min`;
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#1A1A1A] rounded-xl border border-[#2A2A2A] p-4"
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
              result.score >= 70
                ? 'bg-[#2ECC71]/20'
                : result.score >= 50
                ? 'bg-[#FFB800]/20'
                : 'bg-[#E74C3C]/20'
            }`}
          >
            {result.score >= 70 ? (
              <Award size={20} className="text-[#2ECC71]" />
            ) : result.score >= 50 ? (
              <TrendingUp size={20} className="text-[#FFB800]" />
            ) : (
              <Target size={20} className="text-[#E74C3C]" />
            )}
          </div>
          <div>
            <p className="text-white font-medium">{result.prova_label || 'Prova'}</p>
            <p className="text-[#6E6E6E] text-xs">{formatDate(result.completed_at)}</p>
          </div>
        </div>

        <div className="text-right">
          <p
            className={`text-xl font-bold ${
              result.score >= 70
                ? 'text-[#2ECC71]'
                : result.score >= 50
                ? 'text-[#FFB800]'
                : 'text-[#E74C3C]'
            }`}
          >
            {Math.round(result.score)}%
          </p>
          <div className="flex items-center gap-2 text-[#6E6E6E] text-xs">
            <Clock size={10} />
            <span>{formatDuration(result.tempo_gasto)}</span>
            {result.ranking_position && (
              <>
                <Trophy size={10} className="text-[#FFB800] ml-1" />
                <span className="text-[#FFB800]">#{result.ranking_position}</span>
              </>
            )}
          </div>
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
  const [settings, setSettings] = useState({
    different_exams_per_user: 3,
    questions_per_simulado: 120,
    time_limit_minutes: 180,
  });
  const [activeTab, setActiveTab] = useState<TabType>('provas');
  const [history, setHistory] = useState<SimuladoResult[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (profile?.id && id) {
      loadSimuladoDetails();
    }
  }, [profile?.id, id]);

  useEffect(() => {
    if (activeTab === 'historico' && profile?.id && id && history.length === 0) {
      loadHistory();
    }
  }, [activeTab, profile?.id, id]);

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

  const loadHistory = async () => {
    if (!profile?.id || !id) return;

    setLoadingHistory(true);
    try {
      const results = await getUserSimuladoResultsBySimulado(profile.id, id);
      setHistory(results);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoadingHistory(false);
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
      {/* Hero Section with Cover Image */}
      <div className="relative">
        {/* Cover Image */}
        <div className="h-56 w-full overflow-hidden">
          {coverImage ? (
            <img
              src={coverImage}
              alt={simulado.nome}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#3498DB] to-[#8B5CF6]" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[#121212]/70 to-transparent" />
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
          <h1 className="text-2xl font-bold text-white">{simulado.nome}</h1>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 -mt-2 relative z-10">
        {/* Stats Cards */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <Card className="text-center py-4">
            <CircularProgress
              value={progressPercent}
              size={48}
              strokeWidth={4}
              color="brand"
            />
            <p className="text-[#6E6E6E] text-xs mt-2">Progresso</p>
          </Card>
          <Card className="text-center py-4">
            <p className="text-2xl font-bold text-white">
              {stats.completed}/{stats.total}
            </p>
            <p className="text-[#6E6E6E] text-xs">Provas feitas</p>
          </Card>
          <Card className="text-center py-4">
            <p
              className={`text-2xl font-bold ${
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
            <p className="text-[#6E6E6E] text-xs">Média geral</p>
          </Card>
        </div>

        {/* Info Card */}
        <Card className="mb-6">
          <div className="flex items-center justify-around text-center">
            <div>
              <div className="flex items-center justify-center gap-2 text-[#FFB800] mb-1">
                <Clock size={18} />
                <span className="font-semibold">{formatDuration(simulado.duracao_minutos)}</span>
              </div>
              <p className="text-[#6E6E6E] text-xs">por prova</p>
            </div>
            <div className="w-px h-10 bg-[#3A3A3A]" />
            <div>
              <div className="flex items-center justify-center gap-2 text-[#3498DB] mb-1">
                <FileText size={18} />
                <span className="font-semibold">{simulado.total_questoes}</span>
              </div>
              <p className="text-[#6E6E6E] text-xs">questões</p>
            </div>
            <div className="w-px h-10 bg-[#3A3A3A]" />
            <div>
              <div className="flex items-center justify-center gap-2 text-[#9B59B6] mb-1">
                <Target size={18} />
                <span className="font-semibold">{stats.total}</span>
              </div>
              <p className="text-[#6E6E6E] text-xs">provas</p>
            </div>
          </div>
        </Card>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('provas')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'provas'
                ? 'bg-[#FFB800] text-black'
                : 'bg-[#252525] text-[#A0A0A0] hover:bg-[#2A2A2A]'
            }`}
          >
            <FileText size={18} />
            Provas
          </button>
          <button
            onClick={() => setActiveTab('historico')}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-medium transition-colors ${
              activeTab === 'historico'
                ? 'bg-[#FFB800] text-black'
                : 'bg-[#252525] text-[#A0A0A0] hover:bg-[#2A2A2A]'
            }`}
          >
            <History size={18} />
            Histórico
          </button>
        </div>

        {/* Tab Content */}
        <AnimatePresence mode="wait">
          {activeTab === 'provas' ? (
            <motion.div
              key="provas"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {provas.length > 0 ? (
                provas.map((prova) => (
                  <ProvaCard
                    key={prova.variationIndex}
                    prova={prova}
                    simulado={simulado}
                    onStart={handleStartProva}
                    onContinue={handleContinueProva}
                    onViewResult={handleViewResult}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-[#6E6E6E]">
                  <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Nenhuma prova disponível</p>
                  <p className="text-sm">
                    Este pacote de simulados ainda não possui provas configuradas.
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div
              key="historico"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
            >
              {loadingHistory ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 text-[#FFB800] animate-spin" />
                </div>
              ) : history.length > 0 ? (
                <div className="space-y-3">
                  {history.map((result, index) => (
                    <HistoryCard
                      key={result.id}
                      result={{
                        ...result,
                        prova_label: `Prova ${(index % settings.different_exams_per_user) + 1}`,
                      }}
                      index={index}
                    />
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-[#6E6E6E]">
                  <History className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-2">Nenhuma prova realizada</p>
                  <p className="text-sm">
                    Seu histórico de provas aparecerá aqui após concluir uma prova.
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
