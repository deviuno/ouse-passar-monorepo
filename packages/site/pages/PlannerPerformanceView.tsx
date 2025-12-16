import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Calendar,
  Target,
  FileText,
  ClipboardCheck,
  Menu as MenuIcon,
  X,
  ChevronRight,
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
  HelpCircle,
  Save,
  User
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { SEOHead } from '../components/SEOHead';
import { plannerService, SavePlannerInput } from '../services/plannerService';
import { PlannerDiario, PlannerSemanal, Planejamento, SemaforoCor } from '../lib/database.types';

// Emojis para humor
const HUMOR_EMOJIS = ['😫', '😕', '😐', '🙂', '😄'];

// Motivos do semáforo
const SEMAFORO_MOTIVOS = [
  { value: 'cansaco', label: 'Cansaço' },
  { value: 'falta_tempo', label: 'Falta de tempo' },
  { value: 'procrastinacao', label: 'Procrastinação' },
  { value: 'materia_dificil', label: 'Matéria difícil' },
  { value: 'ansiedade', label: 'Ansiedade' },
  { value: 'trabalho', label: 'Trabalho' }
];

// Opções de meta mínima
const META_MINIMA_OPTIONS = [
  { value: 30, label: '30 min' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h30' }
];

// Componente de seletor de humor
const HumorPicker: React.FC<{
  value: number | null;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => (
  <div className="flex gap-2">
    {HUMOR_EMOJIS.map((emoji, idx) => (
      <button
        key={idx}
        onClick={() => onChange(idx + 1)}
        className={`text-2xl p-2 rounded-lg transition-all ${
          value === idx + 1
            ? 'bg-brand-yellow/20 scale-110'
            : 'hover:bg-white/10 opacity-50 hover:opacity-100'
        }`}
      >
        {emoji}
      </button>
    ))}
  </div>
);

// Componente de seletor de energia
const EnergiaPicker: React.FC<{
  value: number | null;
  onChange: (value: number) => void;
}> = ({ value, onChange }) => (
  <div className="flex gap-1">
    {[1, 2, 3, 4, 5].map(level => (
      <button
        key={level}
        onClick={() => onChange(level)}
        className={`p-2 rounded-lg transition-all flex items-center gap-1 ${
          value === level
            ? 'bg-yellow-500/20 text-yellow-400'
            : value && level <= value
              ? 'text-yellow-400/60'
              : 'text-gray-600 hover:text-gray-400'
        }`}
      >
        <Zap className={`w-5 h-5 ${value && level <= value ? 'fill-current' : ''}`} />
      </button>
    ))}
  </div>
);

// Componente de semáforo
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
        className={`flex flex-col items-center gap-2 p-3 rounded-xl transition-all ${
          value === item.cor
            ? 'bg-white/10 scale-105'
            : 'opacity-50 hover:opacity-100'
        }`}
      >
        <div className={`w-8 h-8 rounded-full ${item.bg} ${value === item.cor ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-darker' : ''}`} />
        <span className="text-xs text-gray-400">{item.label}</span>
      </button>
    ))}
  </div>
);

// Componente de checkbox estilizado
const CheckboxItem: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ checked, onChange, icon, label }) => (
  <button
    onClick={() => onChange(!checked)}
    className={`flex items-center gap-3 p-3 rounded-lg transition-all w-full text-left ${
      checked ? 'bg-green-500/10 text-green-400' : 'bg-white/5 text-gray-400 hover:bg-white/10'
    }`}
  >
    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
      checked ? 'bg-green-500 border-green-500' : 'border-gray-600'
    }`}>
      {checked && <CheckCircle2 className="w-4 h-4 text-white" />}
    </div>
    <span className="flex items-center gap-2">
      {icon}
      {label}
    </span>
  </button>
);

// Componente de input numérico
const NumericInput: React.FC<{
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  suffix?: string;
  step?: number;
  min?: number;
  max?: number;
}> = ({ value, onChange, placeholder, suffix, step = 0.5, min = 0, max = 24 }) => (
  <div className="flex items-center gap-2">
    <input
      type="number"
      value={value ?? ''}
      onChange={e => onChange(e.target.value ? parseFloat(e.target.value) : null)}
      placeholder={placeholder}
      step={step}
      min={min}
      max={max}
      className="w-20 bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-brand-yellow/50"
    />
    {suffix && <span className="text-gray-500 text-sm">{suffix}</span>}
  </div>
);

// Helper: Converte decimal para HH:MM (ex: 1.5 -> "01:30")
const decimalToTime = (decimal: number | null): string => {
  if (decimal === null || decimal === undefined) return '';
  const hours = Math.floor(decimal);
  const minutes = Math.round((decimal - hours) * 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

// Helper: Converte HH:MM para decimal (ex: "01:30" -> 1.5)
const timeToDecimal = (time: string): number | null => {
  if (!time || time.length < 5) return null;
  const [hours, minutes] = time.split(':').map(Number);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours + minutes / 60;
};

// Componente de input de tempo com máscara HH:MM
const TimeInput: React.FC<{
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
  maxHours?: number;
}> = ({ value, onChange, placeholder = '00:00', maxHours = 23 }) => {
  const [displayValue, setDisplayValue] = useState(decimalToTime(value));

  // Atualiza display quando value externo muda
  useEffect(() => {
    setDisplayValue(decimalToTime(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let input = e.target.value.replace(/\D/g, ''); // Remove não-dígitos

    // Limita a 4 dígitos
    if (input.length > 4) input = input.slice(0, 4);

    // Formata como HH:MM
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

    // Completa o formato se necessário
    let finalValue = displayValue;
    if (displayValue.length === 1) finalValue = `0${displayValue}:00`;
    else if (displayValue.length === 2) finalValue = `${displayValue}:00`;
    else if (displayValue.length === 4) finalValue = `${displayValue.slice(0, 2)}:${displayValue.slice(2)}`;

    // Valida horas e minutos
    const [hoursStr, minutesStr] = finalValue.split(':');
    let hours = parseInt(hoursStr) || 0;
    let minutes = parseInt(minutesStr) || 0;

    // Limita valores
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
      className="w-20 bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white text-center focus:outline-none focus:border-brand-yellow/50 font-mono"
    />
  );
};

// Componente Principal
export const PlannerPerformanceView: React.FC = () => {
  const { id, slug } = useParams<{ id: string; slug?: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [planejamento, setPlanejamento] = useState<Planejamento | null>(null);
  const [planner, setPlanner] = useState<Partial<PlannerDiario>>({});
  const [weekSummary, setWeekSummary] = useState<PlannerSemanal | null>(null);
  const [horasPlanejadas, setHorasPlanejadas] = useState(0);
  const [materias, setMaterias] = useState<string[]>([]);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  const today = new Date();
  const dayInfo = plannerService.formatDayInfo(today);

  // Links de navegação
  const navLinks = [
    { label: 'Calendário', path: `/planejador-semanal/${slug}/${id}`, icon: Calendar, active: false },
    { label: 'Planner', path: `/planner/${slug}/${id}`, icon: ClipboardCheck, active: true },
    { label: 'Missões', path: `/planejamento/${slug}/${id}`, icon: Target, active: false },
    { label: 'Edital', path: `/edital-verticalizado/${slug}/${id}`, icon: FileText, active: false },
  ];

  // Carregar dados
  useEffect(() => {
    const fetchData = async () => {
      if (!id) return;

      try {
        // Buscar planejamento
        const { data: planData } = await supabase
          .from('planejamentos')
          .select('*')
          .eq('id', id)
          .single();

        if (planData) {
          setPlanejamento(planData);

          // Buscar matérias
          const mats = await plannerService.getMaterias(planData.preparatorio_id);
          setMaterias(mats);
        }

        // Buscar planner de hoje
        const todayPlanner = await plannerService.getToday(id);
        if (todayPlanner) {
          setPlanner(todayPlanner);
        }

        // Buscar resumo semanal
        const summary = await plannerService.getWeekSummary(id);
        setWeekSummary(summary);

        // Calcular horas planejadas
        const horas = await plannerService.calcularHorasPlanejadas(id, today.getDay());
        setHorasPlanejadas(horas);

      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [id]);

  // Atualizar campo do planner
  const updateField = useCallback(<K extends keyof PlannerDiario>(field: K, value: PlannerDiario[K]) => {
    setPlanner(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  }, []);

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

      // Atualizar resumo semanal
      const summary = await plannerService.getWeekSummary(id);
      setWeekSummary(summary);
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

  const bateuMinimo = percentualPlanejado >= 80;

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-darker text-white pb-24">
      <SEOHead title="Planner de Performance | Ouse Passar" />

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 bg-brand-dark/95 backdrop-blur-md border-b border-white/10 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center">
            <div className="flex items-center">
              <span className="text-brand-yellow font-black text-lg uppercase tracking-tight">
                {planejamento?.nome_aluno}
              </span>
            </div>

            {/* Desktop Menu */}
            <nav className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => {
                const IconComponent = link.icon;
                return (
                  <button
                    key={link.label}
                    onClick={() => navigate(link.path)}
                    className={`flex items-center gap-2 px-4 py-2 text-sm font-bold uppercase tracking-wider transition-all duration-300 rounded-lg ${
                      link.active
                        ? 'text-brand-yellow bg-brand-yellow/10'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    <IconComponent className="w-4 h-4" />
                    {link.label}
                  </button>
                );
              })}
            </nav>

            {/* Botão Perfil (desktop) */}
            <button
              onClick={() => navigate(`/perfil/${slug}/${id}`)}
              className="hidden md:flex items-center justify-center w-9 h-9 bg-white/5 border border-white/10 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
              title="Perfil"
            >
              <User className="w-5 h-5" />
            </button>

            {/* Mobile Menu Button */}
            <div className="md:hidden">
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="text-white hover:text-brand-yellow p-2"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <MenuIcon className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden bg-brand-card border-b border-white/10"
            >
              <div className="px-4 pt-2 pb-4 space-y-1">
                {navLinks.map((link) => {
                  const IconComponent = link.icon;
                  return (
                    <button
                      key={link.label}
                      onClick={() => {
                        navigate(link.path);
                        setMobileMenuOpen(false);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase border-l-4 transition-all ${
                        link.active
                          ? 'border-brand-yellow text-brand-yellow bg-white/5'
                          : 'border-transparent text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <IconComponent className="w-4 h-4" />
                      {link.label}
                    </button>
                  );
                })}

                {/* Perfil no mobile */}
                <button
                  onClick={() => {
                    navigate(`/perfil/${slug}/${id}`);
                    setMobileMenuOpen(false);
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm font-bold uppercase border-l-4 border-transparent text-gray-400 hover:text-white hover:bg-white/5 transition-all mt-2 border-t border-white/10"
                >
                  <User className="w-4 h-4" />
                  Perfil
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <main className="pt-20 px-4 max-w-4xl mx-auto space-y-6">
        {/* Placar Semanal */}
        {weekSummary && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-brand-card border border-white/5 rounded-lg p-4">
              <p className="text-xs text-green-400 uppercase font-bold flex items-center gap-1">
                <span className="w-2 h-2 rounded-full bg-green-500" /> Dias Verdes
              </p>
              <p className="text-2xl font-black text-white">{weekSummary.diasVerdes}</p>
            </div>
            <div className="bg-brand-card border border-white/5 rounded-lg p-4">
              <p className="text-xs text-blue-400 uppercase font-bold flex items-center gap-1">
                <BookOpen className="w-3 h-3" /> Horas
              </p>
              <p className="text-2xl font-black text-white">{weekSummary.horasEstudadas}h</p>
            </div>
            <div className="bg-brand-card border border-white/5 rounded-lg p-4">
              <p className="text-xs text-purple-400 uppercase font-bold flex items-center gap-1">
                <Target className="w-3 h-3" /> Missões
              </p>
              <p className="text-2xl font-black text-white">{weekSummary.missoesTotal}</p>
            </div>
            <div className="bg-brand-card border border-white/5 rounded-lg p-4">
              <p className="text-xs text-yellow-400 uppercase font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> Acertos
              </p>
              <p className="text-2xl font-black text-white">
                {weekSummary.mediaAcertos !== null ? `${weekSummary.mediaAcertos}%` : '-'}
              </p>
            </div>
          </div>
        )}

        {/* Cabeçalho do Dia */}
        <div className="bg-brand-card border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Calendar className="w-5 h-5 text-brand-yellow" />
            <h2 className="text-lg font-bold text-white">{dayInfo.diaSemana}, {dayInfo.dataFormatada}</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Como você está hoje?</p>
              <HumorPicker
                value={planner.humor ?? null}
                onChange={v => updateField('humor', v)}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Nível de energia</p>
              <EnergiaPicker
                value={planner.energia ?? null}
                onChange={v => updateField('energia', v)}
              />
            </div>
          </div>
        </div>

        {/* Execução de Estudo */}
        <div className="bg-brand-card border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BookOpen className="w-5 h-5 text-blue-400" />
            <h2 className="text-lg font-bold text-white">Execução de Estudo</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mb-6">
            <div className="bg-brand-dark/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-bold mb-1">Planejado hoje</p>
              <p className="text-2xl font-black text-white font-mono">{decimalToTime(horasPlanejadas)}</p>
            </div>
            <div className="bg-brand-dark/50 rounded-lg p-4">
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Estudado hoje</p>
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

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Missões</p>
              <NumericInput
                value={planner.missoes_concluidas ?? null}
                onChange={v => updateField('missoes_concluidas', v ?? 0)}
                step={1}
                max={99}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Questões</p>
              <NumericInput
                value={planner.questoes_feitas ?? null}
                onChange={v => updateField('questoes_feitas', v ?? 0)}
                step={1}
                max={999}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">% Acertos</p>
              <NumericInput
                value={planner.percentual_acertos ?? null}
                onChange={v => updateField('percentual_acertos', v)}
                suffix="%"
                step={1}
                max={100}
              />
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-2">Matéria principal</p>
              <select
                value={planner.materia_principal || ''}
                onChange={e => updateField('materia_principal', e.target.value || null)}
                className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-yellow/50"
              >
                <option value="">Selecione...</option>
                {materias.map(mat => (
                  <option key={mat} value={mat}>{mat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 mb-4">
            <CheckboxItem
              checked={planner.fez_revisao ?? false}
              onChange={v => updateField('fez_revisao', v)}
              icon={<Brain className="w-4 h-4" />}
              label="Fez revisão?"
            />
            <CheckboxItem
              checked={planner.usou_tecnica_estudo ?? false}
              onChange={v => updateField('usou_tecnica_estudo', v)}
              icon={<Sparkles className="w-4 h-4" />}
              label="Usou técnica de estudo?"
            />
          </div>

          {/* Feedback automático */}
          {horasPlanejadas > 0 && (planner.horas_estudadas ?? 0) > 0 && (
            <div className={`p-4 rounded-lg ${bateuMinimo ? 'bg-green-500/10' : 'bg-yellow-500/10'}`}>
              <p className={`text-sm font-bold ${bateuMinimo ? 'text-green-400' : 'text-yellow-400'}`}>
                {bateuMinimo ? '✓ ' : ''}Você atingiu {percentualPlanejado}% do planejado
                {bateuMinimo && ' - Parabéns!'}
              </p>
            </div>
          )}
        </div>

        {/* Checklist Pessoa Melhor */}
        <div className="bg-brand-card border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Heart className="w-5 h-5 text-pink-400" />
            <h2 className="text-lg font-bold text-white">Pessoa Melhor</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Corpo */}
            <div>
              <p className="text-xs text-orange-400 uppercase font-bold mb-3 flex items-center gap-1">
                <Dumbbell className="w-3 h-3" /> Corpo
              </p>
              <div className="space-y-3">
                <CheckboxItem
                  checked={planner.exercicio_fisico ?? false}
                  onChange={v => updateField('exercicio_fisico', v)}
                  icon={<Dumbbell className="w-4 h-4" />}
                  label="Exercício (20 min)"
                />
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Droplets className="w-3 h-3" /> Água
                  </p>
                  <NumericInput
                    value={planner.litros_agua ?? null}
                    onChange={v => updateField('litros_agua', v)}
                    suffix="litros"
                    step={0.5}
                    max={10}
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1 flex items-center gap-1">
                    <Moon className="w-3 h-3" /> Sono
                  </p>
                  <div className="flex items-center gap-2">
                    <TimeInput
                      value={planner.horas_sono ?? null}
                      onChange={v => updateField('horas_sono', v)}
                      maxHours={14}
                    />
                    <span className="text-gray-500 text-sm">horas</span>
                  </div>
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
                  icon={<Smartphone className="w-4 h-4" />}
                  label="10 min sem celular"
                />
                <CheckboxItem
                  checked={planner.revisao_rapida ?? false}
                  onChange={v => updateField('revisao_rapida', v)}
                  icon={<BookOpen className="w-4 h-4" />}
                  label="Revisão rápida"
                />
                <CheckboxItem
                  checked={planner.registrou_erro ?? false}
                  onChange={v => updateField('registrou_erro', v)}
                  icon={<AlertCircle className="w-4 h-4" />}
                  label="Registrou erro"
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
                  icon={<Sparkles className="w-4 h-4" />}
                  label="Oração/devocional"
                />
                <div>
                  <p className="text-xs text-gray-500 mb-1">Gratidão (3 itens)</p>
                  <textarea
                    value={planner.gratidao || ''}
                    onChange={e => updateField('gratidao', e.target.value || null)}
                    placeholder="Sou grato por..."
                    rows={2}
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-yellow/50 resize-none"
                  />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-1">Motivação do dia</p>
                  <input
                    type="text"
                    value={planner.motivacao_dia || ''}
                    onChange={e => updateField('motivacao_dia', e.target.value || null)}
                    placeholder="O que te motivou hoje?"
                    className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-brand-yellow/50"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Semáforo do Dia */}
        <div className="bg-brand-card border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-5 h-5 rounded-full bg-gradient-to-r from-green-500 via-yellow-500 to-red-500" />
            <h2 className="text-lg font-bold text-white">Semáforo do Dia</h2>
          </div>

          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-3">Hoje foi:</p>
              <SemaforoPicker
                value={planner.semaforo ?? null}
                onChange={v => updateField('semaforo', v)}
              />
            </div>

            {planner.semaforo && planner.semaforo !== 'verde' && (
              <div className="flex-1">
                <p className="text-xs text-gray-500 uppercase font-bold mb-2">Por quê?</p>
                <select
                  value={planner.semaforo_motivo || ''}
                  onChange={e => updateField('semaforo_motivo', e.target.value || null)}
                  className="w-full bg-brand-dark border border-white/10 rounded-lg px-3 py-2 text-white focus:outline-none focus:border-brand-yellow/50"
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

        {/* Plano para Amanhã */}
        <div className="bg-brand-card border border-white/5 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">Plano para Amanhã</h2>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-3">Vou garantir no mínimo:</p>
              <div className="flex gap-2">
                {META_MINIMA_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateField('meta_minima_amanha', opt.value)}
                    className={`px-4 py-2 rounded-lg font-bold transition-all ${
                      planner.meta_minima_amanha === opt.value
                        ? 'bg-brand-yellow text-brand-darker'
                        : 'bg-white/5 text-gray-400 hover:bg-white/10'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase font-bold mb-3">Missão que não posso falhar:</p>
              <input
                type="text"
                value={planner.missao_prioritaria_amanha || ''}
                onChange={e => updateField('missao_prioritaria_amanha', e.target.value || null)}
                placeholder="Ex: Revisar Direito Constitucional"
                className="w-full bg-brand-dark border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-brand-yellow/50"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Botão Salvar Fixo */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-brand-darker/95 backdrop-blur-md border-t border-white/10">
        <div className="max-w-4xl mx-auto">
          <button
            onClick={handleSave}
            disabled={saving || !hasChanges}
            className={`w-full py-4 rounded-lg font-black uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
              hasChanges
                ? 'bg-brand-yellow text-brand-darker hover:bg-yellow-400'
                : 'bg-gray-700 text-gray-500 cursor-not-allowed'
            }`}
          >
            {saving ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            {saving ? 'Salvando...' : hasChanges ? 'Salvar Dia' : 'Salvo'}
          </button>
        </div>
      </div>
    </div>
  );
};
