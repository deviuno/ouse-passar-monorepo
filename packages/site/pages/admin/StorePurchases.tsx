import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowLeft,
  Loader2,
  ShoppingCart,
  Coins,
  DollarSign,
  CheckCircle,
  Clock,
  XCircle,
  Filter,
  Search,
  Calendar,
} from 'lucide-react';
import { useToast } from '../../components/ui/Toast';

interface StorePurchase {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  price_paid: number | null;
  currency: string;
  payment_status: string;
  payment_method: string | null;
  created_at: string;
  completed_at: string | null;
  item?: {
    id: string;
    name: string;
    icon: string;
    item_type: string;
  };
}

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  completed: { label: 'Concluído', color: 'green', icon: CheckCircle },
  pending: { label: 'Pendente', color: 'yellow', icon: Clock },
  refunded: { label: 'Reembolsado', color: 'red', icon: XCircle },
  cancelled: { label: 'Cancelado', color: 'gray', icon: XCircle },
};

export const StorePurchases: React.FC = () => {
  const toast = useToast();
  const [purchases, setPurchases] = useState<StorePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadPurchases();
  }, []);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${MASTRA_URL}/api/admin/store/purchases`);
      if (response.ok) {
        const data = await response.json();
        const purch = data?.purchases || data?.data || (Array.isArray(data) ? data : []);
        setPurchases(purch);
      }
    } catch (error) {
      console.error('Error loading purchases:', error);
      toast.error('Erro ao carregar compras');
    } finally {
      setLoading(false);
    }
  };

  const filteredPurchases = purchases.filter((purchase) => {
    const matchesStatus = filterStatus === 'all' || purchase.payment_status === filterStatus;
    const matchesSearch =
      searchTerm === '' ||
      purchase.item?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      purchase.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalRevenue = purchases
    .filter((p) => p.payment_status === 'completed' && p.currency === 'BRL')
    .reduce((sum, p) => sum + (p.price_paid || 0), 0);

  const totalCoins = purchases
    .filter((p) => p.payment_status === 'completed' && p.currency === 'COINS')
    .reduce((sum, p) => sum + (p.price_paid || 0), 0);

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
      <div>
        <Link
          to="/admin/loja"
          className="text-gray-400 hover:text-white flex items-center mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Loja
        </Link>
        <h1 className="text-3xl font-black text-white uppercase tracking-tight">
          Pedidos
        </h1>
        <p className="text-gray-400 mt-1">
          Histórico de compras da loja
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-brand-card border border-white/10 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total de Pedidos</p>
              <p className="text-2xl font-black text-white">{purchases.length}</p>
            </div>
            <ShoppingCart className="w-8 h-8 text-blue-500" />
          </div>
        </div>
        <div className="bg-brand-card border border-white/10 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Receita (R$)</p>
              <p className="text-2xl font-black text-green-400">
                {totalRevenue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <DollarSign className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-brand-card border border-white/10 rounded-sm p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Moedas Gastas</p>
              <p className="text-2xl font-black text-brand-yellow">
                {totalCoins.toLocaleString('pt-BR')}
              </p>
            </div>
            <Coins className="w-8 h-8 text-brand-yellow" />
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por produto ou ID..."
            className="w-full bg-brand-card border border-white/10 rounded-sm py-2 pl-10 pr-4 text-white focus:outline-none focus:border-brand-yellow"
          />
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-brand-card border border-white/10 rounded-sm py-2 px-4 text-white focus:outline-none focus:border-brand-yellow"
        >
          <option value="all">Todos os status</option>
          <option value="completed">Concluídos</option>
          <option value="pending">Pendentes</option>
          <option value="refunded">Reembolsados</option>
        </select>
      </div>

      {/* Purchases List */}
      <div className="bg-brand-card border border-white/10 rounded-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-white/10">
              <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">
                Produto
              </th>
              <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">
                Valor
              </th>
              <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">
                Status
              </th>
              <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">
                Método
              </th>
              <th className="text-left text-gray-400 text-xs font-bold uppercase tracking-wide p-4">
                Data
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredPurchases.map((purchase) => {
              const statusConfig = STATUS_CONFIG[purchase.payment_status] || STATUS_CONFIG.pending;
              const StatusIcon = statusConfig.icon;

              return (
                <tr key={purchase.id} className="hover:bg-white/5">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-brand-dark rounded-sm flex items-center justify-center">
                        {purchase.currency === 'COINS' ? (
                          <Coins className="w-5 h-5 text-brand-yellow" />
                        ) : (
                          <DollarSign className="w-5 h-5 text-green-500" />
                        )}
                      </div>
                      <div>
                        <p className="text-white font-bold">
                          {purchase.item?.name || 'Produto removido'}
                        </p>
                        <p className="text-gray-500 text-xs">
                          {purchase.item?.item_type || 'N/A'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <p className={`font-bold ${purchase.currency === 'COINS' ? 'text-brand-yellow' : 'text-green-400'}`}>
                      {purchase.currency === 'COINS'
                        ? `${purchase.price_paid} moedas`
                        : (purchase.price_paid || 0).toLocaleString('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          })}
                    </p>
                    {purchase.quantity > 1 && (
                      <p className="text-gray-500 text-xs">Qtd: {purchase.quantity}</p>
                    )}
                  </td>
                  <td className="p-4">
                    <span
                      className={`inline-flex items-center gap-1 px-2 py-1 rounded-sm text-xs font-bold bg-${statusConfig.color}-500/20 text-${statusConfig.color}-400`}
                      style={{
                        backgroundColor: `var(--${statusConfig.color === 'yellow' ? 'brand-yellow' : statusConfig.color}-500, ${statusConfig.color === 'green' ? '#22c55e' : statusConfig.color === 'yellow' ? '#eab308' : statusConfig.color === 'red' ? '#ef4444' : '#6b7280'})20`,
                        color: statusConfig.color === 'green' ? '#4ade80' : statusConfig.color === 'yellow' ? '#facc15' : statusConfig.color === 'red' ? '#f87171' : '#9ca3af',
                      }}
                    >
                      <StatusIcon className="w-3 h-3" />
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="p-4">
                    <p className="text-gray-400 text-sm">
                      {purchase.payment_method || '-'}
                    </p>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2 text-gray-400 text-sm">
                      <Calendar className="w-4 h-4" />
                      {new Date(purchase.created_at).toLocaleDateString('pt-BR', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                </tr>
              );
            })}

            {filteredPurchases.length === 0 && (
              <tr>
                <td colSpan={5} className="p-12 text-center text-gray-400">
                  <ShoppingCart className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Nenhuma compra encontrada</p>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
