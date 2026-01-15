import React from 'react';
import { motion } from 'framer-motion';
import { Minus, Plus } from 'lucide-react';
import { WeeklySchedule, DAYS_OF_WEEK } from '../../types';

interface DisponibilidadeStepProps {
  schedule: WeeklySchedule;
  weeklyTotal: number;
  onToggleDay: (day: keyof WeeklySchedule) => void;
  onSetMinutes: (day: keyof WeeklySchedule, minutes: number) => void;
}

export function DisponibilidadeStep({
  schedule,
  weeklyTotal,
  onToggleDay,
  onSetMinutes,
}: DisponibilidadeStepProps) {
  // Formatar minutos para HH:MM
  const formatToHHMM = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
  };

  // Quando ativar um dia, definir 1 hora por padrao
  const handleToggleDay = (day: keyof WeeklySchedule) => {
    const isCurrentlyActive = schedule[day] > 0;
    if (!isCurrentlyActive) {
      // Ativando: definir 1 hora (60 minutos)
      onSetMinutes(day, 60);
    } else {
      // Desativando: zerar
      onSetMinutes(day, 0);
    }
  };

  // Ajustar tempo em +-15 minutos
  const adjustTime = (day: keyof WeeklySchedule, delta: number) => {
    const currentMinutes = schedule[day];
    const newMinutes = Math.max(0, Math.min(480, currentMinutes + delta));
    onSetMinutes(day, newMinutes);
  };

  // Lidar com mudanca direta no input
  const handleTimeInputChange = (day: keyof WeeklySchedule, value: string) => {
    // Aceitar formato HH:MM
    const match = value.match(/^(\d{0,2}):?(\d{0,2})$/);
    if (match) {
      const hours = Math.min(8, parseInt(match[1]) || 0);
      const mins = Math.min(59, parseInt(match[2]) || 0);
      onSetMinutes(day, hours * 60 + mins);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 50 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -50 }}
    >
      <h2 className="text-2xl font-bold text-white mb-2">Sua disponibilidade</h2>
      <p className="text-[#A0A0A0] mb-6">
        Selecione os dias e quanto tempo voce pode estudar em cada um.
      </p>

      {/* Lista de dias - cards compactos */}
      <div className="space-y-2 mb-6">
        {DAYS_OF_WEEK.map((day) => {
          const isActive = schedule[day.key] > 0;

          return (
            <div
              key={day.key}
              className={`
                flex items-center gap-3 p-3 rounded-xl transition-all
                ${isActive ? 'bg-[#252525] border border-[#FFB800]/30' : 'bg-[#1E1E1E] border border-[#333]'}
              `}
            >
              {/* Toggle */}
              <button
                onClick={() => handleToggleDay(day.key)}
                className={`
                  w-11 h-6 rounded-full p-0.5 transition-colors flex-shrink-0
                  ${isActive ? 'bg-[#FFB800]' : 'bg-[#3A3A3A]'}
                `}
              >
                <motion.div
                  className="w-5 h-5 rounded-full bg-white shadow-md"
                  animate={{ x: isActive ? 20 : 0 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              </button>

              {/* Nome do dia */}
              <span className={`font-medium flex-1 min-w-0 ${isActive ? 'text-white' : 'text-[#6E6E6E]'}`}>
                {day.fullLabel}
              </span>

              {/* Controles de tempo (apenas quando ativo) */}
              {isActive && (
                <div className="flex items-center gap-1">
                  {/* Botao -15 */}
                  <button
                    onClick={() => adjustTime(day.key, -15)}
                    className="w-8 h-8 rounded-lg bg-[#333] hover:bg-[#404040] text-[#A0A0A0] hover:text-white
                      flex items-center justify-center transition-colors text-xs font-bold"
                  >
                    <Minus size={14} />
                  </button>

                  {/* Input HH:MM */}
                  <input
                    type="text"
                    value={formatToHHMM(schedule[day.key])}
                    onChange={(e) => handleTimeInputChange(day.key, e.target.value)}
                    className="w-16 bg-[#333] text-[#FFB800] text-center font-mono font-bold text-lg
                      rounded-lg py-1 focus:outline-none focus:ring-1 focus:ring-[#FFB800]"
                  />

                  {/* Botao +15 */}
                  <button
                    onClick={() => adjustTime(day.key, 15)}
                    className="w-8 h-8 rounded-lg bg-[#333] hover:bg-[#404040] text-[#A0A0A0] hover:text-white
                      flex items-center justify-center transition-colors text-xs font-bold"
                  >
                    <Plus size={14} />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resumo Semanal - abaixo dos cards, nao sticky */}
      <div className="bg-gradient-to-r from-[#FFB800]/20 to-[#FFB800]/10 border border-[#FFB800]/30 rounded-2xl p-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[#A0A0A0] text-sm">Total por semana</p>
            <motion.p
              key={weeklyTotal}
              initial={{ scale: 1.1 }}
              animate={{ scale: 1 }}
              className="text-2xl font-bold text-[#FFB800] font-mono"
            >
              {formatToHHMM(weeklyTotal)}
            </motion.p>
          </div>
          <div className="text-right">
            <p className="text-[#A0A0A0] text-sm">
              {DAYS_OF_WEEK.filter((d) => schedule[d.key] > 0).length} dias ativos
            </p>
            <p className="text-white text-sm">
              ~{Math.round(weeklyTotal / Math.max(1, DAYS_OF_WEEK.filter((d) => schedule[d.key] > 0).length))} min/dia
            </p>
          </div>
        </div>
      </div>

      {weeklyTotal === 0 && (
        <p className="text-center text-red-400 text-sm mt-4">
          Selecione pelo menos um dia de estudo
        </p>
      )}
    </motion.div>
  );
}
