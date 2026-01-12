import React, { useState, useEffect } from 'react';
import { MarkdownPreview } from '../../components/admin/MarkdownPreview';
import {
  Brain,
  RefreshCw,
  Play,
  CheckCircle,
  Loader2,
  Database,
  MessageSquare,
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
} from 'lucide-react';
import {
  agentesService,
  ComentarioFormatItem,
  QuestaoDetalhes,
} from '../../services/agentesService';
import { ScrapingSection } from './Settings';

// ============================================================================
// COMPONENTES AUXILIARES
// ============================================================================

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const statusConfig: Record<string, { color: string; bg: string; label: string }> = {
    pendente: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Pendente' },
    processando: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Processando' },
    concluido: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Concluído' },
    falha: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Falha' },
    ignorado: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Ignorado' },
    // Scraper statuses
    queued: { color: 'text-yellow-400', bg: 'bg-yellow-500/10', label: 'Na Fila' },
    running: { color: 'text-blue-400', bg: 'bg-blue-500/10', label: 'Executando' },
    paused: { color: 'text-orange-400', bg: 'bg-orange-500/10', label: 'Pausado' },
    completed: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Completo' },
    error: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Erro' },
    // Account statuses
    valid: { color: 'text-green-400', bg: 'bg-green-500/10', label: 'Válida' },
    invalid: { color: 'text-red-400', bg: 'bg-red-500/10', label: 'Inválida' },
    unknown: { color: 'text-gray-400', bg: 'bg-gray-500/10', label: 'Desconhecido' },
  };

  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <span className={`${config.color} ${config.bg} px-2 py-1 rounded text-xs font-medium`}>
      {config.label}
    </span>
  );
};

// ============================================================================
// PÁGINA PRINCIPAL
// ============================================================================

interface AgentesProps {
  showHeader?: boolean;
}

const Agentes: React.FC<AgentesProps> = ({ showHeader = true }) => {
  // Estado
  const [activeTab, setActiveTab] = useState<'comentarios' | 'scraper'>('comentarios');
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
  const [processarQuantidade, setProcessarQuantidade] = useState(100);

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

  // --------------------------------------------------------------------------
  // Carregar dados
  // --------------------------------------------------------------------------
  const loadData = async (page: number = currentPage) => {
    try {
      // Carregar fila e estatísticas em paralelo
      const [queueResult, statsResult] = await Promise.all([
        agentesService.getComentarioQueue(statusFilter, page, ITEMS_PER_PAGE),
        agentesService.getComentarioStats().catch(() => null),
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
    } catch (error) {
      console.warn('Erro ao carregar queue:', error);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    setCurrentPage(1); // Reset para página 1 ao mudar filtro
    loadData(1);
  }, [statusFilter]);

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
  const handleProcessarPendentes = async () => {
    setActionLoading('processar');
    setOperationStatus({
      type: 'processing',
      message: `Formatando ${processarQuantidade} comentários...`,
      details: 'O agente de IA está processando as questões pendentes',
      timestamp: new Date(),
    });
    try {
      const result = await agentesService.processarPendentes(processarQuantidade);
      if (result.success) {
        setOperationStatus({
          type: 'success',
          message: 'Processamento concluído!',
          details: `${result.sucesso || 0} formatados com sucesso, ${result.falha || 0} falhas`,
          timestamp: new Date(),
        });
        loadData();
      } else {
        setOperationStatus({
          type: 'error',
          message: 'Erro no processamento',
          details: result.error || 'Erro desconhecido',
          timestamp: new Date(),
        });
      }
    } catch (error) {
      setOperationStatus({
        type: 'error',
        message: 'Erro ao processar',
        details: error instanceof Error ? error.message : 'Erro de conexão',
        timestamp: new Date(),
      });
    } finally {
      setActionLoading(null);
    }
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
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'comentarios' && (
        <div className="space-y-6">
          {/* Ações */}
          <div className="bg-brand-card border border-white/5 rounded-sm p-6">
            <h3 className="text-white font-bold mb-4">Processar Comentários</h3>
            <p className="text-gray-400 text-sm mb-4">
              O agente de IA irá formatar os comentários das questões pendentes, convertendo para Markdown organizado.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              {/* Quantidade */}
              <div className="flex items-center gap-2">
                <label className="text-gray-400 text-sm">Quantidade:</label>
                <input
                  type="number"
                  value={processarQuantidade}
                  onChange={(e) => setProcessarQuantidade(Number(e.target.value))}
                  className="w-24 px-3 py-2 bg-brand-dark border border-white/10 rounded text-white"
                  min={1}
                  max={500}
                />
              </div>

              {/* Botão Processar */}
              <button
                onClick={handleProcessarPendentes}
                disabled={actionLoading === 'processar' || (queueStats?.pendente === 0)}
                className="flex items-center gap-2 px-6 py-2 bg-brand-yellow text-black font-bold rounded hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'processar' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Play className="w-4 h-4" />
                )}
                Formatar Comentários
              </button>

              {/* Info de pendentes */}
              {queueStats && queueStats.pendente > 0 && (
                <span className="text-yellow-400 text-sm">
                  {queueStats.pendente.toLocaleString()} pendentes
                </span>
              )}
              {queueStats && queueStats.pendente === 0 && (
                <span className="text-green-400 text-sm flex items-center gap-1">
                  <CheckCircle2 className="w-4 h-4" />
                  Todos os comentários foram formatados!
                </span>
              )}
            </div>
          </div>

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

      {activeTab === 'scraper' && (
        <ScrapingSection />
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
