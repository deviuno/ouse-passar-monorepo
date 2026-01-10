import React, { useState, useEffect } from 'react';
import { MarkdownPreview } from '../../components/admin/MarkdownPreview';
import {
  Brain,
  RefreshCw,
  Play,
  RotateCcw,
  Plus,
  CheckCircle,
  Loader2,
  Database,
  MessageSquare,
  X,
  ExternalLink,
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

  // Ações
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [processarQuantidade, setProcessarQuantidade] = useState(100);
  const [popularQuantidade, setPopularQuantidade] = useState(1000);

  // Modal de questão
  const [selectedQuestao, setSelectedQuestao] = useState<QuestaoDetalhes | null>(null);
  const [questaoModalOpen, setQuestaoModalOpen] = useState(false);
  const [questaoLoading, setQuestaoLoading] = useState(false);

  // --------------------------------------------------------------------------
  // Carregar dados
  // --------------------------------------------------------------------------
  const loadData = async () => {
    try {
      const queue = await agentesService.getComentarioQueue(statusFilter);
      setComentarioQueue(queue);
    } catch (error) {
      console.warn('Erro ao carregar queue:', error);
    }

    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadData();
  };

  // --------------------------------------------------------------------------
  // Ações do Formatador
  // --------------------------------------------------------------------------
  const handleProcessarFila = async () => {
    setActionLoading('processar');
    try {
      const result = await agentesService.processarFila(processarQuantidade);
      if (result.success) {
        alert(`Processamento iniciado! ${result.sucesso || 0} sucesso, ${result.falha || 0} falhas`);
        loadData();
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (error) {
      alert('Erro ao processar fila');
    } finally {
      setActionLoading(null);
    }
  };

  const handlePopularFila = async () => {
    setActionLoading('popular');
    try {
      const result = await agentesService.popularFila(popularQuantidade);
      if (result.success) {
        alert(`${result.adicionadas || 0} questões adicionadas à fila`);
        loadData();
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (error) {
      alert('Erro ao popular fila');
    } finally {
      setActionLoading(null);
    }
  };

  const handleResetarFalhas = async () => {
    if (!confirm('Tem certeza que deseja resetar todas as falhas para reprocessamento?')) return;

    setActionLoading('resetar');
    try {
      const result = await agentesService.resetarFalhas();
      if (result.success) {
        alert(`${result.resetadas || 0} falhas resetadas`);
        loadData();
      } else {
        alert(`Erro: ${result.error}`);
      }
    } catch (error) {
      alert('Erro ao resetar falhas');
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
            <h3 className="text-white font-bold mb-4">Ações</h3>
            <div className="flex flex-wrap gap-4">
              {/* Processar Fila */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={processarQuantidade}
                  onChange={(e) => setProcessarQuantidade(Number(e.target.value))}
                  className="w-24 px-3 py-2 bg-brand-dark border border-white/10 rounded text-white"
                  min={1}
                  max={500}
                />
                <button
                  onClick={handleProcessarFila}
                  disabled={actionLoading === 'processar'}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-black font-bold rounded hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'processar' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  Processar Fila
                </button>
              </div>

              {/* Popular Fila */}
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={popularQuantidade}
                  onChange={(e) => setPopularQuantidade(Number(e.target.value))}
                  className="w-24 px-3 py-2 bg-brand-dark border border-white/10 rounded text-white"
                  min={1}
                  max={5000}
                />
                <button
                  onClick={handlePopularFila}
                  disabled={actionLoading === 'popular'}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-bold rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                >
                  {actionLoading === 'popular' ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Plus className="w-4 h-4" />
                  )}
                  Popular Fila
                </button>
              </div>

              {/* Resetar Falhas */}
              <button
                onClick={handleResetarFalhas}
                disabled={actionLoading === 'resetar'}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white font-bold rounded hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {actionLoading === 'resetar' ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <RotateCcw className="w-4 h-4" />
                )}
                Resetar Falhas
              </button>
            </div>
          </div>

          {/* Filtro e Tabela */}
          <div className="bg-brand-card border border-white/5 rounded-sm">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-white font-bold">Fila de Processamento</h3>
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
