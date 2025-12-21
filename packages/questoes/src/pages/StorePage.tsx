import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingBag, User, Palette, Zap, Lock, Check, Shield,
  Sparkles, Package, Loader2, ChevronRight, Star,
  GraduationCap, ClipboardList
} from 'lucide-react';
import { Card, Button, Modal, StaggerContainer, StaggerItem } from '../components/ui';
import { useUIStore } from '../stores';
import { useAuth } from '../hooks/useAuth';
import {
  getStoreCategories,
  getStoreProducts,
  getUserInventory,
  getUserCoins,
  purchaseWithCoins,
  StoreCategory,
  StoreItem,
  UserInventoryItem
} from '../services/storeService';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'avatares': User,
  'boosters': Zap,
  'protetores': Shield,
  'power-ups': Sparkles,
  'temas': Palette,
  'preparatorios': GraduationCap,
  'simulados': ClipboardList,
};

function StoreItemCard({
  item,
  owned,
  userCoins,
  onBuy,
}: {
  item: StoreItem;
  owned: boolean;
  userCoins: number;
  onBuy: (item: StoreItem) => void;
}) {
  const canAfford = userCoins >= item.price_coins;

  return (
    <Card hoverable={!owned} className={owned ? 'opacity-70' : ''}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#3A3A3A] flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : item.icon ? (
            <span>{item.icon}</span>
          ) : (
            <Package className="w-6 h-6 text-gray-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium truncate">{item.name}</h3>
            {item.is_featured && (
              <Star className="w-4 h-4 text-[#FFB800] flex-shrink-0" fill="currentColor" />
            )}
            {owned && (
              <span className="px-2 py-0.5 bg-[#2ECC71]/20 text-[#2ECC71] text-xs rounded-full flex-shrink-0">
                Adquirido
              </span>
            )}
          </div>
          <p className="text-[#6E6E6E] text-sm line-clamp-2">{item.description || 'Sem descricao'}</p>
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {owned ? (
            <div className="w-8 h-8 rounded-full bg-[#2ECC71]/20 flex items-center justify-center">
              <Check size={16} className="text-[#2ECC71]" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="text-xl">🪙</span>
                <span className={`font-bold ${canAfford ? 'text-[#FFB800]' : 'text-[#E74C3C]'}`}>
                  {item.price_coins.toLocaleString('pt-BR')}
                </span>
              </div>
              <Button
                size="sm"
                variant={canAfford ? 'primary' : 'secondary'}
                disabled={!canAfford}
                onClick={() => onBuy(item)}
              >
                {canAfford ? 'Comprar' : <Lock size={14} />}
              </Button>
            </>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function StorePage() {
  const { user } = useAuth();
  const { addToast } = useUIStore();

  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState(false);
  const [categories, setCategories] = useState<StoreCategory[]>([]);
  const [products, setProducts] = useState<StoreItem[]>([]);
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [userCoins, setUserCoins] = useState(0);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);

  useEffect(() => {
    loadStoreData();
  }, [user?.id]);

  const loadStoreData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [cats, prods, inv, coins] = await Promise.all([
        getStoreCategories(),
        getStoreProducts(),
        getUserInventory(user.id),
        getUserCoins(user.id),
      ]);

      // Filter only gamification-related categories
      const gamificationCategories = cats.filter(c =>
        ['avatares', 'boosters', 'protetores', 'power-ups', 'temas'].includes(c.slug)
      );

      setCategories(gamificationCategories);
      setProducts(prods.filter(p => p.is_active));
      setInventory(inv);
      setUserCoins(coins);
    } catch (error) {
      console.error('Error loading store data:', error);
      addToast('error', 'Erro ao carregar loja');
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = activeCategory === 'all'
    ? products.filter(p => {
        const cat = categories.find(c => c.id === p.category_id);
        return cat && ['avatares', 'boosters', 'protetores', 'power-ups', 'temas'].includes(cat.slug);
      })
    : products.filter(p => {
        const cat = categories.find(c => c.id === p.category_id);
        return cat?.slug === activeCategory;
      });

  const isOwned = (itemId: string) => {
    return inventory.some(inv => inv.item_id === itemId && inv.quantity > 0);
  };

  const handleBuy = (item: StoreItem) => {
    setSelectedItem(item);
  };

  const confirmPurchase = async () => {
    if (!selectedItem || !user?.id) return;

    if (userCoins < selectedItem.price_coins) {
      addToast('error', 'Moedas insuficientes');
      return;
    }

    setPurchasing(true);
    try {
      const result = await purchaseWithCoins(user.id, selectedItem.id, 1);

      if (result.success) {
        addToast('success', `${selectedItem.name} adquirido com sucesso!`);
        setSelectedItem(null);
        // Reload data to update inventory and coins
        await loadStoreData();
      } else {
        addToast('error', result.message || 'Erro ao processar compra');
      }
    } catch (error) {
      console.error('Error purchasing:', error);
      addToast('error', 'Erro ao processar compra');
    } finally {
      setPurchasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 text-[#FFB800] animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Loja</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-full">
            <span className="text-xl">🪙</span>
            <span className="text-[#FFB800] font-bold">{userCoins.toLocaleString('pt-BR')}</span>
          </div>
        </div>
        <p className="text-[#A0A0A0]">
          Personalize sua experiencia e potencialize seus estudos
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => setActiveCategory('all')}
          className={`
            flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors
            ${activeCategory === 'all'
              ? 'bg-[#FFB800] text-black'
              : 'bg-[#252525] text-white hover:bg-[#3A3A3A]'
            }
          `}
        >
          <ShoppingBag size={18} />
          <span className="font-medium">Todos</span>
        </motion.button>

        {categories.map((category) => {
          const Icon = CATEGORY_ICONS[category.slug] || Package;
          const isActive = activeCategory === category.slug;

          return (
            <motion.button
              key={category.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(category.slug)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors
                ${isActive
                  ? 'bg-[#FFB800] text-black'
                  : 'bg-[#252525] text-white hover:bg-[#3A3A3A]'
                }
              `}
            >
              {category.icon ? (
                <span className="text-lg">{category.icon}</span>
              ) : (
                <Icon size={18} />
              )}
              <span className="font-medium">{category.name}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Products List */}
      {filteredProducts.length > 0 ? (
        <StaggerContainer className="space-y-3">
          {filteredProducts.map((item) => (
            <StaggerItem key={item.id}>
              <StoreItemCard
                item={item}
                owned={isOwned(item.id)}
                userCoins={userCoins}
                onBuy={handleBuy}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="text-center py-12 text-[#6E6E6E]">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>Nenhum produto disponivel nesta categoria</p>
        </div>
      )}

      {/* Inventory Link */}
      <div className="mt-8">
        <Card
          hoverable
          onClick={() => window.location.href = '/inventario'}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3A3A3A] flex items-center justify-center">
                <Package className="w-5 h-5 text-[#FFB800]" />
              </div>
              <div>
                <h3 className="text-white font-medium">Meu Inventario</h3>
                <p className="text-[#6E6E6E] text-sm">
                  {inventory.length} {inventory.length === 1 ? 'item' : 'itens'}
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6E6E6E]" />
          </div>
        </Card>
      </div>

      {/* Purchase Confirmation Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => !purchasing && setSelectedItem(null)}
        title="Confirmar Compra"
      >
        {selectedItem && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#3A3A3A] flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {selectedItem.image_url ? (
                <img src={selectedItem.image_url} alt={selectedItem.name} className="w-full h-full object-cover" />
              ) : selectedItem.icon ? (
                <span className="text-5xl">{selectedItem.icon}</span>
              ) : (
                <Package className="w-10 h-10 text-gray-500" />
              )}
            </div>
            <h3 className="text-white text-xl font-bold mb-2">{selectedItem.name}</h3>
            <p className="text-[#A0A0A0] mb-4">{selectedItem.description}</p>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-2xl">🪙</span>
              <span className="text-[#FFB800] text-2xl font-bold">
                {selectedItem.price_coins.toLocaleString('pt-BR')}
              </span>
            </div>

            <p className="text-[#6E6E6E] text-sm mb-6">
              Saldo apos compra: {(userCoins - selectedItem.price_coins).toLocaleString('pt-BR')} moedas
            </p>

            <div className="flex gap-3">
              <Button
                fullWidth
                variant="ghost"
                onClick={() => setSelectedItem(null)}
                disabled={purchasing}
              >
                Cancelar
              </Button>
              <Button
                fullWidth
                onClick={confirmPurchase}
                disabled={purchasing || userCoins < selectedItem.price_coins}
              >
                {purchasing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  'Confirmar'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
