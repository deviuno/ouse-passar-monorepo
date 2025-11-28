import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Save,
  RotateCcw,
  Zap,
  Coins,
  TrendingUp,
  Target,
  Flame,
  Trophy,
  Brain,
  Settings as SettingsIcon,
  AlertCircle,
  CheckCircle,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import {
  getGamificationSettings,
  updateGamificationSettings,
  GamificationSettings,
} from '../../../services/gamificationService';

const DEFAULT_SETTINGS: GamificationSettings = {
  id: 'main',
  xp_per_correct_answer: 50,
  xp_per_correct_hard_mode: 100,
  xp_per_pvp_win: 200,
  xp_per_pvp_loss: 20,
  xp_per_flashcard_review: 50,
  xp_per_flashcard_remembered: 10,
  coins_per_correct_answer: 10,
  coins_per_correct_hard_mode: 20,
  coins_per_pvp_win: 50,
  coins_per_pvp_loss: 5,
  xp_per_level: 1000,
  level_formula: 'linear',
  daily_goal_questions: 50,
  daily_goal_xp_bonus: 100,
  daily_goal_coins_bonus: 50,
  streak_freeze_cost: 300,
  streak_7_day_xp_bonus: 200,
  streak_30_day_xp_bonus: 500,
  league_promotion_top: 5,
  league_demotion_bottom: 3,
  league_reset_day: 'sunday',
  srs_interval_easy: 7,
  srs_interval_medium: 3,
  srs_interval_hard: 0,
  srs_progression_steps: [1, 3, 7, 14, 30],
  is_gamification_enabled: true,
  show_xp_animations: true,
  show_level_up_modal: true,
};

interface SettingSectionProps {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}

const SettingSection: React.FC<SettingSectionProps> = ({ title, icon, children }) => (
  <div className="bg-brand-card border border-white/5 rounded-sm p-6 mb-6">
    <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-6 flex items-center gap-3">
      {icon}
      {title}
    </h2>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {children}
    </div>
  </div>
);

interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  suffix?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({
  label,
  value,
  onChange,
  min = 0,
  max,
  step = 1,
  suffix,
}) => (
  <div>
    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
      {label}
    </label>
    <div className="relative">
      <input
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
      />
      {suffix && (
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">
          {suffix}
        </span>
      )}
    </div>
  </div>
);

interface SelectInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}

const SelectInput: React.FC<SelectInputProps> = ({ label, value, onChange, options }) => (
  <div>
    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">
      {label}
    </label>
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

interface ToggleInputProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  description?: string;
}

const ToggleInput: React.FC<ToggleInputProps> = ({ label, checked, onChange, description }) => (
  <div className="flex items-center justify-between p-4 bg-brand-dark/50 rounded-sm">
    <div>
      <span className="text-white font-medium">{label}</span>
      {description && <p className="text-gray-500 text-xs mt-1">{description}</p>}
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        checked ? 'bg-brand-yellow' : 'bg-gray-600'
      }`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
          checked ? 'left-7' : 'left-1'
        }`}
      />
    </button>
  </div>
);

export const GamificationSettingsPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState<GamificationSettings>(DEFAULT_SETTINGS);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    const { settings: data, error: err } = await getGamificationSettings();
    if (err) {
      setError(err);
      // Use defaults if no settings exist
      setSettings(DEFAULT_SETTINGS);
    } else if (data) {
      setSettings(data);
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    const { success, error: err } = await updateGamificationSettings(settings);
    if (success) {
      toast.success('Configuracoes salvas com sucesso!');
    } else {
      toast.error(err || 'Erro ao salvar configuracoes');
    }
    setSaving(false);
  };

  const handleReset = () => {
    setSettings(DEFAULT_SETTINGS);
    toast.info('Configuracoes restauradas para o padrao');
  };

  const updateSetting = <K extends keyof GamificationSettings>(
    key: K,
    value: GamificationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display">
            Configuracoes de Gamificacao
          </h1>
          <p className="text-gray-400 mt-2">
            Configure todos os parametros do sistema de gamificacao
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleReset}
            className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Restaurar Padrao
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <p className="text-yellow-500">
            Tabela nao encontrada. Os valores padrao estao sendo exibidos. Execute a migracao SQL primeiro.
          </p>
        </div>
      )}

      {/* Sistema de XP */}
      <SettingSection title="Sistema de XP" icon={<Zap className="w-5 h-5 text-brand-yellow" />}>
        <NumberInput
          label="XP por Acerto (Normal)"
          value={settings.xp_per_correct_answer}
          onChange={(v) => updateSetting('xp_per_correct_answer', v)}
          suffix="XP"
        />
        <NumberInput
          label="XP por Acerto (Desafio)"
          value={settings.xp_per_correct_hard_mode}
          onChange={(v) => updateSetting('xp_per_correct_hard_mode', v)}
          suffix="XP"
        />
        <NumberInput
          label="XP por Vitoria PvP"
          value={settings.xp_per_pvp_win}
          onChange={(v) => updateSetting('xp_per_pvp_win', v)}
          suffix="XP"
        />
        <NumberInput
          label="XP por Derrota PvP"
          value={settings.xp_per_pvp_loss}
          onChange={(v) => updateSetting('xp_per_pvp_loss', v)}
          suffix="XP"
        />
        <NumberInput
          label="XP por Revisao Flashcard"
          value={settings.xp_per_flashcard_review}
          onChange={(v) => updateSetting('xp_per_flashcard_review', v)}
          suffix="XP"
        />
        <NumberInput
          label="XP por Card Lembrado"
          value={settings.xp_per_flashcard_remembered}
          onChange={(v) => updateSetting('xp_per_flashcard_remembered', v)}
          suffix="XP"
        />
      </SettingSection>

      {/* Sistema de Moedas */}
      <SettingSection title="Sistema de Moedas" icon={<Coins className="w-5 h-5 text-yellow-500" />}>
        <NumberInput
          label="Moedas por Acerto (Normal)"
          value={settings.coins_per_correct_answer}
          onChange={(v) => updateSetting('coins_per_correct_answer', v)}
        />
        <NumberInput
          label="Moedas por Acerto (Desafio)"
          value={settings.coins_per_correct_hard_mode}
          onChange={(v) => updateSetting('coins_per_correct_hard_mode', v)}
        />
        <NumberInput
          label="Moedas por Vitoria PvP"
          value={settings.coins_per_pvp_win}
          onChange={(v) => updateSetting('coins_per_pvp_win', v)}
        />
        <NumberInput
          label="Moedas por Derrota PvP"
          value={settings.coins_per_pvp_loss}
          onChange={(v) => updateSetting('coins_per_pvp_loss', v)}
        />
      </SettingSection>

      {/* Sistema de Niveis */}
      <SettingSection title="Sistema de Niveis" icon={<TrendingUp className="w-5 h-5 text-green-500" />}>
        <NumberInput
          label="XP por Nivel"
          value={settings.xp_per_level}
          onChange={(v) => updateSetting('xp_per_level', v)}
          suffix="XP"
        />
        <SelectInput
          label="Formula de Progressao"
          value={settings.level_formula}
          onChange={(v) => updateSetting('level_formula', v as 'linear' | 'exponential')}
          options={[
            { value: 'linear', label: 'Linear (XP fixo por nivel)' },
            { value: 'exponential', label: 'Exponencial (XP aumenta)' },
          ]}
        />
      </SettingSection>

      {/* Meta Diaria */}
      <SettingSection title="Meta Diaria" icon={<Target className="w-5 h-5 text-blue-500" />}>
        <NumberInput
          label="Questoes por Dia"
          value={settings.daily_goal_questions}
          onChange={(v) => updateSetting('daily_goal_questions', v)}
        />
        <NumberInput
          label="Bonus XP ao Completar"
          value={settings.daily_goal_xp_bonus}
          onChange={(v) => updateSetting('daily_goal_xp_bonus', v)}
          suffix="XP"
        />
        <NumberInput
          label="Bonus Moedas ao Completar"
          value={settings.daily_goal_coins_bonus}
          onChange={(v) => updateSetting('daily_goal_coins_bonus', v)}
        />
      </SettingSection>

      {/* Sistema de Streak */}
      <SettingSection title="Sistema de Streak" icon={<Flame className="w-5 h-5 text-orange-500" />}>
        <NumberInput
          label="Custo do Congelamento"
          value={settings.streak_freeze_cost}
          onChange={(v) => updateSetting('streak_freeze_cost', v)}
          suffix="moedas"
        />
        <NumberInput
          label="Bonus 7 Dias Seguidos"
          value={settings.streak_7_day_xp_bonus}
          onChange={(v) => updateSetting('streak_7_day_xp_bonus', v)}
          suffix="XP"
        />
        <NumberInput
          label="Bonus 30 Dias Seguidos"
          value={settings.streak_30_day_xp_bonus}
          onChange={(v) => updateSetting('streak_30_day_xp_bonus', v)}
          suffix="XP"
        />
      </SettingSection>

      {/* Liga/Ranking */}
      <SettingSection title="Liga / Ranking" icon={<Trophy className="w-5 h-5 text-purple-500" />}>
        <NumberInput
          label="Top N Promovidos"
          value={settings.league_promotion_top}
          onChange={(v) => updateSetting('league_promotion_top', v)}
        />
        <NumberInput
          label="Ultimos N Rebaixados"
          value={settings.league_demotion_bottom}
          onChange={(v) => updateSetting('league_demotion_bottom', v)}
        />
        <SelectInput
          label="Dia do Reset Semanal"
          value={settings.league_reset_day}
          onChange={(v) => updateSetting('league_reset_day', v)}
          options={[
            { value: 'sunday', label: 'Domingo' },
            { value: 'monday', label: 'Segunda-feira' },
            { value: 'saturday', label: 'Sabado' },
          ]}
        />
      </SettingSection>

      {/* SRS (Repeticao Espacada) */}
      <SettingSection title="Repeticao Espacada (SRS)" icon={<Brain className="w-5 h-5 text-pink-500" />}>
        <NumberInput
          label="Intervalo Facil"
          value={settings.srs_interval_easy}
          onChange={(v) => updateSetting('srs_interval_easy', v)}
          suffix="dias"
        />
        <NumberInput
          label="Intervalo Medio"
          value={settings.srs_interval_medium}
          onChange={(v) => updateSetting('srs_interval_medium', v)}
          suffix="dias"
        />
        <NumberInput
          label="Intervalo Dificil"
          value={settings.srs_interval_hard}
          onChange={(v) => updateSetting('srs_interval_hard', v)}
          suffix="dias"
        />
      </SettingSection>

      {/* Configuracoes Gerais */}
      <div className="bg-brand-card border border-white/5 rounded-sm p-6 mb-6">
        <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-6 flex items-center gap-3">
          <SettingsIcon className="w-5 h-5 text-gray-400" />
          Configuracoes Gerais
        </h2>
        <div className="space-y-4">
          <ToggleInput
            label="Gamificacao Ativa"
            checked={settings.is_gamification_enabled}
            onChange={(v) => updateSetting('is_gamification_enabled', v)}
            description="Desativar remove todo o sistema de XP, moedas e niveis do app"
          />
          <ToggleInput
            label="Mostrar Animacoes de XP"
            checked={settings.show_xp_animations}
            onChange={(v) => updateSetting('show_xp_animations', v)}
            description="Animacoes visuais ao ganhar XP"
          />
          <ToggleInput
            label="Mostrar Modal de Level Up"
            checked={settings.show_level_up_modal}
            onChange={(v) => updateSetting('show_level_up_modal', v)}
            description="Modal de celebracao ao subir de nivel"
          />
        </div>
      </div>

      {/* Save Button (Fixed at bottom on mobile) */}
      <div className="sticky bottom-4 flex justify-end sm:hidden">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-3 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide shadow-lg flex items-center gap-2 disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salvar
        </button>
      </div>
    </div>
  );
};
