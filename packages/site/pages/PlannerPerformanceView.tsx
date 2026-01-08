import React, { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Calendar,
  Target,
  FileText,
  Gauge,
  Menu as MenuIcon,
  X,
  Zap,
  BookOpen,
  Dumbbell,
  Droplets,
  Moon,
  Smartphone,
  Brain,
  AlertCircle,
  Heart,
  Sparkles,
  CheckCircle2,
  Clock,
  Save,
  User,
  Flame,
  Play,
  Pause,
  RotateCcw,
  ChevronDown,
  ChevronUp,
  Sun,
  Lightbulb,
  TrendingUp,
  TrendingDown,
  Award,
  Settings
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SEOHead } from '../components/SEOHead';
import { plannerService, SavePlannerInput } from '../services/plannerService';
import { PlannerDiario, PlannerSemanal, Planejamento, SemaforoCor } from '../lib/database.types';
import { useQueryClient } from '@tanstack/react-query';
import {
  usePlannerToday,
  usePlannerStreak,
  usePlannerHistorico,
  useAtividadesHoje,
  plannerKeys,
} from '../hooks/usePlannerData';

// Tipos
type ModoPlanner = 'manha' | 'noite';
type TimerStatus = 'idle' | 'running' | 'paused';

// Helper: Converte decimal para HH:MM
const decimalToTime = (decimal: number | null): string => {
  if (decimal === null || decimal === undefined) return '00:00';
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Helper: Converte HH:MM para decimal
const timeToDecimal = (time: string): number | null => {
  if (!time || time.length < 5) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours + minutes / 60;
};

// Helper: Formata duração em minutos para display
const formatDuracao = (minutos: number): string => {
  if (minutos < 60) return `${minutos}min`;
  const h = Math.floor(minutos / 60);
  const m = minutos % 60;
  return m > 0 ? `${h}h${m}min` : `${h}h`;
};

// Componente: Calendário de Contribuições (estilo GitHub)
const ContributionCalendar: React.FC<{
  historico: PlannerDiario[];
  streak: { atual: number; melhor: number };
  showStatsHeader?: boolean;
  totalDays?: number;
}> = ({ historico, streak, showStatsHeader = true, totalDays = 182 }) => {
  const hoje = new Date();
  const DIAS_SEMANA = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const MESES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

  const dias: { data: string; semaforo: SemaforoCor | null; isHoje: boolean; date: Date }[] = [];

  for (let i = totalDays - 1; i >= 0; i--) {
    const d = new Date(hoje);
    d.setDate(d.getDate() - i);
    const dataStr = d.toISOString().split('T')[0];
    const registro = historico.find(h => h.data === dataStr);
    dias.push({
      data: dataStr,
      semaforo: registro?.semaforo || null,
      isHoje: i === 0,
      date: new Date(d)
    });
  }

  // Agrupar por semana (começando na segunda)
  const primeiroDia = dias[0].date.getDay(); // 0 = Dom, 1 = Seg, etc.
  // Ajustar para segunda-feira ser 0: (dia + 6) % 7
  const diasPaddingCount = (primeiroDia + 6) % 7;
  const diasComPadding = [...Array(diasPaddingCount).fill(null), ...dias];
  const semanas: (typeof dias[0] | null)[][] = [];
  for (let i = 0; i < diasComPadding.length; i += 7) {
    semanas.push(diasComPadding.slice(i, i + 7));
  }

  // Calcular meses para labels
  const mesesLabels: { mes: string; posicao: number }[] = [];
  let ultimoMes = -1;
  semanas.forEach((semana, idx) => {
    const primeiroDiaSemana = semana.find(d => d !== null);
    if (primeiroDiaSemana) {
      const mes = primeiroDiaSemana.date.getMonth();
      if (mes !== ultimoMes) {
        mesesLabels.push({ mes: MESES[mes], posicao: idx });
        ultimoMes = mes;
      }
    }
  });

  const getCor = (semaforo: SemaforoCor | null): string => {
    switch (semaforo) {
      case 'verde': return 'bg-green-500';
      case 'amarelo': return 'bg-yellow-500';
      case 'vermelho': return 'bg-red-500';
      default: return 'bg-white/[0.06]';
    }
  };

  const getCorHover = (semaforo: SemaforoCor | null): string => {
    switch (semaforo) {
      case 'verde': return 'hover:bg-green-400 hover:ring-2 hover:ring-green-400/50';
      case 'amarelo': return 'hover:bg-yellow-400 hover:ring-2 hover:ring-yellow-400/50';
      case 'vermelho': return 'hover:bg-red-400 hover:ring-2 hover:ring-red-400/50';
      default: return 'hover:bg-white/10';
    }
  };

  // Estatísticas
  const totalVerdes = historico.filter(h => h.semaforo === 'verde').length;
  const totalAmarelos = historico.filter(h => h.semaforo === 'amarelo').length;
  const totalVermelhos = historico.filter(h => h.semaforo === 'vermelho').length;
  const totalRegistrados = totalVerdes + totalAmarelos + totalVermelhos;
  const percentualVerde = totalRegistrados > 0 ? Math.round((totalVerdes / totalRegistrados) * 100) : 0;

  return (
    <div className="space-y-4">
      {/* Header com Estatísticas */}
      {showStatsHeader && (
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            {/* Streak Atual */}
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Flame className="w-7 h-7 text-white" />
              </div>
              <div>
                <p className="text-3xl font-black text-[var(--color-text-primary)] leading-none">{streak.atual}</p>
                <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold">dias seguidos</p>
              </div>
            </div>

            {/* Melhor Streak */}
            {streak.melhor > streak.atual && (
              <div className="hidden md:flex items-center gap-2 pl-6 border-l border-[var(--color-border-light)]">
                <Award className="w-5 h-5 text-purple-400" />
                <div>
                  <p className="text-lg font-black text-[var(--color-text-primary)] leading-none">{streak.melhor}</p>
                  <p className="text-[10px] text-[var(--color-text-muted)] uppercase">recorde</p>
                </div>
              </div>
            )}
          </div>

          {/* Stats Resumidos */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-green-500" />
              <span className="text-sm text-[var(--color-text-secondary)]"><span className="font-bold text-[var(--color-text-primary)]">{totalVerdes}</span> verdes</span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-yellow-500" />
              <span className="text-sm text-[var(--color-text-secondary)]"><span className="font-bold text-[var(--color-text-primary)]">{totalAmarelos}</span></span>
            </div>
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-3 h-3 rounded-sm bg-red-500" />
              <span className="text-sm text-[var(--color-text-secondary)]"><span className="font-bold text-[var(--color-text-primary)]">{totalVermelhos}</span></span>
            </div>
            {percentualVerde > 0 && (
              <div className="text-sm text-green-400 font-bold">
                {percentualVerde}% verde
              </div>
            )}
          </div>
        </div>
      )}

      {/* Calendário */}
      <div className="bg-[var(--color-bg-secondary)]/30 rounded-xl p-4 overflow-x-auto">
        {/* Labels dos meses */}
        <div className="flex mb-2 pl-8">
          {mesesLabels.map((label, idx) => (
            <div
              key={idx}
              className="text-[10px] text-[var(--color-text-muted)] font-medium absolute"
              style={{ marginLeft: `${label.posicao * 16}px` }}
            >
              {label.mes}
            </div>
          ))}
        </div>
        <div className="h-3 mb-1" /> {/* Spacer para labels */}

        <div className="flex gap-[3px]">
          {/* Labels dos dias da semana */}
          <div className="flex flex-col gap-[3px] pr-2">
            {['Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb', 'Dom'].map((dia) => (
              <div
                key={dia}
                className="w-6 h-[13px] flex items-center text-[9px] text-[var(--color-text-muted)]"
              >
                {dia}
              </div>
            ))}
          </div>

          {/* Grid de semanas */}
          {semanas.map((semana, sIdx) => (
            <div key={sIdx} className="flex flex-col gap-[3px]">
              {semana.map((dia, dIdx) => (
                <div
                  key={dIdx}
                  className={`w-[13px] h-[13px] rounded-[3px] transition-all cursor-pointer ${dia
                    ? `${getCor(dia.semaforo)} ${getCorHover(dia.semaforo)} ${dia.isHoje ? 'ring-2 ring-[var(--color-accent)] ring-offset-1 ring-offset-[var(--color-bg-primary)]' : ''
                    }`
                    : 'bg-transparent'
                    }`}
                  title={
                    dia
                      ? `${dia.date.toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: 'short' })}: ${dia.semaforo === 'verde' ? '🟢 Dia produtivo' :
                        dia.semaforo === 'amarelo' ? '🟡 Dia ok' :
                          dia.semaforo === 'vermelho' ? '🔴 Dia difícil' :
                            'Não registrado'
                      }`
                      : ''
                  }
                />
              ))}
            </div>
          ))}
        </div>

        {/* Legenda */}
        <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-[var(--color-border-light)]">
          <span className="text-[10px] text-[var(--color-text-muted)]">Menos</span>
          <div className="w-[10px] h-[10px] rounded-[2px] bg-white/[0.06]" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-red-500/60" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-yellow-500/80" />
          <div className="w-[10px] h-[10px] rounded-[2px] bg-green-500" />
          <span className="text-[10px] text-[var(--color-text-muted)]">Mais</span>
        </div>
      </div>
    </div>
  );
};

// Opções de duração do timer
const TIMER_DURACOES = [
  { value: 15, label: '15 min' },
  { value: 25, label: '25 min' },
  { value: 30, label: '30 min' },
  { value: 45, label: '45 min' },
  { value: 60, label: '60 min' },
];

// Componente: Timer Pomodoro
const PomodoroTimer: React.FC<{
  duracao: number;
  onDuracaoChange: (minutos: number) => void;
  onComplete: (minutos: number) => void;
}> = ({ duracao, onDuracaoChange, onComplete }) => {
  const [status, setStatus] = useState<TimerStatus>('idle');
  const [tempoRestante, setTempoRestante] = useState(duracao * 60);
  const [tempoTotal, setTempoTotal] = useState(0);
  const [sessaoAtual, setSessaoAtual] = useState(1);
  const [showConfig, setShowConfig] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        setTempoRestante(prev => {
          if (prev <= 1) {
            // Sessão completa
            setStatus('idle');
            setTempoTotal(t => t + duracao);
            onComplete(duracao);
            setSessaoAtual(s => s + 1);
            return duracao * 60;
          }
          return prev - 1;
        });
      }, 1000);
    } else if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [status, duracao, onComplete]);

  const formatTime = (seconds: number): string => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const handleStart = () => setStatus('running');
  const handlePause = () => setStatus('paused');
  const handleReset = () => {
    setStatus('idle');
    setTempoRestante(duracao * 60);
  };

  const handleChangeDuracao = (minutos: number) => {
    onDuracaoChange(minutos);
    if (status === 'idle') {
      setTempoRestante(minutos * 60);
    }
    setShowConfig(false);
  };

  const progresso = ((duracao * 60 - tempoRestante) / (duracao * 60)) * 100;

  return (
    <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 relative theme-transition">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock className="w-5 h-5 text-cyan-400" />
          <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Timer de Estudo</h3>
        </div>
        <span className="text-xs text-[var(--color-text-muted)]">Sessão {sessaoAtual}</span>
      </div>

      {/* Timer Display */}
      <div className="text-center mb-6">
        <div className="text-5xl font-mono font-black text-[var(--color-text-primary)] mb-2">
          {formatTime(tempoRestante)}
        </div>
        <div className="w-full bg-[var(--color-bg-hover)] rounded-full h-2 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-cyan-500 to-blue-500"
            initial={{ width: 0 }}
            animate={{ width: `${progresso}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        {tempoTotal > 0 && (
          <p className="text-xs text-[var(--color-text-muted)] mt-2">
            Total hoje: {formatDuracao(tempoTotal)}
          </p>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-3">
        {status === 'idle' || status === 'paused' ? (
          <button
            onClick={handleStart}
            className="flex items-center gap-2 px-6 py-3 bg-green-500 hover:bg-green-400 text-white font-bold rounded-lg transition-all"
          >
            <Play className="w-5 h-5" />
            {status === 'paused' ? 'Continuar' : 'Iniciar'}
          </button>
        ) : (
          <button
            onClick={handlePause}
            className="flex items-center gap-2 px-6 py-3 bg-yellow-500 hover:bg-yellow-400 text-black font-bold rounded-lg transition-all"
          >
            <Pause className="w-5 h-5" />
            Pausar
          </button>
        )}
        <button
          onClick={handleReset}
          className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-hover)] hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] rounded-lg transition-all"
          title="Reiniciar"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <button
          onClick={() => setShowConfig(!showConfig)}
          className="flex items-center gap-2 px-4 py-3 bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-hover)] text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] rounded-lg transition-all"
          title="Configurar duração"
        >
          <Settings className="w-5 h-5" />
        </button>
      </div>

      {/* Config Dropdown */}
      <AnimatePresence>
        {showConfig && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-6 mt-2 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg p-3 shadow-xl z-10"
          >
            <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">Duração da sessão</p>
            <div className="flex flex-wrap gap-2">
              {TIMER_DURACOES.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => handleChangeDuracao(opt.value)}
                  className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${duracao === opt.value
                    ? 'bg-cyan-500 text-white'
                    : 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                    }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// Componente: Atividade do Dia
const AtividadeCard: React.FC<{
  hora: string;
  atividade: string;
  cor: string;
  duracao: number;
  concluida?: boolean;
  onToggle?: () => void;
}> = ({ hora, atividade, cor, duracao, concluida, onToggle }) => (
  <button
    onClick={onToggle}
    className={`flex items-center gap-3 p-3 rounded-lg transition-all w-full text-left ${concluida ? 'bg-green-500/10 opacity-60' : 'bg-[var(--color-bg-hover)] hover:bg-[var(--color-bg-tertiary)]'
      }`}
  >
    <div
      className={`w-3 h-12 rounded-full`}
      style={{ backgroundColor: cor }}
    />
    <div className="flex-1">
      <p className={`font-bold ${concluida ? 'text-[var(--color-text-muted)] line-through' : 'text-[var(--color-text-primary)]'}`}>
        {atividade}
      </p>
      <p className="text-xs text-[var(--color-text-muted)]">
        {hora} - {formatDuracao(duracao)}
      </p>
    </div>
    {concluida && <CheckCircle2 className="w-5 h-5 text-green-500" />}
  </button>
);

// Componente: Insight Card
const InsightCard: React.FC<{
  tipo: 'success' | 'warning' | 'tip';
  texto: string;
}> = ({ tipo, texto }) => {
  const configs = {
    success: { bg: 'bg-green-500/10', border: 'border-green-500/30', icon: TrendingUp, iconColor: 'text-green-400' },
    warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', icon: AlertCircle, iconColor: 'text-yellow-400' },
    tip: { bg: 'bg-blue-500/10', border: 'border-blue-500/30', icon: Lightbulb, iconColor: 'text-blue-400' }
  };

  const config = configs[tipo];
  const Icon = config.icon;

  return (
    <div className={`${config.bg} border ${config.border} rounded-lg p-3 flex items-start gap-3`}>
      <Icon className={`w-5 h-5 ${config.iconColor} flex-shrink-0 mt-0.5`} />
      <p className="text-sm text-[var(--color-text-secondary)]">{texto}</p>
    </div>
  );
};

// Componente: Semáforo do Dia
const SemaforoPicker: React.FC<{
  value: SemaforoCor | null;
  onChange: (value: SemaforoCor) => void;
}> = ({ value, onChange }) => (
  <div className="flex gap-3">
    {[
      { cor: 'verde' as SemaforoCor, bg: 'bg-green-500', label: 'Dia produtivo!' },
      { cor: 'amarelo' as SemaforoCor, bg: 'bg-yellow-500', label: 'Mais ou menos' },
      { cor: 'vermelho' as SemaforoCor, bg: 'bg-red-500', label: 'Dia difícil' }
    ].map(item => (
      <button
        key={item.cor}
        onClick={() => onChange(item.cor)}
        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${value === item.cor
          ? 'bg-[var(--color-bg-hover)] scale-105'
          : 'opacity-50 hover:opacity-100'
          }`}
      >
        <div className={`w-8 h-8 rounded-full ${item.bg} ${value === item.cor ? 'ring-2 ring-[var(--color-text-primary)] ring-offset-2 ring-offset-[var(--color-bg-primary)]' : ''}`} />
        <span className="text-xs text-[var(--color-text-secondary)]">{item.label}</span>
      </button>
    ))}
  </div>
);

// Componente: Input de Tempo
const TimeInput: React.FC<{
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  maxHours?: number;
}> = ({ value, onChange, placeholder = '00:00', maxHours = 23 }) => {
  const [displayValue, setDisplayValue] = useState(decimalToTime(value));

  useEffect(() => {
    setDisplayValue(decimalToTime(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, '');
    if (input.length > 4) input = input.slice(0, 4);

    let formatted = '';
    if (input.length >= 1) {
      const hours = input.slice(0, 2);
      formatted = hours;
      if (input.length >= 3) {
        const minutes = input.slice(2, 4);
        formatted = `${hours}:${minutes}`;
      }
    }
    setDisplayValue(formatted);
  };

  const handleBlur = () => {
    if (!displayValue) {
      onChange(null);
      return;
    }

    let finalValue = displayValue;
    if (displayValue.length === 1) finalValue = `0${displayValue}:00`;
    else if (displayValue.length === 2) finalValue = `${displayValue}:00`;
    else if (displayValue.length === 4) finalValue = `${displayValue.slice(0, 2)}:${displayValue.slice(2)}`;

    const [hoursStr, minutesStr] = finalValue.split(':');
    let hours = parseInt(hoursStr) || 0;
    let minutes = parseInt(minutesStr) || 0;

    if (hours > maxHours) hours = maxHours;
    if (minutes > 59) minutes = 59;

    const formatted = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
    setDisplayValue(formatted);
    onChange(timeToDecimal(formatted));
  };

  return (
    <input
      type="text"
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      maxLength={5}
      className="w-20 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] text-center focus:outline-none focus:border-[var(--color-accent)]/50 font-mono"
    />
  );
};

// Componente: Checkbox Estilizado
const CheckboxItem: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
  label: string;
}> = ({ checked, onChange, icon, label }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-3 p-3 rounded-lg transition-all w-full text-left ${checked ? 'bg-green-500/10 text-green-400' : 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
      }`}
  >
    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${checked ? 'bg-green-500 border-green-500' : 'border-[var(--color-border)]'
      }`}>
      {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
    </div>
    <span className="flex items-center gap-2">
      {icon && icon}
      {label}
    </span>
  </button>
);

// Motivos do semáforo
const SEMAFORO_MOTIVOS = [
  { value: 'cansaco', label: 'Cansaço' },
  { value: 'falta_tempo', label: 'Falta de tempo' },
  { value: 'procrastinacao', label: 'Procrastinação' },
  { value: 'materia_dificil', label: 'Matéria difícil' },
  { value: 'ansiedade', label: 'Ansiedade' },
  { value: 'trabalho', label: 'Trabalho' }
];

// Componente Principal
// Tipo do contexto do layout
interface PlannerContext {
  planejamento: (Planejamento & {
    preparatorio?: { id: string; nome: string; cor: string } | null;
  }) | null;
  slug: string;
  id: string;
}

interface MensagemIncentivo {
  id: string;
  mensagem: string;
}

export const PlannerPerformanceView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const context = useOutletContext<PlannerContext>();
  const planejamento = context?.planejamento;
  const queryClient = useQueryClient();

  // Estados principais
  const [saving, setSaving] = useState(false);
  const [planner, setPlanner] = useState<Partial<PlannerDiario>>({});
  const [hasChanges, setHasChanges] = useState(false);
  const [timerDuration, setTimerDuration] = useState(25);

  // Helper: Determina o modo baseado na hora
  const getModoByHora = (): ModoPlanner => {
    const hora = new Date().getHours();
    // 5:00 - 17:59 = manhã, 18:00 - 4:59 = noite
    return hora >= 5 && hora < 18 ? 'manha' : 'noite';
  };

  // Estados do Cockpit
  const [modo, setModo] = useState<ModoPlanner>(getModoByHora);
  const [atividadesConcluidas, setAtividadesConcluidas] = useState<Set<string>>(new Set());
  const [insights, setInsights] = useState<Array<{ tipo: 'success' | 'warning' | 'tip'; texto: string }>>([]);
  const [weekSummary, setWeekSummary] = useState<PlannerSemanal | null>(null);
  const [horasPlanejadas, setHorasPlanejadas] = useState(0);
  const [showPessoaMelhor, setShowPessoaMelhor] = useState(true);
  const [mensagemIncentivo, setMensagemIncentivo] = useState<string | null>(null);

  // Buscar mensagem de incentivo aleatória
  useEffect(() => {
    const fetchMensagemIncentivo = async () => {
      const preparatorioId = planejamento?.preparatorio_id;
      if (!preparatorioId) return;

      try {
        const { data } = await supabase
          .from('mensagens_incentivo')
          .select('id, mensagem')
          .eq('preparatorio_id', preparatorioId)
          .eq('is_active', true);

        if (data && data.length > 0) {
          // Selecionar uma mensagem aleatória
          const randomIndex = Math.floor(Math.random() * data.length);
          setMensagemIncentivo(data[randomIndex].mensagem);
        }
      } catch (error) {
        console.error('Erro ao carregar mensagem de incentivo:', error);
      }
    };

    fetchMensagemIncentivo();
  }, [planejamento?.preparatorio_id]);

  const today = new Date();
  const dayInfo = plannerService.formatDayInfo(today);

  // React Query hooks para cache de dados
  const { data: todayPlanner, isLoading: loadingToday } = usePlannerToday(id);
  const { data: streakData, isLoading: loadingStreak } = usePlannerStreak(id);
  const { data: historicoData, isLoading: loadingHistorico } = usePlannerHistorico(id, 200);
  const { data: atividadesData, isLoading: loadingAtividades } = useAtividadesHoje(id);

  // Combinar loading states
  const loading = loadingToday || loadingStreak || loadingHistorico || loadingAtividades;

  // Dados com fallback
  const streak = streakData || { atual: 0, melhor: 0 };
  const historico = historicoData || [];
  const atividadesHoje = atividadesData || [];

  // Atualizar planner local quando dados chegam do cache
  useEffect(() => {
    if (todayPlanner) {
      setPlanner(todayPlanner);
    }
  }, [todayPlanner]);

  // Carregar insights, weekSummary e horasPlanejadas (menos críticos para cache)
  useEffect(() => {
    const fetchExtras = async () => {
      if (!id) return;
      try {
        const [insightsData, summary, horas] = await Promise.all([
          plannerService.getInsights(id),
          plannerService.getWeekSummary(id),
          plannerService.calcularHorasPlanejadas(id, today.getDay()),
        ]);
        setInsights(insightsData);
        setWeekSummary(summary);
        setHorasPlanejadas(horas);
      } catch (error) {
        console.error('Erro ao carregar extras:', error);
      }
    };
    if (!loading) {
      fetchExtras();
    }
  }, [id, loading]);

  // Auto-switch modo baseado na hora (verifica a cada minuto)
  useEffect(() => {
    const checkAndSwitchMode = () => {
      const novoModo = getModoByHora();
      setModo(prevModo => {
        if (prevModo !== novoModo) {
          console.log(`Modo alterado automaticamente para: ${novoModo}`);
          return novoModo;
        }
        return prevModo;
      });
    };

    // Verifica a cada minuto
    const interval = setInterval(checkAndSwitchMode, 60000);

    return () => clearInterval(interval);
  }, []);

  // Atualizar campo do planner
  const updateField = useCallback(<K extends keyof PlannerDiario>(field: K, value: PlannerDiario[K]) => {
    setPlanner(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

  // Toggle atividade concluída
  const toggleAtividade = (hora: string) => {
    setAtividadesConcluidas(prev => {
      const newSet = new Set(prev);
      if (newSet.has(hora)) {
        newSet.delete(hora);
      } else {
        newSet.add(hora);
      }
      return newSet;
    });
  };

  // Timer completo - adicionar tempo estudado
  const handleTimerComplete = (minutos: number) => {
    const horasAdicionais = minutos / 60;
    const horasAtuais = planner.horas_estudadas || 0;
    updateField('horas_estudadas', horasAtuais + horasAdicionais);
  };

  // Salvar planner
  const handleSave = async () => {
    if (!id) return;

    setSaving(true);
    try {
      const input: SavePlannerInput = {
        planejamento_id: id,
        data: today.toISOString().split('T')[0],
        horas_planejadas: horasPlanejadas,
        ...planner
      };

      const saved = await plannerService.save(input);
      setPlanner(saved);
      setHasChanges(false);

      // Atualizar resumo e invalidar cache do streak
      const summary = await plannerService.getWeekSummary(id);
      setWeekSummary(summary);
      queryClient.invalidateQueries({ queryKey: plannerKeys.streak(id) });
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  // Calcular percentual do planejado
  const percentualPlanejado = horasPlanejadas > 0
    ? Math.round(((planner.horas_estudadas || 0) / horasPlanejadas) * 100)
    : 0;

  // Calcular aderência às atividades
  const aderencia = atividadesHoje.length > 0
    ? Math.round((atividadesConcluidas.size / atividadesHoje.length) * 100)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center theme-transition">
        <Loader2 className="w-10 h-10 text-[var(--color-accent)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] pb-24 theme-transition">
      <SEOHead title="Cockpit | Ouse Passar" />

      <main className="pt-20 px-4 max-w-6xl mx-auto space-y-6">
        {/* Painel Unificado de Topo */}
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-5 lg:p-6 relative overflow-hidden group theme-transition">
          {/* Decorative Gradient */}
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[var(--color-accent)]/5 to-transparent pointer-events-none opacity-50 group-hover:opacity-100 transition-opacity duration-700" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">

            {/* Coluna Esquerda: Perfil e KPIs (5 colunas) */}
            <div className="lg:col-span-5 flex flex-col justify-between gap-6">
              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h1 className="text-2xl lg:text-3xl font-black text-[var(--color-text-primary)] mb-1 leading-tight tracking-tight">
                      {modo === 'manha' ? '☀️ Bom dia' : '🌙 Boa noite'},{' '}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--color-accent)] to-yellow-500">
                        {planejamento?.nome_aluno?.split(' ')[0]}!
                      </span>
                    </h1>
                    {mensagemIncentivo && (
                      <p className="text-[var(--color-text-secondary)] text-sm italic">"{mensagemIncentivo}"</p>
                    )}
                  </div>

                  {/* Toggle Mobile */}
                  <div className="lg:hidden flex bg-[var(--color-bg-hover)] rounded-lg p-1">
                    <button
                      onClick={() => setModo(modo === 'manha' ? 'noite' : 'manha')}
                      className="p-2 text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)] rounded-md transition-all"
                    >
                      {modo === 'manha' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                {/* Toggle Desktop */}
                <div className="hidden lg:flex bg-[var(--color-bg-secondary)]/50 rounded-lg p-1 w-full max-w-xs mb-6 border border-[var(--color-border-light)]">
                  <button
                    onClick={() => setModo('manha')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${modo === 'manha' ? 'bg-[var(--color-accent)] text-[var(--color-text-inverse)] shadow-lg' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                      }`}
                  >
                    <Sun className="w-4 h-4" />
                    Manhã
                  </button>
                  <button
                    onClick={() => setModo('noite')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-md text-sm font-bold transition-all ${modo === 'noite' ? 'bg-indigo-500 text-white shadow-lg' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-hover)]'
                      }`}
                  >
                    <Moon className="w-4 h-4" />
                    Noite
                  </button>
                </div>

                {/* Grid de KPIs Compacto */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-[var(--color-bg-secondary)]/40 rounded-xl p-3 border border-[var(--color-border-light)] hover:border-[var(--color-accent)]/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Dias Verdes</span>
                      <div className="w-2 h-2 rounded-full bg-[var(--color-success)] shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                    </div>
                    <p className="text-2xl font-black text-[var(--color-text-primary)]">{weekSummary?.diasVerdes || 0}</p>
                  </div>

                  <div className="bg-[var(--color-bg-secondary)]/40 rounded-xl p-3 border border-[var(--color-border-light)] hover:border-[var(--color-accent)]/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Estudadas</span>
                      <Clock className="w-3 h-3 text-[var(--color-info)]" />
                    </div>
                    <p className="text-2xl font-black text-[var(--color-text-primary)]">{weekSummary?.horasEstudadas || 0}<span className="text-sm text-[var(--color-text-muted)] font-bold ml-0.5">h</span></p>
                  </div>

                  <div className="bg-[var(--color-bg-secondary)]/40 rounded-xl p-3 border border-[var(--color-border-light)] hover:border-[var(--color-accent)]/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Missões</span>
                      <Target className="w-3 h-3 text-purple-400" />
                    </div>
                    <p className="text-2xl font-black text-[var(--color-text-primary)]">{weekSummary?.missoesTotal || 0}</p>
                  </div>

                  <div className="bg-[var(--color-bg-secondary)]/40 rounded-xl p-3 border border-[var(--color-border-light)] hover:border-[var(--color-accent)]/20 transition-colors">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold text-[var(--color-text-muted)]">Acertos</span>
                      <CheckCircle2 className="w-3 h-3 text-cyan-400" />
                    </div>
                    <p className="text-2xl font-black text-[var(--color-text-primary)]">
                      {weekSummary?.mediaAcertos !== null ? weekSummary?.mediaAcertos : '-'}
                      <span className="text-sm text-[var(--color-text-muted)] font-bold ml-0.5">%</span>
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Coluna Direita: Streak e Heatmap (7 colunas) */}
            <div className="lg:col-span-7 flex flex-col h-full bg-[var(--color-bg-secondary)]/20 rounded-xl border border-[var(--color-border-light)] p-1">

              {/* Header Interno */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-light)]">
                <div className="flex items-center gap-3">
                  <div className="bg-gradient-to-br from-orange-500 to-red-600 w-10 h-10 rounded-lg flex items-center justify-center shadow-lg shadow-orange-500/20">
                    <Flame className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-2xl font-black text-[var(--color-text-primary)] leading-none">{streak.atual}</span>
                      <span className="text-xs text-[var(--color-text-muted)] font-bold uppercase tracking-wider">dias seguidos</span>
                    </div>
                    <p className="text-[10px] text-[var(--color-text-muted)] font-medium mt-0.5">{dayInfo.diaSemana}, {dayInfo.dataFormatada}</p>
                  </div>
                </div>

                {/* Cargo / Preparatório */}
                <div className="hidden sm:flex items-center gap-2">
                  {(planejamento as any)?.preparatorio?.nome && (
                    <div className="flex items-center gap-2 bg-gradient-to-r from-[var(--color-accent)]/10 to-transparent pl-3 pr-4 py-1.5 rounded-full border border-[var(--color-accent)]/20">
                      <Target className="w-4 h-4 text-[var(--color-accent)]" />
                      <span className="text-xs font-bold text-[var(--color-text-primary)] uppercase tracking-wide">
                        {(planejamento as any).preparatorio.nome}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Heatmap Area */}
              <div className="flex-1 p-4 flex items-center justify-center">
                <ContributionCalendar historico={historico} streak={streak} showStatsHeader={false} />
              </div>
            </div>

          </div>
        </div>


        {/* Layout principal: 2 colunas em desktop */}
        <div className="grid md:grid-cols-3 gap-6">
          {/* Coluna Esquerda: Atividades + Timer */}
          <div className="md:col-span-2 space-y-6">
            {/* Atividades de Hoje */}
            {atividadesHoje.length > 0 && (
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 theme-transition">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-[var(--color-info)]" />
                    <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Atividades de Hoje</h3>
                  </div>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    Aderência: <span className={aderencia >= 70 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}>{aderencia}%</span>
                  </span>
                </div>

                <div className="grid md:grid-cols-2 gap-3">
                  {atividadesHoje.map((ativ, idx) => (
                    <AtividadeCard
                      key={idx}
                      hora={ativ.hora}
                      atividade={ativ.atividade}
                      cor={ativ.cor}
                      duracao={ativ.duracao}
                      concluida={atividadesConcluidas.has(ativ.hora)}
                      onToggle={() => toggleAtividade(ativ.hora)}
                    />
                  ))}
                </div>
              </div>
            )}



            {/* Registro do Dia */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 theme-transition">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-[var(--color-success)]" />
                <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                  {modo === 'manha' ? 'Meta do Dia' : 'Registro do Dia'}
                </h3>
              </div>

              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div className="bg-[var(--color-bg-secondary)]/50 rounded-lg p-4">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold mb-1">Planejado</p>
                  <p className="text-2xl font-black text-[var(--color-text-primary)] font-mono">{decimalToTime(horasPlanejadas)}</p>
                </div>
                <div className="bg-[var(--color-bg-secondary)]/50 rounded-lg p-4">
                  <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">Estudado</p>
                  <div className="flex items-center gap-2">
                    <TimeInput
                      value={planner.horas_estudadas ?? null}
                      onChange={v => updateField('horas_estudadas', v ?? 0)}
                      maxHours={24}
                    />
                    <span className="text-gray-500 text-sm">horas</span>
                  </div>
                </div>
              </div>

              {modo === 'noite' && (
                <>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">Missões</p>
                      <input
                        type="number"
                        value={planner.missoes_concluidas ?? ''}
                        onChange={e => updateField('missoes_concluidas', parseInt(e.target.value) || 0)}
                        className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] text-center"
                        min={0}
                        max={99}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">Questões</p>
                      <input
                        type="number"
                        value={planner.questoes_feitas ?? ''}
                        onChange={e => updateField('questoes_feitas', parseInt(e.target.value) || 0)}
                        className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] text-center"
                        min={0}
                        max={999}
                      />
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">% Acertos</p>
                      <input
                        type="number"
                        value={planner.percentual_acertos ?? ''}
                        onChange={e => updateField('percentual_acertos', parseInt(e.target.value) || null)}
                        className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] text-center"
                        min={0}
                        max={100}
                      />
                    </div>
                  </div>

                  {/* Feedback automático */}
                  {horasPlanejadas > 0 && (planner.horas_estudadas || 0) > 0 && (
                    <div className={`p-4 rounded-lg ${percentualPlanejado >= 80 ? 'bg-[var(--color-success-light)]' : 'bg-[var(--color-warning-light)]'}`}>
                      <p className={`text-sm font-bold ${percentualPlanejado >= 80 ? 'text-[var(--color-success)]' : 'text-[var(--color-warning)]'}`}>
                        {percentualPlanejado >= 80 ? '✓ ' : ''}Você atingiu {percentualPlanejado}% do planejado
                        {percentualPlanejado >= 80 && ' - Parabéns!'}
                      </p>
                    </div>
                  )}
                </>
              )}

              {modo === 'manha' && (
                <div className="bg-[var(--color-warning-light)] border border-[var(--color-warning)]/30 rounded-lg p-4">
                  <p className="text-sm text-[var(--color-warning)]">
                    💡 <strong>Dica:</strong> Use o timer para estudar em blocos de {timerDuration} minutos. Ao final do dia, registre seu progresso no modo Noite.
                  </p>
                </div>
              )}
            </div>


            {/* Pessoa Melhor - Colapsível */}
            <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl overflow-hidden theme-transition">
              <button
                onClick={() => setShowPessoaMelhor(!showPessoaMelhor)}
                className="w-full flex items-center justify-between p-6 hover:bg-[var(--color-bg-hover)] transition-colors"
              >
                <div className="flex items-center gap-2">
                  <Heart className="w-5 h-5 text-pink-400" />
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Pessoa Melhor</h3>
                </div>
                {showPessoaMelhor ? (
                  <ChevronUp className="w-5 h-5 text-[var(--color-text-secondary)]" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-[var(--color-text-secondary)]" />
                )}
              </button>

              <AnimatePresence>
                {showPessoaMelhor && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-[var(--color-border-light)]"
                  >
                    <div className="p-6 grid md:grid-cols-3 gap-6">
                      {/* Corpo */}
                      <div>
                        <p className="text-xs text-orange-400 uppercase font-bold mb-3 flex items-center gap-1">
                          <Dumbbell className="w-3 h-3" /> Corpo
                        </p>
                        <div className="space-y-3">
                          <CheckboxItem
                            checked={planner.exercicio_fisico ?? false}
                            onChange={v => updateField('exercicio_fisico', v)}
                            label="Exercício (20 min)"
                          />
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)] mb-1 flex items-center gap-1">
                              <Droplets className="w-3 h-3" /> Água (litros)
                            </p>
                            <input
                              type="number"
                              value={planner.litros_agua ?? ''}
                              onChange={e => updateField('litros_agua', parseFloat(e.target.value) || null)}
                              step={0.5}
                              min={0}
                              max={10}
                              className="w-20 bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] text-center"
                            />
                          </div>
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)] mb-1 flex items-center gap-1">
                              <Moon className="w-3 h-3" /> Sono (horas)
                            </p>
                            <TimeInput
                              value={planner.horas_sono ?? null}
                              onChange={v => updateField('horas_sono', v)}
                              maxHours={14}
                            />
                          </div>
                        </div>
                      </div>

                      {/* Mente */}
                      <div>
                        <p className="text-xs text-blue-400 uppercase font-bold mb-3 flex items-center gap-1">
                          <Brain className="w-3 h-3" /> Mente
                        </p>
                        <div className="space-y-3">
                          <CheckboxItem
                            checked={planner.sem_celular_antes ?? false}
                            onChange={v => updateField('sem_celular_antes', v)}
                            label="10 min sem celular"
                          />
                          <CheckboxItem
                            checked={planner.fez_revisao ?? false}
                            onChange={v => updateField('fez_revisao', v)}
                            label="Fez revisão"
                          />
                          <CheckboxItem
                            checked={planner.registrou_erro ?? false}
                            onChange={v => updateField('registrou_erro', v)}
                            label="Registrou erros"
                          />
                        </div>
                      </div>

                      {/* Espírito */}
                      <div>
                        <p className="text-xs text-purple-400 uppercase font-bold mb-3 flex items-center gap-1">
                          <Heart className="w-3 h-3" /> Espírito
                        </p>
                        <div className="space-y-3">
                          <CheckboxItem
                            checked={planner.oracao_devocional ?? false}
                            onChange={v => updateField('oracao_devocional', v)}
                            label="Oração/devocional"
                          />
                          <div>
                            <p className="text-xs text-[var(--color-text-muted)] mb-1">Gratidão</p>
                            <textarea
                              value={planner.gratidao || ''}
                              onChange={e => updateField('gratidao', e.target.value || null)}
                              placeholder="Sou grato por..."
                              rows={2}
                              className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] text-sm resize-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Coluna Direita: Insights */}
          <div className="space-y-6">
            {/* Timer Pomodoro */}
            <PomodoroTimer duracao={timerDuration} onDuracaoChange={setTimerDuration} onComplete={handleTimerComplete} />


            {/* Insights */}
            {insights.length > 0 && (
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 theme-transition">
                <div className="flex items-center gap-2 mb-4">
                  <Lightbulb className="w-5 h-5 text-[var(--color-warning)]" />
                  <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase">Insights</h3>
                </div>

                <div className="space-y-3">
                  {insights.map((insight, idx) => (
                    <InsightCard key={idx} tipo={insight.tipo} texto={insight.texto} />
                  ))}
                </div>
              </div>
            )}

            {/* Semáforo - Apenas modo noite */}
            {modo === 'noite' && (
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 theme-transition">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-5 h-5 rounded-full bg-gradient-to-r from-[var(--color-success)] via-[var(--color-warning)] to-[var(--color-error)]" />
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">Como foi seu dia?</h3>
                </div>

                <div className="flex flex-col md:flex-row md:items-center gap-6">
                  <SemaforoPicker
                    value={planner.semaforo ?? null}
                    onChange={v => updateField('semaforo', v)}
                  />

                  {planner.semaforo && planner.semaforo !== 'verde' && (
                    <div className="flex-1">
                      <p className="text-xs text-[var(--color-text-muted)] uppercase font-bold mb-2">Por quê?</p>
                      <select
                        value={planner.semaforo_motivo || ''}
                        onChange={e => updateField('semaforo_motivo', e.target.value || null)}
                        className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] focus:outline-none focus:border-[var(--color-accent)]/50"
                      >
                        <option value="">Selecione o motivo...</option>
                        {SEMAFORO_MOTIVOS.map(m => (
                          <option key={m.value} value={m.value}>{m.label}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Plano para Amanhã - modo noite */}
            {modo === 'noite' && (
              <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-light)] rounded-xl p-6 theme-transition">
                <div className="flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-cyan-400" />
                  <h3 className="text-sm font-bold text-[var(--color-text-secondary)] uppercase">Amanhã</h3>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">Garantir no mínimo:</p>
                    <div className="flex gap-2">
                      {[30, 60, 90].map(min => (
                        <button
                          key={min}
                          onClick={() => updateField('meta_minima_amanha', min)}
                          className={`px-3 py-2 rounded-lg text-sm font-bold transition-all ${planner.meta_minima_amanha === min
                            ? 'bg-[var(--color-accent)] text-[var(--color-text-inverse)]'
                            : 'bg-[var(--color-bg-hover)] text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                            }`}
                        >
                          {min < 60 ? `${min}min` : `${min / 60}h`}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-2">Missão prioritária:</p>
                    <textarea
                      value={planner.missao_prioritaria_amanha || ''}
                      onChange={e => updateField('missao_prioritaria_amanha', e.target.value || null)}
                      placeholder="Ex: Revisar Constitucional"
                      maxLength={300}
                      rows={2}
                      className="w-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-light)] rounded-lg px-3 py-2 text-[var(--color-text-primary)] text-sm resize-y min-h-[50px]"
                    />
                  </div>
                </div>
              </div>
            )}


          </div>
        </div>
      </main>

      {/* Botão Salvar Fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-[var(--color-bg-primary)]/95 backdrop-blur-md border-t border-[var(--color-border-light)] theme-transition">
        <div className="max-w-6xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`w-full py-4 rounded-lg font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${hasChanges
              ? 'bg-[var(--color-accent)] text-[var(--color-text-inverse)] hover:bg-[var(--color-accent-hover)]'
              : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] cursor-not-allowed'
              }`}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Salvando...' : hasChanges ? 'Salvar' : 'Salvo'}
          </button>
        </div>
      </div>
    </div>
  );
};
