import React, { useState, useEffect } from 'react';
import {
  Loader2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Target,
  AlertCircle,
  EyeOff,
  Calendar,
} from 'lucide-react';
import { useToast } from '../../../components/ui/Toast';
import {
  planejamentoConquistasService,
  REQUISITO_TIPO_LABELS,
} from '../../../services/planejamentoConquistasService';
import {
  PlanejamentoConquista,
  PlanejamentoConquistaRequisitoTipo,
} from '../../../lib/database.types';

const REQUISITO_TIPOS: { value: PlanejamentoConquistaRequisitoTipo; label: string }[] = [
  { value: 'missoes_completadas', label: 'Missoes Completadas' },
  { value: 'rodadas_completadas', label: 'Rodadas Completadas' },
  { value: 'dias_consecutivos', label: 'Dias Consecutivos' },
  { value: 'porcentagem_edital', label: '% do Edital' },
  { value: 'missoes_por_dia', label: 'Missoes por Dia' },
  { value: 'tempo_estudo', label: 'Tempo de Estudo (min)' },
  { value: 'primeiro_acesso', label: 'Primeiro Acesso' },
  { value: 'semana_perfeita', label: 'Semana Perfeita' },
  { value: 'mes_perfeito', label: 'Mes Perfeito' },
  { value: 'custom', label: 'Personalizado' },
];

interface FormData {
  id: string;
  nome: string;
  descricao: string;
  icone: string;
  requisito_tipo: PlanejamentoConquistaRequisitoTipo;
  requisito_valor: number;
  xp_recompensa: number;
  moedas_recompensa: number;
  is_active: boolean;
  is_hidden: boolean;
  ordem: number;
  mensagem_desbloqueio: string | null;
}

export const PlanejamentoAchievementsPage: React.FC = () => {
  const toast = useToast();
  const [loading, setLoading] = useState(true);
  const [conquistas, setConquistas] = useState<PlanejamentoConquista[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [stats, setStats] = useState<Record<string, number>>({});

  const [formData, setFormData] = useState<FormData>({
    id: '',
    nome: '',
    descricao: '',
    icone: '',
    requisito_tipo: 'missoes_completadas',
    requisito_valor: 1,
    xp_recompensa: 0,
    moedas_recompensa: 0,
    is_active: true,
    is_hidden: false,
    ordem: 0,
    mensagem_desbloqueio: null,
  });

  useEffect(() => {
    loadConquistas();
    loadStats();
  }, []);

  const loadConquistas = async () => {
    setLoading(true);
    try {
      const data = await planejamentoConquistasService.getAll(true);
      setConquistas(data);
      setError(null);
    } catch (err) {
      console.error('Erro ao carregar conquistas:', err);
      setError('Erro ao carregar conquistas. Verifique se a migration foi aplicada.');
    }
    setLoading(false);
  };

  const loadStats = async () => {
    try {
      const data = await planejamentoConquistasService.getEstatisticas();
      setStats(data);
    } catch (err) {
      console.error('Erro ao carregar estatisticas:', err);
    }
  };

  const handleCreate = async () => {
    if (!formData.id || !formData.nome) {
      toast.error('ID e Nome sao obrigatorios');
      return;
    }

    try {
      const conquista = await planejamentoConquistasService.create({
        id: formData.id,
        nome: formData.nome,
        descricao: formData.descricao,
        icone: formData.icone || '🏆',
        requisito_tipo: formData.requisito_tipo,
        requisito_valor: formData.requisito_valor,
        xp_recompensa: formData.xp_recompensa,
        moedas_recompensa: formData.moedas_recompensa,
        is_active: formData.is_active,
        is_hidden: formData.is_hidden,
        ordem: formData.ordem,
        mensagem_desbloqueio: formData.mensagem_desbloqueio,
      });
      setConquistas([...conquistas, conquista]);
      setIsCreating(false);
      resetForm();
      toast.success('Conquista criada com sucesso!');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleUpdate = async (id: string) => {
    try {
      const updated = await planejamentoConquistasService.update(id, {
        nome: formData.nome,
        descricao: formData.descricao,
        icone: formData.icone,
        requisito_tipo: formData.requisito_tipo,
        requisito_valor: formData.requisito_valor,
        xp_recompensa: formData.xp_recompensa,
        moedas_recompensa: formData.moedas_recompensa,
        is_active: formData.is_active,
        is_hidden: formData.is_hidden,
        ordem: formData.ordem,
        mensagem_desbloqueio: formData.mensagem_desbloqueio,
      });
      setConquistas(conquistas.map((c) => (c.id === id ? updated : c)));
      setEditingId(null);
      resetForm();
      toast.success('Conquista atualizada com sucesso!');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta conquista?')) return;

    try {
      await planejamentoConquistasService.delete(id);
      setConquistas(conquistas.filter((c) => c.id !== id));
      toast.success('Conquista excluida com sucesso!');
    } catch (err) {
      toast.error((err as Error).message);
    }
  };

  const startEditing = (conquista: PlanejamentoConquista) => {
    setEditingId(conquista.id);
    setFormData({
      id: conquista.id,
      nome: conquista.nome,
      descricao: conquista.descricao,
      icone: conquista.icone,
      requisito_tipo: conquista.requisito_tipo,
      requisito_valor: conquista.requisito_valor,
      xp_recompensa: conquista.xp_recompensa,
      moedas_recompensa: conquista.moedas_recompensa,
      is_active: conquista.is_active,
      is_hidden: conquista.is_hidden,
      ordem: conquista.ordem,
      mensagem_desbloqueio: conquista.mensagem_desbloqueio,
    });
  };

  const resetForm = () => {
    setFormData({
      id: '',
      nome: '',
      descricao: '',
      icone: '',
      requisito_tipo: 'missoes_completadas',
      requisito_valor: 1,
      xp_recompensa: 0,
      moedas_recompensa: 0,
      is_active: true,
      is_hidden: false,
      ordem: conquistas.length,
      mensagem_desbloqueio: null,
    });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setIsCreating(false);
    resetForm();
  };

  const filteredConquistas = filterTipo
    ? conquistas.filter((c) => c.requisito_tipo === filterTipo)
    : conquistas;

  // Group by tipo for filter counts
  const tipoCounts = conquistas.reduce((acc, c) => {
    acc[c.requisito_tipo] = (acc[c.requisito_tipo] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
            <Calendar className="w-8 h-8 text-brand-yellow" />
            Conquistas do Planejamento
          </h1>
          <p className="text-gray-400 mt-2">
            Configure as conquistas do sistema de planejamento de estudos
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
            {error}
          </p>
        </div>
      )}

      {/* Filter */}
      <div className="mb-6 flex gap-2 flex-wrap">
        <button
          onClick={() => setFilterTipo('')}
          className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors ${
            filterTipo === ''
              ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10'
              : 'border-white/10 text-gray-400 hover:border-white/20'
          }`}
        >
          Todas ({conquistas.length})
        </button>
        {REQUISITO_TIPOS.filter(t => tipoCounts[t.value]).map((tipo) => (
          <button
            key={tipo.value}
            onClick={() => setFilterTipo(tipo.value)}
            className={`px-3 py-1.5 text-xs font-bold uppercase rounded-sm border transition-colors ${
              filterTipo === tipo.value
                ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10'
                : 'border-white/10 text-gray-400 hover:border-white/20'
            }`}
          >
            {tipo.label} ({tipoCounts[tipo.value] || 0})
          </button>
        ))}
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
                placeholder="Ex: primeira_missao"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Nome</label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                placeholder="Ex: Primeira Missao"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Icone (Emoji)</label>
              <input
                type="text"
                value={formData.icone}
                onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                placeholder="Ex: 🎯"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Tipo de Requisito</label>
              <select
                value={formData.requisito_tipo}
                onChange={(e) => setFormData({ ...formData, requisito_tipo: e.target.value as PlanejamentoConquistaRequisitoTipo })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              >
                {REQUISITO_TIPOS.map((tipo) => (
                  <option key={tipo.value} value={tipo.value}>
                    {tipo.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Descricao</label>
              <input
                type="text"
                value={formData.descricao}
                onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
                placeholder="Descricao da conquista"
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Valor Requisito</label>
              <input
                type="number"
                min="0"
                value={formData.requisito_valor}
                onChange={(e) => setFormData({ ...formData, requisito_valor: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Ordem</label>
              <input
                type="number"
                min="0"
                value={formData.ordem}
                onChange={(e) => setFormData({ ...formData, ordem: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">XP Recompensa</label>
              <input
                type="number"
                min="0"
                value={formData.xp_recompensa}
                onChange={(e) => setFormData({ ...formData, xp_recompensa: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-1">Moedas Recompensa</label>
              <input
                type="number"
                min="0"
                value={formData.moedas_recompensa}
                onChange={(e) => setFormData({ ...formData, moedas_recompensa: Number(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-3 text-white focus:outline-none focus:border-brand-yellow"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm text-gray-400 mb-1">Mensagem de Desbloqueio (opcional)</label>
              <input
                type="text"
                value={formData.mensagem_desbloqueio || ''}
                onChange={(e) => setFormData({ ...formData, mensagem_desbloqueio: e.target.value || null })}
                placeholder="Ex: Parabens! Voce completou sua primeira missao!"
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

      {/* Conquistas Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredConquistas.map((conquista) => (
          <div
            key={conquista.id}
            className={`bg-brand-card border rounded-sm overflow-hidden ${
              conquista.is_active ? 'border-white/5' : 'border-gray-700/50 opacity-60'
            }`}
          >
            {/* Preview */}
            <div className="p-4 flex items-center gap-4 bg-brand-dark/30">
              <div className="w-14 h-14 rounded-lg bg-brand-yellow/20 flex items-center justify-center text-3xl">
                {conquista.icone || '?'}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className="text-white font-bold truncate">{conquista.nome}</h3>
                  {conquista.is_hidden && (
                    <span title="Oculta">
                      <EyeOff className="w-4 h-4 text-gray-500" />
                    </span>
                  )}
                </div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">
                  {REQUISITO_TIPO_LABELS[conquista.requisito_tipo]}
                </p>
              </div>
            </div>

            {/* Details or Edit */}
            {editingId === conquista.id ? (
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Nome</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-1.5 px-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Icone</label>
                    <input
                      type="text"
                      value={formData.icone}
                      onChange={(e) => setFormData({ ...formData, icone: e.target.value })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-1.5 px-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Requisito</label>
                    <input
                      type="number"
                      value={formData.requisito_valor}
                      onChange={(e) => setFormData({ ...formData, requisito_valor: Number(e.target.value) })}
                      className="w-full bg-brand-dark border border-white/10 rounded-sm py-1.5 px-2 text-white text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">XP</label>
                    <input
                      type="number"
                      value={formData.xp_recompensa}
                      onChange={(e) => setFormData({ ...formData, xp_recompensa: Number(e.target.value) })}
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
                    onClick={() => handleUpdate(conquista.id)}
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
                  {conquista.descricao || 'Sem descricao'}
                </p>
                <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                  <div>
                    <span className="text-gray-500 text-xs block">Requisito</span>
                    <p className="text-white">
                      {REQUISITO_TIPO_LABELS[conquista.requisito_tipo]}:{' '}
                      <span className="text-brand-yellow font-bold">{conquista.requisito_valor}</span>
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-500 text-xs block">Recompensa</span>
                    <p className="text-brand-yellow font-bold">
                      {conquista.xp_recompensa} XP
                      {conquista.moedas_recompensa > 0 && (
                        <span className="text-yellow-500 ml-1">+ {conquista.moedas_recompensa} moedas</span>
                      )}
                    </p>
                  </div>
                </div>
                {stats[conquista.id] !== undefined && (
                  <div className="mb-4 text-xs text-gray-500">
                    <Target className="w-3 h-3 inline mr-1" />
                    {stats[conquista.id]} usuarios desbloquearam
                  </div>
                )}
                <div className="flex gap-2">
                  <button
                    onClick={() => startEditing(conquista)}
                    className="flex-1 px-3 py-1.5 border border-white/10 text-gray-400 rounded-sm text-xs font-bold flex items-center justify-center gap-1 hover:border-brand-yellow hover:text-brand-yellow transition-colors"
                  >
                    <Pencil className="w-3 h-3" /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(conquista.id)}
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

      {filteredConquistas.length === 0 && !error && (
        <div className="text-center py-12 bg-brand-card border border-white/5 rounded-sm">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400">
            {filterTipo ? `Nenhuma conquista do tipo "${REQUISITO_TIPO_LABELS[filterTipo as PlanejamentoConquistaRequisitoTipo]}"` : 'Nenhuma conquista cadastrada'}
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
