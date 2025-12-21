import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Edit,
  Trash2,
  Loader2,
  Package,
  Search,
  Star,
  Coins,
  DollarSign,
  X,
  Check,
  Upload,
  Image as ImageIcon,
  List,
  LayoutGrid,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';
import { supabase } from '../../lib/supabase';

interface StoreProduct {
  id: string;
  name: string;
  description: string | null;
  item_type: string;
  product_type: string;
  price_coins: number;
  price_real: number | null;
  icon: string | null;
  image_url: string | null;
  is_active: boolean;
  is_featured: boolean;
  category_id: string | null;
  category?: { name: string; slug: string; color: string };
}

interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  color: string;
}

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

const PRODUCT_TYPES = [
  { value: 'preparatorio', label: 'Preparatório' },
  { value: 'simulado', label: 'Simulado' },
  { value: 'mimo', label: 'Mimo' },
  { value: 'boost', label: 'Boost' },
  { value: 'externo', label: 'Externo' },
];

const ITEM_TYPES = [
  { value: 'preparatorio', label: 'Preparatório' },
  { value: 'simulado', label: 'Simulado' },
  { value: 'avatar', label: 'Avatar' },
  { value: 'theme', label: 'Tema' },
  { value: 'badge', label: 'Badge' },
  { value: 'title', label: 'Título' },
  { value: 'boost', label: 'Boost' },
  { value: 'external', label: 'Externo' },
];

export const StoreProducts: React.FC = () => {
  const toast = useToast();
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<StoreProduct | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    item_type: 'mimo',
    product_type: 'mimo',
    price_coins: 0,
    price_real: '',
    icon: '',
    image_url: '',
    is_active: true,
    is_featured: false,
    category_id: '',
  });
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [productsRes, categoriesRes] = await Promise.all([
        fetch(`${MASTRA_URL}/api/admin/store/products`),
        fetch(`${MASTRA_URL}/api/admin/store/categories`),
      ]);

      if (productsRes.ok) {
        const data = await productsRes.json();
        const prods = data?.products || data?.data || (Array.isArray(data) ? data : []);
        setProducts(prods);
      }

      if (categoriesRes.ok) {
        const data = await categoriesRes.json();
        const cats = data?.categories || data?.data || (Array.isArray(data) ? data : []);
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      item_type: 'mimo',
      product_type: 'mimo',
      price_coins: 0,
      price_real: '',
      icon: '',
      image_url: '',
      is_active: true,
      is_featured: false,
      category_id: '',
    });
    setEditingProduct(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleImageUpload = async (file: File) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo invalido. Use JPG, PNG, GIF, WebP ou SVG.');
      return;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast.error('Arquivo muito grande. Maximo: 5MB');
      return;
    }

    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `products/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

      // Upload file
      const { error: uploadError } = await supabase.storage
        .from('store-images')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        toast.error('Erro ao fazer upload da imagem');
        return;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('store-images')
        .getPublicUrl(fileName);

      setFormData({ ...formData, image_url: data.publicUrl });
      setImagePreview(data.publicUrl);
      toast.success('Imagem carregada!');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Erro ao fazer upload da imagem');
    } finally {
      setUploading(false);
    }
  };

  const handleCreate = async () => {
    if (!formData.name.trim()) {
      toast.error('Nome é obrigatório');
      return;
    }

    try {
      const response = await fetch(`${MASTRA_URL}/api/admin/store/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price_real: formData.price_real ? parseFloat(formData.price_real) : null,
          category_id: formData.category_id || null,
        }),
      });

      if (response.ok) {
        toast.success('Produto criado!');
        setShowAddModal(false);
        resetForm();
        loadData();
      } else {
        toast.error('Erro ao criar produto');
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast.error('Erro ao criar produto');
    }
  };

  const handleUpdate = async () => {
    if (!editingProduct) return;

    try {
      const response = await fetch(`${MASTRA_URL}/api/admin/store/products/${editingProduct.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          price_real: formData.price_real ? parseFloat(formData.price_real) : null,
          category_id: formData.category_id || null,
        }),
      });

      if (response.ok) {
        toast.success('Produto atualizado!');
        setShowAddModal(false);
        resetForm();
        loadData();
      } else {
        toast.error('Erro ao atualizar produto');
      }
    } catch (error) {
      console.error('Error updating product:', error);
      toast.error('Erro ao atualizar produto');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este produto?')) return;

    try {
      const response = await fetch(`${MASTRA_URL}/api/admin/store/products/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast.success('Produto excluído!');
        loadData();
      } else {
        toast.error('Erro ao excluir produto');
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      toast.error('Erro ao excluir produto');
    }
  };

  const handleEdit = (product: StoreProduct) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
      item_type: product.item_type,
      product_type: product.product_type,
      price_coins: product.price_coins,
      price_real: product.price_real?.toString() || '',
      icon: product.icon || '',
      image_url: product.image_url || '',
      is_active: product.is_active,
      is_featured: product.is_featured,
      category_id: product.category_id || '',
    });
    setImagePreview(product.image_url || null);
    setShowAddModal(true);
  };

  const handleToggleFeatured = async (product: StoreProduct) => {
    try {
      const response = await fetch(`${MASTRA_URL}/api/admin/store/products/${product.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_featured: !product.is_featured }),
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Error toggling featured:', error);
    }
  };

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || product.product_type === filterType;
    return matchesSearch && matchesType;
  });

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
            Produtos
          </h1>
          <p className="text-gray-400 mt-1">
            {products.length} produtos cadastrados
          </p>
        </div>
        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-white text-brand-darker font-bold uppercase text-sm rounded-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          Novo Produto
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar produtos..."
            className="w-full bg-brand-card border border-white/10 rounded-sm py-2 pl-10 pr-4 text-white focus:outline-none focus:border-brand-yellow"
          />
        </div>
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="bg-brand-card border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
        >
          <option value="all">Todos os tipos</option>
          {PRODUCT_TYPES.map((type) => (
            <option key={type.value} value={type.value}>{type.label}</option>
          ))}
        </select>
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

      {/* Products List View */}
      {viewMode === 'list' ? (
        <div className="bg-brand-card border border-white/10 rounded-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Produto</th>
                <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Categoria</th>
                <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Tipo</th>
                <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Preco</th>
                <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Status</th>
                <th className="text-right text-gray-400 text-xs font-bold uppercase tracking-wide p-4">Acoes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {filteredProducts.map((product) => (
                <tr key={product.id} className={`hover:bg-white/5 ${!product.is_active ? 'opacity-50' : ''}`}>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-dark rounded-sm flex items-center justify-center flex-shrink-0 overflow-hidden">
                        {product.image_url ? (
                          <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                        ) : product.icon ? (
                          <span className="text-lg">{product.icon}</span>
                        ) : (
                          <Package className="w-5 h-5 text-gray-500" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-white font-bold truncate">{product.name}</p>
                          {product.is_featured && (
                            <Star className="w-3 h-3 text-brand-yellow flex-shrink-0" fill="currentColor" />
                          )}
                        </div>
                        <p className="text-gray-500 text-xs truncate max-w-[200px]">
                          {product.description || 'Sem descricao'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    {product.category ? (
                      <span
                        className="px-2 py-1 rounded-sm text-xs font-bold"
                        style={{ backgroundColor: `${product.category.color}20`, color: product.category.color }}
                      >
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-gray-500 text-sm">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <span className="text-gray-400 text-sm uppercase">{product.product_type}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col gap-1">
                      {product.price_coins > 0 && (
                        <div className="flex items-center gap-1 text-brand-yellow text-sm">
                          <Coins className="w-3 h-3" />
                          <span className="font-bold">{product.price_coins.toLocaleString('pt-BR')}</span>
                        </div>
                      )}
                      {product.price_real && (
                        <div className="flex items-center gap-1 text-green-400 text-sm">
                          <DollarSign className="w-3 h-3" />
                          <span className="font-bold">
                            {product.price_real.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                          </span>
                        </div>
                      )}
                      {!product.price_coins && !product.price_real && (
                        <span className="text-gray-500 text-sm">-</span>
                      )}
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-sm text-xs font-bold uppercase ${
                      product.is_active ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                    }`}>
                      {product.is_active ? 'Ativo' : 'Inativo'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleToggleFeatured(product)}
                        className={`p-2 rounded-sm transition-colors ${
                          product.is_featured ? 'bg-brand-yellow/20 text-brand-yellow' : 'text-gray-400 hover:text-brand-yellow'
                        }`}
                        title={product.is_featured ? 'Remover destaque' : 'Destacar'}
                      >
                        <Star className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleEdit(product)}
                        className="p-2 text-gray-400 hover:text-white transition-colors"
                        title="Editar"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-gray-400">
                    <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>Nenhum produto encontrado</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        /* Products Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className={`bg-brand-card border rounded-sm overflow-hidden ${
                product.is_active ? 'border-white/10' : 'border-red-500/30 opacity-60'
              }`}
            >
              {/* Image/Icon */}
              <div className="h-32 bg-brand-dark flex items-center justify-center relative">
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Package className="w-12 h-12 text-gray-500" />
                )}
                {product.is_featured && (
                  <div className="absolute top-2 right-2 bg-brand-yellow text-brand-darker px-2 py-1 rounded-sm text-xs font-bold flex items-center gap-1">
                    <Star className="w-3 h-3" />
                    Destaque
                  </div>
                )}
                {product.category && (
                  <div
                    className="absolute bottom-2 left-2 px-2 py-1 rounded-sm text-xs font-bold"
                    style={{ backgroundColor: `${product.category.color}20`, color: product.category.color }}
                  >
                    {product.category.name}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-white font-bold truncate">{product.name}</h3>
                <p className="text-gray-400 text-sm truncate mt-1">
                  {product.description || 'Sem descricao'}
                </p>

                {/* Prices */}
                <div className="flex items-center gap-4 mt-3">
                  {product.price_coins > 0 && (
                    <div className="flex items-center gap-1 text-brand-yellow">
                      <Coins className="w-4 h-4" />
                      <span className="font-bold">{product.price_coins}</span>
                    </div>
                  )}
                  {product.price_real && (
                    <div className="flex items-center gap-1 text-green-400">
                      <DollarSign className="w-4 h-4" />
                      <span className="font-bold">
                        {product.price_real.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                      </span>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/5">
                  <span className="text-xs text-gray-500 uppercase">{product.product_type}</span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleFeatured(product)}
                      className={`p-2 rounded-sm transition-colors ${
                        product.is_featured
                          ? 'bg-brand-yellow/20 text-brand-yellow'
                          : 'text-gray-400 hover:text-brand-yellow'
                      }`}
                    >
                      <Star className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleEdit(product)}
                      className="p-2 text-gray-400 hover:text-white transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(product.id)}
                      className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}

          {filteredProducts.length === 0 && (
            <div className="col-span-full text-center py-12 text-gray-400">
              <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-brand-card border border-white/10 rounded-sm w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-white/10 flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Nome</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
                    placeholder="Nome do produto"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Categoria</label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
                  >
                    <option value="">Sem categoria</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Descrição</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
                  placeholder="Descrição do produto"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Tipo de Produto</label>
                  <select
                    value={formData.product_type}
                    onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
                  >
                    {PRODUCT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Tipo de Item</label>
                  <select
                    value={formData.item_type}
                    onChange={(e) => setFormData({ ...formData, item_type: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
                  >
                    {ITEM_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Preço (Moedas)</label>
                  <input
                    type="number"
                    value={formData.price_coins}
                    onChange={(e) => setFormData({ ...formData, price_coins: parseInt(e.target.value) || 0 })}
                    className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
                    placeholder="0"
                  />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Preço (R$)</label>
                  <input
                    type="text"
                    value={formData.price_real}
                    onChange={(e) => setFormData({ ...formData, price_real: e.target.value })}
                    className="w-full bg-brand-dark border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-400 uppercase mb-2">Imagem do Produto</label>
                <div className="flex gap-4">
                  <div
                    className="w-32 h-32 bg-brand-dark border border-white/10 rounded-sm flex items-center justify-center overflow-hidden cursor-pointer hover:border-brand-yellow/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    {uploading ? (
                      <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
                    ) : imagePreview || formData.image_url ? (
                      <img
                        src={imagePreview || formData.image_url}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="text-center">
                        <ImageIcon className="w-8 h-8 text-gray-500 mx-auto mb-2" />
                        <span className="text-gray-500 text-xs">Clique para enviar</span>
                      </div>
                    )}
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/gif,image/webp,image/svg+xml"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleImageUpload(file);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={uploading}
                      className="flex items-center gap-2 px-4 py-2 bg-brand-dark border border-white/10 hover:border-brand-yellow/50 text-white text-sm rounded-sm transition-colors disabled:opacity-50"
                    >
                      <Upload className="w-4 h-4" />
                      {uploading ? 'Enviando...' : 'Escolher imagem'}
                    </button>
                    <p className="text-gray-500 text-xs mt-2">
                      JPG, PNG, GIF, WebP ou SVG. Max 5MB.
                    </p>
                    {formData.image_url && (
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, image_url: '' });
                          setImagePreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = '';
                        }}
                        className="text-red-400 text-xs mt-2 hover:text-red-300 text-left"
                      >
                        Remover imagem
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-brand-dark text-brand-yellow focus:ring-brand-yellow"
                  />
                  <span className="text-white">Ativo</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.is_featured}
                    onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                    className="w-4 h-4 rounded border-white/10 bg-brand-dark text-brand-yellow focus:ring-brand-yellow"
                  />
                  <span className="text-white">Destaque</span>
                </label>
              </div>
            </div>

            <div className="p-6 border-t border-white/10 flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={editingProduct ? handleUpdate : handleCreate}
                className="flex items-center gap-2 px-4 py-2 bg-brand-yellow hover:bg-white text-brand-darker font-bold uppercase text-sm rounded-sm transition-colors"
              >
                <Check className="w-4 h-4" />
                {editingProduct ? 'Salvar' : 'Criar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
