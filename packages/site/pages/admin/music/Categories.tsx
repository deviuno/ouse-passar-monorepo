import React, { useState, useEffect } from 'react';
import {
  FolderOpen,
  Plus,
  Loader2,
  X,
  Edit2,
  Trash2,
  GripVertical,
} from 'lucide-react';
import { musicAdminService, type MusicCategory } from '../../../services/musicAdminService';

const ICON_OPTIONS = [
  { value: 'music', label: 'Musica' },
  { value: 'headphones', label: 'Fones' },
  { value: 'radio', label: 'Radio' },
  { value: 'mic', label: 'Microfone' },
  { value: 'folder', label: 'Pasta' },
];

const COLOR_OPTIONS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#14B8A6', // Teal
];

export const MusicCategories: React.FC = () => {
  console.log('[MusicCategories] ========== COMPONENTE MONTADO ==========');

  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<MusicCategory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<MusicCategory | null>(null);
  const [saving, setSaving] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'folder',
    color: '#3B82F6',
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    console.log('[MusicCategories] loadData chamado');
    setLoading(true);
    try {
      console.log('[MusicCategories] Chamando musicAdminService.getCategories...');
      const data = await musicAdminService.getCategories(); // Sem filtro de preparatorio
      console.log('[MusicCategories] Categorias recebidas:', data);
      setCategories(data);
    } catch (error) {
      console.error('[MusicCategories] ERRO ao carregar categorias:', error);
    } finally {
      setLoading(false);
      console.log('[MusicCategories] loadData finalizado');
    }
  };

  const handleOpenModal = (category?: MusicCategory) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || 'folder',
        color: category.color || '#3B82F6',
      });
    } else {
      setEditingCategory(null);
      setFormData({
        name: '',
        description: '',
        icon: 'folder',
        color: '#3B82F6',
      });
    }
    setShowModal(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setSaving(true);
    try {
      // Generate slug from name
      const slug = formData.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      if (editingCategory) {
        await musicAdminService.updateCategory(editingCategory.id, {
          ...formData,
          slug,
        });
      } else {
        await musicAdminService.createCategory(undefined, {
          ...formData,
          slug,
          sort_order: categories.length,
        });
      }

      setShowModal(false);
      loadData();
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Erro ao salvar categoria.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: MusicCategory) => {
    if (!confirm(`Tem certeza que deseja excluir "${category.name}"?`)) return;

    try {
      await musicAdminService.deleteCategory(category.id);
      loadData();
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Erro ao excluir categoria.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Categorias
          </h1>
          <p className="text-gray-400 mt-1">
            Organize suas faixas em categorias
          </p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 px-4 py-2 bg-brand-yellow text-brand-darker font-bold rounded-lg hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {/* Categories List */}
      {categories.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-brand-card border border-white/5 rounded-lg">
          <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhuma categoria criada</p>
          <button
            onClick={() => handleOpenModal()}
            className="mt-4 text-brand-yellow hover:underline"
          >
            Criar primeira categoria
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {categories.map((category) => (
            <div
              key={category.id}
              className="flex items-center gap-4 p-4 bg-brand-card border border-white/5 rounded-lg hover:border-brand-yellow/30 transition-colors"
            >
              <GripVertical className="w-5 h-5 text-gray-500 cursor-grab" />

              {/* Color indicator */}
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: category.color || '#3B82F6' }}
              >
                <FolderOpen className="w-5 h-5 text-white" />
              </div>

              {/* Info */}
              <div className="flex-1">
                <h3 className="text-white font-medium">{category.name}</h3>
                {category.description && (
                  <p className="text-gray-400 text-sm">{category.description}</p>
                )}
              </div>

              {/* Slug */}
              <span className="text-gray-500 text-sm font-mono">{category.slug}</span>

              {/* Actions */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenModal(category)}
                  className="p-2 text-gray-400 hover:text-white transition-colors"
                  title="Editar"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(category)}
                  className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                  title="Excluir"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-md">
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h2 className="text-xl font-bold text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
                  placeholder="Nome da categoria"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Descricao</label>
                <input
                  type="text"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-brand-yellow/50"
                  placeholder="Descricao opcional"
                />
              </div>

              {/* Icon */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Icone</label>
                <select
                  value={formData.icon}
                  onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-lg text-white focus:outline-none focus:border-brand-yellow/50"
                >
                  {ICON_OPTIONS.map((opt) => (
                    <option key={opt.value} value={opt.value}>
                      {opt.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Color */}
              <div>
                <label className="block text-gray-400 text-sm mb-2">Cor</label>
                <div className="flex gap-2">
                  {COLOR_OPTIONS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData({ ...formData, color })}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        formData.color === color ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-card' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-6 py-2 bg-brand-yellow text-brand-darker font-bold rounded-lg hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {saving ? 'Salvando...' : editingCategory ? 'Atualizar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default MusicCategories;
