import React from 'react';
import { LeadWithVendedor } from '../../../services/adminUsersService';
import { KanbanColumn as KanbanColumnType, LeadStatus, AgendamentoWithDetails } from './types';
import { LeadCard } from './LeadCard';

interface KanbanColumnProps {
    column: KanbanColumnType;
    leads: LeadWithVendedor[];
    agendamentosMap: Record<string, AgendamentoWithDetails>;
    onDragStart: (e: React.DragEvent, leadId: string) => void;
    onDragOver: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent, status: LeadStatus) => void;
    onDelete: (id: string) => void;
    onLeadClick: (lead: LeadWithVendedor) => void;
}

export const KanbanColumn: React.FC<KanbanColumnProps> = ({
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
                        Arraste leads para ca
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
