import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Zap,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import {
  getXpActions,
  createXpAction,
  updateXpAction,
  deleteXpAction,
  XpAction,
} from '../../../services/gamificationService';

export const XpActionsPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [actions, setActions] = useState<XpAction[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<XpAction>>({
    id: '',
    name: '',
    description: '',
    xp_reward: 0,
    coins_reward: 0,
    study_mode: null,
    requires_correct_answer: false,
    multiplier_enabled: false,
    multiplier_value: 1,
    is_active: true,
  });

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    setLoading(true);
    const { actions: data, error: err } = await getXpActions();
    if (err) {
      setError(err);
    } else {
      setActions(data);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.id || !formData.name) {
      toast.error('ID e Nome sao obrigatorios');
      return;
    }

    const { action, error: err } = await createXpAction({
      id: formData.id,
      name: formData.name,
      description: formData.description || '',
      xp_reward: formData.xp_reward || 0,
      coins_reward: formData.coins_reward || 0,
      study_mode: formData.study_mode || null,
      requires_correct_answer: formData.requires_correct_answer || false,
      multiplier_enabled: formData.multiplier_enabled || false,
      multiplier_value: formData.multiplier_value || 1,
      is_active: formData.is_active ?? true,
    });

    if (err) {
      toast.error(err);
    } else if (action) {
      setActions([...actions, action]);
      setIsCreating(false);
      resetForm();
      toast.success('Acao criada com sucesso!');
    }
  };

  const handleUpdate = async (id: string) => {
    const { success, error: err } = await updateXpAction(id, formData);
    if (err) {
      toast.error(err);
    } else if (success) {
      setActions(actions.map((a) => (a.id === id ? { ...a, ...formData } as XpAction : a)));
      setEditingId(null);
      resetForm();
      toast.success('Acao atualizada com sucesso!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta acao?')) return;

    const { success, error: err } = await deleteXpAction(id);
    if (err) {
      toast.error(err);
    } else if (success) {
      setActions(actions.filter((a) => a.id !== id));
      toast.success('Acao excluida com sucesso!');
    }
  };

  const startEditing = (action: XpAction) => {
    setEditingId(action.id);
    setFormData({ ...action });
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      description: '',
      xp_reward: 0,
      coins_reward: 0,
      study_mode: null,
      requires_correct_answer: false,
      multiplier_enabled: false,
      multiplier_value: 1,
      is_active: true,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  // Quick edit XP/Coins inline
  const handleQuickUpdate = async (id: string, field: 'xp_reward' | 'coins_reward', value: number) => {
    const { success, error: err } = await updateXpAction(id, { [field]: value });
    if (err) {
      toast.error(err);
    } else if (success) {
      setActions(actions.map((a) => (a.id === id ? { ...a, [field]: value } : a)));
    }
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
            <Zap className="w-8 h-8 text-brand-yellow" />
            Acoes de XP
          </h1>
          <p className="text-gray-400 mt-2">
            Configure as recompensas por cada acao do usuario
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
          Nova Acao
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
          <h3 className="text-lg font-bold text-white mb-4">Nova Acao</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID (unico)</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="Ex: correct_answer_zen"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Acerto Modo Zen"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">XP</label>
              <input
                type="number"
                min="0"
                value={formData.xp_reward}
                onChange={(e) => setFormData({ ...formData, xp_reward: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Moedas</label>
              <input
                type="number"
                min="0"
                value={formData.coins_reward}
                onChange={(e) => setFormData({ ...formData, coins_reward: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Descricao</label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descricao da acao"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Modo de Estudo</label>
              <select
                value={formData.study_mode || ''}
                onChange={(e) => setFormData({ ...formData, study_mode: e.target.value || null })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              >
                <option value="">Todos</option>
                <option value="zen">Zen</option>
                <option value="desafio">Desafio</option>
                <option value="pvp">PvP</option>
                <option value="flashcard">Flashcard</option>
              </select>
            </div>
            <div className="flex items-end gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.requires_correct_answer}
                  onChange={(e) => setFormData({ ...formData, requires_correct_answer: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-400">Requer Acerto</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4"
                />
                <span className="text-sm text-gray-400">Ativo</span>
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

      {/* Actions Table */}
      <div className="bg-brand-card border border-white/5 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-brand-dark/50">
            <tr>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Acao
              </th>
              <th className="text-left px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Modo
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                XP
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Moedas
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Acerto
              </th>
              <th className="text-center px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Status
              </th>
              <th className="text-right px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider">
                Acoes
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {actions.map((action) => (
              <tr key={action.id} className="hover:bg-white/5">
                <td className="px-4 py-3">
                  <div>
                    <p className="text-white font-medium">{action.name}</p>
                    <p className="text-gray-500 text-xs">{action.id}</p>
                  </div>
                </td>
                <td className="px-4 py-3">
                  <span className="text-gray-400 text-sm capitalize">
                    {action.study_mode || 'Todos'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    min="0"
                    value={action.xp_reward}
                    onChange={(e) => handleQuickUpdate(action.id, 'xp_reward', Number(e.target.value))}
                    className="w-20 bg-transparent border border-white/10 rounded py-1 px-2 text-brand-yellow text-center font-bold focus:outline-none focus:border-brand-yellow"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  <input
                    type="number"
                    min="0"
                    value={action.coins_reward}
                    onChange={(e) => handleQuickUpdate(action.id, 'coins_reward', Number(e.target.value))}
                    className="w-20 bg-transparent border border-white/10 rounded py-1 px-2 text-yellow-500 text-center font-bold focus:outline-none focus:border-brand-yellow"
                  />
                </td>
                <td className="px-4 py-3 text-center">
                  {action.requires_correct_answer ? (
                    <Check className="w-4 h-4 text-green-500 mx-auto" />
                  ) : (
                    <X className="w-4 h-4 text-gray-600 mx-auto" />
                  )}
                </td>
                <td className="px-4 py-3 text-center">
                  <span
                    className={`px-2 py-0.5 text-xs font-bold uppercase rounded ${
                      action.is_active
                        ? 'bg-green-500/20 text-green-500'
                        : 'bg-gray-500/20 text-gray-500'
                    }`}
                  >
                    {action.is_active ? 'Ativo' : 'Inativo'}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => startEditing(action)}
                      className="p-1.5 text-gray-400 hover:text-brand-yellow hover:bg-brand-yellow/10 rounded"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(action.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {actions.length === 0 && !error && (
          <div className="text-center py-12">
            <Zap className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Nenhuma acao cadastrada</p>
            <button
              onClick={() => {
                setIsCreating(true);
                resetForm();
              }}
              className="mt-4 text-brand-yellow hover:text-white transition-colors"
            >
              Criar primeira acao
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
