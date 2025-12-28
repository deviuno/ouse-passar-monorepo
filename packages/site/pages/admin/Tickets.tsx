import React, { useState, useEffect } from 'react';
import {
  Ticket,
  Search,
  Loader2,
  AlertCircle,
  Clock,
  CheckCircle,
  XCircle,
  Eye,
  MessageSquare,
  X,
  Send,
  Paperclip,
  ExternalLink,
  User,
  ArrowRight,
  LayoutGrid,
  List,
} from 'lucide-react';
import { DateRangePicker } from '../../components/ui/DateRangePicker';
import {
  ticketsService,
  Ticket as TicketType,
  TicketMessage,
  TicketStats,
  TICKET_MOTIVOS,
  TICKET_STATUS,
  TICKET_PRIORIDADES,
  TicketMotivo,
  TicketStatus,
  TicketPrioridade,
} from '../../services/ticketsService';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../lib/AuthContext';

// Kanban columns configuration
const KANBAN_COLUMNS: { status: TicketStatus; label: string; color: string; bgColor: string }[] = [
  { status: 'aberto', label: 'Abertos', color: 'text-yellow-400', bgColor: 'bg-yellow-500/10 border-yellow-500/30' },
  { status: 'em_andamento', label: 'Em Andamento', color: 'text-blue-400', bgColor: 'bg-blue-500/10 border-blue-500/30' },
  { status: 'aguardando_usuario', label: 'Aguardando', color: 'text-purple-400', bgColor: 'bg-purple-500/10 border-purple-500/30' },
  { status: 'resolvido', label: 'Resolvidos', color: 'text-green-400', bgColor: 'bg-green-500/10 border-green-500/30' },
  { status: 'fechado', label: 'Fechados', color: 'text-gray-400', bgColor: 'bg-gray-500/10 border-gray-500/30' },
];

export const Tickets: React.FC = () => {
  const toast = useToast();
  const { user } = useAuth();
  const [tickets, setTickets] = useState<TicketType[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // View mode
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('kanban');

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPrioridade, setFilterPrioridade] = useState<TicketPrioridade | ''>('');
  const [filterMotivo, setFilterMotivo] = useState<TicketMotivo | ''>('');
  const [dateRange, setDateRange] = useState<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  // Modal
  const [selectedTicket, setSelectedTicket] = useState<TicketType | null>(null);
  const [ticketMessages, setTicketMessages] = useState<TicketMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  const [isSending, setIsSending] = useState(false);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [ticketsData, statsData] = await Promise.all([
        ticketsService.getAll({
          searchTerm: searchTerm || undefined,
          prioridade: filterPrioridade || undefined,
          motivo: filterMotivo || undefined,
          dateStart: dateRange.start || undefined,
          dateEnd: dateRange.end || undefined,
        }),
        ticketsService.getStats(),
      ]);

      setTickets(ticketsData);
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
  }, [searchTerm, filterPrioridade, filterMotivo, dateRange.start, dateRange.end]);

  const hasFilters = searchTerm || filterPrioridade || filterMotivo || dateRange.start || dateRange.end;

  const clearFilters = () => {
    setSearchTerm('');
    setFilterPrioridade('');
    setFilterMotivo('');
    setDateRange({ start: null, end: null });
  };

  const openTicketDetail = async (ticket: TicketType) => {
    setSelectedTicket(ticket);
    try {
      const messages = await ticketsService.getMessages(ticket.id);
      setTicketMessages(messages);
    } catch (err) {
      console.error('Error loading messages:', err);
    }
  };

  const handleUpdateStatus = async (newStatus: TicketStatus) => {
    if (!selectedTicket || !user?.id) return;

    setIsUpdating(true);
    try {
      await ticketsService.updateStatus(selectedTicket.id, newStatus, user.id);
      toast.success(`Status atualizado para "${TICKET_STATUS.find(s => s.value === newStatus)?.label}"`);

      // Update local state
      setSelectedTicket({ ...selectedTicket, status: newStatus });
      loadData();
      window.dispatchEvent(new CustomEvent('tickets-updated'));
    } catch (err: any) {
      toast.error('Erro ao atualizar status');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleSendMessage = async () => {
    if (!selectedTicket || !user?.id || !newMessage.trim()) return;

    setIsSending(true);
    try {
      const success = await ticketsService.sendAdminMessage(
        selectedTicket.id,
        user.id,
        newMessage.trim()
      );

      if (success) {
        setNewMessage('');
        const messages = await ticketsService.getMessages(selectedTicket.id);
        setTicketMessages(messages);
        toast.success('Mensagem enviada');
      } else {
        toast.error('Erro ao enviar mensagem');
      }
    } catch (err) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setIsSending(false);
    }
  };

  const handleMoveToColumn = async (ticket: TicketType, newStatus: TicketStatus) => {
    if (!user?.id) return;

    try {
      await ticketsService.updateStatus(ticket.id, newStatus, user.id);
      toast.success(`Ticket movido para "${TICKET_STATUS.find(s => s.value === newStatus)?.label}"`);
      loadData();
      window.dispatchEvent(new CustomEvent('tickets-updated'));
    } catch (err) {
      toast.error('Erro ao mover ticket');
    }
  };

  const getPrioridadeColor = (prioridade: TicketPrioridade) => {
    switch (prioridade) {
      case 'baixa': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'normal': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'alta': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
      case 'urgente': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter(t => t.status === status);
  };

  return (
    <div className="p-6 overflow-x-hidden">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-yellow/20 rounded-sm flex items-center justify-center">
            <Ticket className="w-5 h-5 text-brand-yellow" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-white uppercase font-display">
              Tickets
            </h1>
            <p className="text-gray-500 text-sm">
              Atendimento ao cliente
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

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-3 md:grid-cols-6 gap-3 mb-6">
          <div className="bg-brand-card border border-white/5 rounded-sm p-3 text-center">
            <p className="text-xl font-bold text-white">{stats.total}</p>
            <p className="text-[10px] text-gray-500 uppercase">Total</p>
          </div>
          <div className="bg-brand-card border border-yellow-500/20 rounded-sm p-3 text-center">
            <p className="text-xl font-bold text-yellow-400">{stats.abertos}</p>
            <p className="text-[10px] text-gray-500 uppercase">Abertos</p>
          </div>
          <div className="bg-brand-card border border-blue-500/20 rounded-sm p-3 text-center">
            <p className="text-xl font-bold text-blue-400">{stats.em_andamento}</p>
            <p className="text-[10px] text-gray-500 uppercase">Andamento</p>
          </div>
          <div className="bg-brand-card border border-purple-500/20 rounded-sm p-3 text-center">
            <p className="text-xl font-bold text-purple-400">{stats.aguardando_usuario}</p>
            <p className="text-[10px] text-gray-500 uppercase">Aguardando</p>
          </div>
          <div className="bg-brand-card border border-green-500/20 rounded-sm p-3 text-center">
            <p className="text-xl font-bold text-green-400">{stats.resolvidos}</p>
            <p className="text-[10px] text-gray-500 uppercase">Resolvidos</p>
          </div>
          <div className="bg-brand-card border border-gray-500/20 rounded-sm p-3 text-center">
            <p className="text-xl font-bold text-gray-400">{stats.fechados}</p>
            <p className="text-[10px] text-gray-500 uppercase">Fechados</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-brand-card border border-white/5 rounded-sm p-4 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, email ou mensagem..."
                className="w-full pl-10 pr-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white placeholder-gray-500 focus:outline-none focus:border-brand-yellow"
              />
            </div>
          </div>

          {/* Motivo Filter */}
          <select
            value={filterMotivo}
            onChange={(e) => setFilterMotivo(e.target.value as TicketMotivo | '')}
            className="px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow"
          >
            <option value="">Todos os Assuntos</option>
            {TICKET_MOTIVOS.map((m) => (
              <option key={m.value} value={m.value}>
                {m.label}
              </option>
            ))}
          </select>

          {/* Prioridade Filter */}
          <select
            value={filterPrioridade}
            onChange={(e) => setFilterPrioridade(e.target.value as TicketPrioridade | '')}
            className="px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow"
          >
            <option value="">Todas Prioridades</option>
            {TICKET_PRIORIDADES.map((p) => (
              <option key={p.value} value={p.value}>
                {p.label}
              </option>
            ))}
          </select>

          {/* Date Range Filter */}
          <DateRangePicker
            value={dateRange}
            onChange={setDateRange}
            placeholder="Período"
          />

          {/* Clear Filters */}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="p-2 text-red-400/70 hover:text-red-400 hover:bg-red-500/10 rounded-sm transition-colors"
              title="Limpar filtros"
            >
              <X size={18} />
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

      {/* Kanban Board */}
      {!loading && viewMode === 'kanban' && tickets.length > 0 && (
        <div className="overflow-x-auto pb-4">
          <div className="flex gap-3" style={{ minWidth: `${KANBAN_COLUMNS.length * 25}%` }}>
          {KANBAN_COLUMNS.map((column) => {
            const columnTickets = getTicketsByStatus(column.status);
            return (
              <div
                key={column.status}
                className="flex-1 min-w-0 bg-brand-card border border-white/5 rounded-sm"
              >
                {/* Column Header */}
                <div className={`p-3 border-b ${column.bgColor}`}>
                  <div className="flex items-center justify-between">
                    <span className={`font-bold text-sm uppercase ${column.color}`}>
                      {column.label}
                    </span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${column.bgColor} ${column.color}`}>
                      {columnTickets.length}
                    </span>
                  </div>
                </div>

                {/* Column Content */}
                <div className="p-2 space-y-2 max-h-[60vh] overflow-y-auto">
                  {columnTickets.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 text-sm">
                      Nenhum ticket
                    </div>
                  ) : (
                    columnTickets.map((ticket) => (
                      <div
                        key={ticket.id}
                        className="bg-brand-dark border border-white/5 rounded-sm p-3 hover:border-white/20 transition-colors cursor-pointer group"
                        onClick={() => openTicketDetail(ticket)}
                      >
                        {/* Ticket Header */}
                        <div className="flex items-start justify-between mb-2">
                          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getPrioridadeColor(ticket.prioridade)}`}>
                            {TICKET_PRIORIDADES.find(p => p.value === ticket.prioridade)?.label}
                          </span>
                          <span className="text-[10px] text-gray-500">
                            {formatDate(ticket.created_at)}
                          </span>
                        </div>

                        {/* User */}
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-6 h-6 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                            <User size={12} className="text-brand-yellow" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">
                              {ticket.user_name || 'Usuário'}
                            </p>
                          </div>
                        </div>

                        {/* Motivo */}
                        <p className="text-gray-400 text-xs mb-2">
                          {TICKET_MOTIVOS.find(m => m.value === ticket.motivo)?.label}
                          {ticket.motivo === 'outro' && ticket.motivo_outro && (
                            <span className="text-gray-500"> - {ticket.motivo_outro}</span>
                          )}
                        </p>

                        {/* Message Preview */}
                        <p className="text-gray-500 text-xs line-clamp-2">
                          {ticket.mensagem}
                        </p>

                        {/* Anexos indicator */}
                        {ticket.anexos && ticket.anexos.length > 0 && (
                          <div className="flex items-center gap-1 mt-2 text-gray-500 text-xs">
                            <Paperclip size={12} />
                            {ticket.anexos.length} anexo(s)
                          </div>
                        )}

                        {/* Quick Actions */}
                        <div className="hidden group-hover:flex items-center gap-1 mt-2 pt-2 border-t border-white/5">
                          {column.status !== 'fechado' && (
                            <>
                              {column.status !== 'em_andamento' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToColumn(ticket, 'em_andamento');
                                  }}
                                  className="text-[10px] px-2 py-1 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30"
                                >
                                  Iniciar
                                </button>
                              )}
                              {column.status !== 'resolvido' && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleMoveToColumn(ticket, 'resolvido');
                                  }}
                                  className="text-[10px] px-2 py-1 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30"
                                >
                                  Resolver
                                </button>
                              )}
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
        </div>
      )}

      {/* List View */}
      {!loading && viewMode === 'list' && tickets.length > 0 && (
        <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Usuário
                </th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Assunto
                </th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Mensagem
                </th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Data
                </th>
                <th className="text-left px-4 py-3 text-gray-500 text-xs uppercase font-medium">
                  Prioridade
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
              {tickets.map((ticket) => (
                <tr
                  key={ticket.id}
                  className="border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer"
                  onClick={() => openTicketDetail(ticket)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                        <User size={14} className="text-brand-yellow" />
                      </div>
                      <div>
                        <p className="text-white text-sm font-medium">{ticket.user_name || 'Usuário'}</p>
                        <p className="text-gray-500 text-xs">{ticket.user_email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-300 text-sm">
                      {TICKET_MOTIVOS.find(m => m.value === ticket.motivo)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-gray-400 text-sm truncate max-w-[200px]">{ticket.mensagem}</p>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-gray-500 text-sm">{formatDate(ticket.created_at)}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${getPrioridadeColor(ticket.prioridade)}`}>
                      {TICKET_PRIORIDADES.find(p => p.value === ticket.prioridade)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium border ${
                      ticket.status === 'aberto' ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' :
                      ticket.status === 'em_andamento' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' :
                      ticket.status === 'aguardando_usuario' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                      ticket.status === 'resolvido' ? 'bg-green-500/20 text-green-400 border-green-500/30' :
                      'bg-gray-500/20 text-gray-400 border-gray-500/30'
                    }`}>
                      {TICKET_STATUS.find(s => s.value === ticket.status)?.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openTicketDetail(ticket);
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

      {/* Empty State */}
      {!loading && tickets.length === 0 && (
        <div className="text-center py-12">
          <Ticket className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-white font-medium mb-2">Nenhum ticket encontrado</h3>
          <p className="text-gray-500 text-sm">
            {hasFilters
              ? 'Tente ajustar os filtros de busca'
              : 'Os tickets de suporte aparecerão aqui'}
          </p>
        </div>
      )}

      {/* Detail Modal */}
      {selectedTicket && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-3xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <div className="flex items-center gap-3">
                <Ticket className="w-5 h-5 text-brand-yellow" />
                <div>
                  <h3 className="text-lg font-bold text-white">
                    Ticket de {selectedTicket.user_name || 'Usuário'}
                  </h3>
                  <p className="text-gray-500 text-sm">{selectedTicket.user_email}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setSelectedTicket(null);
                  setTicketMessages([]);
                  setNewMessage('');
                }}
                className="p-2 hover:bg-white/10 rounded-sm transition-colors"
              >
                <X className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {/* Ticket Info */}
              <div className="bg-brand-dark/50 rounded-sm p-4">
                <div className="flex flex-wrap gap-4 mb-4">
                  <div>
                    <span className="text-gray-500 text-xs block">Motivo</span>
                    <span className="text-white text-sm">
                      {TICKET_MOTIVOS.find(m => m.value === selectedTicket.motivo)?.label}
                      {selectedTicket.motivo === 'outro' && selectedTicket.motivo_outro && (
                        <span className="text-gray-400"> - {selectedTicket.motivo_outro}</span>
                      )}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Prioridade</span>
                    <span className={`text-sm px-2 py-0.5 rounded border ${getPrioridadeColor(selectedTicket.prioridade)}`}>
                      {TICKET_PRIORIDADES.find(p => p.value === selectedTicket.prioridade)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Status</span>
                    <span className="text-white text-sm">
                      {TICKET_STATUS.find(s => s.value === selectedTicket.status)?.label}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Criado em</span>
                    <span className="text-white text-sm">{formatDate(selectedTicket.created_at)}</span>
                  </div>
                </div>

                <div>
                  <span className="text-gray-500 text-xs block mb-1">Mensagem</span>
                  <p className="text-white text-sm whitespace-pre-wrap">{selectedTicket.mensagem}</p>
                </div>

                {/* Anexos */}
                {selectedTicket.anexos && selectedTicket.anexos.length > 0 && (
                  <div className="mt-4">
                    <span className="text-gray-500 text-xs block mb-2">Anexos</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedTicket.anexos.map((anexo, index) => (
                        <a
                          key={index}
                          href={anexo.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 px-3 py-2 bg-brand-dark border border-white/10 rounded-sm hover:border-brand-yellow/50 transition-colors"
                        >
                          <Paperclip size={14} className="text-gray-400" />
                          <span className="text-white text-sm truncate max-w-[150px]">{anexo.name}</span>
                          <ExternalLink size={12} className="text-gray-500" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              {ticketMessages.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-white font-medium">Histórico de Mensagens</h4>
                  {ticketMessages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`p-3 rounded-sm ${
                        msg.sender_type === 'admin'
                          ? 'bg-brand-yellow/10 border border-brand-yellow/30 ml-8'
                          : 'bg-brand-dark border border-white/10 mr-8'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-xs font-medium ${
                          msg.sender_type === 'admin' ? 'text-brand-yellow' : 'text-gray-400'
                        }`}>
                          {msg.sender_type === 'admin' ? 'Suporte' : selectedTicket.user_name || 'Usuário'}
                        </span>
                        <span className="text-gray-500 text-xs">{formatDate(msg.created_at)}</span>
                      </div>
                      <p className="text-white text-sm">{msg.mensagem}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Reply Input */}
              <div className="bg-brand-dark/50 rounded-sm p-4">
                <h4 className="text-white font-medium mb-2">Responder</h4>
                <textarea
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Digite sua resposta..."
                  rows={3}
                  className="w-full px-4 py-3 bg-brand-dark border border-white/10 rounded-sm text-white placeholder-gray-500 resize-none focus:outline-none focus:border-brand-yellow"
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={handleSendMessage}
                    disabled={isSending || !newMessage.trim()}
                    className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-medium hover:bg-brand-yellow/90 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
                    Enviar
                  </button>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-white/10 flex flex-wrap gap-3">
              {selectedTicket.status !== 'em_andamento' && selectedTicket.status !== 'resolvido' && selectedTicket.status !== 'fechado' && (
                <button
                  onClick={() => handleUpdateStatus('em_andamento')}
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-blue-500 text-white rounded-sm font-medium hover:bg-blue-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  Em Andamento
                </button>
              )}
              {selectedTicket.status !== 'aguardando_usuario' && selectedTicket.status !== 'resolvido' && selectedTicket.status !== 'fechado' && (
                <button
                  onClick={() => handleUpdateStatus('aguardando_usuario')}
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-purple-500 text-white rounded-sm font-medium hover:bg-purple-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <Clock size={16} />}
                  Aguardando
                </button>
              )}
              {selectedTicket.status !== 'resolvido' && selectedTicket.status !== 'fechado' && (
                <button
                  onClick={() => handleUpdateStatus('resolvido')}
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-green-500 text-white rounded-sm font-medium hover:bg-green-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle size={16} />}
                  Resolvido
                </button>
              )}
              {selectedTicket.status !== 'fechado' && (
                <button
                  onClick={() => handleUpdateStatus('fechado')}
                  disabled={isUpdating}
                  className="flex-1 py-2 bg-gray-600 text-white rounded-sm font-medium hover:bg-gray-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isUpdating ? <Loader2 size={16} className="animate-spin" /> : <XCircle size={16} />}
                  Fechar
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tickets;
