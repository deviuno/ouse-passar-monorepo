import React, { useState, useEffect, useRef } from 'react';
import { MarkdownPreview } from '../../components/admin/MarkdownPreview';
import {
  Brain,
  RefreshCw,
  Play,
  Square,
  CheckCircle,
  Loader2,
  Database,
  MessageSquare,
  FileText,
  X,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  CheckCircle2,
  XCircle,
  Clock,
  Info,
  List,
  TrendingUp,
} from 'lucide-react';
import {
  agentesService,
  ComentarioFormatItem,
  QuestaoDetalhes,
  EnunciadoFormatStats,
  CronStatus,
  QuestoesStats,
  QuestaoListItem,
} from '../../services/agentesService';
import { ScrapingSection } from '../../components/admin/settings';
import { ElapsedTime, StatusBadge } from '../../components/admin/agentes';

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

interface AgentesProps {
  showHeader?: boolean;
}

const Agentes: React.FC<AgentesProps> = ({ showHeader = true }) => {
  // Estado
  const [activeTab, setActiveTab] = useState<'comentarios' | 'enunciados' | 'scraper' | 'questoes'>('comentarios');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Dados do formatador
  const [comentarioQueue, setComentarioQueue] = useState<ComentarioFormatItem[]>([]);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [queueStats, setQueueStats] = useState<{
    pendente: number;
    processando: number;
    concluido: number;
    falha: number;
    ignorado: number;
  } | null>(null);

  // Paginação
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 50;

  // Ações
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Processamento contínuo
  const [isProcessingComentarios, setIsProcessingComentarios] = useState(false);
  const [isProcessingEnunciados, setIsProcessingEnunciados] = useState(false);
  const [processedCount, setProcessedCount] = useState({ comentarios: 0, enunciados: 0 });
  const [processingStartTime, setProcessingStartTime] = useState<{ comentarios: Date | null; enunciados: Date | null }>({
    comentarios: null,
    enunciados: null,
  });
  const [lastBatchResult, setLastBatchResult] = useState<{
    comentarios: { sucesso: number; falha: number } | null;
    enunciados: { sucesso: number; falha: number; ignorado: number } | null;
  }>({ comentarios: null, enunciados: null });

  // Refs para controle de parada (necessário para loops async)
  const shouldStopComentariosRef = useRef(false);
  const shouldStopEnunciadosRef = useRef(false);

  // Enunciados stats
  const [enunciadoStats, setEnunciadoStats] = useState<EnunciadoFormatStats | null>(null);

  // Status dos crons automáticos
  const [cronStatus, setCronStatus] = useState<CronStatus | null>(null);

  // Status da operação (feedback visual)
  const [operationStatus, setOperationStatus] = useState<{
    type: 'idle' | 'processing' | 'success' | 'error';
    message: string;
    details?: string;
    timestamp?: Date;
  }>({ type: 'idle', message: '' });

  // Auto-limpar status de sucesso após 10 segundos
  useEffect(() => {
    if (operationStatus.type === 'success') {
      const timer = setTimeout(() => {
        setOperationStatus({ type: 'idle', message: '' });
      }, 10000);
      return () => clearTimeout(timer);
    }
  }, [operationStatus]);

  // Modal de questão
  const [selectedQuestao, setSelectedQuestao] = useState<QuestaoDetalhes | null>(null);
  const [questaoModalOpen, setQuestaoModalOpen] = useState(false);
  const [questaoLoading, setQuestaoLoading] = useState(false);

  // Dados da aba Questões
  const [questoesStats, setQuestoesStats] = useState<QuestoesStats | null>(null);
  const [ultimasQuestoes, setUltimasQuestoes] = useState<QuestaoListItem[]>([]);
  const [questoesLoading, setQuestoesLoading] = useState(false);

  // --------------------------------------------------------------------------
  // Carregar dados
  // --------------------------------------------------------------------------
  const loadData = async (page: number = currentPage) => {
    try {
      // Carregar fila, estatísticas e status dos crons em paralelo
      const [queueResult, statsResult, enunciadoStatsResult, cronStatusResult] = await Promise.all([
        agentesService.getComentarioQueue(statusFilter, page, ITEMS_PER_PAGE),
        agentesService.getComentarioStats().catch(() => null),
        agentesService.getEnunciadoStats().catch(() => null),
        agentesService.getCronStatus().catch(() => null),
      ]);

      setComentarioQueue(queueResult.items);
      setTotalPages(queueResult.totalPages);
      setTotalItems(queueResult.total);
      setCurrentPage(queueResult.page);

      if (statsResult) {
        setQueueStats({
          pendente: statsResult.pendente,
          processando: statsResult.processando,
          concluido: statsResult.concluido,
          falha: statsResult.falha,
          ignorado: statsResult.ignorado,
        });
      }

      if (enunciadoStatsResult) {
        setEnunciadoStats(enunciadoStatsResult);
      }

      if (cronStatusResult) {
        setCronStatus(cronStatusResult);
      }
    } catch (error) {
      console.warn('Erro ao carregar queue:', error);
    }

    setLoading(false);
    setRefreshing(false);
  };

  // Carregar dados da aba Questões
  const loadQuestoesData = async () => {
    setQuestoesLoading(true);
    try {
      const [statsResult, ultimasResult] = await Promise.all([
        agentesService.getQuestoesStats('2026-01-20'),
        agentesService.getUltimasQuestoes(20),
      ]);

      setQuestoesStats(statsResult);
      setUltimasQuestoes(ultimasResult);
    } catch (error) {
      console.warn('Erro ao carregar dados de questões:', error);
    }
    setQuestoesLoading(false);
  };

  useEffect(() => {
    setCurrentPage(1); // Reset para página 1 ao mudar filtro
    loadData(1);
  }, [statusFilter]);

  // Carregar dados de questões quando a aba for selecionada
  useEffect(() => {
    if (activeTab === 'questoes') {
      loadQuestoesData();
    }
  }, [activeTab]);

  // Auto-refresh do status dos crons a cada 10 segundos
  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const cronStatusResult = await agentesService.getCronStatus().catch(() => null);
        if (cronStatusResult) {
          setCronStatus(cronStatusResult);
        }
        // Também atualizar estatísticas se algum cron estiver processando
        if (cronStatusResult?.comentarioFormatter?.isProcessing || cronStatusResult?.enunciadoFormatter?.isProcessing) {
          const [statsResult, enunciadoStatsResult] = await Promise.all([
            agentesService.getComentarioStats().catch(() => null),
            agentesService.getEnunciadoStats().catch(() => null),
          ]);
          if (statsResult) {
            setQueueStats({
              pendente: statsResult.pendente,
              processando: statsResult.processando,
              concluido: statsResult.concluido,
              falha: statsResult.falha,
              ignorado: statsResult.ignorado,
            });
          }
          if (enunciadoStatsResult) {
            setEnunciadoStats(enunciadoStatsResult);
          }
        }
      } catch {
        // Ignora erros de polling
      }
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  // Navegação de página
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
      loadData(page);
    }
  };

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --------------------------------------------------------------------------
  // Ações do Formatador
  // --------------------------------------------------------------------------
  // Processamento contínuo de comentários
  const handleIniciarComentarios = async () => {
    setIsProcessingComentarios(true);
    shouldStopComentariosRef.current = false;
    setProcessedCount(prev => ({ ...prev, comentarios: 0 }));
    setProcessingStartTime(prev => ({ ...prev, comentarios: new Date() }));
    setLastBatchResult(prev => ({ ...prev, comentarios: null }));

    const BATCH_SIZE = 50;
    let totalProcessed = 0;
    let totalFailed = 0;
    let consecutiveEmpty = 0;

    while (!shouldStopComentariosRef.current) {
      try {
        const result = await agentesService.processarPendentes(BATCH_SIZE);

        if (!result.success) {
          setOperationStatus({
            type: 'error',
            message: 'Erro no processamento',
            details: result.error || 'Erro desconhecido',
            timestamp: new Date(),
          });
          break;
        }

        const processed = (result.sucesso || 0) + (result.falha || 0);
        totalProcessed += result.sucesso || 0;
        totalFailed += result.falha || 0;
        setProcessedCount(prev => ({ ...prev, comentarios: totalProcessed }));
        setLastBatchResult(prev => ({ ...prev, comentarios: { sucesso: result.sucesso || 0, falha: result.falha || 0 } }));

        // Se não processou nada, incrementa contador de vazios
        if (processed === 0) {
          consecutiveEmpty++;
          if (consecutiveEmpty >= 2) {
            // Terminou - não há mais pendentes
            setOperationStatus({
              type: 'success',
              message: 'Processamento concluído!',
              details: `Total: ${totalProcessed} comentários formatados, ${totalFailed} falhas. Não há mais pendentes.`,
              timestamp: new Date(),
            });
            break;
          }
        } else {
          consecutiveEmpty = 0;
        }

        // Atualizar stats
        loadData();

        // Pequena pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        setOperationStatus({
          type: 'error',
          message: 'Erro ao processar',
          details: error instanceof Error ? error.message : 'Erro de conexão',
          timestamp: new Date(),
        });
        break;
      }
    }

    setIsProcessingComentarios(false);
    setProcessingStartTime(prev => ({ ...prev, comentarios: null }));
    if (shouldStopComentariosRef.current) {
      setOperationStatus({
        type: 'success',
        message: 'Processamento pausado',
        details: `${totalProcessed} comentários formatados, ${totalFailed} falhas antes da pausa.`,
        timestamp: new Date(),
      });
    }
    shouldStopComentariosRef.current = false;
  };

  const handlePararComentarios = () => {
    shouldStopComentariosRef.current = true;
  };

  // Processamento contínuo de enunciados
  const handleIniciarEnunciados = async () => {
    setIsProcessingEnunciados(true);
    shouldStopEnunciadosRef.current = false;
    setProcessedCount(prev => ({ ...prev, enunciados: 0 }));
    setProcessingStartTime(prev => ({ ...prev, enunciados: new Date() }));
    setLastBatchResult(prev => ({ ...prev, enunciados: null }));

    const BATCH_SIZE = 30;
    let totalProcessed = 0;
    let totalFailed = 0;
    let totalIgnored = 0;
    let consecutiveEmpty = 0;

    while (!shouldStopEnunciadosRef.current) {
      try {
        const result = await agentesService.processarEnunciados(BATCH_SIZE);

        if (!result.success) {
          setOperationStatus({
            type: 'error',
            message: 'Erro no processamento',
            details: result.error || 'Erro desconhecido',
            timestamp: new Date(),
          });
          break;
        }

        const processed = (result.sucesso || 0) + (result.falha || 0) + (result.ignorado || 0);
        totalProcessed += (result.sucesso || 0);
        totalFailed += (result.falha || 0);
        totalIgnored += (result.ignorado || 0);
        setProcessedCount(prev => ({ ...prev, enunciados: totalProcessed }));
        setLastBatchResult(prev => ({
          ...prev,
          enunciados: { sucesso: result.sucesso || 0, falha: result.falha || 0, ignorado: result.ignorado || 0 }
        }));

        // Se não processou nada, incrementa contador de vazios
        if (processed === 0) {
          consecutiveEmpty++;
          if (consecutiveEmpty >= 2) {
            // Terminou
            setOperationStatus({
              type: 'success',
              message: 'Processamento concluído!',
              details: `Total: ${totalProcessed} formatados, ${totalFailed} falhas, ${totalIgnored} ignorados.`,
              timestamp: new Date(),
            });
            break;
          }
        } else {
          consecutiveEmpty = 0;
        }

        // Atualizar stats
        loadData();

        // Pausa entre lotes
        await new Promise(resolve => setTimeout(resolve, 1000));

      } catch (error) {
        setOperationStatus({
          type: 'error',
          message: 'Erro ao processar',
          details: error instanceof Error ? error.message : 'Erro de conexão',
          timestamp: new Date(),
        });
        break;
      }
    }

    setIsProcessingEnunciados(false);
    setProcessingStartTime(prev => ({ ...prev, enunciados: null }));
    if (shouldStopEnunciadosRef.current) {
      setOperationStatus({
        type: 'success',
        message: 'Processamento pausado',
        details: `${totalProcessed} formatados, ${totalFailed} falhas, ${totalIgnored} ignorados antes da pausa.`,
        timestamp: new Date(),
      });
    }
    shouldStopEnunciadosRef.current = false;
  };

  const handlePararEnunciados = () => {
    shouldStopEnunciadosRef.current = true;
  };

  // --------------------------------------------------------------------------
  // Modal de Questão
  // --------------------------------------------------------------------------
  const handleOpenQuestao = async (questaoId: number) => {
    setQuestaoLoading(true);
    setQuestaoModalOpen(true);
    try {
      const questao = await agentesService.getQuestaoDetalhes(questaoId);
      setSelectedQuestao(questao);
    } catch (error) {
      console.error('Erro ao carregar questão:', error);
      setSelectedQuestao(null);
    } finally {
      setQuestaoLoading(false);
    }
  };

  const handleCloseQuestao = () => {
    setQuestaoModalOpen(false);
    setSelectedQuestao(null);
  };

  // --------------------------------------------------------------------------
  // Render
  // --------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header - only shown when standalone page */}
      {showHeader && (
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-black text-white font-display uppercase flex items-center gap-3">
              <Brain className="w-8 h-8 text-brand-yellow" />
              Agentes IA
            </h2>
            <p className="text-gray-400 mt-1">Monitore e gerencie os agentes de processamento</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-white/10 rounded text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      )}

      {/* Refresh button when used as section (without header) */}
      {!showHeader && (
        <div className="flex justify-end">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-white/10 rounded text-white hover:bg-white/5 transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Atualizar
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-white/10">
        <nav className="flex gap-8">
          <button
            onClick={() => setActiveTab('comentarios')}
            className={`pb-4 px-1 font-bold uppercase text-sm tracking-wider transition-colors ${
              activeTab === 'comentarios'
                ? 'text-brand-yellow border-b-2 border-brand-yellow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4 inline mr-2" />
            Formatador de Comentários
          </button>
          <button
            onClick={() => setActiveTab('enunciados')}
            className={`pb-4 px-1 font-bold uppercase text-sm tracking-wider transition-colors ${
              activeTab === 'enunciados'
                ? 'text-brand-yellow border-b-2 border-brand-yellow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4 inline mr-2" />
            Formatador de Enunciados
          </button>
          <button
            onClick={() => setActiveTab('scraper')}
            className={`pb-4 px-1 font-bold uppercase text-sm tracking-wider transition-colors ${
              activeTab === 'scraper'
                ? 'text-brand-yellow border-b-2 border-brand-yellow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <Database className="w-4 h-4 inline mr-2" />
            Scraper de Questões
          </button>
          <button
            onClick={() => setActiveTab('questoes')}
            className={`pb-4 px-1 font-bold uppercase text-sm tracking-wider transition-colors ${
              activeTab === 'questoes'
                ? 'text-brand-yellow border-b-2 border-brand-yellow'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List className="w-4 h-4 inline mr-2" />
            Questões
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'comentarios' && (
        <div className="space-y-6">
          {/* Card de Processamento Ativo */}
          {isProcessingComentarios && (
            <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 rounded-lg p-6 ">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-blue-500/30 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Formatando Comentários</h3>
                    <p className="text-blue-300 text-sm">Agente de IA trabalhando...</p>
                  </div>
                </div>
                <button
                  onClick={handlePararComentarios}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Parar
                </button>
              </div>

              {/* Contador principal */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-4xl font-bold text-green-400 tabular-nums">
                    {processedCount.comentarios.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-400/70 uppercase tracking-wider mt-1">Formatados</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-4xl font-bold text-yellow-400 tabular-nums">
                    {queueStats?.pendente?.toLocaleString() || '—'}
                  </div>
                  <div className="text-xs text-yellow-400/70 uppercase tracking-wider mt-1">Pendentes</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-4xl font-bold text-blue-400">
                    <ElapsedTime startTime={processingStartTime.comentarios} />
                  </div>
                  <div className="text-xs text-blue-400/70 uppercase tracking-wider mt-1">Tempo</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-300">
                    {lastBatchResult.comentarios ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="text-green-400">+{lastBatchResult.comentarios.sucesso}</span>
                        {lastBatchResult.comentarios.falha > 0 && (
                          <span className="text-red-400">-{lastBatchResult.comentarios.falha}</span>
                        )}
                      </span>
                    ) : '—'}
                  </div>
                  <div className="text-xs text-gray-400/70 uppercase tracking-wider mt-1">Último Lote</div>
                </div>
              </div>

              {/* Barra de progresso animada */}
              {queueStats && (queueStats.pendente + queueStats.concluido) > 0 && (
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 transition-all duration-500"
                    style={{
                      width: `${(queueStats.concluido / (queueStats.pendente + queueStats.concluido + queueStats.processando)) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Status do Processador Automático */}
          {!isProcessingComentarios && (
            <div className="bg-brand-card border border-white/5 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-brand-yellow" />
                  Processador Automático
                </h3>
                {cronStatus?.comentarioFormatter?.isProcessing ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Ativo
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full text-gray-400 text-sm font-medium">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    Aguardando
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm mb-4">
                O agente de IA formata comentários automaticamente em background. Executa a cada minuto processando lotes de 30 questões.
              </p>

              {/* Stats do processador automático */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {cronStatus?.comentarioFormatter?.totalProcessed?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Formatados (sessão)</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {cronStatus?.comentarioFormatter?.totalFailed?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Falhas (sessão)</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {queueStats?.pendente?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Pendentes</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-sm font-medium text-gray-300">
                    {cronStatus?.comentarioFormatter?.lastRun
                      ? new Date(cronStatus.comentarioFormatter.lastRun).toLocaleTimeString('pt-BR')
                      : '—'}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Última execução</div>
                </div>
              </div>

              {/* Ações manuais */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleIniciarComentarios}
                  disabled={queueStats?.pendente === 0 || cronStatus?.comentarioFormatter?.isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-yellow/20 text-brand-yellow font-medium rounded hover:bg-brand-yellow/30 transition-colors disabled:opacity-50 text-sm"
                >
                  <Play className="w-4 h-4" />
                  Processar Manualmente
                </button>
                <span className="text-gray-500 text-xs">
                  Use para processar além do cron automático
                </span>
              </div>
            </div>
          )}

          {/* Card de Estatísticas da Fila */}
          {queueStats && (
            <div className="bg-brand-card border border-white/5 rounded-sm p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-yellow" />
                Estatísticas da Fila
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Pendente */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {queueStats.pendente.toLocaleString()}
                  </div>
                  <div className="text-xs text-yellow-400/70 uppercase tracking-wider mt-1">
                    Pendente
                  </div>
                </div>

                {/* Processando */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400 flex items-center justify-center gap-2">
                    {queueStats.processando > 0 && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                    {queueStats.processando.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-400/70 uppercase tracking-wider mt-1">
                    Processando
                  </div>
                </div>

                {/* Concluído */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {queueStats.concluido.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-400/70 uppercase tracking-wider mt-1">
                    Concluído
                  </div>
                </div>

                {/* Falha */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-400">
                    {queueStats.falha.toLocaleString()}
                  </div>
                  <div className="text-xs text-red-400/70 uppercase tracking-wider mt-1">
                    Falha
                  </div>
                </div>

                {/* Ignorado */}
                <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-gray-400">
                    {queueStats.ignorado.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400/70 uppercase tracking-wider mt-1">
                    Ignorado
                  </div>
                </div>
              </div>

              {/* Barra de progresso */}
              {(queueStats.pendente + queueStats.processando + queueStats.concluido + queueStats.falha + queueStats.ignorado) > 0 && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
                    {queueStats.concluido > 0 && (
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(queueStats.concluido / (queueStats.pendente + queueStats.processando + queueStats.concluido + queueStats.falha + queueStats.ignorado)) * 100}%`,
                        }}
                      />
                    )}
                    {queueStats.processando > 0 && (
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(queueStats.processando / (queueStats.pendente + queueStats.processando + queueStats.concluido + queueStats.falha + queueStats.ignorado)) * 100}%`,
                        }}
                      />
                    )}
                    {queueStats.pendente > 0 && (
                      <div
                        className="h-full bg-yellow-500"
                        style={{
                          width: `${(queueStats.pendente / (queueStats.pendente + queueStats.processando + queueStats.concluido + queueStats.falha + queueStats.ignorado)) * 100}%`,
                        }}
                      />
                    )}
                    {queueStats.falha > 0 && (
                      <div
                        className="h-full bg-red-500"
                        style={{
                          width: `${(queueStats.falha / (queueStats.pendente + queueStats.processando + queueStats.concluido + queueStats.falha + queueStats.ignorado)) * 100}%`,
                        }}
                      />
                    )}
                    {queueStats.ignorado > 0 && (
                      <div
                        className="h-full bg-gray-500"
                        style={{
                          width: `${(queueStats.ignorado / (queueStats.pendente + queueStats.processando + queueStats.concluido + queueStats.falha + queueStats.ignorado)) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-right">
                    Total: {(queueStats.pendente + queueStats.processando + queueStats.concluido + queueStats.falha + queueStats.ignorado).toLocaleString()} itens na fila
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status da Operação */}
          {operationStatus.type !== 'idle' && (
            <div
              className={`border rounded-sm p-4 flex items-start gap-4 transition-all ${
                operationStatus.type === 'processing'
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : operationStatus.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              {/* Ícone */}
              <div className="flex-shrink-0 mt-0.5">
                {operationStatus.type === 'processing' ? (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                ) : operationStatus.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <h4
                  className={`font-bold ${
                    operationStatus.type === 'processing'
                      ? 'text-blue-400'
                      : operationStatus.type === 'success'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {operationStatus.message}
                </h4>
                {operationStatus.details && (
                  <p className="text-sm text-gray-400 mt-1">{operationStatus.details}</p>
                )}
                {operationStatus.timestamp && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {operationStatus.timestamp.toLocaleTimeString('pt-BR')}
                  </p>
                )}
              </div>

              {/* Botão fechar (apenas para sucesso e erro) */}
              {operationStatus.type !== 'processing' && (
                <button
                  onClick={() => setOperationStatus({ type: 'idle', message: '' })}
                  className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Filtro e Tabela */}
          <div className="bg-brand-card border border-white/5 rounded-sm">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <h3 className="text-white font-bold">Fila de Processamento</h3>
                <span className="text-sm text-gray-400">
                  {totalItems.toLocaleString()} itens
                </span>
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-brand-dark border border-white/10 rounded text-white"
              >
                <option value="all">Todos os status</option>
                <option value="pendente">Pendente</option>
                <option value="processando">Processando</option>
                <option value="concluido">Concluído</option>
                <option value="falha">Falha</option>
                <option value="ignorado">Ignorado</option>
              </select>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                    <th className="px-4 py-3">ID Questão</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Erro</th>
                    <th className="px-4 py-3">Criado em</th>
                    <th className="px-4 py-3">Processado em</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {comentarioQueue.map((item) => (
                    <tr
                      key={item.id}
                      onClick={() => handleOpenQuestao(item.questao_id)}
                      className="hover:bg-white/5 cursor-pointer transition-colors"
                    >
                      <td className="px-4 py-3 text-white font-mono flex items-center gap-2">
                        {item.questao_id}
                        <ExternalLink className="w-3 h-3 text-gray-500" />
                      </td>
                      <td className="px-4 py-3">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">
                        {item.erro || '-'}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {new Date(item.created_at).toLocaleString('pt-BR')}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-sm">
                        {item.processed_at
                          ? new Date(item.processed_at).toLocaleString('pt-BR')
                          : '-'}
                      </td>
                    </tr>
                  ))}
                  {comentarioQueue.length === 0 && (
                    <tr>
                      <td colSpan={5} className="px-4 py-8 text-center text-gray-400">
                        Nenhum item encontrado
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Paginação */}
            {totalPages > 1 && (
              <div className="p-4 border-t border-white/5 flex items-center justify-between">
                <div className="text-sm text-gray-400">
                  Página {currentPage} de {totalPages}
                  <span className="ml-2 text-gray-500">
                    (mostrando {((currentPage - 1) * ITEMS_PER_PAGE) + 1}-{Math.min(currentPage * ITEMS_PER_PAGE, totalItems)} de {totalItems.toLocaleString()})
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {/* Primeira página */}
                  <button
                    onClick={() => goToPage(1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Primeira página"
                  >
                    <ChevronsLeft className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Página anterior */}
                  <button
                    onClick={() => goToPage(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Página anterior"
                  >
                    <ChevronLeft className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Números de página */}
                  <div className="flex items-center gap-1 mx-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNum: number;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <button
                          key={pageNum}
                          onClick={() => goToPage(pageNum)}
                          className={`w-8 h-8 rounded text-sm font-medium transition-colors ${
                            pageNum === currentPage
                              ? 'bg-brand-yellow text-black'
                              : 'text-gray-400 hover:bg-white/10'
                          }`}
                        >
                          {pageNum}
                        </button>
                      );
                    })}
                  </div>

                  {/* Próxima página */}
                  <button
                    onClick={() => goToPage(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Próxima página"
                  >
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </button>

                  {/* Última página */}
                  <button
                    onClick={() => goToPage(totalPages)}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    title="Última página"
                  >
                    <ChevronsRight className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'enunciados' && (
        <div className="space-y-6">
          {/* Card de Processamento Ativo */}
          {isProcessingEnunciados && (
            <div className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-lg p-6 ">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-purple-500/30 rounded-full flex items-center justify-center">
                    <Loader2 className="w-6 h-6 text-purple-400 animate-spin" />
                  </div>
                  <div>
                    <h3 className="text-white font-bold text-lg">Formatando Enunciados</h3>
                    <p className="text-purple-300 text-sm">Agente de IA trabalhando...</p>
                  </div>
                </div>
                <button
                  onClick={handlePararEnunciados}
                  className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors"
                >
                  <Square className="w-4 h-4" />
                  Parar
                </button>
              </div>

              {/* Contador principal */}
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-4xl font-bold text-green-400 tabular-nums">
                    {processedCount.enunciados.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-400/70 uppercase tracking-wider mt-1">Formatados</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-4xl font-bold text-yellow-400 tabular-nums">
                    {enunciadoStats?.pendente?.toLocaleString() || '—'}
                  </div>
                  <div className="text-xs text-yellow-400/70 uppercase tracking-wider mt-1">Pendentes</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-4xl font-bold text-purple-400">
                    <ElapsedTime startTime={processingStartTime.enunciados} />
                  </div>
                  <div className="text-xs text-purple-400/70 uppercase tracking-wider mt-1">Tempo</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-gray-300">
                    {lastBatchResult.enunciados ? (
                      <span className="flex items-center justify-center gap-1 text-lg">
                        <span className="text-green-400">+{lastBatchResult.enunciados.sucesso}</span>
                        {lastBatchResult.enunciados.falha > 0 && (
                          <span className="text-red-400">-{lastBatchResult.enunciados.falha}</span>
                        )}
                        {lastBatchResult.enunciados.ignorado > 0 && (
                          <span className="text-gray-400">~{lastBatchResult.enunciados.ignorado}</span>
                        )}
                      </span>
                    ) : '—'}
                  </div>
                  <div className="text-xs text-gray-400/70 uppercase tracking-wider mt-1">Último Lote</div>
                </div>
                <div className="bg-black/30 rounded-lg p-4 text-center">
                  <div className="text-2xl font-bold text-blue-400 tabular-nums">
                    {processingStartTime.enunciados && processedCount.enunciados > 0 ? (
                      Math.round(processedCount.enunciados / ((Date.now() - processingStartTime.enunciados.getTime()) / 60000))
                    ) : '—'}
                  </div>
                  <div className="text-xs text-blue-400/70 uppercase tracking-wider mt-1">por min</div>
                </div>
              </div>

              {/* Barra de progresso animada */}
              {enunciadoStats && enunciadoStats.total > 0 && (
                <div className="h-2 bg-black/30 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-500"
                    style={{
                      width: `${(enunciadoStats.concluido / enunciadoStats.total) * 100}%`,
                    }}
                  />
                </div>
              )}
            </div>
          )}

          {/* Status do Processador Automático de Enunciados */}
          {!isProcessingEnunciados && (
            <div className="bg-brand-card border border-white/5 rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Brain className="w-5 h-5 text-brand-yellow" />
                  Processador Automático
                </h3>
                {cronStatus?.enunciadoFormatter?.isProcessing ? (
                  <span className="flex items-center gap-2 px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-sm font-medium">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    Ativo
                  </span>
                ) : (
                  <span className="flex items-center gap-2 px-3 py-1 bg-gray-500/20 border border-gray-500/30 rounded-full text-gray-400 text-sm font-medium">
                    <span className="w-2 h-2 bg-gray-400 rounded-full" />
                    Aguardando
                  </span>
                )}
              </div>

              <p className="text-gray-400 text-sm mb-4">
                O agente de IA formata enunciados automaticamente em background, convertendo para Markdown. Executa a cada minuto processando lotes de 30 questões.
              </p>

              {/* Stats do processador automático */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {cronStatus?.enunciadoFormatter?.totalProcessed?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Formatados (sessão)</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-red-400">
                    {cronStatus?.enunciadoFormatter?.totalFailed?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Falhas (sessão)</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    {enunciadoStats?.pendente?.toLocaleString() || 0}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Pendentes</div>
                </div>
                <div className="bg-black/20 rounded-lg p-3 text-center">
                  <div className="text-sm font-medium text-gray-300">
                    {cronStatus?.enunciadoFormatter?.lastRun
                      ? new Date(cronStatus.enunciadoFormatter.lastRun).toLocaleTimeString('pt-BR')
                      : '—'}
                  </div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider">Última execução</div>
                </div>
              </div>

              {/* Ações manuais */}
              <div className="flex flex-wrap items-center gap-4 pt-4 border-t border-white/5">
                <button
                  onClick={handleIniciarEnunciados}
                  disabled={enunciadoStats?.pendente === 0 || cronStatus?.enunciadoFormatter?.isProcessing}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-yellow/20 text-brand-yellow font-medium rounded hover:bg-brand-yellow/30 transition-colors disabled:opacity-50 text-sm"
                >
                  <Play className="w-4 h-4" />
                  Processar Manualmente
                </button>
                <span className="text-gray-500 text-xs">
                  Use para processar além do cron automático
                </span>
              </div>
            </div>
          )}

          {/* Card de Estatísticas de Enunciados */}
          {enunciadoStats && (
            <div className="bg-brand-card border border-white/5 rounded-sm p-6">
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-yellow" />
                Estatísticas de Formatação de Enunciados
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {/* Pendente */}
                <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-yellow-400">
                    {enunciadoStats.pendente.toLocaleString()}
                  </div>
                  <div className="text-xs text-yellow-400/70 uppercase tracking-wider mt-1">
                    Pendente
                  </div>
                </div>

                {/* Processando */}
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-blue-400 flex items-center justify-center gap-2">
                    {enunciadoStats.processando > 0 && (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    )}
                    {enunciadoStats.processando.toLocaleString()}
                  </div>
                  <div className="text-xs text-blue-400/70 uppercase tracking-wider mt-1">
                    Processando
                  </div>
                </div>

                {/* Concluído */}
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-green-400">
                    {enunciadoStats.concluido.toLocaleString()}
                  </div>
                  <div className="text-xs text-green-400/70 uppercase tracking-wider mt-1">
                    Concluído
                  </div>
                </div>

                {/* Falha */}
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-red-400">
                    {enunciadoStats.falha.toLocaleString()}
                  </div>
                  <div className="text-xs text-red-400/70 uppercase tracking-wider mt-1">
                    Falha
                  </div>
                </div>

                {/* Ignorado */}
                <div className="bg-gray-500/10 border border-gray-500/20 rounded-lg p-4 text-center">
                  <div className="text-3xl font-bold text-gray-400">
                    {enunciadoStats.ignorado.toLocaleString()}
                  </div>
                  <div className="text-xs text-gray-400/70 uppercase tracking-wider mt-1">
                    Ignorado
                  </div>
                </div>
              </div>

              {/* Barra de progresso */}
              {enunciadoStats.total > 0 && (
                <div className="mt-4">
                  <div className="h-2 bg-gray-700 rounded-full overflow-hidden flex">
                    {enunciadoStats.concluido > 0 && (
                      <div
                        className="h-full bg-green-500"
                        style={{
                          width: `${(enunciadoStats.concluido / enunciadoStats.total) * 100}%`,
                        }}
                      />
                    )}
                    {enunciadoStats.processando > 0 && (
                      <div
                        className="h-full bg-blue-500"
                        style={{
                          width: `${(enunciadoStats.processando / enunciadoStats.total) * 100}%`,
                        }}
                      />
                    )}
                    {enunciadoStats.pendente > 0 && (
                      <div
                        className="h-full bg-yellow-500"
                        style={{
                          width: `${(enunciadoStats.pendente / enunciadoStats.total) * 100}%`,
                        }}
                      />
                    )}
                    {enunciadoStats.falha > 0 && (
                      <div
                        className="h-full bg-red-500"
                        style={{
                          width: `${(enunciadoStats.falha / enunciadoStats.total) * 100}%`,
                        }}
                      />
                    )}
                    {enunciadoStats.ignorado > 0 && (
                      <div
                        className="h-full bg-gray-500"
                        style={{
                          width: `${(enunciadoStats.ignorado / enunciadoStats.total) * 100}%`,
                        }}
                      />
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2 text-right">
                    Total: {enunciadoStats.total.toLocaleString()} questões
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Status da Operação */}
          {operationStatus.type !== 'idle' && (
            <div
              className={`border rounded-sm p-4 flex items-start gap-4 transition-all ${
                operationStatus.type === 'processing'
                  ? 'bg-blue-500/10 border-blue-500/30'
                  : operationStatus.type === 'success'
                  ? 'bg-green-500/10 border-green-500/30'
                  : 'bg-red-500/10 border-red-500/30'
              }`}
            >
              {/* Ícone */}
              <div className="flex-shrink-0 mt-0.5">
                {operationStatus.type === 'processing' ? (
                  <Loader2 className="w-6 h-6 text-blue-400 animate-spin" />
                ) : operationStatus.type === 'success' ? (
                  <CheckCircle2 className="w-6 h-6 text-green-400" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-400" />
                )}
              </div>

              {/* Conteúdo */}
              <div className="flex-1 min-w-0">
                <h4
                  className={`font-bold ${
                    operationStatus.type === 'processing'
                      ? 'text-blue-400'
                      : operationStatus.type === 'success'
                      ? 'text-green-400'
                      : 'text-red-400'
                  }`}
                >
                  {operationStatus.message}
                </h4>
                {operationStatus.details && (
                  <p className="text-sm text-gray-400 mt-1">{operationStatus.details}</p>
                )}
                {operationStatus.timestamp && (
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {operationStatus.timestamp.toLocaleTimeString('pt-BR')}
                  </p>
                )}
              </div>

              {/* Botão fechar (apenas para sucesso e erro) */}
              {operationStatus.type !== 'processing' && (
                <button
                  onClick={() => setOperationStatus({ type: 'idle', message: '' })}
                  className="flex-shrink-0 text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          {/* Informações sobre o processo */}
          <div className="bg-brand-card border border-white/5 rounded-sm p-6">
            <h3 className="text-white font-bold mb-4 flex items-center gap-2">
              <Info className="w-5 h-5 text-brand-yellow" />
              Sobre a Formatação de Enunciados
            </h3>
            <div className="text-gray-400 text-sm space-y-2">
              <p>
                O agente de formatação de enunciados transforma textos corridos em textos bem estruturados,
                identificando automaticamente:
              </p>
              <ul className="list-disc list-inside ml-4 space-y-1">
                <li>Títulos de textos de apoio</li>
                <li>Parágrafos separados</li>
                <li>Citações e referências bibliográficas</li>
                <li>Comando da questão (pergunta)</li>
                <li>Fórmulas matemáticas (preservadas intactas)</li>
              </ul>
              <p className="mt-4 text-yellow-400/80">
                <strong>Nota:</strong> Questões que já possuem 4+ quebras de linha são consideradas
                formatadas e são automaticamente ignoradas.
              </p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'scraper' && (
        <ScrapingSection />
      )}

      {activeTab === 'questoes' && (
        <div className="space-y-6">
          {/* Loading State */}
          {questoesLoading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
            </div>
          )}

          {/* Dashboard Cards */}
          {!questoesLoading && questoesStats && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Total de Questões */}
                <div className="bg-brand-card border border-white/5 rounded-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-brand-yellow/20 rounded-lg flex items-center justify-center">
                      <Database className="w-7 h-7 text-brand-yellow" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm uppercase tracking-wider">Total de Questões</p>
                      <p className="text-4xl font-bold text-white tabular-nums">
                        {questoesStats.total.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Novas Questões */}
                <div className="bg-brand-card border border-white/5 rounded-sm p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-green-500/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-7 h-7 text-green-400" />
                    </div>
                    <div>
                      <p className="text-gray-400 text-sm uppercase tracking-wider">
                        Novas desde 20/01/2026
                      </p>
                      <p className="text-4xl font-bold text-green-400 tabular-nums">
                        +{questoesStats.novasDesde.toLocaleString('pt-BR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de Últimas Questões */}
              <div className="bg-brand-card border border-white/5 rounded-sm">
                <div className="p-4 border-b border-white/5 flex items-center justify-between">
                  <h3 className="text-white font-bold flex items-center gap-2">
                    <List className="w-5 h-5 text-brand-yellow" />
                    Últimas 20 Questões Adicionadas
                  </h3>
                  <button
                    onClick={loadQuestoesData}
                    disabled={questoesLoading}
                    className="flex items-center gap-2 px-3 py-1.5 bg-brand-dark border border-white/10 rounded text-sm text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className={`w-4 h-4 ${questoesLoading ? 'animate-spin' : ''}`} />
                    Atualizar
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 text-xs uppercase tracking-wider">
                        <th className="px-4 py-3">ID</th>
                        <th className="px-4 py-3">Matéria</th>
                        <th className="px-4 py-3">Assunto</th>
                        <th className="px-4 py-3">Banca</th>
                        <th className="px-4 py-3">Ano</th>
                        <th className="px-4 py-3">Órgão</th>
                        <th className="px-4 py-3">Adicionada em</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {ultimasQuestoes.map((questao) => (
                        <tr
                          key={questao.id}
                          onClick={() => handleOpenQuestao(questao.id)}
                          className="hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-3 text-white font-mono flex items-center gap-2">
                            {questao.id}
                            <ExternalLink className="w-3 h-3 text-gray-500" />
                          </td>
                          <td className="px-4 py-3 text-gray-300 text-sm">
                            {questao.materia || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">
                            {questao.assunto || '-'}
                          </td>
                          <td className="px-4 py-3">
                            {questao.banca ? (
                              <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs rounded">
                                {questao.banca}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">
                            {questao.ano || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm max-w-xs truncate">
                            {questao.orgao || '-'}
                          </td>
                          <td className="px-4 py-3 text-gray-400 text-sm">
                            {questao.created_at ? new Date(questao.created_at).toLocaleString('pt-BR') : '-'}
                          </td>
                        </tr>
                      ))}
                      {ultimasQuestoes.length === 0 && (
                        <tr>
                          <td colSpan={7} className="px-4 py-8 text-center text-gray-400">
                            Nenhuma questão encontrada
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Modal de Questão */}
      {questaoModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={handleCloseQuestao}
          />

          {/* Modal */}
          <div className="relative bg-brand-dark border border-white/10 rounded-lg w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-brand-yellow" />
                {selectedQuestao ? `Questão #${selectedQuestao.id}` : 'Carregando...'}
              </h3>
              <button
                onClick={handleCloseQuestao}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
              {questaoLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
                </div>
              ) : selectedQuestao ? (
                <div className="space-y-6">
                  {/* Metadata */}
                  <div className="flex flex-wrap gap-2 text-sm">
                    {selectedQuestao.banca && (
                      <span className="px-2 py-1 bg-blue-500/20 text-blue-400 rounded">
                        {selectedQuestao.banca}
                      </span>
                    )}
                    {selectedQuestao.ano && (
                      <span className="px-2 py-1 bg-purple-500/20 text-purple-400 rounded">
                        {selectedQuestao.ano}
                      </span>
                    )}
                    {selectedQuestao.materia && (
                      <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded">
                        {selectedQuestao.materia}
                      </span>
                    )}
                    {selectedQuestao.assunto && (
                      <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded">
                        {selectedQuestao.assunto}
                      </span>
                    )}
                    {selectedQuestao.gabarito && (
                      <span className="px-2 py-1 bg-brand-yellow/20 text-brand-yellow rounded font-bold">
                        Gabarito: {selectedQuestao.gabarito}
                      </span>
                    )}
                  </div>

                  {/* Enunciado */}
                  <div>
                    <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Enunciado</h4>
                    <div
                      className="text-white bg-brand-card p-4 rounded border border-white/5 prose prose-invert max-w-none"
                      dangerouslySetInnerHTML={{ __html: selectedQuestao.enunciado || 'Sem enunciado' }}
                    />
                  </div>

                  {/* Alternativas */}
                  {selectedQuestao.alternativas && selectedQuestao.alternativas.length > 0 && (
                    <div>
                      <h4 className="text-sm font-bold text-gray-400 uppercase mb-2">Alternativas</h4>
                      <div className="space-y-2">
                        {selectedQuestao.alternativas.map((alt, idx) => (
                          <div
                            key={idx}
                            className={`p-3 rounded border ${
                              selectedQuestao.gabarito === alt.letter
                                ? 'bg-green-500/10 border-green-500/30'
                                : 'bg-brand-card border-white/5'
                            }`}
                          >
                            <span className={`font-bold mr-2 ${
                              selectedQuestao.gabarito === alt.letter
                                ? 'text-green-400'
                                : 'text-gray-400'
                            }`}>
                              {alt.letter})
                            </span>
                            <span
                              className="text-white"
                              dangerouslySetInnerHTML={{ __html: alt.text }}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Comentário */}
                  {selectedQuestao.comentario && (
                    <div>
                      <h4 className={`text-sm font-bold uppercase mb-2 flex items-center gap-2 ${
                        selectedQuestao.comentario_formatado ? 'text-green-400' : 'text-gray-400'
                      }`}>
                        {selectedQuestao.comentario_formatado ? (
                          <>
                            <CheckCircle className="w-4 h-4" />
                            Comentário Formatado
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-4 h-4" />
                            Comentário Original
                          </>
                        )}
                      </h4>
                      {selectedQuestao.comentario_formatado ? (
                        // Comentário formatado é Markdown - usar MarkdownPreview (igual ao app do aluno)
                        <div className="p-4 rounded border bg-[#121212] border-green-500/20">
                          <MarkdownPreview content={selectedQuestao.comentario} />
                        </div>
                      ) : (
                        // Comentário original é HTML - usar dangerouslySetInnerHTML
                        <div
                          className="prose prose-invert max-w-none p-4 rounded border text-gray-300 bg-brand-card border-white/5 text-sm"
                          dangerouslySetInnerHTML={{ __html: selectedQuestao.comentario }}
                        />
                      )}
                    </div>
                  )}

                  {/* Sem comentário */}
                  {!selectedQuestao.comentario && (
                    <div className="text-center py-8 text-gray-400">
                      Esta questão não possui comentário.
                    </div>
                  )}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-400">
                  Erro ao carregar questão
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Agentes;
