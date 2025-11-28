import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Trophy,
  AlertCircle,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import {
  getLeagueTiers,
  createLeagueTier,
  updateLeagueTier,
  deleteLeagueTier,
  LeagueTier,
} from '../../../services/gamificationService';

export const LeaguesPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<LeagueTier[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<Partial<LeagueTier>>({
    id: '',
    name: '',
    display_order: 1,
    icon: '',
    color: '#FFB800',
    bg_color: '#1a1a1a',
    min_xp_to_enter: null,
    promotion_bonus_xp: 0,
    promotion_bonus_coins: 0,
    is_active: true,
  });

  useEffect(() => {
    loadTiers();
  }, []);

  const loadTiers = async () => {
    setLoading(true);
    const { tiers: data, error: err } = await getLeagueTiers();
    if (err) {
      setError(err);
    } else {
      setTiers(data);
    }
    setLoading(false);
  };

  const handleCreate = async () => {
    if (!formData.id || !formData.name) {
      toast.error('ID e Nome sao obrigatorios');
      return;
    }

    const { tier, error: err } = await createLeagueTier({
      id: formData.id,
      name: formData.name,
      display_order: formData.display_order || tiers.length + 1,
      icon: formData.icon || '',
      color: formData.color || '#FFB800',
      bg_color: formData.bg_color || '#1a1a1a',
      min_xp_to_enter: formData.min_xp_to_enter || null,
      promotion_bonus_xp: formData.promotion_bonus_xp || 0,
      promotion_bonus_coins: formData.promotion_bonus_coins || 0,
      is_active: formData.is_active ?? true,
    });

    if (err) {
      toast.error(err);
    } else if (tier) {
      setTiers([...tiers, tier].sort((a, b) => a.display_order - b.display_order));
      setIsCreating(false);
      resetForm();
      toast.success('Liga criada com sucesso!');
    }
  };

  const handleUpdate = async (id: string) => {
    const { success, error: err } = await updateLeagueTier(id, formData);
    if (err) {
      toast.error(err);
    } else if (success) {
      setTiers(
        tiers
          .map((t) => (t.id === id ? { ...t, ...formData } as LeagueTier : t))
          .sort((a, b) => a.display_order - b.display_order)
      );
      setEditingId(null);
      resetForm();
      toast.success('Liga atualizada com sucesso!');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta liga?')) return;

    const { success, error: err } = await deleteLeagueTier(id);
    if (err) {
      toast.error(err);
    } else if (success) {
      setTiers(tiers.filter((t) => t.id !== id));
      toast.success('Liga excluida com sucesso!');
    }
  };

  const startEditing = (tier: LeagueTier) => {
    setEditingId(tier.id);
    setFormData({ ...tier });
  };

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      display_order: tiers.length + 1,
      icon: '',
      color: '#FFB800',
      bg_color: '#1a1a1a',
      min_xp_to_enter: null,
      promotion_bonus_xp: 0,
      promotion_bonus_coins: 0,
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
            <Trophy className="w-8 h-8 text-brand-yellow" />
            Ligas
          </h1>
          <p className="text-gray-400 mt-2">
            Configure as ligas do sistema de ranking
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
          Nova Liga
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
          <h3 className="text-lg font-bold text-white mb-4">Nova Liga</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm text-gray-400 mb-1">ID (unico)</label>
              <input
                type="text"
                value={formData.id}
                onChange={(e) => setFormData({ ...formData, id: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                placeholder="Ex: diamante"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Diamante"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ordem</label>
              <input
                type="number"
                min="1"
                value={formData.display_order}
                onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Icone</label>
              <input
                type="text"
                value={formData.icon}
                onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                placeholder="Ex: Diamond"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Cor Principal</label>
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
              <label className="block text-sm text-gray-400 mb-1">Cor de Fundo</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={formData.bg_color}
                  onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                  className="w-12 h-10 bg-transparent border border-white/10 rounded-sm cursor-pointer"
                />
                <input
                  type="text"
                  value={formData.bg_color}
                  onChange={(e) => setFormData({ ...formData, bg_color: e.target.value })}
                  className="flex-1 bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bonus XP Promocao</label>
              <input
                type="number"
                min="0"
                value={formData.promotion_bonus_xp}
                onChange={(e) => setFormData({ ...formData, promotion_bonus_xp: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Bonus Moedas</label>
              <input
                type="number"
                min="0"
                value={formData.promotion_bonus_coins}
                onChange={(e) => setFormData({ ...formData, promotion_bonus_coins: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
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

      {/* Leagues Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tiers.map((tier) => (
          <div
            key={tier.id}
            className="bg-brand-card border border-white/5 rounded-sm overflow-hidden"
            style={{ borderColor: tier.is_active ? `${tier.color}30` : undefined }}
          >
            {/* Preview Header */}
            <div
              className="p-4 flex items-center gap-3"
              style={{ backgroundColor: `${tier.bg_color}` }}
            >
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                style={{ backgroundColor: tier.color }}
              >
                {tier.icon}
              </div>
              <div>
                <h3 className="text-white font-bold text-lg">{tier.name}</h3>
                <p className="text-gray-400 text-xs uppercase tracking-wider">
                  Ordem: {tier.display_order}
                </p>
              </div>
              {!tier.is_active && (
                <span className="ml-auto px-2 py-0.5 text-xs bg-gray-500/20 text-gray-500 rounded">
                  Inativo
                </span>
              )}
            </div>

            {/* Details or Edit Form */}
            {editingId === tier.id ? (
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
                    <label className="block text-xs text-gray-500 mb-1">Ordem</label>
                    <input
                      type="number"
                      value={formData.display_order}
                      onChange={(e) => setFormData({ ...formData, display_order: Number(e.target.value) })}
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
                    <label className="block text-xs text-gray-500 mb-1">Cor</label>
                    <input
                      type="color"
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full h-8 bg-transparent border border-white/10 rounded cursor-pointer"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bonus XP</label>
                    <input
                      type="number"
                      value={formData.promotion_bonus_xp}
                      onChange={(e) => setFormData({ ...formData, promotion_bonus_xp: Number(e.target.value) })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-1.5 px-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Bonus Coins</label>
                    <input
                      type="number"
                      value={formData.promotion_bonus_coins}
                      onChange={(e) => setFormData({ ...formData, promotion_bonus_coins: Number(e.target.value) })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-1.5 px-2 text-white text-sm"
                    />
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-400">Ativo</span>
                </div>
                <div className="flex gap-2 pt-2">
                  <button
                    onClick={() => handleUpdate(tier.id)}
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
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-500 text-xs">Bonus Promocao</span>
                    <p className="text-brand-yellow font-bold">{tier.promotion_bonus_xp} XP</p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs">Bonus Moedas</span>
                    <p className="text-yellow-500 font-bold">{tier.promotion_bonus_coins}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(tier)}
                    className="flex-1 px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm text-xs font-bold flex items-center justify-center gap-1 hover:border-brand-yellow hover:text-brand-yellow transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(tier.id)}
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

      {tiers.length === 0 && !error && (
        <div className="text-center py-12 bg-brand-card border border-white/5 rounded-sm">
          <Trophy className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">Nenhuma liga cadastrada</p>
          <button
            onClick={() => {
              setIsCreating(true);
              resetForm();
            }}
            className="mt-4 text-brand-yellow hover:text-white transition-colors"
          >
            Criar primeira liga
          </button>
        </div>
      )}
    </div>
  );
};
