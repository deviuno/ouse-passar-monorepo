import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  FolderOpen,
  Plus,
  Loader2,
  Edit2,
  Trash2,
  X,
  ChevronLeft,
  GripVertical,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../hooks/useAuth';
import * as musicAdminService from '../../services/musicAdminService';

const PRESET_COLORS = [
  '#3B82F6', // blue
  '#8B5CF6', // purple
  '#10B981', // green
  '#F59E0B', // amber
  '#EF4444', // red
  '#EC4899', // pink
  '#06B6D4', // cyan
  '#F97316', // orange
];

const PRESET_ICONS = [
  'music', 'headphones', 'radio', 'mic', 'guitar', 'piano',
  'drum', 'speaker', 'volume-2', 'music-2', 'music-3', 'music-4',
];

export const MusicCategories: React.FC = () => {
  const toast = useToast();
  const { currentPreparatorio } = useAuth();
  const [categories, setCategories] = useState<musicAdminService.MusicCategory[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<musicAdminService.MusicCategory | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'music',
    color: '#3B82F6',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (currentPreparatorio?.id) {
      loadCategories();
    }
  }, [currentPreparatorio?.id]);

  const loadCategories = async () => {
    if (!currentPreparatorio?.id) return;

    setLoading(true);
    try {
      const data = await musicAdminService.getCategories(currentPreparatorio.id);
      setCategories(data);
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      slug: '',
      description: '',
      icon: 'music',
      color: '#3B82F6',
    });
    setShowModal(true);
  };

  const openEditModal = (category: musicAdminService.MusicCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || 'music',
      color: category.color || '#3B82F6',
    });
    setShowModal(true);
  };

  const handleNameChange = (name: string) => {
    setFormData((f) => ({
      ...f,
      name,
      slug: editingCategory ? f.slug : musicAdminService.generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPreparatorio?.id) return;

    setSaving(true);
    try {
      if (editingCategory) {
        await musicAdminService.updateCategory(editingCategory.id, formData);
        toast.success('Categoria atualizada!');
      } else {
        await musicAdminService.createCategory(currentPreparatorio.id, formData);
        toast.success('Categoria criada!');
      }

      setShowModal(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      toast.error('Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (category: musicAdminService.MusicCategory) => {
    if (!confirm(`Excluir "${category.name}"?`)) return;

    try {
      await musicAdminService.deleteCategory(category.id);
      toast.success('Categoria excluida!');
      loadCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3">
            <Link to="/admin/music" className="text-gray-400 hover:text-white transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-3xl font-black text-white uppercase tracking-tight">Categorias</h1>
          </div>
          <p className="text-gray-400 mt-1 ml-8">Organize suas faixas em categorias</p>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-dark text-black font-bold uppercase text-sm rounded-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* List */}
      <div className="bg-brand-card border border-white/10 rounded-sm overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <FolderOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>Nenhuma categoria criada</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-brand-yellow hover:text-white transition-colors"
            >
              Criar primeira categoria
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {categories.map((category) => (
              <div
                key={category.id}
                className="flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <GripVertical className="w-4 h-4 text-gray-500 cursor-grab" />
                  <div
                    className="w-10 h-10 rounded-sm flex items-center justify-center"
                    style={{ backgroundColor: `${category.color}20` }}
                  >
                    <FolderOpen className="w-5 h-5" style={{ color: category.color || '#3B82F6' }} />
                  </div>
                  <div>
                    <p className="text-white font-bold">{category.name}</p>
                    <p className="text-gray-400 text-sm">{category.slug}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => openEditModal(category)}
                    className="p-2 text-gray-400 hover:text-brand-yellow transition-colors"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(category)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-sm w-full max-w-md">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white uppercase">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">Nome *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  required
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">Slug</label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) => setFormData((f) => ({ ...f, slug: e.target.value }))}
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">Descricao</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData((f) => ({ ...f, description: e.target.value }))}
                  rows={3}
                  className="w-full px-4 py-2 bg-brand-dark border border-white/10 rounded-sm text-white focus:outline-none focus:border-brand-yellow/50 resize-none"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm uppercase mb-2">Cor</label>
                <div className="flex flex-wrap gap-2">
                  {PRESET_COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData((f) => ({ ...f, color }))}
                      className={`w-8 h-8 rounded-sm transition-all ${
                        formData.color === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-dark'
                          : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-brand-dark border border-white/10 text-white font-bold uppercase text-sm rounded-sm hover:border-white/30 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-brand-yellow-dark text-black font-bold uppercase text-sm rounded-sm transition-colors disabled:opacity-50"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingCategory ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
