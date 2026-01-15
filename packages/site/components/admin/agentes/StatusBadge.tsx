import React from 'react';

interface StatusBadgeProps {
  status: string;
}

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

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const config = statusConfig[status] || statusConfig.unknown;

  return (
    <span className={`${config.color} ${config.bg} px-2 py-1 rounded text-xs font-medium`}>
      {config.label}
    </span>
  );
};
