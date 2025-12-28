import React, { useState, useEffect } from 'react';
import {
  LifeBuoy,
  Search,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  Filter,
  X,
  Flag,
  ExternalLink,
  Calendar,
  LayoutGrid,
  List,
  User,
} from 'lucide-react';
import {
  questionReportsService,
  QuestionReport,
  ReportStats,
  REPORT_MOTIVOS,
  REPORT_STATUS,
  ReportMotivo,
  ReportStatus,
} from '../../services/questionReportsService';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../lib/AuthContext';

export const Suporte: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [reports, setReports] = useState<QuestionReport[]>([]);
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  // Filters - Por padrão, mostra todos (para Kanban)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<ReportStatus | ''>('');
  const [filterMotivo, setFilterMotivo] = useState<ReportMotivo | ''>('');
  const [dateStart, setDateStart] = useState<string>('');
  const [dateEnd, setDateEnd] = useState<string>('');

  // Modal
  const [selectedReport, setSelectedReport] = useState<QuestionReport | null>(null);
  const [adminResposta, setAdminResposta] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [reportsData, statsData] = await Promise.all([
        questionReportsService.getAll({
          status: filterStatus || undefined,
          motivo: filterMotivo || undefined,
          searchTerm: searchTerm || undefined,
          dateStart: dateStart || undefined,
          dateEnd: dateEnd || undefined,
        }),
        questionReportsService.getStats(),
      ]);

      setReports(reportsData);
      setStats(statsData);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Apply filters
  useEffect(() => {
    const timer = setTimeout(() => {
      loadData();
    }, 300);
    return () => clearTimeout(timer);
  }, [searchTerm, filterStatus, filterMotivo, dateStart, dateEnd]);

  const handleUpdateStatus = async (status: ReportStatus) => {
    if (!selectedReport || !user?.id) return;

    setIsUpdating(true);
    try {
      await questionReportsService.updateStatus(
        selectedReport.id,
        status,
        user.id,
        adminResposta.trim() || undefined
      );

      toast.success(`Status atualizado para "${REPORT_STATUS.find(s => s.value === status)?.label}"`);
      setSelectedReport(null);
      setAdminResposta('');
      loadData();
      // Disparar evento para atualizar contador no menu
      window.dispatchEvent(new CustomEvent('reports-updated'));
    } catch (err: any) {
      toast.error('Erro ao atualizar status');
    } finally {
      setIsUpdating(false);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setFilterStatus('');
    setFilterMotivo('');
    setDateStart('');
    setDateEnd('');
  };

  const hasFilters = searchTerm || filterStatus || filterMotivo || dateStart || dateEnd;

  // Kanban columns
  const KANBAN_COLUMNS: { status: ReportStatus; label: string; color: string; bgColor: string }[] = [
    { status: 'pendente', label: 'Pendentes', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
    { status: 'em_analise', label: 'Em Análise', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' },
    { status: 'resolvido', label: 'Resolvidos', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/30' },
    { status: 'rejeitado', label: 'Rejeitados', color: 'text-red-400', bgColor: 'bg-red-500/10 border-red-500/30' },
  ];

  const getReportsByStatus = (status: ReportStatus) => {
    return reports.filter(r => r.status === status);
  };

  const handleMoveToStatus = async (report: QuestionReport, newStatus: ReportStatus) => {
    if (!user?.id) return;

    try {
      await questionReportsService.updateStatus(report.id, newStatus, user.id);
      toast.success(`Report movido para "${REPORT_STATUS.find(s => s.value === newStatus)?.label}"`);
      loadData();
      window.dispatchEvent(new CustomEvent('reports-updated'));
    } catch (err) {
      toast.error('Erro ao mover report');
    }
  };

  const getStatusColor = (status: ReportStatus) => {
    switch (status) {
      case 'pendente':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'em_analise':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'resolvido':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'rejeitado':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const getStatusIcon = (status: ReportStatus) => {
    switch (status) {
      case 'pendente':
        return <Clock size={14} />;
      case 'em_analise':
        return <Eye size={14} />;
      case 'resolvido':
        return <CheckCircle size={14} />;
      case 'rejeitado':
        return <XCircle size={14} />;
      default:
        return null;
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-yellow/20 rounded-sm flex items-center justify-center">
            <Flag className="w-5 h-5 text-brand-yellow" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase font-display">
              Reportes
            </h1>
            <p className="text-gray-500 text-sm">
              Reclamações de questões reportadas pelos usuários
            </p>
          </div>
        </div>

        {/* View Mode Toggle */}
        <div className="flex items-center gap-1 bg-brand-card border border-white/5 rounded-sm p-1">
          <button
            onClick={() => setViewMode('kanban')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
              viewMode === 'kanban'
                ? 'bg-brand-yellow text-brand-darker'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <LayoutGrid size={16} />
            Kanban
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-sm text-sm font-medium transition-colors ${
              viewMode === 'list'
                ? 'bg-brand-yellow text-brand-darker'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            <List size={16} />
            Lista
          </button>
        </div>
      </div>

      {/* Stats Cards - Botões de Filtro */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-6">
          <button
            onClick={() => setFilterStatus('pendente')}
            className={`bg-brand-card rounded-sm p-4 text-left transition-all ${
              filterStatus === 'pendente'
                ? 'border-2 border-yellow-500 ring-2 ring-yellow-500/20'
                : 'border border-yellow-500/20 hover:border-yellow-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-yellow-400">{stats.pendentes}</p>
            <p className="text-xs text-gray-500 uppercase">Pendentes</p>
          </button>
          <button
            onClick={() => setFilterStatus('em_analise')}
            className={`bg-brand-card rounded-sm p-4 text-left transition-all ${
              filterStatus === 'em_analise'
                ? 'border-2 border-blue-500 ring-2 ring-blue-500/20'
                : 'border border-blue-500/20 hover:border-blue-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-blue-400">{stats.em_analise}</p>
            <p className="text-xs text-gray-500 uppercase">Em Análise</p>
          </button>
          <button
            onClick={() => setFilterStatus('resolvido')}
            className={`bg-brand-card rounded-sm p-4 text-left transition-all ${
              filterStatus === 'resolvido'
                ? 'border-2 border-green-500 ring-2 ring-green-500/20'
                : 'border border-green-500/20 hover:border-green-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-green-400">{stats.resolvidos}</p>
            <p className="text-xs text-gray-500 uppercase">Resolvidos</p>
          </button>
          <button
            onClick={() => setFilterStatus('rejeitado')}
            className={`bg-brand-card rounded-sm p-4 text-left transition-all ${
              filterStatus === 'rejeitado'
                ? 'border-2 border-red-500 ring-2 ring-red-500/20'
                : 'border border-red-500/20 hover:border-red-500/50'
            }`}
          >
            <p className="text-2xl font-bold text-red-400">{stats.rejeitados}</p>
            <p className="text-xs text-gray-500 uppercase">Rejeitados</p>
          </button>
          <button
            onClick={() => setFilterStatus('')}
            className={`bg-brand-card rounded-sm p-4 text-left transition-all ${
              filterStatus === ''
                ? 'border-2 border-white ring-2 ring-white/20'
                : 'border border-white/5 hover:border-white/20'
            }`}
          >
            <p className="text-2xl font-bold text-white">{stats.total}</p>
            <p className="text-xs text-gray-500 uppercase">Total</p>
          </button>
        </div>
      )}

      {/* Filters */}
      <div className="bg-brand-card border border-white/5 rounded-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por ID da questão ou matéria..."
                className="w-full pl-10 pr-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow"
              />
            </div>
          </div>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ReportStatus | '')}
            className="px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow"
          >
            <option value="">Todos os Status</option>
            {REPORT_STATUS.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          {/* Motivo Filter */}
          <select
            value={filterMotivo}
            onChange={(e) => setFilterMotivo(e.target.value as ReportMotivo | '')}
            className="px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow"
          >
            <option value="">Todos os Motivos</option>
            {REPORT_MOTIVOS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <div className="flex items-center gap-2 bg-brand-dark border border-white/10 rounded-sm px-3 py-1">
            <Calendar className="w-4 h-4 text-gray-500" />
            <input
              type="date"
              value={dateStart}
              onChange={(e) => setDateStart(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
              title="Data inicial"
            />
            <span className="text-gray-500">—</span>
            <input
              type="date"
              value={dateEnd}
              onChange={(e) => setDateEnd(e.target.value)}
              className="bg-transparent text-white text-sm focus:outline-none [&::-webkit-calendar-picker-indicator]:invert"
              title="Data final"
            />
            {(dateStart || dateEnd) && (
              <button
                onClick={() => {
                  setDateStart('');
                  setDateEnd('');
                }}
                className="text-gray-400 hover:text-white ml-1"
                title="Limpar período"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors flex items-center gap-2"
            >
              <X size={16} />
              Limpar
            </button>
          )}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-red-500" />
          <p className="text-red-400">{error}</p>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
        </div>
      )}

      {/* Empty State */}
      {!loading && reports.length === 0 && (
        <div className="text-center py-12">
          <Flag className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Nenhum report encontrado</h3>
          <p className="text-gray-500 text-sm">
            {hasFilters
              ? 'Tente ajustar os filtros de busca'
              : 'Os reports de questões aparecerão aqui'}
          </p>
        </div>
      )}

      {/* Kanban View */}
      {!loading && reports.length > 0 && viewMode === 'kanban' && (
        <div className="flex gap-4 overflow-x-auto pb-4">
          {KANBAN_COLUMNS.map((column) => {
            const columnReports = getReportsByStatus(column.status);
            return (
              <div
                key={column.status}
                className="flex-shrink-0 w-72 bg-brand-card border border-white/5 rounded-sm"
              >
                {/* Column Header */}
                <div className={`p-3 border-b ${column.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-sm uppercase ${column.color}`}>
                      {column.label}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${column.bgColor} ${column.color}`}>
                      {columnReports.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                  {columnReports.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 text-sm">
                      Nenhum report
                    </div>
                  ) : (
                    columnReports.map((report) => (
                      <div
                        key={report.id}
                        className="bg-brand-dark border border-white/5 rounded-sm p-3 hover:border-white/20 transition-colors cursor-pointer group"
                        onClick={() => {
                          setSelectedReport(report);
                          setAdminResposta(report.admin_resposta || '');
                        }}
                      >
                        {/* Question ID */}
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-mono text-sm">#{report.question_id}</span>
                          <span className="text-[10px] text-gray-500">
                            {formatDate(report.created_at)}
                          </span>
                        </div>

                        {/* User */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-5 h-5 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                            <User size={10} className="text-brand-yellow" />
                          </div>
                          <span className="text-gray-300 text-xs truncate">
                            {report.user_profile?.name || report.user_profile?.email || 'Anônimo'}
                          </span>
                        </div>

                        {/* Motivo */}
                        <p className="text-gray-400 text-xs mb-1">
                          {REPORT_MOTIVOS.find((m) => m.value === report.motivo)?.label}
                        </p>

                        {/* Matéria */}
                        <p className="text-gray-500 text-[10px] truncate">
                          {report.question_materia}
                          {report.question_banca && ` • ${report.question_banca}`}
                        </p>

                        {/* Quick Actions */}
                        <div className="hidden group-hover:flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
                          {column.status === 'pendente' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMoveToStatus(report, 'em_analise');
                              }}
                              className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                            >
                              Analisar
                            </button>
                          )}
                          {(column.status === 'pendente' || column.status === 'em_analise') && (
                            <>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveToStatus(report, 'resolvido');
                                }}
                                className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                              >
                                Resolver
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleMoveToStatus(report, 'rejeitado');
                                }}
                                className="text-[10px] px-2 py-1 bg-red-500/20 text-red-400 rounded hover:bg-red-500/30"
                              >
                                Rejeitar
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* List View (Table) */}
      {!loading && reports.length > 0 && viewMode === 'list' && (
        <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Questão
                </th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Matéria
                </th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Motivo
                </th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Usuário
                </th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Data
                </th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Status
                </th>
                <th className="text-right px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Ações
                </th>
              </tr>
            </thead>
            <tbody>
              {reports.map((report) => (
                <tr
                  key={report.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-white font-mono">#{report.question_id}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300">{report.question_materia || '-'}</span>
                    {report.question_banca && (
                      <span className="text-gray-500 text-xs ml-2">
                        ({report.question_banca} {report.question_ano})
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300">
                      {REPORT_MOTIVOS.find((m) => m.value === report.motivo)?.label || report.motivo}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-400 text-sm">
                      {report.user_profile?.name || report.user_profile?.email || 'Anônimo'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-500 text-sm">{formatDate(report.created_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${getStatusColor(
                        report.status
                      )}`}
                    >
                      {getStatusIcon(report.status)}
                      {REPORT_STATUS.find((s) => s.value === report.status)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => {
                        setSelectedReport(report);
                        setAdminResposta(report.admin_resposta || '');
                      }}
                      className="p-2 hover:bg-white/10 rounded-sm transition-colors text-gray-400 hover:text-white"
                      title="Ver detalhes"
                    >
                      <Eye size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Detail Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Flag className="w-5 h-5 text-brand-yellow" />
                <h3 className="text-lg font-bold text-white">
                  Report da Questão #{selectedReport.question_id}
                </h3>
              </div>
              <button
                onClick={() => {
                  setSelectedReport(null);
                  setAdminResposta('');
                }}
                className="p-2 hover:bg-white/10 rounded-sm transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              {/* Question Info */}
              <div className="bg-brand-dark/50 rounded-sm p-4">
                <h4 className="text-white font-medium mb-2">Informações da Questão</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">ID:</span>
                    <span className="text-white ml-2">#{selectedReport.question_id}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Matéria:</span>
                    <span className="text-white ml-2">{selectedReport.question_materia || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Banca:</span>
                    <span className="text-white ml-2">{selectedReport.question_banca || '-'}</span>
                  </div>
                  <div>
                    <span className="text-gray-500">Ano:</span>
                    <span className="text-white ml-2">{selectedReport.question_ano || '-'}</span>
                  </div>
                </div>
              </div>

              {/* Report Info */}
              <div className="bg-brand-dark/50 rounded-sm p-4">
                <h4 className="text-white font-medium mb-2">Detalhes do Report</h4>
                <div className="space-y-3">
                  <div>
                    <span className="text-gray-500 text-sm">Motivo:</span>
                    <p className="text-white">
                      {REPORT_MOTIVOS.find((m) => m.value === selectedReport.motivo)?.label}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Descrição do usuário:</span>
                    <p className="text-white">{selectedReport.descricao || 'Nenhuma descrição fornecida'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Reportado por:</span>
                    <p className="text-white">
                      {selectedReport.user_profile?.name || selectedReport.user_profile?.email || 'Anônimo'}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Data:</span>
                    <p className="text-white">{formatDate(selectedReport.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-sm">Status atual:</span>
                    <span
                      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ml-2 ${getStatusColor(
                        selectedReport.status
                      )}`}
                    >
                      {getStatusIcon(selectedReport.status)}
                      {REPORT_STATUS.find((s) => s.value === selectedReport.status)?.label}
                    </span>
                  </div>
                </div>
              </div>

              {/* Admin Response */}
              <div>
                <label className="block text-white text-sm font-medium mb-2">
                  Resposta do Admin (opcional)
                </label>
                <textarea
                  value={adminResposta}
                  onChange={(e) => setAdminResposta(e.target.value)}
                  placeholder="Adicione uma nota sobre a resolução..."
                  rows={3}
                  className="w-full px-4 py-3 bg-brand-dark border border-white/10 rounded-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-brand-yellow"
                />
              </div>

              {/* Previous Response */}
              {selectedReport.admin_resposta && selectedReport.status !== 'pendente' && (
                <div className="bg-blue-500/10 border border-blue-500/30 rounded-sm p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare size={16} className="text-blue-400" />
                    <span className="text-blue-400 text-sm font-medium">Resposta anterior</span>
                  </div>
                  <p className="text-white text-sm">{selectedReport.admin_resposta}</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/10 flex flex-wrap gap-3">
              <button
                onClick={() => handleUpdateStatus('em_analise')}
                disabled={isUpdating || selectedReport.status === 'em_analise'}
                className="flex-1 py-2 bg-blue-500 text-white rounded-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Eye size={16} />}
                Em Análise
              </button>
              <button
                onClick={() => handleUpdateStatus('resolvido')}
                disabled={isUpdating}
                className="flex-1 py-2 bg-green-500 text-white rounded-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                Resolvido
              </button>
              <button
                onClick={() => handleUpdateStatus('rejeitado')}
                disabled={isUpdating}
                className="flex-1 py-2 bg-red-500 text-white rounded-sm font-medium hover:bg-red-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                Rejeitar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Suporte;
