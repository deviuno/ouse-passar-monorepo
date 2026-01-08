import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Edit2,
  Trash2,
  ChevronLeft,
  GripVertical,
  Eye,
  EyeOff,
  FolderOpen,
  X,
  Check,
} from 'lucide-react';
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  generateSlug,
} from '../../../services/eadService';
import type { EadCategory } from '../../../types/ead';

interface CategoryFormData {
  name: string;
  slug: string;
  description: string;
  icon: string;
  color: string;
  parentId: string | null;
  isActive: boolean;
}

const defaultFormData: CategoryFormData = {
  name: '',
  slug: '',
  description: '',
  icon: '',
  color: '#FFB800',
  parentId: null,
  isActive: true,
};

const iconOptions = [
  'book-open', 'graduation-cap', 'building', 'map-pin', 'home', 'scale',
  'brain', 'code', 'briefcase', 'target', 'star', 'award',
];

const colorOptions = [
  '#FFB800', '#3B82F6', '#10B981', '#8B5CF6', '#EC4899', '#F97316',
  '#EF4444', '#06B6D4', '#84CC16', '#F59E0B', '#6366F1', '#14B8A6',
];

export const AcademyCategories: React.FC = () => {
  const [categories, setCategories] = useState<EadCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<EadCategory | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>(defaultFormData);
  const [saving, setSaving] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const data = await getCategories(true);
      setCategories(data);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    } finally {
      setLoading(false);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData(defaultFormData);
    setShowModal(true);
  };

  const openEditModal = (category: EadCategory) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      icon: category.icon || '',
      color: category.color || '#FFB800',
      parentId: category.parentId,
      isActive: category.isActive,
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData(defaultFormData);
  };

  const handleNameChange = (name: string) => {
    setFormData((prev) => ({
      ...prev,
      name,
      slug: editingCategory ? prev.slug : generateSlug(name),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
      } else {
        await createCategory(formData);
      }
      await loadCategories();
      closeModal();
    } catch (error) {
      console.error('Erro ao salvar categoria:', error);
      alert('Erro ao salvar categoria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCategory(id);
      await loadCategories();
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Erro ao deletar categoria:', error);
      alert('Erro ao deletar categoria. Verifique se não há cursos vinculados.');
    }
  };

  const toggleActive = async (category: EadCategory) => {
    try {
      await updateCategory(category.id, { isActive: !category.isActive });
      await loadCategories();
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-6">
        <div className="h-8 bg-white/5 rounded w-48" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-white/5 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            to="/admin/academy"
            className="text-gray-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-6 h-6" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-white">Categorias</h1>
            <p className="text-gray-400 mt-1">Organize seus cursos em categorias</p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="flex items-center gap-2 bg-brand-yellow text-brand-darker px-4 py-2 rounded-lg font-bold hover:bg-brand-yellow/90 transition-colors"
        >
          <Plus className="w-5 h-5" />
          Nova Categoria
        </button>
      </div>

      {/* Categories List */}
      <div className="bg-brand-card border border-white/5 rounded-lg overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-500" />
            <h3 className="text-lg font-semibold text-white mb-2">
              Nenhuma categoria criada
            </h3>
            <p className="text-gray-400 mb-4">
              Crie categorias para organizar seus cursos
            </p>
            <button
              onClick={openCreateModal}
              className="text-brand-yellow hover:underline"
            >
              Criar primeira categoria
            </button>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {categories.map((category) => (
              <div
                key={category.id}
                className={`flex items-center gap-4 p-4 hover:bg-white/5 transition-colors ${
                  !category.isActive ? 'opacity-50' : ''
                }`}
              >
                <div className="text-gray-500 cursor-grab">
                  <GripVertical className="w-5 h-5" />
                </div>

                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <FolderOpen
                    className="w-5 h-5"
                    style={{ color: category.color || '#FFB800' }}
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-white font-medium">{category.name}</p>
                    {!category.isActive && (
                      <span className="text-xs text-gray-500 bg-gray-500/20 px-2 py-0.5 rounded">
                        Inativo
                      </span>
                    )}
                  </div>
                  <p className="text-gray-400 text-sm truncate">
                    {category.description || 'Sem descrição'}
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => toggleActive(category)}
                    className={`p-2 rounded-lg transition-colors ${
                      category.isActive
                        ? 'text-green-400 hover:bg-green-500/20'
                        : 'text-gray-400 hover:bg-white/5'
                    }`}
                    title={category.isActive ? 'Desativar' : 'Ativar'}
                  >
                    {category.isActive ? (
                      <Eye className="w-5 h-5" />
                    ) : (
                      <EyeOff className="w-5 h-5" />
                    )}
                  </button>

                  <button
                    onClick={() => openEditModal(category)}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <Edit2 className="w-5 h-5" />
                  </button>

                  {deleteConfirm === category.id ? (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                        title="Confirmar"
                      >
                        <Check className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setDeleteConfirm(null)}
                        className="p-2 text-gray-400 hover:bg-white/5 rounded-lg transition-colors"
                        title="Cancelar"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => setDeleteConfirm(category.id)}
                      className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-brand-card border border-white/10 rounded-lg w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-white">
                {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
              </h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {/* Nome */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                  placeholder="Ex: Concursos Federais"
                  required
                />
              </div>

              {/* Slug */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Slug
                </label>
                <input
                  type="text"
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, slug: e.target.value }))
                  }
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                  placeholder="concursos-federais"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Descrição
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, description: e.target.value }))
                  }
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none resize-none"
                  rows={3}
                  placeholder="Descrição breve da categoria"
                />
              </div>

              {/* Cor */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Cor
                </label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, color }))}
                      className={`w-8 h-8 rounded-lg transition-all ${
                        formData.color === color
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-brand-card scale-110'
                          : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              {/* Ícone */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Ícone
                </label>
                <input
                  type="text"
                  value={formData.icon}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, icon: e.target.value }))
                  }
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                  placeholder="Ex: book-open, graduation-cap"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Sugestões: {iconOptions.join(', ')}
                </p>
              </div>

              {/* Categoria Pai */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Categoria Pai
                </label>
                <select
                  value={formData.parentId || ''}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      parentId: e.target.value || null,
                    }))
                  }
                  className="w-full bg-brand-darker border border-white/10 rounded-lg px-4 py-2.5 text-white focus:border-brand-yellow focus:outline-none"
                >
                  <option value="">Nenhuma (categoria raiz)</option>
                  {categories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              {/* Ativo */}
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={formData.isActive}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, isActive: e.target.checked }))
                  }
                  className="w-5 h-5 rounded border-white/10 bg-brand-darker text-brand-yellow focus:ring-brand-yellow"
                />
                <label htmlFor="isActive" className="text-gray-300">
                  Categoria ativa
                </label>
              </div>

              {/* Botões */}
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-4 py-2.5 border border-white/10 text-white rounded-lg hover:bg-white/5 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={saving || !formData.name}
                  className="flex-1 bg-brand-yellow text-brand-darker px-4 py-2.5 rounded-lg font-bold hover:bg-brand-yellow/90 transition-colors disabled:opacity-50"
                >
                  {saving ? 'Salvando...' : editingCategory ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AcademyCategories;
