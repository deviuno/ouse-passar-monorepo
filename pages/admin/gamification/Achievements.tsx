import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Award,
  AlertCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import {
  getAchievements,
  createAchievement,
  updateAchievement,
  deleteAchievement,
  Achievement,
} from '../../../services/gamificationService';

const CATEGORIES = [
  'estudo',
  'streak',
  'pvp',
  'nivel',
  'social',
  'especial',
];

const REQUIREMENT_TYPES = [
  { value: 'questions_answered', label: 'Questoes Respondidas' },
  { value: 'correct_answers', label: 'Respostas Corretas' },
  { value: 'streak_days', label: 'Dias de Streak' },
  { value: 'pvp_wins', label: 'Vitorias PvP' },
  { value: 'level_reached', label: 'Nivel Alcancado' },
  { value: 'xp_earned', label: 'XP Total' },
  { value: 'coins_earned', label: 'Moedas Total' },
  { value: 'flashcards_reviewed', label: 'Flashcards Revisados' },
  { value: 'subjects_mastered', label: 'Materias Dominadas' },
  { value: 'custom', label: 'Personalizado' },
];

export const AchievementsPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');

  const [formData, setFormData] = useState<Partial<Achievement>>({
    id: '',
    name: '',
    description: '',
    icon: '',
    category: 'estudo',
    requirement_type: 'questions_answered',
    requirement_value: 1,
    xp_reward: 0,
    coins_reward: 0,
    is_active: true,
    is_hidden: false,
    display_order: 0,
    unlock_message: null,
  });

  useEffect(() => {
    loadAchievements();
  }, []);

  const loadAchievements = async () => {
    setLoading(true);
    const { achievements: data, error: err } = await getAchievements();
    if (err) {
      setError(err);
    } else {
      setAchievements(data);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.id || !formData.name) {
      toast.error('ID e Nome sao obrigatorios');
      return;
    }

    const { achievement, error: err } = await createAchievement({
      id: formData.id!,
      name: formData.name,
      description: formData.description || '',
      icon: formData.icon || '',
      category: formData.category || 'estudo',
      requirement_type: formData.requirement_type || 'questions_answered',
      requirement_value: formData.requirement_value || 1,
      xp_reward: formData.xp_reward || 0,
      coins_reward: formData.coins_reward || 0,
      is_active: formData.is_active ?? true,
      is_hidden: formData.is_hidden ?? false,
      display_order: formData.display_order || 0,
      unlock_message: formData.unlock_message || null,
    });

    if (err) {
      toast.error(err);
    } else if (achievement) {
      setAchievements([...achievements, achievement]);
      setIsCreating(false);
      resetForm();
      toast.success('Conquista criada com sucesso!');
    }
  };

  const handleUpdate = async (id: string) => {
    const { success, error: err } = await updateAchievement(id, formData);
    if (err) {
      toast.error(err);
    } else if (success) {
      setAchievements(achievements.map((a) => (a.id === id ? { ...a, ...formData } as Achievement : a)));
      setEditingId(null);
      resetForm();
      toast.success('Conquista atualizada com sucesso!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conquista?')) return;

    const { success, error: err } = await deleteAchievement(id);
    if (err) {
      toast.error(err);
    } else if (success) {
      setAchievements(achievements.filter((a) => a.id !== id));
      toast.success('Conquista excluida com sucesso!');
    }
  };

  const startEditing = (achievement: Achievement) => {
    setEditingId(achievement.id);
    setFormData({ ...achievement });
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      icon: '',
      category: 'estudo',
      requirement_type: 'questions_answered',
      requirement_value: 1,
      xp_reward: 0,
      coins_reward: 0,
      is_active: true,
      is_hidden: false,
      display_order: achievements.length,
      unlock_message: null,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const filteredAchievements = filterCategory
    ? achievements.filter((a) => a.category === filterCategory)
    : achievements;

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
          <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display flex items-center gap-3">
            <Award className="w-8 h-8 text-brand-yellow" />
            Conquistas
          </h1>
          <p className="text-gray-400 mt-2">
            Configure as conquistas e badges do sistema
          </p>
        </div>
        <button
          onClick={() => {
            setIsCreating(true);
            resetForm();
          }}
          disabled={isCreating}
          className="px-6 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase tracking-wide hover:bg-white transition-colors flex items-center gap-2 disabled:opacity-50"
        >
          <Plus className="w-4 h-4" />
          Nova Conquista
        </button>
      </div>

      {error && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-sm p-4 mb-6 flex items-center gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-500" />
          <p className="text-yellow-500">
            Tabela nao encontrada. Execute a migracao SQL primeiro.
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterCategory('')}
          className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors ${
            filterCategory === ''
              ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10'
              : 'border-white/10 text-gray-400 hover:border-white/20'
          }`}
        >
          Todas ({achievements.length})
        </button>
        {CATEGORIES.map((cat) => {
          const count = achievements.filter((a) => a.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors ${
                filterCategory === cat
                  ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10'
                  : 'border-white/10 text-gray-400 hover:border-white/20'
              }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* Create Form */}
      {isCreating && (
        <div className="bg-brand-card border border-brand-yellow/50 rounded-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Nova Conquista</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID (unico)</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="Ex: first_correct"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Primeiro Acerto"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Icone (Emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Ex: Trophy"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Categoria</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              >
                {CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat.charAt(0).toUpperCase() + cat.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Descricao</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descricao da conquista"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo de Requisito</label>
              <select
                value={formData.requirement_type}
                onChange={(e) => setFormData({ ...formData, requirement_type: e.target.value })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              >
                {REQUIREMENT_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Valor Requisito</label>
              <input
                type="number"
                min="1"
                value={formData.requirement_value}
                onChange={(e) => setFormData({ ...formData, requirement_value: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">XP Reward</label>
              <input
                type="number"
                min="0"
                value={formData.xp_reward}
                onChange={(e) => setFormData({ ...formData, xp_reward: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Coins Reward</label>
              <input
                type="number"
                min="0"
                value={formData.coins_reward}
                onChange={(e) => setFormData({ ...formData, coins_reward: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_hidden}
                  onChange={(e) => setFormData({ ...formData, is_hidden: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-400">Oculta</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-400">Ativa</span>
              </label>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleCreate}
              className="px-4 py-2 bg-brand-yellow text-brand-darker rounded-sm font-bold uppercase text-sm flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              Criar
            </button>
            <button
              onClick={cancelEdit}
              className="px-4 py-2 border border-white/10 text-gray-400 rounded-sm font-bold uppercase text-sm flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredAchievements.map((achievement) => (
          <div
            key={achievement.id}
            className={`bg-brand-card border rounded-sm overflow-hidden ${
              achievement.is_active ? 'border-white/5' : 'border-gray-700/50 opacity-60'
            }`}
          >
            {/* Preview */}
            <div className="p-4 flex items-center gap-4 bg-brand-dark/30">
              <div className="w-14 h-14 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-3xl">
                {achievement.icon || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold truncate">{achievement.name}</h3>
                  {achievement.is_hidden && (
                    <span title="Oculta">
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">
                  {achievement.category}
                </p>
              </div>
            </div>

            {/* Details or Edit */}
            {editingId === achievement.id ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nome</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-1.5 px-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Icone</label>
                    <input
                      type="text"
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-1.5 px-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Requisito</label>
                    <input
                      type="number"
                      value={formData.requirement_value}
                      onChange={(e) => setFormData({ ...formData, requirement_value: Number(e.target.value) })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-1.5 px-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">XP</label>
                    <input
                      type="number"
                      value={formData.xp_reward}
                      onChange={(e) => setFormData({ ...formData, xp_reward: Number(e.target.value) })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-1.5 px-2 text-white text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_hidden}
                      onChange={(e) => setFormData({ ...formData, is_hidden: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-gray-400">Oculta</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4"
                    />
                    <span className="text-xs text-gray-400">Ativa</span>
                  </label>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleUpdate(achievement.id)}
                    className="flex-1 px-3 py-1.5 bg-brand-yellow text-brand-darker rounded-sm font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <Check className="w-3 h-3" /> Salvar
                  </button>
                  <button
                    onClick={cancelEdit}
                    className="flex-1 px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm font-bold text-xs flex items-center justify-center gap-1"
                  >
                    <X className="w-3 h-3" /> Cancelar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4">
                <p className="text-gray-400 text-sm mb-3 line-clamp-2">
                  {achievement.description || 'Sem descricao'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-500 text-xs block">Requisito</span>
                    <p className="text-white">
                      {REQUIREMENT_TYPES.find((t) => t.value === achievement.requirement_type)?.label || achievement.requirement_type}
                      : <span className="text-brand-yellow font-bold">{achievement.requirement_value}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Recompensa</span>
                    <p className="text-brand-yellow font-bold">
                      {achievement.xp_reward} XP
                      {achievement.coins_reward > 0 && (
                        <span className="text-yellow-500 ml-1">+ {achievement.coins_reward} coins</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(achievement)}
                    className="flex-1 px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm text-xs font-bold flex items-center justify-center gap-1 hover:border-brand-yellow hover:text-brand-yellow transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(achievement.id)}
                    className="px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm text-xs font-bold flex items-center justify-center gap-1 hover:border-red-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredAchievements.length === 0 && !error && (
        <div className="text-center py-12 bg-brand-card border border-white/5 rounded-sm">
          <Award className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {filterCategory ? `Nenhuma conquista na categoria "${filterCategory}"` : 'Nenhuma conquista cadastrada'}
          </p>
          <button
            onClick={() => {
              setIsCreating(true);
              resetForm();
            }}
            className="mt-4 text-brand-yellow hover:text-white transition-colors"
          >
            Criar primeira conquista
          </button>
        </div>
      )}
    </div>
  );
};
