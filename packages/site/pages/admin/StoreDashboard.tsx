import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  ShoppingCart,
  DollarSign,
  Loader2,
  Tag,
  ArrowRight,
  Coins,
  BookOpen,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

interface StoreStats {
  totalProducts: number;
  totalPurchases: number;
  totalRevenue: number;
  recentPurchases: any[];
}

interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  icon: string;
  color: string;
  is_active: boolean;
}

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

export const StoreDashboard: React.FC = () => {
  const toast = useToast();
  const [stats, setStats] = useState<StoreStats | null>(null);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsRes, categoriesRes] = await Promise.all([
        fetch(`${MASTRA_URL}/api/admin/store/stats`),
        fetch(`${MASTRA_URL}/api/admin/store/categories`),
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        // Extrair array de categorias da resposta
        const cats = categoriesData?.categories || categoriesData?.data || (Array.isArray(categoriesData) ? categoriesData : []);
        setCategories(cats);
      }
    } catch (error) {
      console.error('Error loading store data:', error);
      toast.error('Erro ao carregar dados da loja');
    } finally {
      setLoading(false);
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
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-white uppercase tracking-tight">
            Loja
          </h1>
          <p className="text-gray-400 mt-1">
            Gerencie produtos, categorias e acompanhe vendas
          </p>
        </div>
        <Link
          to="/admin/loja/documentacao"
          className="flex items-center gap-2 px-4 py-2 bg-brand-card border border-white/10 hover:border-brand-yellow/50 text-white font-bold uppercase text-sm rounded-sm transition-colors"
        >
          <BookOpen className="w-4 h-4" />
          Documentacao
        </Link>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Produtos</p>
              <p className="text-3xl font-black text-white mt-1">{stats?.totalProducts || 0}</p>
            </div>
            <div className="w-12 h-12 bg-blue-500/20 rounded-sm flex items-center justify-center">
              <Package className="w-6 h-6 text-blue-500" />
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Compras</p>
              <p className="text-3xl font-black text-white mt-1">{stats?.totalPurchases || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-500/20 rounded-sm flex items-center justify-center">
              <ShoppingCart className="w-6 h-6 text-green-500" />
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Receita (R$)</p>
              <p className="text-3xl font-black text-white mt-1">
                {(stats?.totalRevenue || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <div className="w-12 h-12 bg-brand-yellow/20 rounded-sm flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-brand-yellow" />
            </div>
          </div>
        </div>

        <div className="bg-brand-card border border-white/10 rounded-sm p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm uppercase tracking-wide">Categorias</p>
              <p className="text-3xl font-black text-white mt-1">{categories.length}</p>
            </div>
            <div className="w-12 h-12 bg-purple-500/20 rounded-sm flex items-center justify-center">
              <Tag className="w-6 h-6 text-purple-500" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Link
          to="/admin/loja/categorias"
          className="bg-brand-card border border-white/10 rounded-sm p-6 hover:border-brand-yellow/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-purple-500/20 rounded-sm flex items-center justify-center">
                <Tag className="w-6 h-6 text-purple-500" />
              </div>
              <div>
                <h3 className="text-white font-bold">Categorias</h3>
                <p className="text-gray-400 text-sm">{categories.length} categorias</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-yellow transition-colors" />
          </div>
        </Link>

        <Link
          to="/admin/loja/produtos"
          className="bg-brand-card border border-white/10 rounded-sm p-6 hover:border-brand-yellow/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/20 rounded-sm flex items-center justify-center">
                <Package className="w-6 h-6 text-blue-500" />
              </div>
              <div>
                <h3 className="text-white font-bold">Produtos</h3>
                <p className="text-gray-400 text-sm">{stats?.totalProducts || 0} produtos</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-yellow transition-colors" />
          </div>
        </Link>

        <Link
          to="/admin/loja/pedidos"
          className="bg-brand-card border border-white/10 rounded-sm p-6 hover:border-brand-yellow/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-500/20 rounded-sm flex items-center justify-center">
                <ShoppingCart className="w-6 h-6 text-green-500" />
              </div>
              <div>
                <h3 className="text-white font-bold">Pedidos</h3>
                <p className="text-gray-400 text-sm">{stats?.totalPurchases || 0} compras</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-yellow transition-colors" />
          </div>
        </Link>

        <Link
          to="/admin/loja/documentacao"
          className="bg-brand-card border border-white/10 rounded-sm p-6 hover:border-brand-yellow/50 transition-colors group"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500/20 rounded-sm flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-orange-500" />
              </div>
              <div>
                <h3 className="text-white font-bold">Documentacao</h3>
                <p className="text-gray-400 text-sm">Guia de recursos</p>
              </div>
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-brand-yellow transition-colors" />
          </div>
        </Link>
      </div>

      {/* Categories Overview */}
      <div className="bg-brand-card border border-white/10 rounded-sm">
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white uppercase">Categorias</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <div
                key={category.id}
                className="bg-brand-dark/50 border border-white/5 rounded-sm p-4 text-center"
              >
                <div
                  className="w-12 h-12 rounded-sm flex items-center justify-center mx-auto mb-3"
                  style={{ backgroundColor: `${category.color}20` }}
                >
                  <span className="text-2xl">{category.icon}</span>
                </div>
                <p className="text-white font-bold text-sm">{category.name}</p>
                <span
                  className={`text-xs px-2 py-1 rounded-full mt-2 inline-block ${
                    category.is_active
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {category.is_active ? 'Ativo' : 'Inativo'}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Purchases */}
      <div className="bg-brand-card border border-white/10 rounded-sm">
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
          <h2 className="text-xl font-bold text-white uppercase">Compras Recentes</h2>
          <Link
            to="/admin/loja/pedidos"
            className="text-brand-yellow text-sm font-bold hover:text-white transition-colors"
          >
            Ver todas
          </Link>
        </div>
        <div className="p-6">
          {stats?.recentPurchases && stats.recentPurchases.length > 0 ? (
            <div className="space-y-4">
              {stats.recentPurchases.slice(0, 5).map((purchase: any) => (
                <div
                  key={purchase.id}
                  className="flex items-center justify-between p-4 bg-brand-dark/50 border border-white/5 rounded-sm"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-brand-yellow/20 rounded-sm flex items-center justify-center">
                      {purchase.currency === 'COINS' ? (
                        <Coins className="w-5 h-5 text-brand-yellow" />
                      ) : (
                        <DollarSign className="w-5 h-5 text-green-500" />
                      )}
                    </div>
                    <div>
                      <p className="text-white font-bold">{purchase.item?.name || 'Produto'}</p>
                      <p className="text-gray-400 text-sm">
                        {new Date(purchase.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold">
                      {purchase.currency === 'COINS'
                        ? `${purchase.price_paid} moedas`
                        : (purchase.price_paid || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                    </p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        purchase.payment_status === 'completed'
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-yellow-500/20 text-yellow-400'
                      }`}
                    >
                      {purchase.payment_status === 'completed' ? 'Concluído' : 'Pendente'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-400">
              <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Nenhuma compra realizada ainda</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
