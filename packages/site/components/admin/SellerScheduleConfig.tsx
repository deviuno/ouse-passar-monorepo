import React, { useState, useEffect } from 'react';
import { Clock, Calendar, Loader2, Check } from 'lucide-react';
import { vendedorScheduleService, ScheduleInput } from '../../services/schedulingService';

interface SellerScheduleConfigProps {
  vendedorId: string;
  onSave?: () => void;
  onCancel?: () => void;
  showButtons?: boolean;
}

const DIAS_SEMANA = [
  { value: 1, label: 'Segunda-feira', short: 'Seg' },
  { value: 2, label: 'Terça-feira', short: 'Ter' },
  { value: 3, label: 'Quarta-feira', short: 'Qua' },
  { value: 4, label: 'Quinta-feira', short: 'Qui' },
  { value: 5, label: 'Sexta-feira', short: 'Sex' },
  { value: 6, label: 'Sábado', short: 'Sáb' },
  { value: 0, label: 'Domingo', short: 'Dom' }
];

const DEFAULT_SCHEDULES: ScheduleInput[] = DIAS_SEMANA.map(dia => ({
  dia_semana: dia.value,
  is_active: dia.value !== 0 && dia.value !== 6, // Sáb e Dom desativados
  manha_inicio: '08:00',
  manha_fim: '12:00',
  tarde_inicio: '14:00',
  tarde_fim: '18:00'
}));

export const SellerScheduleConfig: React.FC<SellerScheduleConfigProps> = ({
  vendedorId,
  onSave,
  onCancel,
  showButtons = true
}) => {
  const [schedules, setSchedules] = useState<ScheduleInput[]>(DEFAULT_SCHEDULES);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSchedules();
  }, [vendedorId]);

  const loadSchedules = async () => {
    if (!vendedorId) {
      setSchedules(DEFAULT_SCHEDULES);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await vendedorScheduleService.getByVendedor(vendedorId);

      if (data.length > 0) {
        // Mapear dados existentes
        const mappedSchedules = DIAS_SEMANA.map(dia => {
          const existing = data.find(d => d.dia_semana === dia.value);
          if (existing) {
            return {
              dia_semana: existing.dia_semana,
              is_active: existing.is_active,
              manha_inicio: existing.manha_inicio,
              manha_fim: existing.manha_fim,
              tarde_inicio: existing.tarde_inicio,
              tarde_fim: existing.tarde_fim
            };
          }
          return DEFAULT_SCHEDULES.find(d => d.dia_semana === dia.value)!;
        });
        setSchedules(mappedSchedules);
      } else {
        setSchedules(DEFAULT_SCHEDULES);
      }
    } catch (error) {
      console.error('Erro ao carregar schedules:', error);
      setSchedules(DEFAULT_SCHEDULES);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleDay = (diaSemana: number) => {
    setSchedules(prev =>
      prev.map(s =>
        s.dia_semana === diaSemana ? { ...s, is_active: !s.is_active } : s
      )
    );
    setSaved(false);
  };

  const handleTimeChange = (
    diaSemana: number,
    field: 'manha_inicio' | 'manha_fim' | 'tarde_inicio' | 'tarde_fim',
    value: string
  ) => {
    setSchedules(prev =>
      prev.map(s =>
        s.dia_semana === diaSemana ? { ...s, [field]: value || null } : s
      )
    );
    setSaved(false);
  };

  const handleSave = async () => {
    if (!vendedorId) return;

    try {
      setSaving(true);
      await vendedorScheduleService.save(vendedorId, schedules);
      setSaved(true);
      onSave?.();
      setTimeout(() => setSaved(false), 2000);
    } catch (error) {
      console.error('Erro ao salvar schedules:', error);
      alert('Erro ao salvar configurações de agenda');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-brand-yellow" />
        <span className="ml-2 text-gray-400">Carregando agenda...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className="w-5 h-5 text-brand-yellow" />
        <h3 className="text-lg font-bold text-white">Configurar Agenda Semanal</h3>
      </div>

      <p className="text-gray-400 text-sm mb-6">
        Configure os dias e horários disponíveis para agendamento de reuniões.
        Deixe os campos de horário em branco para desativar um período.
      </p>

      <div className="space-y-4">
        {DIAS_SEMANA.map(dia => {
          const schedule = schedules.find(s => s.dia_semana === dia.value)!;
          const isWeekend = dia.value === 0 || dia.value === 6;

          return (
            <div
              key={dia.value}
              className={`p-4 border rounded-lg transition-all ${
                schedule.is_active
                  ? 'border-brand-yellow/30 bg-brand-yellow/5'
                  : 'border-white/10 bg-white/5 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => handleToggleDay(dia.value)}
                    className={`w-12 h-6 rounded-full transition-all relative ${
                      schedule.is_active ? 'bg-brand-yellow' : 'bg-gray-600'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${
                        schedule.is_active ? 'left-7' : 'left-1'
                      }`}
                    />
                  </button>
                  <span className={`font-medium ${schedule.is_active ? 'text-white' : 'text-gray-500'}`}>
                    {dia.label}
                  </span>
                  {isWeekend && (
                    <span className="text-xs px-2 py-0.5 bg-gray-700 text-gray-400 rounded">
                      Fim de semana
                    </span>
                  )}
                </div>
              </div>

              {schedule.is_active && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Período da Manhã */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Manhã
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={schedule.manha_inicio || ''}
                        onChange={(e) => handleTimeChange(dia.value, 'manha_inicio', e.target.value)}
                        className="flex-1 bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-brand-yellow outline-none"
                      />
                      <span className="text-gray-500">às</span>
                      <input
                        type="time"
                        value={schedule.manha_fim || ''}
                        onChange={(e) => handleTimeChange(dia.value, 'manha_fim', e.target.value)}
                        className="flex-1 bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-brand-yellow outline-none"
                      />
                    </div>
                  </div>

                  {/* Período da Tarde */}
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-400 uppercase flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Tarde
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={schedule.tarde_inicio || ''}
                        onChange={(e) => handleTimeChange(dia.value, 'tarde_inicio', e.target.value)}
                        className="flex-1 bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-brand-yellow outline-none"
                      />
                      <span className="text-gray-500">às</span>
                      <input
                        type="time"
                        value={schedule.tarde_fim || ''}
                        onChange={(e) => handleTimeChange(dia.value, 'tarde_fim', e.target.value)}
                        className="flex-1 bg-brand-dark border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-brand-yellow outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {showButtons && (
        <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
          )}
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`px-6 py-2 font-bold uppercase tracking-wider transition-all flex items-center gap-2 ${
              saved
                ? 'bg-green-500 text-white'
                : 'bg-brand-yellow text-brand-darker hover:bg-yellow-400'
            }`}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Salvando...
              </>
            ) : saved ? (
              <>
                <Check className="w-4 h-4" />
                Salvo!
              </>
            ) : (
              'Salvar Agenda'
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default SellerScheduleConfig;
