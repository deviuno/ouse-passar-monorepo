import React, { useState } from 'react';
import {
    User, Calendar, Phone, X, Clock, Briefcase, Target,
    AlertCircle, Video, PlayCircle, UserCog, ChevronDown,
    Loader2, Copy, MessageCircle, Key, Trash2, Eye
} from 'lucide-react';
import { LeadWithVendedor } from '../../../services/adminUsersService';
import { generateInviteMessage, generateWhatsAppUrl } from '../../../services/studentService';
import {
    LeadDifficulty, EducationLevel, LeadGender, AdminUser,
    LeadStatus, AgendamentoWithDetails, KANBAN_COLUMNS, getPlanejamentoUrl
} from './types';

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

export const LeadDetailsSidebar: React.FC<LeadDetailsSidebarProps> = ({
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

    // Copia o texto de convite para a area de transferencia
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

    // Verifica se o usuario pode iniciar o planejamento
    // Admin ou vendedor designado podem iniciar
    const canStartPlanejamento = isAdmin || (currentUserId && lead.vendedor_id === currentUserId);

    // Funcao para transferir o lead
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
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}/${month} - ${hours}:${minutes}`;
    };

    const formatTimeHHMM = (time: string | null | undefined) => {
        if (!time) return '';
        return time.slice(0, 5);
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
            'prefiro_nao_dizer': 'Prefiro nao dizer'
        };
        return gender ? labels[gender] : '-';
    };

    const getEducationLabel = (level: EducationLevel | null) => {
        const labels: Record<EducationLevel, string> = {
            'fundamental_incompleto': 'Fundamental Incompleto',
            'fundamental_completo': 'Fundamental Completo',
            'medio_incompleto': 'Medio Incompleto',
            'medio_completo': 'Medio Completo',
            'superior_incompleto': 'Superior Incompleto',
            'superior_completo': 'Superior Completo',
            'pos_graduacao': 'Pos-graduacao',
            'mestrado': 'Mestrado',
            'doutorado': 'Doutorado'
        };
        return level ? labels[level] : '-';
    };

    const getDifficultyLabel = (difficulty: LeadDifficulty) => {
        const labels: Record<LeadDifficulty, string> = {
            'tempo': 'Tempo',
            'nao_saber_por_onde_comecar': 'Nao saber por onde comecar',
            'organizacao': 'Organizacao',
            'falta_de_material': 'Falta de material',
            'outros': 'Outros'
        };
        return labels[difficulty];
    };

    // Normaliza status para o Kanban (planejamento_gerado e novo sao tratados como apresentacao)
    const currentStatus = (!lead.status || lead.status === 'novo' || lead.status === 'planejamento_gerado')
        ? 'apresentacao'
        : lead.status;

    const weekDays = [
        { key: 'minutos_segunda', label: 'Seg' },
        { key: 'minutos_terca', label: 'Ter' },
        { key: 'minutos_quarta', label: 'Qua' },
        { key: 'minutos_quinta', label: 'Qui' },
        { key: 'minutos_sexta', label: 'Sex' },
        { key: 'minutos_sabado', label: 'Sab' },
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

                {/* Conteudo com scroll */}
                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                    {/* Status */}
                    <div>
                        <h4 className="text-xs text-gray-500 uppercase font-bold mb-3">Status</h4>
                        {/* Bloquear alteracao de status para leads agendados */}
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

                    {/* Agendamento */}
                    {agendamento && (
                        <div>
                            <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center">
                                <Video className="w-3 h-3 mr-2" />
                                Reuniao Agendada
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
                                        Duracao: {agendamento.duracao_minutos} minutos
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

                                {/* Botao Iniciar Planejamento - so aparece para admin ou vendedor designado */}
                                {agendamento.status === 'agendado' && onStartPlanejamento && canStartPlanejamento && (
                                    <button
                                        onClick={() => onStartPlanejamento(lead, agendamento)}
                                        className="w-full mt-3 bg-purple-500 hover:bg-purple-600 text-white py-2 px-4 font-bold uppercase text-xs flex items-center justify-center gap-2 transition-colors"
                                    >
                                        <PlayCircle className="w-4 h-4" />
                                        Iniciar Planejamento
                                    </button>
                                )}

                                {/* Mensagem quando nao tem permissao */}
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

                    {/* Informacoes de Contato */}
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

                    {/* Informacoes do Concurso */}
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

                    {/* Situacao Atual */}
                    <div>
                        <h4 className="text-xs text-gray-500 uppercase font-bold mb-3 flex items-center">
                            <Briefcase className="w-3 h-3 mr-2" />
                            Situacao Atual
                        </h4>
                        <div className="bg-brand-dark/50 border border-white/5 rounded-sm p-4 space-y-3">
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Trabalha</span>
                                <span className={`text-sm ${lead.trabalha ? 'text-green-400' : 'text-gray-400'}`}>
                                    {lead.trabalha ? 'Sim' : 'Nao'}
                                </span>
                            </div>
                            {lead.trabalha && (
                                <div className="flex justify-between">
                                    <span className="text-gray-500 text-sm">E concursado</span>
                                    <span className={`text-sm ${lead.e_concursado ? 'text-green-400' : 'text-gray-400'}`}>
                                        {lead.e_concursado ? 'Sim' : 'Nao'}
                                    </span>
                                </div>
                            )}
                            <div className="flex justify-between">
                                <span className="text-gray-500 text-sm">Possui curso</span>
                                <span className={`text-sm ${lead.possui_curso_concurso ? 'text-green-400' : 'text-gray-400'}`}>
                                    {lead.possui_curso_concurso ? 'Sim' : 'Nao'}
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
                            {/* Horarios de acordar/dormir */}
                            {(lead.hora_acordar || lead.hora_dormir) && (
                                <div className="flex justify-between mb-4 pb-3 border-b border-white/5">
                                    <div className="text-center flex-1">
                                        <span className="text-[10px] text-gray-600 uppercase block">Acorda</span>
                                        <span className="text-brand-yellow font-bold text-sm">{formatTimeHHMM(lead.hora_acordar || null) || '06:00'}</span>
                                    </div>
                                    <div className="text-center flex-1">
                                        <span className="text-[10px] text-gray-600 uppercase block">Dorme</span>
                                        <span className="text-brand-yellow font-bold text-sm">{formatTimeHHMM(lead.hora_dormir || null) || '22:00'}</span>
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
                                {new Date(lead.created_at || new Date().toISOString()).toLocaleDateString('pt-BR', {
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

                    {/* Dados de Acesso - so aparece se o lead tem usuario criado */}
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

                {/* Footer com acoes */}
                <div className="p-4 border-t border-white/10 flex gap-3">
                    {lead.planejamento_id && (
                        <a
                            href={getPlanejamentoUrl(lead.planejamento_id, agendamento?.preparatorio?.slug)}
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
