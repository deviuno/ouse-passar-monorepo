import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, User, Calendar, List, LayoutGrid, ChevronLeft, ChevronRight, Phone, Filter } from 'lucide-react';
import { leadsService, LeadWithVendedor, adminUsersService } from '../../services/adminUsersService';
import { Tables } from '../../lib/database.types';
import { agendamentosService } from '../../services/schedulingService';
import { useAuth } from '../../lib/AuthContext';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import {
    LeadDetailsSidebar,
    KanbanColumn as KanbanColumnComponent,
    KANBAN_COLUMNS,
    getPlanejamentoUrl,
    type LeadStatus,
    type AgendamentoWithDetails,
    type LeadDifficulty,
} from '../../components/admin/leads';

type AdminUser = Tables<'admin_users'>;

export const Leads: React.FC = () => {
    const { user, isAdmin } = useAuth();
    const navigate = useNavigate();
    const [leads, setLeads] = useState<LeadWithVendedor[]>([]);
    const [allLeads, setAllLeads] = useState<LeadWithVendedor[]>([]); // Todos os leads sem filtro de status/vendedor
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'kanban' | 'list'>('kanban');
    const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [draggedLeadId, setDraggedLeadId] = useState<string | null>(null);
    const [selectedLead, setSelectedLead] = useState<LeadWithVendedor | null>(null);

    // Agendamentos
    const [agendamentosMap, setAgendamentosMap] = useState<Record<string, AgendamentoWithDetails>>({});
    const [selectedAgendamento, setSelectedAgendamento] = useState<AgendamentoWithDetails | null>(null);

    // Filtros
    const [vendedores, setVendedores] = useState<AdminUser[]>([]);
    const [selectedVendedor, setSelectedVendedor] = useState<string>('todos');
    const [selectedStatus, setSelectedStatus] = useState<string>('todos');

    // Modal de confirmacao de exclusao
    const [deleteModal, setDeleteModal] = useState<{ isOpen: boolean; leadId: string | null; leadName: string }>({
        isOpen: false,
        leadId: null,
        leadName: ''
    });
    const [isDeleting, setIsDeleting] = useState(false);

    // Carregar vendedores ao iniciar (apenas admin)
    useEffect(() => {
        if (isAdmin) {
            loadVendedores();
        }
    }, [isAdmin]);

    useEffect(() => {
        loadLeads();
    }, [selectedDate]);

    // Aplicar filtros quando mudam
    useEffect(() => {
        applyFilters();
    }, [allLeads, selectedVendedor, selectedStatus]);

    const loadVendedores = async () => {
        try {
            const data = await adminUsersService.getAll();
            // Filtrar apenas vendedores e admins ativos
            const vendedoresList = data.filter(u => (u.role === 'vendedor' || u.role === 'admin') && u.is_active);
            setVendedores(vendedoresList);
        } catch (error) {
            console.error('Erro ao carregar vendedores:', error);
        }
    };

    const normalizeStatus = (status: string | null): LeadStatus => {
        if (!status || status === 'novo' || status === 'planejamento_gerado') {
            return 'apresentacao';
        }
        return status as LeadStatus;
    };

    const applyFilters = () => {
        let filtered = [...allLeads];

        // Filtrar por vendedor (apenas admin)
        if (isAdmin && selectedVendedor !== 'todos') {
            filtered = filtered.filter(lead => lead.vendedor_id === selectedVendedor);
        }

        // Filtrar por status
        if (selectedStatus !== 'todos') {
            filtered = filtered.filter(lead => normalizeStatus(lead.status) === selectedStatus);
        }

        setLeads(filtered);
    };

    const loadLeads = async () => {
        setLoading(true);
        try {
            let data: LeadWithVendedor[];
            if (isAdmin) {
                data = await leadsService.getAll();
            } else if (user?.id) {
                const leadsData = await leadsService.getByVendedor(user.id);
                data = leadsData.map(l => ({ ...l, vendedor: undefined }));
            } else {
                data = [];
            }

            // Filtrar por data
            const filteredData = data.filter(lead => {
                const leadDate = new Date(lead.created_at || new Date().toISOString()).toISOString().split('T')[0];
                return leadDate === selectedDate;
            });

            setAllLeads(filteredData); // Armazena todos os leads filtrados por data

            // Carregar agendamentos para leads que tem agendamento_id
            const leadsWithAgendamento = filteredData.filter(l => l.agendamento_id);
            if (leadsWithAgendamento.length > 0) {
                const agendamentoIds = leadsWithAgendamento.map(l => l.agendamento_id!);
                const agendamentos = await Promise.all(
                    agendamentoIds.map(id => agendamentosService.getById(id))
                );
                const map: Record<string, AgendamentoWithDetails> = {};
                agendamentos.forEach((ag: AgendamentoWithDetails | null) => {
                    if (ag) {
                        map[ag.id] = ag;
                    }
                });
                setAgendamentosMap(map);
            } else {
                setAgendamentosMap({});
            }
        } catch (error) {
            console.error('Erro ao carregar leads:', error);
        }
        setLoading(false);
    };

    // Abre o modal de confirmacao de exclusao
    const openDeleteModal = (lead: LeadWithVendedor) => {
        setDeleteModal({
            isOpen: true,
            leadId: lead.id,
            leadName: lead.nome
        });
    };

    // Fecha o modal de confirmacao
    const closeDeleteModal = () => {
        if (!isDeleting) {
            setDeleteModal({ isOpen: false, leadId: null, leadName: '' });
        }
    };

    // Confirma a exclusao
    const handleConfirmDelete = async () => {
        if (!deleteModal.leadId) return;

        setIsDeleting(true);
        try {
            await leadsService.delete(deleteModal.leadId);
            setAllLeads(allLeads.filter(l => l.id !== deleteModal.leadId));
            setLeads(leads.filter(l => l.id !== deleteModal.leadId));
            if (selectedLead?.id === deleteModal.leadId) {
                setSelectedLead(null);
            }
            closeDeleteModal();
        } catch (error) {
            console.error('Erro ao excluir lead:', error);
            alert('Erro ao excluir lead');
        }
        setIsDeleting(false);
    };

    // Funcao wrapper para compatibilidade com componentes filhos
    const handleDelete = (id: string) => {
        const lead = allLeads.find(l => l.id === id);
        if (lead) {
            openDeleteModal(lead);
        }
    };

    const handleStatusChange = async (leadId: string, newStatus: LeadStatus) => {
        // Atualizar localmente primeiro para feedback imediato
        setAllLeads(allLeads.map(l =>
            l.id === leadId ? { ...l, status: newStatus } : l
        ));
        setLeads(leads.map(l =>
            l.id === leadId ? { ...l, status: newStatus } : l
        ));

        // Atualizar o lead selecionado se for o mesmo
        if (selectedLead?.id === leadId) {
            setSelectedLead({ ...selectedLead, status: newStatus });
        }

        try {
            await leadsService.update(leadId, { status: newStatus });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            // Reverter em caso de erro
            loadLeads();
        }
    };

    const handleLeadClick = async (lead: LeadWithVendedor) => {
        // Buscar dados atualizados do lead (pode ter sido atualizado apos criacao de planejamento)
        try {
            const updatedLead = await leadsService.getById(lead.id);
            if (updatedLead) {
                const leadWithVendedor: LeadWithVendedor = {
                    ...updatedLead,
                    vendedor: lead.vendedor // Mantem o vendedor do cache
                };
                setSelectedLead(leadWithVendedor);

                // Buscar agendamento se existir
                if (updatedLead.agendamento_id && agendamentosMap[updatedLead.agendamento_id]) {
                    setSelectedAgendamento(agendamentosMap[updatedLead.agendamento_id]);
                } else {
                    setSelectedAgendamento(null);
                }
            } else {
                setSelectedLead(lead);
                if (lead.agendamento_id && agendamentosMap[lead.agendamento_id]) {
                    setSelectedAgendamento(agendamentosMap[lead.agendamento_id]);
                } else {
                    setSelectedAgendamento(null);
                }
            }
        } catch (error) {
            console.error('Erro ao buscar lead atualizado:', error);
            // Fallback para dados em cache
            setSelectedLead(lead);
            if (lead.agendamento_id && agendamentosMap[lead.agendamento_id]) {
                setSelectedAgendamento(agendamentosMap[lead.agendamento_id]);
            } else {
                setSelectedAgendamento(null);
            }
        }
    };

    const handleStartPlanejamento = (lead: LeadWithVendedor, agendamento: AgendamentoWithDetails) => {
        // Redirecionar para a pagina de planejamentos com o lead_id
        // A pagina de planejamentos vai abrir o formulario automaticamente com os dados do lead
        navigate(`/admin/planejamentos?lead_id=${lead.id}`);
    };

    const handleTransferLead = async (leadId: string, newVendedorId: string) => {
        try {
            // Atualizar vendedor_id do lead
            await leadsService.update(leadId, { vendedor_id: newVendedorId });

            // Se tiver agendamento, atualizar vendedor do agendamento tambem
            const lead = allLeads.find(l => l.id === leadId);
            if (lead?.agendamento_id) {
                await agendamentosService.updateVendedor(lead.agendamento_id, newVendedorId);
            }

            // Recarregar leads para refletir mudancas
            await loadLeads();

            // Atualizar o lead selecionado com os novos dados
            const updatedLead = allLeads.find(l => l.id === leadId);
            if (updatedLead) {
                const newVendedor = vendedores.find(v => v.id === newVendedorId);
                setSelectedLead({ ...updatedLead, vendedor_id: newVendedorId, vendedor: newVendedor });
            }
        } catch (error) {
            console.error('Erro ao transferir lead:', error);
            alert('Erro ao transferir lead');
        }
    };

    const handleDragStart = (e: React.DragEvent, leadId: string) => {
        // Verificar se o lead e agendado - nao permitir arrastar
        const lead = leads.find(l => l.id === leadId);
        if (lead && normalizeStatus(lead.status) === 'agendado') {
            e.preventDefault();
            return;
        }
        setDraggedLeadId(leadId);
        e.dataTransfer.effectAllowed = 'move';
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
    };

    const handleDrop = async (e: React.DragEvent, newStatus: LeadStatus) => {
        e.preventDefault();
        if (!draggedLeadId) return;

        const lead = leads.find(l => l.id === draggedLeadId);
        if (!lead || normalizeStatus(lead.status) === newStatus) {
            setDraggedLeadId(null);
            return;
        }

        // Bloquear alteracao de status para leads agendados
        if (normalizeStatus(lead.status) === 'agendado') {
            setDraggedLeadId(null);
            return;
        }

        // Atualizar localmente primeiro para feedback imediato
        setAllLeads(allLeads.map(l =>
            l.id === draggedLeadId ? { ...l, status: newStatus } : l
        ));
        setLeads(leads.map(l =>
            l.id === draggedLeadId ? { ...l, status: newStatus } : l
        ));

        try {
            await leadsService.update(draggedLeadId, { status: newStatus });
        } catch (error) {
            console.error('Erro ao atualizar status:', error);
            // Reverter em caso de erro
            loadLeads();
        }

        setDraggedLeadId(null);
    };

    const getLeadsByStatus = (status: LeadStatus) => {
        return leads.filter(lead => {
            // Leads novos, sem status, ou com planejamento gerado vao para "apresentacao"
            if (!lead.status || lead.status === 'novo' || lead.status === 'apresentacao' || lead.status === 'planejamento_gerado') {
                return status === 'apresentacao';
            }
            return lead.status === status;
        });
    };

    const changeDate = (days: number) => {
        const date = new Date(selectedDate);
        date.setDate(date.getDate() + days);
        setSelectedDate(date.toISOString().split('T')[0]);
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getDifficultyLabels = (difficulties: LeadDifficulty[] | null) => {
        const labels: Record<LeadDifficulty, string> = {
            'tempo': 'Tempo',
            'nao_saber_por_onde_comecar': 'Nao saber comecar',
            'organizacao': 'Organizacao',
            'falta_de_material': 'Falta material',
            'outros': 'Outros'
        };
        if (!difficulties || difficulties.length === 0) return '-';
        return difficulties.map(d => labels[d]).join(', ');
    };

    const formatMinutesToTime = (minutos: number) => {
        const h = Math.floor(minutos / 60);
        const m = minutos % 60;
        if (h === 0) return `${m}min`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}min`;
    };

    const getStatusBadge = (status: string | null) => {
        const statusConfig: Record<string, { label: string; className: string }> = {
            'agendado': { label: 'Agendado', className: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
            'apresentacao': { label: 'Apresentacao', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            'novo': { label: 'Apresentacao', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            'planejamento_gerado': { label: 'Apresentacao', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            'followup': { label: 'Follow-up', className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' },
            'perdido': { label: 'Perdido', className: 'bg-red-500/20 text-red-400 border-red-500/30' },
            'ganho': { label: 'Ganho', className: 'bg-green-500/20 text-green-400 border-green-500/30' }
        };
        const config = statusConfig[status || 'novo'] || statusConfig['novo'];
        return (
            <span className={`px-3 py-1 rounded text-xs font-bold uppercase border ${config.className}`}>
                {config.label}
            </span>
        );
    };

    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-black text-white font-display uppercase">Alunos</h2>
                    <p className="text-gray-500 mt-1">Gerencie seus alunos e acompanhe o funil de vendas</p>
                </div>
            </div>

            {/* Barra de Filtros */}
            <div className="bg-brand-card border border-white/5 rounded-sm p-4 mb-6">
                <div className="flex items-center justify-between flex-wrap gap-4">
                    {/* Primeira linha de filtros */}
                    <div className="flex items-center gap-4 flex-wrap">
                        {/* Filtro de Data */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm font-bold uppercase">Data:</span>
                            <div className="flex items-center bg-brand-dark border border-white/10 rounded-sm">
                                <button
                                    onClick={() => changeDate(-1)}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="w-4 h-4" />
                                </button>
                                <input
                                    type="date"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                    className="bg-transparent text-white text-sm px-2 py-1 outline-none"
                                />
                                <button
                                    onClick={() => changeDate(1)}
                                    className="p-2 text-gray-400 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                            {!isToday && (
                                <button
                                    onClick={() => setSelectedDate(new Date().toISOString().split('T')[0])}
                                    className="text-xs text-brand-yellow hover:underline"
                                >
                                    Hoje
                                </button>
                            )}
                            {isToday && (
                                <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded">
                                    Hoje
                                </span>
                            )}
                        </div>

                        {/* Filtro de Vendedor (apenas admin) */}
                        {isAdmin && (
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm font-bold uppercase">Vendedor:</span>
                                <select
                                    value={selectedVendedor}
                                    onChange={(e) => setSelectedVendedor(e.target.value)}
                                    className="bg-brand-dark border border-white/10 rounded-sm text-white text-sm px-3 py-2 outline-none focus:border-brand-yellow/50 transition-colors"
                                >
                                    <option value="todos">Todos</option>
                                    {vendedores.map((v) => (
                                        <option key={v.id} value={v.id}>
                                            {v.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        {/* Filtro de Status */}
                        <div className="flex items-center gap-2">
                            <span className="text-gray-400 text-sm font-bold uppercase">Status:</span>
                            <select
                                value={selectedStatus}
                                onChange={(e) => setSelectedStatus(e.target.value)}
                                className="bg-brand-dark border border-white/10 rounded-sm text-white text-sm px-3 py-2 outline-none focus:border-brand-yellow/50 transition-colors"
                            >
                                <option value="todos">Todos</option>
                                {KANBAN_COLUMNS.map((col) => (
                                    <option key={col.id} value={col.id}>
                                        {col.title}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Indicador de filtros ativos */}
                        {(selectedVendedor !== 'todos' || selectedStatus !== 'todos') && (
                            <button
                                onClick={() => {
                                    setSelectedVendedor('todos');
                                    setSelectedStatus('todos');
                                }}
                                className="flex items-center gap-1 text-xs text-brand-yellow hover:text-brand-yellow/80 transition-colors"
                            >
                                <Filter className="w-3 h-3" />
                                Limpar filtros
                            </button>
                        )}
                    </div>

                    {/* Toggle de Visualizacao */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-bold uppercase">Visualizacao:</span>
                        <div className="flex bg-brand-dark border border-white/10 rounded-sm overflow-hidden">
                            <button
                                onClick={() => setViewMode('kanban')}
                                className={`p-2 flex items-center gap-2 text-sm transition-colors ${viewMode === 'kanban'
                                    ? 'bg-brand-yellow text-brand-darker'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <LayoutGrid className="w-4 h-4" />
                                Kanban
                            </button>
                            <button
                                onClick={() => setViewMode('list')}
                                className={`p-2 flex items-center gap-2 text-sm transition-colors ${viewMode === 'list'
                                    ? 'bg-brand-yellow text-brand-darker'
                                    : 'text-gray-400 hover:text-white'
                                    }`}
                            >
                                <List className="w-4 h-4" />
                                Lista
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Conteudo */}
            {loading ? (
                <div className="flex-1 flex items-center justify-center">
                    <div className="text-white">Carregando...</div>
                </div>
            ) : leads.length === 0 ? (
                <div className="bg-brand-card border border-white/5 rounded-sm p-12 text-center">
                    <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-4">
                        <User className="w-8 h-8 text-brand-yellow" />
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2">Nenhum lead encontrado</h3>
                    <p className="text-gray-400 mb-6">
                        Nao ha leads cadastrados para {isToday ? 'hoje' : 'esta data'}
                    </p>
                </div>
            ) : viewMode === 'kanban' ? (
                /* Visualizacao Kanban */
                <div className="flex-1 overflow-x-auto">
                    <div className="flex gap-4 min-w-max pb-4">
                        {KANBAN_COLUMNS.map((column) => (
                            <KanbanColumnComponent
                                key={column.id}
                                column={column}
                                leads={getLeadsByStatus(column.id)}
                                agendamentosMap={agendamentosMap}
                                onDragStart={handleDragStart}
                                onDragOver={handleDragOver}
                                onDrop={handleDrop}
                                onDelete={handleDelete}
                                onLeadClick={handleLeadClick}
                            />
                        ))}
                    </div>
                </div>
            ) : (
                /* Visualizacao Lista */
                <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-brand-dark/50">
                            <tr>
                                <th className="text-left text-gray-400 text-xs font-bold uppercase p-4">Lead</th>
                                <th className="text-left text-gray-400 text-xs font-bold uppercase p-4">Concurso</th>
                                <th className="text-left text-gray-400 text-xs font-bold uppercase p-4">Dificuldades</th>
                                {isAdmin && (
                                    <th className="text-left text-gray-400 text-xs font-bold uppercase p-4">Vendedor</th>
                                )}
                                <th className="text-left text-gray-400 text-xs font-bold uppercase p-4">Status</th>
                                <th className="text-left text-gray-400 text-xs font-bold uppercase p-4">Data</th>
                                <th className="text-right text-gray-400 text-xs font-bold uppercase p-4">Acoes</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {leads.map((lead) => {
                                const totalMinutos = (lead.minutos_domingo || 0) + (lead.minutos_segunda || 0) +
                                    (lead.minutos_terca || 0) + (lead.minutos_quarta || 0) +
                                    (lead.minutos_quinta || 0) + (lead.minutos_sexta || 0) +
                                    (lead.minutos_sabado || 0);

                                return (
                                    <tr
                                        key={lead.id}
                                        onClick={() => handleLeadClick(lead)}
                                        className="hover:bg-white/5 transition-colors cursor-pointer"
                                    >
                                        <td className="p-4">
                                            <div className="flex items-center">
                                                <div className="w-10 h-10 bg-brand-yellow/20 rounded-full flex items-center justify-center mr-3">
                                                    <User className="w-5 h-5 text-brand-yellow" />
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold">{lead.nome}</p>
                                                    <p className="text-gray-500 text-xs">
                                                        {lead.trabalha ? (lead.e_concursado ? 'Concursado' : 'Trabalha') : 'Nao trabalha'} |{' '}
                                                        {formatMinutesToTime(totalMinutos)}/semana
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-white text-sm">{lead.concurso_almejado}</span>
                                        </td>
                                        <td className="p-4">
                                            <span className="text-gray-400 text-sm">{getDifficultyLabels(lead.principais_dificuldades)}</span>
                                        </td>
                                        {isAdmin && (
                                            <td className="p-4">
                                                <span className="text-gray-400 text-sm">
                                                    {lead.vendedor?.name || '-'}
                                                </span>
                                            </td>
                                        )}
                                        <td className="p-4">
                                            {getStatusBadge(lead.status)}
                                        </td>
                                        <td className="p-4">
                                            <div className="flex items-center text-gray-400 text-sm">
                                                <Calendar className="w-4 h-4 mr-2" />
                                                {formatDate(lead.created_at || new Date().toISOString())}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end space-x-2">
                                                {lead.planejamento_id && (
                                                    <a
                                                        href={getPlanejamentoUrl(lead.planejamento_id, lead.agendamento_id ? agendamentosMap[lead.agendamento_id]?.preparatorio?.slug : null)}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                                                        title="Ver Planejamento"
                                                    >
                                                        <Eye className="w-4 h-4" />
                                                    </a>
                                                )}
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDelete(lead.id);
                                                    }}
                                                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Sidebar de detalhes do lead */}
            {selectedLead && (
                <LeadDetailsSidebar
                    lead={selectedLead}
                    agendamento={selectedAgendamento}
                    onClose={() => {
                        setSelectedLead(null);
                        setSelectedAgendamento(null);
                    }}
                    onDelete={handleDelete}
                    onStatusChange={handleStatusChange}
                    onStartPlanejamento={handleStartPlanejamento}
                    onTransferLead={handleTransferLead}
                    currentUserId={user?.id}
                    isAdmin={isAdmin}
                    vendedores={vendedores}
                />
            )}

            {/* Modal de confirmacao de exclusao */}
            <ConfirmDeleteModal
                isOpen={deleteModal.isOpen}
                onClose={closeDeleteModal}
                onConfirm={handleConfirmDelete}
                itemName={deleteModal.leadName}
                isLoading={isDeleting}
            />
        </div>
    );
};
