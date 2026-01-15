import React from 'react';
import { User, Calendar, Phone, Video, GripVertical, Trash2, Eye } from 'lucide-react';
import { LeadWithVendedor } from '../../../services/adminUsersService';
import { AgendamentoWithDetails, getPlanejamentoUrl } from './types';

interface LeadCardProps {
    lead: LeadWithVendedor;
    agendamento?: AgendamentoWithDetails | null;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
    onDelete: (id: string) => void;
    onClick: (lead: LeadWithVendedor) => void;
}

export const LeadCard: React.FC<LeadCardProps> = ({ lead, agendamento, onDragStart, onDelete, onClick }) => {
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
                    {/* Icone de arrastar - escondido para leads agendados */}
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
                    {new Date(lead.created_at || new Date().toISOString()).toLocaleDateString('pt-BR')}
                </span>
                <div className="flex items-center gap-1">
                    {lead.planejamento_id && (
                        <a
                            href={getPlanejamentoUrl(lead.planejamento_id, agendamento?.preparatorio?.slug)}
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
