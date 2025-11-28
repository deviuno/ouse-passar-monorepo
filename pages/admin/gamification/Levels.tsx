import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  TrendingUp,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import {
  getLevels,
  createLevel,
  updateLevel,
  deleteLevel,
  Level,
} from '../../../services/gamificationService';

export const LevelsPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [levels, setLevels] = useState<Level[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<Partial<Level>>({
    level_number: 1,
    title: '',
    min_xp: 0,
    icon: '',
    color: '#FFB800',
    rewards_xp: 0,
    rewards_coins: 0,
    is_active: true,
  });

  useEffect(() => {
    loadLevels();
  }, []);

  const loadLevels = async () => {
    setLoading(true);
    const { levels: data, error: err } = await getLevels();
    if (err) {
      setError(err);
    } else {
      setLevels(data);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.title) {
      toast.error('Titulo e obrigatorio');
      return;
    }

    const { level, error: err } = await createLevel({
      level_number: formData.level_number || levels.length + 1,
      title: formData.title,
      min_xp: formData.min_xp || 0,
      icon: formData.icon || '',
      color: formData.color || '#FFB800',
      rewards_xp: formData.rewards_xp || 0,
      rewards_coins: formData.rewards_coins || 0,
      is_active: formData.is_active ?? true,
    });

    if (err) {
      toast.error(err);
    } else if (level) {
      setLevels([...levels, level].sort((a, b) => a.level_number - b.level_number));
      setIsCreating(false);
      resetForm();
      toast.success('Nivel criado com sucesso!');
    }
  };

  const handleUpdate = async (id: number) => {
    const { success, error: err } = await updateLevel(id, formData);
    if (err) {
      toast.error(err);
    } else if (success) {
      setLevels(
        levels
          .map((l) => (l.id === id ? { ...l, ...formData } : l))
          .sort((a, b) => a.level_number - b.level_number)
      );
      setEditingId(null);
      resetForm();
      toast.success('Nivel atualizado com sucesso!');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Tem certeza que deseja excluir este nivel?')) return;

    const { success, error: err } = await deleteLevel(id);
    if (err) {
      toast.error(err);
    } else if (success) {
      setLevels(levels.filter((l) => l.id !== id));
      toast.success('Nivel excluido com sucesso!');
    }
  };

  const startEditing = (level: Level) => {
    setEditingId(level.id);
    setFormData({
      level_number: level.level_number,
      title: level.title,
      min_xp: level.min_xp,
      icon: level.icon,
      color: level.color,
      rewards_xp: level.rewards_xp,
      rewards_coins: level.rewards_coins,
      is_active: level.is_active,
    });
  };

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

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
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
          <h1 className="text-3xl font-black text-white uppercase tracking-tight font-display flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-brand-yellow" />
            Niveis
          </h1>
          <p className="text-gray-400 mt-2">
            Configure os niveis e titulos do sistema de progressao
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
          Novo Nivel
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

      {/* Create Form */}
      {isCreating && (
        <div className="bg-brand-card border border-brand-yellow/50 rounded-sm p-6 mb-6">
          <h3 className="text-lg font-bold text-white mb-4">Novo Nivel</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">Numero</label>
              <input
                type="number"
                min="1"
                value={formData.level_number}
                onChange={(e) => setFormData({ ...formData, level_number: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Titulo</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Ex: Mestre"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">XP Minimo</label>
              <input
                type="number"
                min="0"
                value={formData.min_xp}
                onChange={(e) => setFormData({ ...formData, min_xp: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Icone (Emoji)</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Ex: Crown"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cor</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-12 h-10 bg-transparent border border-white/10 rounded-sm cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="flex-1 bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bonus XP</label>
              <input
                type="number"
                min="0"
                value={formData.rewards_xp}
                onChange={(e) => setFormData({ ...formData, rewards_xp: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bonus Moedas</label>
              <input
                type="number"
                min="0"
                value={formData.rewards_coins}
                onChange={(e) => setFormData({ ...formData, rewards_coins: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div className="flex items-end">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 text-brand-yellow"
                />
                <span className="text-white">Ativo</span>
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

      {/* Levels Table */}
      <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-dark/50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Nivel
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Titulo
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                XP Min
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Icone
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Cor
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Bonus
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {levels.map((level) => (
              <tr key={level.id} className="hover:bg-white/5">
                {editingId === level.id ? (
                  // Editing Row
                  <>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="1"
                        value={formData.level_number}
                        onChange={(e) => setFormData({ ...formData, level_number: Number(e.target.value) })}
                        className="w-16 bg-brand-dark border border-white/10 rounded-sm py-1 px-2 text-white text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                        className="w-full bg-brand-dark border border-white/10 rounded-sm py-1 px-2 text-white text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        min="0"
                        value={formData.min_xp}
                        onChange={(e) => setFormData({ ...formData, min_xp: Number(e.target.value) })}
                        className="w-24 bg-brand-dark border border-white/10 rounded-sm py-1 px-2 text-white text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="text"
                        value={formData.icon}
                        onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                        className="w-20 bg-brand-dark border border-white/10 rounded-sm py-1 px-2 text-white text-sm"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="color"
                        value={formData.color}
                        onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                        className="w-8 h-8 bg-transparent border border-white/10 rounded cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-1">
                        <input
                          type="number"
                          min="0"
                          value={formData.rewards_xp}
                          onChange={(e) => setFormData({ ...formData, rewards_xp: Number(e.target.value) })}
                          className="w-16 bg-brand-dark border border-white/10 rounded-sm py-1 px-2 text-white text-sm"
                          placeholder="XP"
                        />
                        <input
                          type="number"
                          min="0"
                          value={formData.rewards_coins}
                          onChange={(e) => setFormData({ ...formData, rewards_coins: Number(e.target.value) })}
                          className="w-16 bg-brand-dark border border-white/10 rounded-sm py-1 px-2 text-white text-sm"
                          placeholder="Coins"
                        />
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={formData.is_active}
                        onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                        className="w-4 h-4"
                      />
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleUpdate(level.id)}
                          className="p-1.5 text-green-500 hover:bg-green-500/10 rounded"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="p-1.5 text-gray-400 hover:bg-white/10 rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                ) : (
                  // Display Row
                  <>
                    <td className="px-4 py-3">
                      <span className="text-white font-bold">{level.level_number}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-white">{level.title}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-gray-400">{level.min_xp.toLocaleString()}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-lg">{level.icon}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-6 h-6 rounded"
                          style={{ backgroundColor: level.color }}
                        />
                        <span className="text-gray-400 text-xs">{level.color}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-gray-400 text-sm">
                        <span className="text-brand-yellow">{level.rewards_xp} XP</span>
                        {level.rewards_coins > 0 && (
                          <span className="ml-2 text-yellow-500">{level.rewards_coins} coins</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${
                          level.is_active
                            ? 'bg-green-500/20 text-green-500'
                            : 'bg-gray-500/20 text-gray-500'
                        }`}
                      >
                        {level.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => startEditing(level)}
                          className="p-1.5 text-gray-400 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(level.id)}
                          className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        {levels.length === 0 && !error && (
          <div className="text-center py-12">
            <p className="text-gray-400">Nenhum nivel cadastrado</p>
            <button
              onClick={() => {
                setIsCreating(true);
                resetForm();
              }}
              className="mt-4 text-brand-yellow hover:text-white transition-colors"
            >
              Criar primeiro nivel
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
