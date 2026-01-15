import React, { useState, useEffect } from 'react';
import {
  Save,
  Loader2,
  Zap,
  Star,
  Medal,
  Trophy,
  Target,
  Calendar,
  RotateCcw,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  TrendingUp,
  AlertCircle,
  Coins,
  Flame,
  Brain,
  Award,
  EyeOff,
  ChevronDown,
  BookOpen,
  Settings as SettingsIcon,
} from 'lucide-react';
import { useToast } from '../../ui/Toast';
import {
  getGamificationSettings,
  updateGamificationSettings,
  GamificationSettings,
  getLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  Level,
  getLeagueTiers,
  createLeagueTier,
  deleteLeagueTier,
  LeagueTier,
  getAchievements,
  createAchievement,
  deleteAchievement,
  Achievement,
} from '../../../services/gamificationService';
import {
  planejamentoConquistasService,
  REQUISITO_TIPO_LABELS,
} from '../../../services/planejamentoConquistasService';

// Types
interface PlanejamentoConquista {
  id: string;
  nome: string;
  descricao?: string;
  icone: string;
  cor: string;
  requisito_tipo: string;
  requisito_valor: number;
  xp_recompensa: number;
  moedas_recompensa: number;
  is_active: boolean;
  is_hidden: boolean;
}
type PlanejamentoConquistaRequisitoTipo = string;

// Constants
const GAMIFICATION_TABS = [
  { id: 'questoes', label: 'Questões', icon: Zap },
  { id: 'niveis', label: 'Níveis', icon: Star },
  { id: 'ligas', label: 'Ligas', icon: Medal },
  { id: 'conquistas', label: 'Conquistas', icon: Award },
  { id: 'conquistas-planejamento', label: 'Planejamento', icon: Calendar },
];

const DEFAULT_GAMIFICATION_SETTINGS: GamificationSettings = {
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

const ACHIEVEMENT_CATEGORIES = ['estudo', 'streak', 'pvp', 'nivel', 'social', 'especial'];

const REQUIREMENT_TYPES = [
  { value: 'questions_answered', label: 'Questões Respondidas' },
  { value: 'correct_answers', label: 'Respostas Corretas' },
  { value: 'streak_days', label: 'Dias de Streak' },
  { value: 'pvp_wins', label: 'Vitórias PvP' },
  { value: 'level_reached', label: 'Nível Alcançado' },
  { value: 'xp_earned', label: 'XP Total' },
  { value: 'coins_earned', label: 'Moedas Total' },
  { value: 'flashcards_reviewed', label: 'Flashcards Revisados' },
  { value: 'subjects_mastered', label: 'Matérias Dominadas' },
  { value: 'custom', label: 'Personalizado' },
];

const REQUISITO_TIPOS: { value: PlanejamentoConquistaRequisitoTipo; label: string }[] = [
  { value: 'missoes_completadas', label: 'Missões Completadas' },
  { value: 'rodadas_completadas', label: 'Rodadas Completadas' },
  { value: 'dias_consecutivos', label: 'Dias Consecutivos' },
  { value: 'porcentagem_edital', label: '% do Edital' },
  { value: 'missoes_por_dia', label: 'Missões por Dia' },
  { value: 'tempo_estudo', label: 'Tempo de Estudo (min)' },
  { value: 'primeiro_acesso', label: 'Primeiro Acesso' },
  { value: 'semana_perfeita', label: 'Semana Perfeita' },
  { value: 'mes_perfeito', label: 'Mês Perfeito' },
  { value: 'custom', label: 'Personalizado' },
];

const GAMIFICATION_TUTORIALS: Record<string, { title: string; content: string[] }> = {
  questoes: {
    title: 'Como funcionam as Recompensas de Questões',
    content: [
      'O sistema de XP e Moedas recompensa os alunos por cada atividade realizada na plataforma.',
      'XP por Resposta Correta: Quantidade de XP que o aluno ganha ao acertar uma questão no modo normal.',
      'XP por Acerto Hard Mode: Bônus adicional para questões respondidas no modo desafio (simulado).',
      'XP por Vitória/Derrota PvP: Recompensas para partidas no modo Player vs Player.',
      'Moedas: Podem ser usadas na loja para comprar itens, avatares e outros benefícios.',
      'XP por Nível: Define quantos pontos de XP são necessários para subir de nível.',
      'Fórmula de Nível: Linear (XP fixo por nível) ou Exponencial (XP aumenta a cada nível).',
    ],
  },
  niveis: {
    title: 'Como funciona o Sistema de Níveis',
    content: [
      'Os níveis representam o progresso do aluno na plataforma.',
      'Número do Nível: Identificador único do nível (1, 2, 3, etc.).',
      'Título: Nome exibido para o nível (ex: Iniciante, Estudante, Mestre).',
      'XP Mínimo: Quantidade de XP necessária para atingir este nível.',
      'Ícone e Cor: Personalização visual do nível.',
      'Recompensas: XP e Moedas bônus que o aluno recebe ao atingir o nível.',
      'Dica: Crie níveis com títulos motivacionais relacionados a concursos públicos!',
    ],
  },
  ligas: {
    title: 'Como funciona o Sistema de Ligas',
    content: [
      'As ligas criam competição saudável entre os alunos.',
      'Ferro, Bronze, Prata, Ouro, Diamante: Hierarquia das ligas.',
      'Ranking Semanal: Os alunos competem pelo XP ganho durante a semana.',
      'Promoção: Os 3 primeiros colocados sobem para a liga superior.',
      'Rebaixamento: Os 3 últimos colocados descem para a liga inferior.',
      'Reset Semanal: O ranking reinicia toda semana (configurável).',
      'Bônus de Promoção: XP e Moedas extras ao subir de liga.',
    ],
  },
  conquistas: {
    title: 'Como funcionam as Conquistas',
    content: [
      'Conquistas são prêmios que os alunos desbloqueiam ao atingir marcos.',
      'Categorias: Estudo, Streak, PvP, Nível, Social, Especial.',
      'Tipos de Requisito: Questões respondidas, Acertos, Dias de sequência, Nível, XP, etc.',
      'Valor do Requisito: Número que define a meta (ex: 100 questões, 7 dias de streak).',
      'Recompensas: XP e Moedas que o aluno ganha ao desbloquear.',
      'Conquistas Ocultas: Não aparecem na lista até serem desbloqueadas (surpresa!).',
      'Dica: Crie conquistas variadas para diferentes perfis de alunos.',
    ],
  },
  'conquistas-planejamento': {
    title: 'Como funcionam as Conquistas de Planejamento',
    content: [
      'Conquistas específicas para o sistema de planejamento de estudos.',
      'Missões Completadas: Número de missões finalizadas pelo aluno.',
      'Rodadas Completadas: Número de rodadas de estudo finalizadas.',
      'Dias Consecutivos: Sequência de dias estudando sem interrupção.',
      '% do Edital: Porcentagem do conteúdo do edital coberta.',
      'Esses achievements incentivam o uso do planejador de estudos.',
      'Dica: Crie conquistas progressivas (10, 50, 100 missões) para manter engajamento.',
    ],
  },
};

// Helper Components
interface NumberInputProps {
  label: string;
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  suffix?: string;
}

const NumberInput: React.FC<NumberInputProps> = ({ label, value, onChange, min = 0, max, suffix }) => (
  <div>
    <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">{label}</label>
    <div className="relative">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
      />
      {suffix && <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 text-sm">{suffix}</span>}
    </div>
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
      className={`relative w-12 h-6 rounded-full transition-colors ${checked ? 'bg-brand-yellow' : 'bg-gray-600'}`}
    >
      <span className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'left-7' : 'left-1'}`} />
    </button>
  </div>
);

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
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{children}</div>
  </div>
);

function TutorialSection({ tabId }: { tabId: string }) {
  const [isOpen, setIsOpen] = React.useState(false);
  const tutorial = GAMIFICATION_TUTORIALS[tabId];

  if (!tutorial) return null;

  return (
    <div className="mt-8 border border-white/10 rounded-sm overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 bg-brand-dark/50 hover:bg-brand-dark transition-colors"
      >
        <div className="flex items-center gap-3">
          <BookOpen className="w-5 h-5 text-brand-yellow" />
          <span className="text-white font-bold uppercase text-sm tracking-wide">
            {tutorial.title}
          </span>
        </div>
        <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      {isOpen && (
        <div className="p-4 bg-brand-card border-t border-white/10">
          <ul className="space-y-3">
            {tutorial.content.map((item, index) => (
              <li key={index} className="flex gap-3 text-sm">
                <span className="text-brand-yellow font-bold">{index + 1}.</span>
                <span className="text-gray-300">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// Tab Components
function LevelsTab({
  levels, setLevels, editingId, setEditingId, isCreating, setIsCreating, formData, setFormData,
}: {
  levels: Level[];
  setLevels: (l: Level[]) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  isCreating: boolean;
  setIsCreating: (v: boolean) => void;
  formData: Partial<Level>;
  setFormData: (d: Partial<Level>) => void;
}) {
  const toast = useToast();

  const resetForm = () => {
    setFormData({
      level_number: levels.length + 1,
      title: '',
      min_xp: levels.length > 0 ? (levels[levels.length - 1]?.min_xp || 0) + 1000 : 0,
      icon: '',
      color: '#FFB800',
      rewards_xp: 0,
      rewards_coins: 0,
      is_active: true,
    });
  };

  const handleCreate = async () => {
    if (!formData.title) {
      toast.error('Titulo e obrigatorio');
      return;
    }
    const { level, error } = await createLevel({
      level_number: formData.level_number || levels.length + 1,
      title: formData.title,
      min_xp: formData.min_xp || 0,
      icon: formData.icon || '',
      color: formData.color || '#FFB800',
      rewards_xp: formData.rewards_xp || 0,
      rewards_coins: formData.rewards_coins || 0,
      is_active: formData.is_active ?? true,
    });
    if (error) {
      toast.error(error);
    } else if (level) {
      setLevels([...levels, level].sort((a, b) => a.level_number - b.level_number));
      setIsCreating(false);
      resetForm();
      toast.success('Nivel criado!');
    }
  };

  const handleUpdate = async (id: number) => {
    const { success, error } = await updateLevel(id, formData);
    if (error) {
      toast.error(error);
    } else if (success) {
      setLevels(levels.map((l) => (l.id === id ? { ...l, ...formData } : l)).sort((a, b) => a.level_number - b.level_number));
      setEditingId(null);
      resetForm();
      toast.success('Nivel atualizado!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Excluir este nivel?')) return;
    const { success, error } = await deleteLevel(id);
    if (error) {
      toast.error(error);
    } else if (success) {
      setLevels(levels.filter((l) => l.id !== id));
      toast.success('Nivel excluido!');
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button
          onClick={() => { setIsCreating(true); resetForm(); }}
          disabled={isCreating}
          className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" /> Novo Nivel
        </button>
      </div>

      {isCreating && (
        <div className="bg-brand-card border border-brand-yellow/50 rounded-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Novo Nivel</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Numero</label>
              <input type="number" min="1" value={formData.level_number} onChange={(e) => setFormData({ ...formData, level_number: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Titulo</label>
              <input type="text" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">XP Minimo</label>
              <input type="number" min="0" value={formData.min_xp} onChange={(e) => setFormData({ ...formData, min_xp: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Icone</label>
              <input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cor</label>
              <input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full h-10 bg-transparent border border-white/10 rounded-sm cursor-pointer" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bonus XP</label>
              <input type="number" min="0" value={formData.rewards_xp} onChange={(e) => setFormData({ ...formData, rewards_xp: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bonus Moedas</label>
              <input type="number" min="0" value={formData.rewards_coins} onChange={(e) => setFormData({ ...formData, rewards_coins: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={formData.is_active} onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })} className="w-4 h-4" />
                <span className="text-white">Ativo</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Criar</button>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </div>
      )}

      <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-dark/50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Nivel</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Titulo</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">XP Min</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Icone</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Cor</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Bonus</th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase">Status</th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {levels.map((level) => (
              <tr key={level.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-white font-bold">{level.level_number}</td>
                <td className="px-4 py-3 text-white">{level.title}</td>
                <td className="px-4 py-3 text-gray-400">{level.min_xp.toLocaleString()}</td>
                <td className="px-4 py-3 text-lg">{level.icon}</td>
                <td className="px-4 py-3"><div className="w-6 h-6 rounded" style={{ backgroundColor: level.color }} /></td>
                <td className="px-4 py-3 text-brand-yellow text-sm">{level.rewards_xp} XP {level.rewards_coins > 0 && <span className="text-yellow-500">+ {level.rewards_coins}</span>}</td>
                <td className="px-4 py-3"><span className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${level.is_active ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'}`}>{level.is_active ? 'Ativo' : 'Inativo'}</span></td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button onClick={() => { setEditingId(level.id); setFormData({ ...level }); }} className="p-1.5 text-gray-400 hover:text-brand-yellow"><Pencil className="w-4 h-4" /></button>
                    <button onClick={() => handleDelete(level.id)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {levels.length === 0 && <div className="text-center py-12 text-gray-400">Nenhum nivel cadastrado</div>}
      </div>
    </div>
  );
}

function LeaguesTab({ tiers, setTiers, editingId, setEditingId, isCreating, setIsCreating, formData, setFormData }: any) {
  const toast = useToast();
  const resetForm = () => setFormData({ id: '', name: '', display_order: tiers.length + 1, icon: '', color: '#FFB800', bg_color: '#1a1a1a', promotion_bonus_xp: 0, promotion_bonus_coins: 0, is_active: true });

  const handleCreate = async () => {
    if (!formData.id || !formData.name) { toast.error('ID e Nome obrigatorios'); return; }
    const { tier, error } = await createLeagueTier({ ...formData, min_xp_to_enter: null });
    if (error) toast.error(error);
    else if (tier) { setTiers([...tiers, tier].sort((a: any, b: any) => a.display_order - b.display_order)); setIsCreating(false); resetForm(); toast.success('Liga criada!'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir liga?')) return;
    const { success, error } = await deleteLeagueTier(id);
    if (error) toast.error(error);
    else if (success) { setTiers(tiers.filter((t: any) => t.id !== id)); toast.success('Liga excluida!'); }
  };

  return (
    <div>
      <div className="flex justify-end mb-4">
        <button onClick={() => { setIsCreating(true); resetForm(); }} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Nova Liga</button>
      </div>

      {isCreating && (
        <div className="bg-brand-card border border-brand-yellow/50 rounded-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Nova Liga</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><label className="block text-sm text-gray-400 mb-1">ID</label><input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Nome</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Ordem</label><input type="number" min="1" value={formData.display_order} onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Icone</label><input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Cor</label><input type="color" value={formData.color} onChange={(e) => setFormData({ ...formData, color: e.target.value })} className="w-full h-10 bg-transparent border border-white/10 rounded-sm" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Bonus XP</label><input type="number" min="0" value={formData.promotion_bonus_xp} onChange={(e) => setFormData({ ...formData, promotion_bonus_xp: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Bonus Moedas</label><input type="number" min="0" value={formData.promotion_bonus_coins} onChange={(e) => setFormData({ ...formData, promotion_bonus_coins: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Criar</button>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiers.map((tier: LeagueTier) => (
          <div key={tier.id} className="bg-brand-card border border-white/5 rounded-sm overflow-hidden" style={{ borderColor: tier.is_active ? `${tier.color}30` : undefined }}>
            <div className="p-4 flex items-center gap-3" style={{ backgroundColor: tier.bg_color }}>
              <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: tier.color }}>{tier.icon}</div>
              <div>
                <h3 className="text-white font-bold text-lg">{tier.name}</h3>
                <p className="text-gray-400 text-xs uppercase">Ordem: {tier.display_order}</p>
              </div>
            </div>
            <div className="p-4">
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="text-gray-500 text-xs">Bonus XP</span><p className="text-brand-yellow font-bold">{tier.promotion_bonus_xp}</p></div>
                <div><span className="text-gray-500 text-xs">Bonus Moedas</span><p className="text-yellow-500 font-bold">{tier.promotion_bonus_coins}</p></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => handleDelete(tier.id)} className="flex-1 px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm text-xs font-bold flex items-center justify-center gap-1 hover:border-red-500 hover:text-red-500"><Trash2 className="w-3 h-3" /> Excluir</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      {tiers.length === 0 && <div className="text-center py-12 bg-brand-card border border-white/5 rounded-sm text-gray-400">Nenhuma liga cadastrada</div>}
    </div>
  );
}

function AchievementsTab({ achievements, setAchievements, editingId, setEditingId, isCreating, setIsCreating, formData, setFormData, filterCategory, setFilterCategory }: any) {
  const toast = useToast();
  const resetForm = () => setFormData({ id: '', name: '', description: '', icon: '', category: 'estudo', requirement_type: 'questions_answered', requirement_value: 1, xp_reward: 0, coins_reward: 0, is_active: true, is_hidden: false });

  const handleCreate = async () => {
    if (!formData.id || !formData.name) { toast.error('ID e Nome obrigatorios'); return; }
    const { achievement, error } = await createAchievement({ ...formData, display_order: achievements.length, unlock_message: null });
    if (error) toast.error(error);
    else if (achievement) { setAchievements([...achievements, achievement]); setIsCreating(false); resetForm(); toast.success('Conquista criada!'); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir conquista?')) return;
    const { success, error } = await deleteAchievement(id);
    if (error) toast.error(error);
    else if (success) { setAchievements(achievements.filter((a: any) => a.id !== id)); toast.success('Conquista excluida!'); }
  };

  const filtered = filterCategory ? achievements.filter((a: any) => a.category === filterCategory) : achievements;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterCategory('')} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border ${filterCategory === '' ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10' : 'border-white/10 text-gray-400'}`}>Todas ({achievements.length})</button>
          {ACHIEVEMENT_CATEGORIES.map((cat) => {
            const count = achievements.filter((a: any) => a.category === cat).length;
            return <button key={cat} onClick={() => setFilterCategory(cat)} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border ${filterCategory === cat ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10' : 'border-white/10 text-gray-400'}`}>{cat} ({count})</button>;
          })}
        </div>
        <button onClick={() => { setIsCreating(true); resetForm(); }} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Nova</button>
      </div>

      {isCreating && (
        <div className="bg-brand-card border border-brand-yellow/50 rounded-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Nova Conquista</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><label className="block text-sm text-gray-400 mb-1">ID</label><input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Nome</label><input type="text" value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Icone</label><input type="text" value={formData.icon} onChange={(e) => setFormData({ ...formData, icon: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Categoria</label><select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white">{ACHIEVEMENT_CATEGORIES.map((cat) => <option key={cat} value={cat}>{cat}</option>)}</select></div>
            <div><label className="block text-sm text-gray-400 mb-1">Tipo Requisito</label><select value={formData.requirement_type} onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white">{REQUIREMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="block text-sm text-gray-400 mb-1">Valor</label><input type="number" min="1" value={formData.requirement_value} onChange={(e) => setFormData({ ...formData, requirement_value: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">XP</label><input type="number" min="0" value={formData.xp_reward} onChange={(e) => setFormData({ ...formData, xp_reward: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Moedas</label><input type="number" min="0" value={formData.coins_reward} onChange={(e) => setFormData({ ...formData, coins_reward: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Criar</button>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((achievement: Achievement) => (
          <div key={achievement.id} className={`bg-brand-card border rounded-sm overflow-hidden ${achievement.is_active ? 'border-white/5' : 'border-gray-700/50 opacity-60'}`}>
            <div className="p-4 flex items-center gap-4 bg-brand-dark/30">
              <div className="w-14 h-14 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-3xl">{achievement.icon || '?'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold truncate">{achievement.name}</h3>
                  {achievement.is_hidden && <EyeOff className="w-4 h-4 text-gray-500" />}
                </div>
                <p className="text-gray-500 text-xs uppercase">{achievement.category}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{achievement.description || 'Sem descricao'}</p>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="text-gray-500 text-xs block">Requisito</span><p className="text-white">{REQUIREMENT_TYPES.find((t) => t.value === achievement.requirement_type)?.label}: <span className="text-brand-yellow font-bold">{achievement.requirement_value}</span></p></div>
                <div><span className="text-gray-500 text-xs block">Recompensa</span><p className="text-brand-yellow font-bold">{achievement.xp_reward} XP {achievement.coins_reward > 0 && <span className="text-yellow-500">+ {achievement.coins_reward}</span>}</p></div>
              </div>
              <button onClick={() => handleDelete(achievement.id)} className="w-full px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm text-xs font-bold flex items-center justify-center gap-1 hover:border-red-500 hover:text-red-500"><Trash2 className="w-3 h-3" /> Excluir</button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 bg-brand-card border border-white/5 rounded-sm text-gray-400">Nenhuma conquista {filterCategory && `na categoria "${filterCategory}"`}</div>}
    </div>
  );
}

function PlanejamentoConquistasTab({ conquistas, setConquistas, editingId, setEditingId, isCreating, setIsCreating, formData, setFormData, filterTipo, setFilterTipo }: any) {
  const toast = useToast();
  const resetForm = () => setFormData({ id: '', nome: '', descricao: '', icone: '', requisito_tipo: 'missoes_completadas', requisito_valor: 1, xp_recompensa: 0, moedas_recompensa: 0, is_active: true, is_hidden: false, ordem: conquistas.length });

  const handleCreate = async () => {
    if (!formData.id || !formData.nome) { toast.error('ID e Nome obrigatorios'); return; }
    try {
      const conquista = await planejamentoConquistasService.create({ ...formData, icone: formData.icone || '🏆', mensagem_desbloqueio: null });
      setConquistas([...conquistas, conquista]);
      setIsCreating(false);
      resetForm();
      toast.success('Conquista criada!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Excluir conquista?')) return;
    try {
      await planejamentoConquistasService.delete(id);
      setConquistas(conquistas.filter((c: any) => c.id !== id));
      toast.success('Conquista excluida!');
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const tipoCounts = conquistas.reduce((acc: any, c: any) => { acc[c.requisito_tipo] = (acc[c.requisito_tipo] || 0) + 1; return acc; }, {});
  const filtered = filterTipo ? conquistas.filter((c: any) => c.requisito_tipo === filterTipo) : conquistas;

  return (
    <div>
      <div className="flex justify-between items-center mb-4 flex-wrap gap-4">
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setFilterTipo('')} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border ${filterTipo === '' ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10' : 'border-white/10 text-gray-400'}`}>Todas ({conquistas.length})</button>
          {REQUISITO_TIPOS.filter((t) => tipoCounts[t.value]).map((tipo) => (
            <button key={tipo.value} onClick={() => setFilterTipo(tipo.value)} className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border ${filterTipo === tipo.value ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10' : 'border-white/10 text-gray-400'}`}>{tipo.label} ({tipoCounts[tipo.value] || 0})</button>
          ))}
        </div>
        <button onClick={() => { setIsCreating(true); resetForm(); }} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Plus className="w-4 h-4" /> Nova</button>
      </div>

      {isCreating && (
        <div className="bg-brand-card border border-brand-yellow/50 rounded-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Nova Conquista de Planejamento</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            <div><label className="block text-sm text-gray-400 mb-1">ID</label><input type="text" value={formData.id} onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Nome</label><input type="text" value={formData.nome} onChange={(e) => setFormData({ ...formData, nome: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Icone</label><input type="text" value={formData.icone} onChange={(e) => setFormData({ ...formData, icone: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Tipo Requisito</label><select value={formData.requisito_tipo} onChange={(e) => setFormData({ ...formData, requisito_tipo: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white">{REQUISITO_TIPOS.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}</select></div>
            <div><label className="block text-sm text-gray-400 mb-1">Valor</label><input type="number" min="0" value={formData.requisito_valor} onChange={(e) => setFormData({ ...formData, requisito_valor: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">XP</label><input type="number" min="0" value={formData.xp_recompensa} onChange={(e) => setFormData({ ...formData, xp_recompensa: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div><label className="block text-sm text-gray-400 mb-1">Moedas</label><input type="number" min="0" value={formData.moedas_recompensa} onChange={(e) => setFormData({ ...formData, moedas_recompensa: Number(e.target.value) })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
            <div className="md:col-span-2"><label className="block text-sm text-gray-400 mb-1">Descricao</label><input type="text" value={formData.descricao} onChange={(e) => setFormData({ ...formData, descricao: e.target.value })} className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white" /></div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleCreate} className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"><Check className="w-4 h-4" /> Criar</button>
            <button onClick={() => { setIsCreating(false); resetForm(); }} className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2"><X className="w-4 h-4" /> Cancelar</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((conquista: PlanejamentoConquista) => (
          <div key={conquista.id} className={`bg-brand-card border rounded-sm overflow-hidden ${conquista.is_active ? 'border-white/5' : 'border-gray-700/50 opacity-60'}`}>
            <div className="p-4 flex items-center gap-4 bg-brand-dark/30">
              <div className="w-14 h-14 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-3xl">{conquista.icone || '?'}</div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold truncate">{conquista.nome}</h3>
                  {conquista.is_hidden && <EyeOff className="w-4 h-4 text-gray-500" />}
                </div>
                <p className="text-gray-500 text-xs uppercase">{REQUISITO_TIPO_LABELS[conquista.requisito_tipo]}</p>
              </div>
            </div>
            <div className="p-4">
              <p className="text-gray-400 text-sm mb-3 line-clamp-2">{conquista.descricao || 'Sem descricao'}</p>
              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div><span className="text-gray-500 text-xs block">Requisito</span><p className="text-brand-yellow font-bold">{conquista.requisito_valor}</p></div>
                <div><span className="text-gray-500 text-xs block">Recompensa</span><p className="text-brand-yellow font-bold">{conquista.xp_recompensa} XP {conquista.moedas_recompensa > 0 && <span className="text-yellow-500">+ {conquista.moedas_recompensa}</span>}</p></div>
              </div>
              <button onClick={() => handleDelete(conquista.id)} className="w-full px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm text-xs font-bold flex items-center justify-center gap-1 hover:border-red-500 hover:text-red-500"><Trash2 className="w-3 h-3" /> Excluir</button>
            </div>
          </div>
        ))}
      </div>
      {filtered.length === 0 && <div className="text-center py-12 bg-brand-card border border-white/5 rounded-sm text-gray-400">Nenhuma conquista {filterTipo && `do tipo "${REQUISITO_TIPO_LABELS[filterTipo as PlanejamentoConquistaRequisitoTipo]}"`}</div>}
    </div>
  );
}

// Main Component
export function GamificationSection() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState('questoes');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Questoes (Settings)
  const [gamSettings, setGamSettings] = useState<GamificationSettings>(DEFAULT_GAMIFICATION_SETTINGS);

  // Niveis
  const [levels, setLevels] = useState<Level[]>([]);
  const [levelEditingId, setLevelEditingId] = useState<number | null>(null);
  const [levelCreating, setLevelCreating] = useState(false);
  const [levelForm, setLevelForm] = useState<Partial<Level>>({});

  // Ligas
  const [tiers, setTiers] = useState<LeagueTier[]>([]);
  const [tierEditingId, setTierEditingId] = useState<string | null>(null);
  const [tierCreating, setTierCreating] = useState(false);
  const [tierForm, setTierForm] = useState<Partial<LeagueTier>>({});

  // Conquistas
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [achievementEditingId, setAchievementEditingId] = useState<string | null>(null);
  const [achievementCreating, setAchievementCreating] = useState(false);
  const [achievementForm, setAchievementForm] = useState<Partial<Achievement>>({});
  const [achievementFilter, setAchievementFilter] = useState('');

  // Conquistas Planejamento
  const [planejamentoConquistas, setPlanejamentoConquistas] = useState<PlanejamentoConquista[]>([]);
  const [planejamentoEditingId, setPlanejamentoEditingId] = useState<string | null>(null);
  const [planejamentoCreating, setPlanejamentoCreating] = useState(false);
  const [planejamentoForm, setPlanejamentoForm] = useState<any>({});
  const [planejamentoFilter, setPlanejamentoFilter] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError(null);

    try {
      const { settings: gamData } = await getGamificationSettings();
      if (gamData) setGamSettings(gamData);

      const { levels: levelsData } = await getLevels();
      setLevels(levelsData);

      const { tiers: tiersData } = await getLeagueTiers();
      setTiers(tiersData);

      const { achievements: achievementsData } = await getAchievements();
      setAchievements(achievementsData);

      try {
        const planejamentoData = await planejamentoConquistasService.getAll(true);
        setPlanejamentoConquistas(planejamentoData);
      } catch (e) {
        console.error('Error loading planejamento conquistas:', e);
      }
    } catch (e) {
      setError('Erro ao carregar dados');
      console.error(e);
    }

    setLoading(false);
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    const { success, error: err } = await updateGamificationSettings(gamSettings);
    if (success) {
      toast.success('Configurações salvas com sucesso!');
    } else {
      toast.error(err || 'Erro ao salvar');
    }
    setSaving(false);
  };

  const handleResetSettings = () => {
    setGamSettings(DEFAULT_GAMIFICATION_SETTINGS);
    toast.info('Configurações restauradas para o padrão');
  };

  const updateSetting = <K extends keyof GamificationSettings>(key: K, value: GamificationSettings[K]) => {
    setGamSettings((prev) => ({ ...prev, [key]: value }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* Horizontal Tabs */}
      <div className="flex gap-1 mb-6 border-b border-white/10 overflow-x-auto pb-px">
        {GAMIFICATION_TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-bold uppercase tracking-wide whitespace-nowrap transition-colors border-b-2 -mb-px ${isActive
                ? 'text-brand-yellow border-brand-yellow'
                : 'text-gray-400 border-transparent hover:text-white hover:border-white/20'
                }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <p className="text-yellow-500">
            Algumas tabelas nao foram encontradas. Execute as migrations SQL primeiro.
          </p>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'questoes' && (
        <div>
          <div className="flex justify-end gap-3 mb-6">
            <button
              onClick={handleResetSettings}
              className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase tracking-wide hover:text-white hover:border-white/20 transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Restaurar
            </button>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="px-6 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Salvar
            </button>
          </div>

          <SettingSection title="Sistema de XP" icon={<Zap className="w-5 h-5 text-brand-yellow" />}>
            <NumberInput label="XP por Acerto (Normal)" value={gamSettings.xp_per_correct_answer} onChange={(v) => updateSetting('xp_per_correct_answer', v)} suffix="XP" />
            <NumberInput label="XP por Acerto (Desafio)" value={gamSettings.xp_per_correct_hard_mode} onChange={(v) => updateSetting('xp_per_correct_hard_mode', v)} suffix="XP" />
            <NumberInput label="XP por Vitoria PvP" value={gamSettings.xp_per_pvp_win} onChange={(v) => updateSetting('xp_per_pvp_win', v)} suffix="XP" />
            <NumberInput label="XP por Derrota PvP" value={gamSettings.xp_per_pvp_loss} onChange={(v) => updateSetting('xp_per_pvp_loss', v)} suffix="XP" />
            <NumberInput label="XP por Revisao Flashcard" value={gamSettings.xp_per_flashcard_review} onChange={(v) => updateSetting('xp_per_flashcard_review', v)} suffix="XP" />
            <NumberInput label="XP por Card Lembrado" value={gamSettings.xp_per_flashcard_remembered} onChange={(v) => updateSetting('xp_per_flashcard_remembered', v)} suffix="XP" />
          </SettingSection>

          <SettingSection title="Sistema de Moedas" icon={<Coins className="w-5 h-5 text-yellow-500" />}>
            <NumberInput label="Moedas por Acerto (Normal)" value={gamSettings.coins_per_correct_answer} onChange={(v) => updateSetting('coins_per_correct_answer', v)} />
            <NumberInput label="Moedas por Acerto (Desafio)" value={gamSettings.coins_per_correct_hard_mode} onChange={(v) => updateSetting('coins_per_correct_hard_mode', v)} />
            <NumberInput label="Moedas por Vitoria PvP" value={gamSettings.coins_per_pvp_win} onChange={(v) => updateSetting('coins_per_pvp_win', v)} />
            <NumberInput label="Moedas por Derrota PvP" value={gamSettings.coins_per_pvp_loss} onChange={(v) => updateSetting('coins_per_pvp_loss', v)} />
          </SettingSection>

          <SettingSection title="Sistema de Níveis" icon={<TrendingUp className="w-5 h-5 text-green-500" />}>
            <NumberInput label="XP por Nivel" value={gamSettings.xp_per_level} onChange={(v) => updateSetting('xp_per_level', v)} suffix="XP" />
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Formula de Progressao</label>
              <select
                value={gamSettings.level_formula}
                onChange={(e) => updateSetting('level_formula', e.target.value as 'linear' | 'exponential')}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
              >
                <option value="linear">Linear (XP fixo por nivel)</option>
                <option value="exponential">Exponencial (XP aumenta)</option>
              </select>
            </div>
          </SettingSection>

          <SettingSection title="Meta Diaria" icon={<Target className="w-5 h-5 text-blue-500" />}>
            <NumberInput label="Questões por Dia" value={gamSettings.daily_goal_questions} onChange={(v) => updateSetting('daily_goal_questions', v)} />
            <NumberInput label="Bonus XP ao Completar" value={gamSettings.daily_goal_xp_bonus} onChange={(v) => updateSetting('daily_goal_xp_bonus', v)} suffix="XP" />
            <NumberInput label="Bonus Moedas ao Completar" value={gamSettings.daily_goal_coins_bonus} onChange={(v) => updateSetting('daily_goal_coins_bonus', v)} />
          </SettingSection>

          <SettingSection title="Sistema de Streak" icon={<Flame className="w-5 h-5 text-orange-500" />}>
            <NumberInput label="Custo do Congelamento" value={gamSettings.streak_freeze_cost} onChange={(v) => updateSetting('streak_freeze_cost', v)} suffix="moedas" />
            <NumberInput label="Bonus 7 Dias Seguidos" value={gamSettings.streak_7_day_xp_bonus} onChange={(v) => updateSetting('streak_7_day_xp_bonus', v)} suffix="XP" />
            <NumberInput label="Bonus 30 Dias Seguidos" value={gamSettings.streak_30_day_xp_bonus} onChange={(v) => updateSetting('streak_30_day_xp_bonus', v)} suffix="XP" />
          </SettingSection>

          <SettingSection title="Liga / Ranking" icon={<Trophy className="w-5 h-5 text-purple-500" />}>
            <NumberInput label="Top N Promovidos" value={gamSettings.league_promotion_top} onChange={(v) => updateSetting('league_promotion_top', v)} />
            <NumberInput label="Ultimos N Rebaixados" value={gamSettings.league_demotion_bottom} onChange={(v) => updateSetting('league_demotion_bottom', v)} />
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Dia do Reset Semanal</label>
              <select
                value={gamSettings.league_reset_day}
                onChange={(e) => updateSetting('league_reset_day', e.target.value)}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-3 px-4 text-white focus:outline-none focus:border-brand-yellow"
              >
                <option value="sunday">Domingo</option>
                <option value="monday">Segunda-feira</option>
                <option value="saturday">Sabado</option>
              </select>
            </div>
          </SettingSection>

          <SettingSection title="Repeticao Espacada (SRS)" icon={<Brain className="w-5 h-5 text-pink-500" />}>
            <NumberInput label="Intervalo Facil" value={gamSettings.srs_interval_easy} onChange={(v) => updateSetting('srs_interval_easy', v)} suffix="dias" />
            <NumberInput label="Intervalo Medio" value={gamSettings.srs_interval_medium} onChange={(v) => updateSetting('srs_interval_medium', v)} suffix="dias" />
            <NumberInput label="Intervalo Dificil" value={gamSettings.srs_interval_hard} onChange={(v) => updateSetting('srs_interval_hard', v)} suffix="dias" />
          </SettingSection>

          <div className="bg-brand-card border border-white/5 rounded-sm p-6">
            <h2 className="text-lg font-bold text-white uppercase tracking-wide mb-6 flex items-center gap-3">
              <SettingsIcon className="w-5 h-5 text-gray-400" />
              Configurações Gerais
            </h2>
            <div className="space-y-4">
              <ToggleInput label="Gamificação Ativa" checked={gamSettings.is_gamification_enabled} onChange={(v) => updateSetting('is_gamification_enabled', v)} description="Desativar remove todo o sistema de XP, moedas e níveis do app" />
              <ToggleInput label="Mostrar Animacoes de XP" checked={gamSettings.show_xp_animations} onChange={(v) => updateSetting('show_xp_animations', v)} description="Animacoes visuais ao ganhar XP" />
              <ToggleInput label="Mostrar Modal de Level Up" checked={gamSettings.show_level_up_modal} onChange={(v) => updateSetting('show_level_up_modal', v)} description="Modal de celebracao ao subir de nivel" />
            </div>
          </div>

          <TutorialSection tabId="questoes" />
        </div>
      )}

      {activeTab === 'niveis' && (
        <div>
          <LevelsTab
            levels={levels}
            setLevels={setLevels}
            editingId={levelEditingId}
            setEditingId={setLevelEditingId}
            isCreating={levelCreating}
            setIsCreating={setLevelCreating}
            formData={levelForm}
            setFormData={setLevelForm}
          />
          <TutorialSection tabId="niveis" />
        </div>
      )}

      {activeTab === 'ligas' && (
        <div>
          <LeaguesTab
            tiers={tiers}
            setTiers={setTiers}
            editingId={tierEditingId}
            setEditingId={setTierEditingId}
            isCreating={tierCreating}
            setIsCreating={setTierCreating}
            formData={tierForm}
            setFormData={setTierForm}
          />
          <TutorialSection tabId="ligas" />
        </div>
      )}

      {activeTab === 'conquistas' && (
        <div>
          <AchievementsTab
            achievements={achievements}
            setAchievements={setAchievements}
            editingId={achievementEditingId}
            setEditingId={setAchievementEditingId}
            isCreating={achievementCreating}
            setIsCreating={setAchievementCreating}
            formData={achievementForm}
            setFormData={setAchievementForm}
            filterCategory={achievementFilter}
            setFilterCategory={setAchievementFilter}
          />
          <TutorialSection tabId="conquistas" />
        </div>
      )}

      {activeTab === 'conquistas-planejamento' && (
        <div>
          <PlanejamentoConquistasTab
            conquistas={planejamentoConquistas}
            setConquistas={setPlanejamentoConquistas}
            editingId={planejamentoEditingId}
            setEditingId={setPlanejamentoEditingId}
            isCreating={planejamentoCreating}
            setIsCreating={setPlanejamentoCreating}
            formData={planejamentoForm}
            setFormData={setPlanejamentoForm}
            filterTipo={planejamentoFilter}
            setFilterTipo={setPlanejamentoFilter}
          />
          <TutorialSection tabId="conquistas-planejamento" />
        </div>
      )}
    </div>
  );
}
