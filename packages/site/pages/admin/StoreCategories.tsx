import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Check,
  X,
  Tag,
  GripVertical,
  List,
  LayoutGrid,
  Search,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

const ICONS = ['book', 'zap', 'clipboard-list', 'user-circle', 'rocket', 'palette', 'award', 'external-link', 'gift', 'star', 'trophy', 'shield'];
const COLORS = ['#3B82F6', '#EF4444', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1', '#64748B', '#14B8A6', '#F97316'];

export const StoreCategories: React.FC = () => {
  const toast = useToast();
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [searchTerm, setSearchTerm] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    icon: 'tag',
    color: '#3B82F6',
    is_active: true,
  });

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${MASTRA_URL}/api/admin/store/categories`);
      if (response.ok) {
        const data = await response.json();
        const cats = data?.categories || data?.data || (Array.isArray(data) ? data : []);
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error loading categories:', error);
      toast.error('Erro ao carregar categorias');
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const response = await fetch(`${MASTRA_URL}/api/admin/store/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          slug: formData.slug || generateSlug(formData.name),
        }),
      });

      if (response.ok) {
        toast.success('Categoria criada!');
        setShowAddForm(false);
        setFormData({ name: '', slug: '', description: '', icon: 'tag', color: '#3B82F6', is_active: true });
        loadCategories();
      } else {
        toast.error('Erro ao criar categoria');
      }
    } catch (error) {
      console.error('Error creating category:', error);
      toast.error('Erro ao criar categoria');
    }
  };

  const handleUpdate = async (category: StoreCategory) => {
    try {
      const response = await fetch(`${MASTRA_URL}/api/admin/store/categories/${category.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(category),
      });

      if (response.ok) {
        toast.success('Categoria atualizada!');
        setEditingId(null);
        loadCategories();
      } else {
        toast.error('Erro ao atualizar categoria');
      }
    } catch (error) {
      console.error('Error updating category:', error);
      toast.error('Erro ao atualizar categoria');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir esta categoria?')) return;

    try {
      const response = await fetch(`${MASTRA_URL}/api/admin/store/categories/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Categoria excluída!');
        loadCategories();
      } else {
        toast.error('Erro ao excluir categoria');
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      toast.error('Erro ao excluir categoria');
    }
  };

  const handleToggleActive = async (category: StoreCategory) => {
    await handleUpdate({ ...category, is_active: !category.is_active });
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
          <Link
            to="/admin/loja"
            className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Loja
          </Link>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Categorias
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie as categorias de produtos da loja
          </p>
        </div>
        <button
          onClick={() => setShowAddForm(true)}
          className="flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-white text-brand-darker font-bold uppercase text-sm rounded-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nova Categoria
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <h3 className="text-lg font-bold text-white mb-4">Nova Categoria</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Nome</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value, slug: generateSlug(e.target.value) })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
                placeholder="Nome da categoria"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Slug</label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
                placeholder="slug-da-categoria"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Descrição</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
                placeholder="Descrição da categoria"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Ícone</label>
              <div className="flex flex-wrap gap-2">
                {ICONS.map((icon) => (
                  <button
                    key={icon}
                    onClick={() => setFormData({ ...formData, icon })}
                    className={`w-10 h-10 rounded-sm flex items-center justify-center text-sm ${
                      formData.icon === icon
                        ? 'bg-brand-yellow text-brand-darker'
                        : 'bg-brand-dark border border-white/10 text-gray-400 hover:text-white'
                    }`}
                  >
                    {icon.substring(0, 2)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Cor</label>
              <div className="flex flex-wrap gap-2">
                {COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className={`w-10 h-10 rounded-sm ${
                      formData.color === color ? 'ring-2 ring-white' : ''
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleCreate}
              className="flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-white text-brand-darker font-bold uppercase text-sm rounded-sm transition-colors"
            >
              <Check className="w-4 h-4" />
              Criar
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar categorias..."
            className="w-full bg-brand-card border border-white/10 rounded-sm py-2 pl-10 pr-4 text-white focus:outline-none focus:border-brand-yellow"
          />
        </div>
        <div className="flex bg-brand-card border border-white/10 rounded-sm overflow-hidden">
          <button
            onClick={() => setViewMode('list')}
            className={`p-2 transition-colors ${viewMode === 'list' ? 'bg-brand-yellow text-brand-darker' : 'text-gray-400 hover:text-white'}`}
            title="Modo Lista"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={() => setViewMode('card')}
            className={`p-2 transition-colors ${viewMode === 'card' ? 'bg-brand-yellow text-brand-darker' : 'text-gray-400 hover:text-white'}`}
            title="Modo Cards"
          >
            <LayoutGrid className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Categories List View */}
      {viewMode === 'list' ? (
        <div className="bg-brand-card border border-white/10 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Categoria</th>
                <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Slug</th>
                <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Descricao</th>
                <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Ordem</th>
                <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Status</th>
                <th className="text-right text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {categories
                .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase()))
                .map((category) => (
                <tr key={category.id} className={`hover:bg-white/5 ${!category.is_active ? 'opacity-50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-sm flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: `${category.color}20` }}
                      >
                        {category.icon ? (
                          <span className="text-lg">{category.icon}</span>
                        ) : (
                          <Tag className="w-5 h-5" style={{ color: category.color }} />
                        )}
                      </div>
                      <p className="text-white font-bold">{category.name}</p>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-400 text-sm">/{category.slug}</span>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-400 text-sm truncate max-w-[200px]">
                      {category.description || '-'}
                    </p>
                  </td>
                  <td className="p-4">
                    <span className="text-gray-400 text-sm">{category.display_order}</span>
                  </td>
                  <td className="p-4">
                    <button
                      onClick={() => handleToggleActive(category)}
                      className={`px-2 py-1 rounded-sm text-xs font-bold uppercase ${
                        category.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                      }`}
                    >
                      {category.is_active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => setEditingId(category.id)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(category.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhuma categoria encontrada</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Categories Card View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {categories
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((category) => (
            <div
              key={category.id}
              className={`bg-brand-card border rounded-sm overflow-hidden ${
                category.is_active ? 'border-white/10' : 'border-red-500/30 opacity-60'
              }`}
            >
              <div
                className="h-24 flex items-center justify-center"
                style={{ backgroundColor: `${category.color}20` }}
              >
                {category.icon ? (
                  <span className="text-4xl">{category.icon}</span>
                ) : (
                  <Tag className="w-12 h-12" style={{ color: category.color }} />
                )}
              </div>
              <div className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-white font-bold">{category.name}</h3>
                  <span className="text-gray-500 text-xs">/{category.slug}</span>
                </div>
                <p className="text-gray-400 text-sm truncate mb-3">
                  {category.description || 'Sem descricao'}
                </p>
                <div className="flex items-center justify-between pt-3 border-t border-white/5">
                  <button
                    onClick={() => handleToggleActive(category)}
                    className={`px-2 py-1 rounded-sm text-xs font-bold uppercase ${
                      category.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {category.is_active ? 'Ativo' : 'Inativo'}
                  </button>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => setEditingId(category.id)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {categories.filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.slug.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Tag className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma categoria encontrada</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
