import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, Trash2, User, Calendar, List, LayoutGrid, ChevronLeft, ChevronRight, GripVertical, Phone, X, Clock, Briefcase, GraduationCap, Target, AlertCircle, Filter, Video, PlayCircle, UserCog, ChevronDown, Loader2, Copy, MessageCircle, Key, ExternalLink, FileText } from 'lucide-react';
import { leadsService, LeadWithVendedor, adminUsersService } from '../../services/adminUsersService';
import { LeadDifficulty, EducationLevel, LeadGender, AdminUser, AgendamentoWithDetails } from '../../lib/database.types';
import { agendamentosService } from '../../services/schedulingService';
import { useAuth } from '../../lib/AuthContext';
import { ConfirmDeleteModal } from '../../components/ui/ConfirmDeleteModal';
import { generateInviteMessage, generateWhatsAppUrl } from '../../services/studentService';

// Status do Kanban
type LeadStatus = 'agendado' | 'apresentacao' | 'followup' | 'perdido' | 'ganho';

interface KanbanColumn {
    id: LeadStatus;
    title: string;
    color: string;
    bgColor: string;
    borderColor: string;
}

const KANBAN_COLUMNS: KanbanColumn[] = [
    {
        id: 'agendado',
        title: 'Agendado',
        color: 'text-purple-400',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/30'
    },
    {
        id: 'apresentacao',
        title: 'Apresentação',
        color: 'text-blue-400',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/30'
    },
    {
        id: 'followup',
        title: 'Follow-up',
        color: 'text-yellow-400',
        bgColor: 'bg-yellow-500/10',
        borderColor: 'border-yellow-500/30'
    },
    {
        id: 'perdido',
        title: 'Perdido',
        color: 'text-red-400',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/30'
    },
    {
        id: 'ganho',
        title: 'Ganho',
        color: 'text-green-400',
        bgColor: 'bg-green-500/10',
        borderColor: 'border-green-500/30'
    }
];

// Componente Sidebar de Detalhes do Lead
interface LeadDetailsSidebarProps {
    lead: LeadWithVendedor;
    agendamento?: AgendamentoWithDetails | null;
    onClose: () => void;
    onDelete: (id: string) => void;
    onStatusChange: (leadId: string, newStatus: LeadStatus) => void;
    onStartPlanejamento?: (lead: LeadWithVendedor, agendamento: AgendamentoWithDetails) => void;
    onTransferLead?: (leadId: string, newVendedorId: string) => void;
    currentUserId?: string;
    isAdmin?: boolean;
    vendedores?: AdminUser[];
}

const LeadDetailsSidebar: React.FC<LeadDetailsSidebarProps> = ({
    lead,
    agendamento,
    onClose,
    onDelete,
    onStatusChange,
    onStartPlanejamento,
    onTransferLead,
    currentUserId,
    isAdmin = false,
    vendedores = []
}) => {
    const [showTransferDropdown, setShowTransferDropdown] = useState(false);
    const [transferring, setTransferring] = useState(false);
    const [copied, setCopied] = useState(false);

    // Verifica se o lead tem dados de acesso (user_id e senha_temporaria)
    const hasAccessData = lead.user_id && lead.senha_temporaria && lead.email;

    // Gera a URL do planejamento
    const getPlanningUrl = () => {
        if (!lead.planejamento_id) return '';
        return `${window.location.origin}/planejamento-prf/${lead.planejamento_id}`;
    };

    // Copia o texto de convite para a área de transferência
    const handleCopyAccess = async () => {
        if (!lead.email || !lead.senha_temporaria) return;

        const message = generateInviteMessage(
            lead.nome,
            lead.email,
            lead.senha_temporaria,
            getPlanningUrl()
        );

        try {
            await navigator.clipboard.writeText(message);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        } catch (err) {
            console.error('Erro ao copiar:', err);
        }
    };

    // Abre o WhatsApp Web com a mensagem
    const handleSendWhatsApp = () => {
        if (!lead.telefone || !lead.email || !lead.senha_temporaria) return;

        const message = generateInviteMessage(
            lead.nome,
            lead.email,
            lead.senha_temporaria,
            getPlanningUrl()
        );

        const whatsappUrl = generateWhatsAppUrl(lead.telefone, message);
        window.open(whatsappUrl, '_blank');
    };

    const totalMinutos = (lead.minutos_domingo || 0) + (lead.minutos_segunda || 0) +
        (lead.minutos_terca || 0) + (lead.minutos_quarta || 0) +
        (lead.minutos_quinta || 0) + (lead.minutos_sexta || 0) +
        (lead.minutos_sabado || 0);

    // Verifica se o usuário pode iniciar o planejamento
    // Admin ou vendedor designado podem iniciar
    const canStartPlanejamento = isAdmin || (currentUserId && lead.vendedor_id === currentUserId);

    // Função para transferir o lead
    const handleTransfer = async (newVendedorId: string) => {
        if (!onTransferLead) return;
        setTransferring(true);
        try {
            await onTransferLead(lead.id, newVendedorId);
            setShowTransferDropdown(false);
        } finally {
            setTransferring(false);
        }
    };

    // Filtrar vendedores excluindo o atual
    const availableVendedores = vendedores.filter(v => v.id !== lead.vendedor_id);

    const formatAgendamentoDate = (dataHora: string) => {
        const date = new Date(dataHora);
        return date.toLocaleDateString('pt-BR', {
            weekday: 'long',
            day: '2-digit',
            month: 'long',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatMinutesToTime = (minutos: number) => {
        const h = Math.floor(minutos / 60);
        const m = minutos % 60;
        if (h === 0) return `${m}min`;
        if (m === 0) return `${h}h`;
        return `${h}h ${m}min`;
    };

    const getGenderLabel = (gender: LeadGender | null) => {
        const labels: Record<LeadGender, string> = {
            'masculino': 'Masculino',
            'feminino': 'Feminino',
            'outro': 'Outro',
            'prefiro_nao_dizer': 'Prefiro não dizer'
        };
        return gender ? labels[gender] : '-';
    };

    const getEducationLabel = (level: EducationLevel | null) => {
        const labels: Record<EducationLevel, string> = {
            'fundamental_incompleto': 'Fundamental Incompleto',
            'fundamental_completo': 'Fundamental Completo',
            'medio_incompleto': 'Médio Incompleto',
            'medio_completo': 'Médio Completo',
            'superior_incompleto': 'Superior Incompleto',
            'superior_completo': 'Superior Completo',
            'pos_graduacao': 'Pós-graduação',
            'mestrado': 'Mestrado',
            'doutorado': 'Doutorado'
        };
        return level ? labels[level] : '-';
    };

    const getDifficultyLabel = (difficulty: LeadDifficulty) => {
        const labels: Record<LeadDifficulty, string> = {
            'tempo': 'Tempo',
            'nao_saber_por_onde_comecar': 'Não saber por onde começar',
            'organizacao': 'Organização',
            'falta_de_material': 'Falta de material',
            'outros': 'Outros'
        };
        return labels[difficulty];
    };

    // Normaliza status para o Kanban (planejamento_gerado e novo são tratados como apresentacao)
    const currentStatus = (!lead.status || lead.status === 'novo' || lead.status === 'planejamento_gerado')
        ? 'apresentacao'
        : lead.status;

    const weekDays = [
        { key: 'minutos_segunda', label: 'Seg' },
        { key: 'minutos_terca', label: 'Ter' },
        { key: 'minutos_quarta', label: 'Qua' },
        { key: 'minutos_quinta', label: 'Qui' },
        { key: 'minutos_sexta', label: 'Sex' },
        { key: 'minutos_sabado', label: 'Sáb' },
        { key: 'minutos_domingo', label: 'Dom' }
    ];

    return (
        <>
            {/* Overlay */}
            <div
                className="fixed inset-0 bg-black/50 z-40"
                onClick={onClose}
            />

            {/* Sidebar */}
            <div className="fixed right-0 top-0 h-full w-full max-w-md bg-brand-card border-l border-white/10 z-50 flex flex-col shadow-2xl animate-slide-in-right">
                {/* Header */}
                <div className="p-6 border-b border-white/10 flex items-center justify-between">
                    <div className="flex items-center">
                        <div className="w-12 h-12 bg-brand-yellow/20 rounded-full flex items-center justify-center mr-4">
                            <User className="w-6 h-6 text-brand-yellow" />
                        </div>
                        <div>
                            <h3 className="text-white font-bold text-lg">{lead.nome}</h3>
                            <p className="text-gray-500 text-sm">{lead.concurso_almejado}</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Conteúdo com scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status */}
                    <div>
                        <h4 className="text-xs text-gray-500 uppercase font-bold mb-3">Status</h4>
                        {/* Bloquear alteração de status para leads agendados */}
                        {currentStatus === 'agendado' ? (
                            <div>
                                <div className="flex flex-wrap gap-2 mb-3">
                                    {KANBAN_COLUMNS.map((col) => (
                                        <button
                                            key={col.id}
                                            disabled
                                            className={`px-3 py-1.5 rounded text-xs font-bold uppercase border transition-all cursor-not-allowed ${currentStatus === col.id
                                                ? `${col.bgColor} ${col.color} ${col.borderColor}`
                                                : 'bg-brand-dark/50 text-gray-600 border-white/5 opacity-50'
                                                }`}
                                        >
                                            {col.title}
                                        </button>
                                    ))}
                                </div>
                                <p className="text-gray-500 text-xs flex items-center gap-1">
                                    <AlertCircle className="w-3 h-3" />
                                    Status bloqueado. Inicie o planejamento para alterar.
                                </p>
                            </div>
                        ) : (
                            <div className="flex flex-wrap gap-2">
                                {KANBAN_COLUMNS.map((col) => (
                                    <button
                                        key={col.id}
                                        onClick={() => onStatusChange(lead.id, col.id)}
                                        className={`px-3 py-1.5 rounded text-xs font-bold uppercase border transition-all ${currentStatus === col.id
                                            ? `${col.bgColor} ${col.color} ${col.borderColor}`
                                            : 'bg-brand-dark/50 text-gray-500 border-white/10 hover:border-white/30'
                                            }`}
                                    >
                                        {col.title}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Planejamento - aparece quando o lead já tem planejamento gerado */}
                    {lead.planejamento_id && (
                        <div>
                            <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center">
                                <FileText className="w-3 h-3 mr-2" />
                                Planejamento
                            </h4>
                            <a
                                href={`/planejamento-prf/${lead.planejamento_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="block w-full bg-brand-yellow/10 border border-brand-yellow/30 hover:border-brand-yellow/50 rounded-sm p-4 transition-all group"
                            >
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-brand-yellow/20 rounded-full flex items-center justify-center">
                                            <FileText className="w-5 h-5 text-brand-yellow" />
                                        </div>
                                        <div>
                                            <p className="text-white font-bold text-sm">Ver Planejamento</p>
                                            <p className="text-gray-500 text-xs">Abrir em nova aba</p>
                                        </div>
                                    </div>
                                    <ExternalLink className="w-5 h-5 text-brand-yellow group-hover:translate-x-1 transition-transform" />
                                </div>
                            </a>
                        </div>
                    )}

                    {/* Agendamento */}
                    {agendamento && (
                        <div>
                            <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center">
                                <Video className="w-3 h-3 mr-2" />
                                Reunião Agendada
                            </h4>
                            <div className="bg-purple-500/10 border border-purple-500/30 rounded-sm p-4 space-y-3">
                                <div className="flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-purple-400" />
                                    <span className="text-white text-sm font-medium capitalize">
                                        {formatAgendamentoDate(agendamento.data_hora)}
                                    </span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Clock className="w-4 h-4 text-purple-400" />
                                    <span className="text-gray-400 text-sm">
                                        Duração: {agendamento.duracao_minutos} minutos
                                    </span>
                                </div>
                                {agendamento.vendedor && (
                                    <div className="flex items-center gap-2">
                                        <User className="w-4 h-4 text-purple-400" />
                                        <span className="text-gray-400 text-sm">
                                            Vendedor: {agendamento.vendedor.name}
                                        </span>
                                    </div>
                                )}
                                {agendamento.notas && (
                                    <p className="text-gray-400 text-sm italic mt-2">
                                        "{agendamento.notas}"
                                    </p>
                                )}

                                {/* Botão Iniciar Planejamento - só aparece para admin ou vendedor designado */}
                                {agendamento.status === 'agendado' && onStartPlanejamento && canStartPlanejamento && (
                                    <button
                                        onClick={() => onStartPlanejamento(lead, agendamento)}
                                        className="w-full mt-3 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 font-bold uppercase text-xs flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                        Iniciar Planejamento
                                    </button>
                                )}

                                {/* Mensagem quando não tem permissão */}
                                {agendamento.status === 'agendado' && !canStartPlanejamento && (
                                    <div className="mt-3 text-center text-gray-500 text-xs">
                                        Apenas o vendedor designado ou admin pode iniciar o planejamento
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Transferir Lead (apenas admin) */}
                    {isAdmin && onTransferLead && availableVendedores.length > 0 && (
                        <div>
                            <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center">
                                <UserCog className="w-3 h-3 mr-2" />
                                Transferir Lead
                            </h4>
                            <div className="relative">
                                <button
                                    onClick={() => setShowTransferDropdown(!showTransferDropdown)}
                                    disabled={transferring}
                                    className="w-full bg-brand-dark border border-white/10 hover:border-white/20 rounded-sm p-3 flex items-center justify-between text-sm transition-colors disabled:opacity-50"
                                >
                                    <span className="text-gray-400">
                                        {transferring ? 'Transferindo...' : 'Selecionar novo vendedor'}
                                    </span>
                                    {transferring ? (
                                        <Loader2 className="w-4 h-4 text-gray-400 animate-spin" />
                                    ) : (
                                        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${showTransferDropdown ? 'rotate-180' : ''}`} />
                                    )}
                                </button>

                                {showTransferDropdown && (
                                    <div className="absolute top-full left-0 right-0 mt-1 bg-brand-dark border border-white/10 rounded-sm shadow-lg z-10 max-h-48 overflow-y-auto">
                                        {availableVendedores.map((vendedor) => (
                                            <button
                                                key={vendedor.id}
                                                onClick={() => handleTransfer(vendedor.id)}
                                                className="w-full text-left px-4 py-3 text-sm text-white hover:bg-white/10 transition-colors flex items-center gap-3"
                                            >
                                                <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden bg-brand-dark border border-white/10">
                                                    {vendedor.avatar_url ? (
                                                        <img
                                                            src={vendedor.avatar_url}
                                                            alt={vendedor.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <User className="w-4 h-4 text-brand-yellow" />
                                                    )}
                                                </div>
                                                <div>
                                                    <span className="font-medium">{vendedor.name}</span>
                                                    <span className="text-gray-500 text-xs ml-2">
                                                        ({vendedor.role === 'admin' ? 'Admin' : 'Vendedor'})
                                                    </span>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                            {lead.vendedor && (
                                <p className="text-gray-500 text-xs mt-2">
                                    Vendedor atual: <span className="text-gray-400">{lead.vendedor.name}</span>
                                </p>
                            )}
                        </div>
                    )}

                    {/* Informações de Contato */}
                    <div>
                        <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center">
                            <Phone className="w-3 h-3 mr-2" />
                            Contato
                        </h4>
                        <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4 space-y-3">
                            {lead.telefone && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Telefone</span>
                                    <a href={`tel:${lead.telefone}`} className="text-brand-yellow text-sm hover:underline">
                                        {lead.telefone}
                                    </a>
                                </div>
                            )}
                            {lead.email && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Email</span>
                                    <a href={`mailto:${lead.email}`} className="text-brand-yellow text-sm hover:underline truncate ml-4">
                                        {lead.email}
                                    </a>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Sexo</span>
                                <span className="text-white text-sm">{getGenderLabel(lead.sexo)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Informações do Concurso */}
                    <div>
                        <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center">
                            <Target className="w-3 h-3 mr-2" />
                            Sobre o Concurso
                        </h4>
                        <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Concurso</span>
                                <span className="text-white text-sm">{lead.concurso_almejado}</span>
                            </div>
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Escolaridade</span>
                                <span className="text-white text-sm">{getEducationLabel(lead.nivel_escolaridade)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Situação Atual */}
                    <div>
                        <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center">
                            <Briefcase className="w-3 h-3 mr-2" />
                            Situação Atual
                        </h4>
                        <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Trabalha</span>
                                <span className={`text-sm ${lead.trabalha ? 'text-green-400' : 'text-gray-400'}`}>
                                    {lead.trabalha ? 'Sim' : 'Não'}
                                </span>
                            </div>
                            {lead.trabalha && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">É concursado</span>
                                    <span className={`text-sm ${lead.e_concursado ? 'text-green-400' : 'text-gray-400'}`}>
                                        {lead.e_concursado ? 'Sim' : 'Não'}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Possui curso</span>
                                <span className={`text-sm ${lead.possui_curso_concurso ? 'text-green-400' : 'text-gray-400'}`}>
                                    {lead.possui_curso_concurso ? 'Sim' : 'Não'}
                                </span>
                            </div>
                            {lead.possui_curso_concurso && lead.qual_curso && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">Qual curso</span>
                                    <span className="text-white text-sm">{lead.qual_curso}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Rotina de Estudos */}
                    <div>
                        <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center">
                            <Clock className="w-3 h-3 mr-2" />
                            Rotina de Estudos
                        </h4>
                        <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4">
                            {/* Horários de acordar/dormir */}
                            {(lead.hora_acordar || lead.hora_dormir) && (
                                <div className="flex justify-between mb-4 pb-3 border-b border-white/5">
                                    <div className="text-center flex-1">
                                        <span className="text-[10px] text-gray-600 uppercase block">Acorda</span>
                                        <span className="text-brand-yellow font-bold text-sm">{lead.hora_acordar || '06:00'}</span>
                                    </div>
                                    <div className="text-center flex-1">
                                        <span className="text-[10px] text-gray-600 uppercase block">Dorme</span>
                                        <span className="text-brand-yellow font-bold text-sm">{lead.hora_dormir || '22:00'}</span>
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-7 gap-1 mb-3">
                                {weekDays.map((day) => {
                                    const minutes = (lead as any)[day.key] || 0;
                                    const hasTime = minutes > 0;
                                    return (
                                        <div key={day.key} className="text-center">
                                            <span className="text-[10px] text-gray-600 uppercase">{day.label}</span>
                                            <div className={`mt-1 p-2 rounded text-xs font-bold ${hasTime ? 'bg-brand-yellow/20 text-brand-yellow' : 'bg-white/5 text-gray-600'
                                                }`}>
                                                {hasTime ? formatMinutesToTime(minutes) : '-'}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="text-center pt-3 border-t border-white/5">
                                <span className="text-gray-500 text-xs">Total semanal: </span>
                                <span className="text-brand-yellow font-bold">{formatMinutesToTime(totalMinutos)}</span>
                            </div>
                            {/* Link para Planejador Semanal */}
                            {lead.planejamento_id && (
                                <a
                                    href={`/planejador-semanal/prf/${lead.planejamento_id}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="mt-4 block w-full text-center bg-brand-yellow/10 border border-brand-yellow/30 hover:border-brand-yellow/50 rounded-sm py-2 px-3 text-brand-yellow text-xs font-bold uppercase transition-all"
                                >
                                    <Clock className="w-3 h-3 inline mr-2" />
                                    Ver Planejador Semanal
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Dificuldades */}
                    {lead.principais_dificuldades && lead.principais_dificuldades.length > 0 && (
                        <div>
                            <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center">
                                <AlertCircle className="w-3 h-3 mr-2" />
                                Principais Dificuldades
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {lead.principais_dificuldades.map((diff) => (
                                    <span
                                        key={diff}
                                        className="px-3 py-1 bg-red-500/10 text-red-400 text-xs rounded border border-red-500/20"
                                    >
                                        {getDifficultyLabel(diff)}
                                    </span>
                                ))}
                            </div>
                            {lead.dificuldade_outros && (
                                <p className="text-gray-400 text-sm mt-2 italic">"{lead.dificuldade_outros}"</p>
                            )}
                        </div>
                    )}

                    {/* Metadados */}
                    <div className="pt-4 border-t border-white/5">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-600">Cadastrado em</span>
                            <span className="text-gray-400">
                                {new Date(lead.created_at).toLocaleDateString('pt-BR', {
                                    day: '2-digit',
                                    month: '2-digit',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                })}
                            </span>
                        </div>
                        {lead.vendedor && (
                            <div className="flex justify-between text-xs mt-2">
                                <span className="text-gray-600">Vendedor</span>
                                <span className="text-gray-400">{lead.vendedor.name}</span>
                            </div>
                        )}
                    </div>

                    {/* Dados de Acesso - só aparece se o lead tem usuário criado */}
                    {hasAccessData && (
                        <div className="mt-4 pt-4 border-t border-white/5">
                            <div className="flex items-center gap-2 mb-3">
                                <Key className="w-4 h-4 text-brand-yellow" />
                                <h4 className="text-sm font-bold text-white uppercase">Dados de Acesso</h4>
                            </div>

                            <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-3 space-y-2">
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">E-mail</span>
                                    <span className="text-gray-300 font-mono">{lead.email}</span>
                                </div>
                                <div className="flex justify-between text-xs">
                                    <span className="text-gray-500">Senha</span>
                                    <span className="text-gray-300 font-mono">{lead.senha_temporaria}</span>
                                </div>
                            </div>

                            <div className="flex gap-2 mt-3">
                                <button
                                    onClick={handleCopyAccess}
                                    className={`flex-1 py-2 px-3 text-xs font-bold uppercase rounded-sm flex items-center justify-center gap-2 transition-all ${copied
                                            ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                                            : 'bg-white/5 text-gray-300 border border-white/10 hover:bg-white/10'
                                        }`}
                                >
                                    <Copy className="w-4 h-4" />
                                    {copied ? 'Copiado!' : 'Copiar Acesso'}
                                </button>

                                {lead.telefone && (
                                    <button
                                        onClick={handleSendWhatsApp}
                                        className="flex-1 py-2 px-3 text-xs font-bold uppercase bg-green-600/20 text-green-400 border border-green-500/30 rounded-sm flex items-center justify-center gap-2 hover:bg-green-600/30 transition-all"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        WhatsApp
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer com ações */}
                <div className="p-4 border-t border-white/10 flex gap-3">
                    {lead.planejamento_id && (
                        <a
                            href={`/planejamento-prf/${lead.planejamento_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 bg-brand-yellow text-brand-darker py-3 font-bold uppercase text-xs text-center hover:bg-brand-yellow/90 transition-colors flex items-center justify-center gap-2"
                        >
                            <Eye className="w-4 h-4" />
                            Ver Planejamento
                        </a>
                    )}
                    <button
                        onClick={() => {
                            onDelete(lead.id);
                            onClose();
                        }}
                        className="px-4 py-3 border border-red-500/30 text-red-400 font-bold uppercase text-xs hover:bg-red-500/10 transition-colors flex items-center gap-2"
                    >
                        <Trash2 className="w-4 h-4" />
                        Excluir
                    </button>
                </div>
            </div>

            <style>{`
                @keyframes slide-in-right {
                    from {
                        transform: translateX(100%);
                    }
                    to {
                        transform: translateX(0);
                    }
                }
                .animate-slide-in-right {
                    animation: slide-in-right 0.3s ease-out;
                }
            `}</style>
        </>
    );
};

// Componente do Card do Lead no Kanban
interface LeadCardProps {
    lead: LeadWithVendedor;
    agendamento?: AgendamentoWithDetails | null;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
    onDelete: (id: string) => void;
    onClick: (lead: LeadWithVendedor) => void;
}

const LeadCard: React.FC<LeadCardProps> = ({ lead, agendamento, onDragStart, onDelete, onClick }) => {
    const totalMinutos = (lead.minutos_domingo || 0) + (lead.minutos_segunda || 0) +
        (lead.minutos_terca || 0) + (lead.minutos_quarta || 0) +
        (lead.minutos_quinta || 0) + (lead.minutos_sexta || 0) +
        (lead.minutos_sabado || 0);

    const formatMinutesToTime = (minutos: number) => {
        const h = Math.floor(minutos / 60);
        const m = minutos % 60;
        if (h === 0) return `${m}min`;
        if (m === 0) return `${h}h`;
        return `${h}h${m}min`;
    };

    const formatAgendamentoShort = (dataHora: string) => {
        const date = new Date(dataHora);
        const time = date.toLocaleTimeString('pt-BR', {
            hour: '2-digit',
            minute: '2-digit'
        });
        const dateStr = date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric' // Changed to numeric (full year) as requested "aa" usually implies 2-digit but "dd/mm/aa" can be interpreted. Let's stick to dd/mm/yy or dd/mm/yyyy. User said dd/mm/aa (usually 2 digits). 
            // Wait, "aa" in pt-BR usually means "ano" (2 digits). "aaaa" means 4 digits.
            // If I use '2-digit', it will be '25'. 'numeric' will be '2025'.
            // User sample: 13/12/2025 in screenshot.
            // User request: "00:00 e dd/mm/aa". 
            // I'll use 2-digit year to match "aa".
        });
        // Actually, user screenshot has "13/12/2025".
        // But request says "dd/mm/aa". 
        // I will use 2-digit for year to be safe with "aa", or maybe 4-digit if that looks better.
        // Let's use 2-digit for year to match "aa".
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear().toString().slice(-2);

        return `${time} e ${day}/${month}/${year}`;
    };

    const isAgendado = lead.status === 'agendado';

    return (
        <div
            draggable={!isAgendado}
            onDragStart={(e) => !isAgendado && onDragStart(e, lead.id)}
            onClick={() => onClick(lead)}
            className={`bg-brand-dark border rounded-sm p-3 hover:border-white/20 transition-colors group ${isAgendado
                ? 'border-purple-500/30 cursor-pointer'
                : 'border-white/10 cursor-grab active:cursor-grabbing'
                }`}
        >
            <div className="flex items-start justify-between mb-2">
                <div className="flex items-center flex-1 min-w-0">
                    {/* Ícone de arrastar - escondido para leads agendados */}
                    {!isAgendado && (
                        <GripVertical className="w-4 h-4 text-gray-600 mr-2 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0" />
                    )}
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center mr-2 flex-shrink-0 ${isAgendado ? 'bg-purple-500/20' : 'bg-brand-yellow/20'
                        }`}>
                        <User className={`w-4 h-4 ${isAgendado ? 'text-purple-400' : 'text-brand-yellow'}`} />
                    </div>
                    <p className="text-white text-sm font-bold truncate">{lead.nome}</p>
                </div>
            </div>

            <div className="space-y-1 text-xs">
                <p className="text-gray-400 truncate">{lead.concurso_almejado}</p>

                {/* Mostrar data/hora do agendamento se tiver, independente do status */}
                {agendamento ? (
                    <div className="flex items-center text-purple-400 font-medium">
                        <Video className="w-3 h-3 mr-1" />
                        {formatAgendamentoShort(agendamento.data_hora)}
                    </div>
                ) : (
                    <div className="flex items-center text-gray-500">
                        <Calendar className="w-3 h-3 mr-1" />
                        {formatMinutesToTime(totalMinutos)}/sem
                    </div>
                )}
                {lead.telefone && (
                    <div className="flex items-center text-gray-500">
                        <Phone className="w-3 h-3 mr-1" />
                        {lead.telefone}
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between mt-3 pt-2 border-t border-white/5">
                <span className="text-[10px] text-gray-600">
                    {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                </span>
                <div className="flex items-center gap-1">
                    {lead.planejamento_id && (
                        <a
                            href={`/planejamento-prf/${lead.planejamento_id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1 text-gray-500 hover:text-brand-yellow transition-colors"
                            title="Ver Planejamento"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <Eye className="w-3.5 h-3.5" />
                        </a>
                    )}
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onDelete(lead.id);
                        }}
                        className="p-1 text-gray-500 hover:text-red-500 transition-colors"
                        title="Excluir"
                    >
                        <Trash2 className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

// Componente da Coluna do Kanban
interface KanbanColumnProps {
    column: KanbanColumn;
    leads: LeadWithVendedor[];
    agendamentosMap: Record<string, AgendamentoWithDetails>;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, status: LeadStatus) => void;
    onDelete: (id: string) => void;
    onLeadClick: (lead: LeadWithVendedor) => void;
}

const KanbanColumnComponent: React.FC<KanbanColumnProps> = ({
    column,
    leads,
    agendamentosMap,
    onDragStart,
    onDragOver,
    onDrop,
    onDelete,
    onLeadClick
}) => {
    return (
        <div
            className={`flex-1 min-w-[280px] max-w-[320px] ${column.bgColor} border ${column.borderColor} rounded-sm flex flex-col`}
            onDragOver={onDragOver}
            onDrop={(e) => onDrop(e, column.id)}
        >
            <div className="p-3 border-b border-white/10">
                <div className="flex items-center justify-between">
                    <h3 className={`font-bold text-sm uppercase ${column.color}`}>
                        {column.title}
                    </h3>
                    <span className={`text-xs ${column.color} bg-black/20 px-2 py-0.5 rounded`}>
                        {leads.length}
                    </span>
                </div>
            </div>
            <div className="flex-1 p-2 space-y-2 overflow-y-auto max-h-[calc(100vh-320px)] scrollbar-thin scrollbar-thumb-white/10">
                {leads.length === 0 ? (
                    <div className="text-center py-8 text-gray-600 text-xs">
                        Arraste leads para cá
                    </div>
                ) : (
                    leads.map((lead) => (
                        <LeadCard
                            key={lead.id}
                            lead={lead}
                            agendamento={lead.agendamento_id ? agendamentosMap[lead.agendamento_id] : null}
                            onDragStart={onDragStart}
                            onDelete={onDelete}
                            onClick={onLeadClick}
                        />
                    ))
                )}
            </div>
        </div>
    );
};

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

    // Modal de confirmação de exclusão
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
                const leadDate = new Date(lead.created_at).toISOString().split('T')[0];
                return leadDate === selectedDate;
            });

            setAllLeads(filteredData); // Armazena todos os leads filtrados por data

            // Carregar agendamentos para leads que têm agendamento_id
            const leadsWithAgendamento = filteredData.filter(l => l.agendamento_id);
            if (leadsWithAgendamento.length > 0) {
                const agendamentoIds = leadsWithAgendamento.map(l => l.agendamento_id!);
                const agendamentos = await Promise.all(
                    agendamentoIds.map(id => agendamentosService.getById(id))
                );
                const map: Record<string, AgendamentoWithDetails> = {};
                agendamentos.forEach(ag => {
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

    // Abre o modal de confirmação de exclusão
    const openDeleteModal = (lead: LeadWithVendedor) => {
        setDeleteModal({
            isOpen: true,
            leadId: lead.id,
            leadName: lead.nome
        });
    };

    // Fecha o modal de confirmação
    const closeDeleteModal = () => {
        if (!isDeleting) {
            setDeleteModal({ isOpen: false, leadId: null, leadName: '' });
        }
    };

    // Confirma a exclusão
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

    // Função wrapper para compatibilidade com componentes filhos
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
        // Buscar dados atualizados do lead (pode ter sido atualizado após criação de planejamento)
        try {
            const updatedLead = await leadsService.getById(lead.id);
            if (updatedLead) {
                const leadWithVendedor: LeadWithVendedor = {
                    ...updatedLead,
                    vendedor: lead.vendedor // Mantém o vendedor do cache
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
        // Redirecionar para a página de planejamentos com o lead_id
        // A página de planejamentos vai abrir o formulário automaticamente com os dados do lead
        navigate(`/admin/planejamentos?lead_id=${lead.id}`);
    };

    const handleTransferLead = async (leadId: string, newVendedorId: string) => {
        try {
            // Atualizar vendedor_id do lead
            await leadsService.update(leadId, { vendedor_id: newVendedorId });

            // Se tiver agendamento, atualizar vendedor do agendamento também
            const lead = allLeads.find(l => l.id === leadId);
            if (lead?.agendamento_id) {
                await agendamentosService.updateVendedor(lead.agendamento_id, newVendedorId);
            }

            // Recarregar leads para refletir mudanças
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
        // Verificar se o lead é agendado - não permitir arrastar
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

        // Bloquear alteração de status para leads agendados
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
            // Leads novos, sem status, ou com planejamento gerado vão para "apresentacao"
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
            'nao_saber_por_onde_comecar': 'Não saber começar',
            'organizacao': 'Organização',
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
            'apresentacao': { label: 'Apresentação', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            'novo': { label: 'Apresentação', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
            'planejamento_gerado': { label: 'Apresentação', className: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
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

                    {/* Toggle de Visualização */}
                    <div className="flex items-center gap-2">
                        <span className="text-gray-400 text-sm font-bold uppercase">Visualização:</span>
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

            {/* Conteúdo */}
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
                        Não há leads cadastrados para {isToday ? 'hoje' : 'esta data'}
                    </p>
                </div>
            ) : viewMode === 'kanban' ? (
                /* Visualização Kanban */
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
                /* Visualização Lista */
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
                                <th className="text-right text-gray-400 text-xs font-bold uppercase p-4">Ações</th>
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
                                                        {lead.trabalha ? (lead.e_concursado ? 'Concursado' : 'Trabalha') : 'Não trabalha'} |{' '}
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
                                                {formatDate(lead.created_at)}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex justify-end space-x-2">
                                                {lead.planejamento_id && (
                                                    <a
                                                        href={`/planejamento-prf/${lead.planejamento_id}`}
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

            {/* Modal de confirmação de exclusão */}
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
