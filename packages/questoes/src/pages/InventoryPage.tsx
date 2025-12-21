import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package, User, Zap, Shield, Sparkles, Palette,
  Loader2, Check, ChevronRight, Clock, AlertCircle,
  ShoppingBag, Play, Pause
} from 'lucide-react';
import { Card, Button, Modal, StaggerContainer, StaggerItem } from '../components/ui';
import { useUIStore } from '../stores';
import { useAuth } from '../hooks/useAuth';
import {
  getUserInventory,
  getUserActiveBoosts,
  equipItem,
  useBoost,
  usePowerUp,
  UserInventoryItem,
  UserBoost,
  StoreItem
} from '../services/storeService';

const CATEGORY_ICONS: Record<string, React.ElementType> = {
  'avatar': User,
  'boost': Zap,
  'powerup': Sparkles,
  'theme': Palette,
};

const ITEM_TYPE_LABELS: Record<string, string> = {
  'avatar': 'Avatar',
  'boost': 'Booster',
  'powerup': 'Power-up',
  'theme': 'Tema',
};

function InventoryItemCard({
  inventoryItem,
  onUse,
  onEquip,
  isEquipped,
  isActive,
}: {
  inventoryItem: UserInventoryItem;
  onUse: (item: UserInventoryItem) => void;
  onEquip: (item: UserInventoryItem) => void;
  isEquipped: boolean;
  isActive: boolean;
}) {
  const item = inventoryItem.item;
  if (!item) return null;

  const Icon = CATEGORY_ICONS[item.item_type] || Package;
  const isExpired = inventoryItem.expires_at && new Date(inventoryItem.expires_at) < new Date();
  const isConsumable = item.item_type === 'boost' || item.item_type === 'powerup';
  const canUse = !isExpired && inventoryItem.quantity > 0;

  return (
    <Card className={`${isExpired ? 'opacity-50' : ''} ${isEquipped || isActive ? 'ring-2 ring-[#FFB800]' : ''}`}>
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#3A3A3A] flex items-center justify-center text-3xl overflow-hidden flex-shrink-0">
          {item.image_url ? (
            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
          ) : item.icon ? (
            <span>{item.icon}</span>
          ) : (
            <Icon className="w-6 h-6 text-gray-500" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="text-white font-medium">{item.name}</h3>
            <span className="px-2 py-0.5 bg-[#3A3A3A] text-[#A0A0A0] text-xs rounded-full">
              {ITEM_TYPE_LABELS[item.item_type] || item.item_type}
            </span>
            {isEquipped && (
              <span className="px-2 py-0.5 bg-[#FFB800]/20 text-[#FFB800] text-xs rounded-full flex items-center gap-1">
                <Check size={10} /> Equipado
              </span>
            )}
            {isActive && (
              <span className="px-2 py-0.5 bg-[#2ECC71]/20 text-[#2ECC71] text-xs rounded-full flex items-center gap-1">
                <Play size={10} /> Ativo
              </span>
            )}
          </div>
          <p className="text-[#6E6E6E] text-sm line-clamp-2 mt-1">
            {item.description || 'Sem descricao'}
          </p>

          {isConsumable && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-[#A0A0A0] text-xs">
                Quantidade: <span className="text-white font-medium">{inventoryItem.quantity}</span>
              </span>
            </div>
          )}

          {inventoryItem.expires_at && (
            <div className="flex items-center gap-1 mt-2 text-xs">
              <Clock size={12} className={isExpired ? 'text-[#E74C3C]' : 'text-[#A0A0A0]'} />
              <span className={isExpired ? 'text-[#E74C3C]' : 'text-[#A0A0A0]'}>
                {isExpired
                  ? 'Expirado'
                  : `Expira em ${new Date(inventoryItem.expires_at).toLocaleDateString('pt-BR')}`
                }
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-col items-end gap-2 flex-shrink-0">
          {item.item_type === 'avatar' && !isEquipped && canUse && (
            <Button size="sm" variant="primary" onClick={() => onEquip(inventoryItem)}>
              Equipar
            </Button>
          )}
          {item.item_type === 'theme' && !isEquipped && canUse && (
            <Button size="sm" variant="primary" onClick={() => onEquip(inventoryItem)}>
              Aplicar
            </Button>
          )}
          {isConsumable && canUse && !isActive && (
            <Button size="sm" variant="primary" onClick={() => onUse(inventoryItem)}>
              Usar
            </Button>
          )}
          {isEquipped && (
            <div className="w-8 h-8 rounded-full bg-[#FFB800]/20 flex items-center justify-center">
              <Check size={16} className="text-[#FFB800]" />
            </div>
          )}
        </div>
      </div>
    </Card>
  );
}

function ActiveBoostCard({ boost }: { boost: UserBoost }) {
  const timeRemaining = new Date(boost.expires_at).getTime() - Date.now();
  const hoursRemaining = Math.max(0, Math.floor(timeRemaining / (1000 * 60 * 60)));
  const minutesRemaining = Math.max(0, Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60)));

  return (
    <div className="flex items-center gap-3 p-3 bg-[#252525] rounded-xl">
      <div className="w-10 h-10 rounded-lg bg-[#FFB800]/20 flex items-center justify-center">
        <Zap className="w-5 h-5 text-[#FFB800]" />
      </div>
      <div className="flex-1">
        <p className="text-white font-medium text-sm">
          {boost.boost_type === 'xp' ? 'XP Boost' : 'Coin Boost'} x{boost.multiplier}
        </p>
        <p className="text-[#6E6E6E] text-xs">
          {hoursRemaining > 0 ? `${hoursRemaining}h ${minutesRemaining}min restantes` : `${minutesRemaining}min restantes`}
        </p>
      </div>
      <div className="px-2 py-1 bg-[#2ECC71]/20 rounded-full">
        <span className="text-[#2ECC71] text-xs font-medium">Ativo</span>
      </div>
    </div>
  );
}

export default function InventoryPage() {
  const { user } = useAuth();
  const { addToast } = useUIStore();

  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [inventory, setInventory] = useState<UserInventoryItem[]>([]);
  const [activeBoosts, setActiveBoosts] = useState<UserBoost[]>([]);
  const [selectedItem, setSelectedItem] = useState<UserInventoryItem | null>(null);
  const [actionType, setActionType] = useState<'use' | 'equip' | null>(null);
  const [activeTab, setActiveTab] = useState<string>('all');

  useEffect(() => {
    loadInventoryData();
  }, [user?.id]);

  const loadInventoryData = async () => {
    if (!user?.id) return;

    setLoading(true);
    try {
      const [inv, boosts] = await Promise.all([
        getUserInventory(user.id),
        getUserActiveBoosts(user.id),
      ]);

      setInventory(inv.filter(i => i.quantity > 0));
      setActiveBoosts(boosts.filter(b => b.is_active && new Date(b.expires_at) > new Date()));
    } catch (error) {
      console.error('Error loading inventory:', error);
      addToast('error', 'Erro ao carregar inventario');
    } finally {
      setLoading(false);
    }
  };

  const handleUse = (inventoryItem: UserInventoryItem) => {
    setSelectedItem(inventoryItem);
    setActionType('use');
  };

  const handleEquip = (inventoryItem: UserInventoryItem) => {
    setSelectedItem(inventoryItem);
    setActionType('equip');
  };

  const confirmAction = async () => {
    if (!selectedItem || !user?.id || !actionType) return;

    setProcessing(true);
    try {
      if (actionType === 'equip') {
        const result = await equipItem(user.id, selectedItem.id);
        if (result.success) {
          addToast('success', `${selectedItem.item?.name} equipado com sucesso!`);
          await loadInventoryData();
        } else {
          addToast('error', result.message || 'Erro ao equipar item');
        }
      } else if (actionType === 'use') {
        const item = selectedItem.item;
        if (!item) return;

        if (item.item_type === 'boost') {
          const result = await useBoost(user.id, selectedItem.id);
          if (result.success) {
            addToast('success', `${item.name} ativado com sucesso!`);
            await loadInventoryData();
          } else {
            addToast('error', result.message || 'Erro ao ativar boost');
          }
        } else if (item.item_type === 'powerup') {
          // Get power-up type from metadata
          const powerUpType = item.metadata?.effect || item.metadata?.type || 'generic';
          const result = await usePowerUp(user.id, selectedItem.id, powerUpType);
          if (result.success) {
            addToast('success', `${item.name} usado com sucesso!`);
            if (result.remainingUses !== undefined && result.remainingUses > 0) {
              addToast('info', `Usos restantes: ${result.remainingUses}`);
            }
            await loadInventoryData();
          } else {
            addToast('error', result.message || 'Erro ao usar power-up');
          }
        }
      }
    } catch (error) {
      console.error('Error processing action:', error);
      addToast('error', 'Erro ao processar acao');
    } finally {
      setProcessing(false);
      setSelectedItem(null);
      setActionType(null);
    }
  };

  const getEquippedItemId = (itemType: string): string | null => {
    const equipped = inventory.find(inv =>
      inv.item?.item_type === itemType && inv.is_equipped
    );
    return equipped?.item_id || null;
  };

  const isBoostActive = (inventoryItem: UserInventoryItem): boolean => {
    if (inventoryItem.item?.item_type !== 'boost') return false;
    return activeBoosts.some(b =>
      b.boost_type === inventoryItem.item?.metadata?.boost_type
    );
  };

  const filterInventory = (tab: string) => {
    if (tab === 'all') return inventory;
    return inventory.filter(inv => inv.item?.item_type === tab);
  };

  const filteredInventory = filterInventory(activeTab);

  const itemTypes = ['all', ...new Set(inventory.map(inv => inv.item?.item_type).filter(Boolean))] as string[];

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
        <h1 className="text-2xl font-bold text-white mb-2">Meu Inventario</h1>
        <p className="text-[#A0A0A0]">
          Gerencie seus itens e equipamentos
        </p>
      </div>

      {/* Active Boosts */}
      {activeBoosts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-white font-medium mb-3 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FFB800]" />
            Boosts Ativos
          </h2>
          <div className="space-y-2">
            {activeBoosts.map((boost) => (
              <ActiveBoostCard key={boost.id} boost={boost} />
            ))}
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2 scrollbar-hide">
        {itemTypes.map((type) => {
          const Icon = type === 'all' ? Package : (CATEGORY_ICONS[type] || Package);
          const label = type === 'all' ? 'Todos' : (ITEM_TYPE_LABELS[type] || type);
          const count = type === 'all'
            ? inventory.length
            : inventory.filter(inv => inv.item?.item_type === type).length;

          return (
            <motion.button
              key={type}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveTab(type)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-colors
                ${activeTab === type
                  ? 'bg-[#FFB800] text-black'
                  : 'bg-[#252525] text-white hover:bg-[#3A3A3A]'
                }
              `}
            >
              <Icon size={18} />
              <span className="font-medium">{label}</span>
              <span className={`
                px-1.5 py-0.5 rounded-full text-xs
                ${activeTab === type ? 'bg-black/20' : 'bg-[#3A3A3A]'}
              `}>
                {count}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Inventory List */}
      {filteredInventory.length > 0 ? (
        <StaggerContainer className="space-y-3">
          {filteredInventory.map((inventoryItem) => (
            <StaggerItem key={inventoryItem.id}>
              <InventoryItemCard
                inventoryItem={inventoryItem}
                onUse={handleUse}
                onEquip={handleEquip}
                isEquipped={inventoryItem.is_equipped}
                isActive={isBoostActive(inventoryItem)}
              />
            </StaggerItem>
          ))}
        </StaggerContainer>
      ) : (
        <div className="text-center py-12 text-[#6E6E6E]">
          <Package className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p className="mb-4">
            {activeTab === 'all'
              ? 'Seu inventario esta vazio'
              : `Nenhum item do tipo ${ITEM_TYPE_LABELS[activeTab] || activeTab}`
            }
          </p>
          <Button
            variant="primary"
            onClick={() => window.location.href = '/loja'}
          >
            <ShoppingBag size={16} className="mr-2" />
            Ir para a Loja
          </Button>
        </div>
      )}

      {/* Store Link */}
      <div className="mt-8">
        <Card
          hoverable
          onClick={() => window.location.href = '/loja'}
          className="cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#3A3A3A] flex items-center justify-center">
                <ShoppingBag className="w-5 h-5 text-[#FFB800]" />
              </div>
              <div>
                <h3 className="text-white font-medium">Loja</h3>
                <p className="text-[#6E6E6E] text-sm">
                  Adquira novos itens e power-ups
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-[#6E6E6E]" />
          </div>
        </Card>
      </div>

      {/* Action Confirmation Modal */}
      <Modal
        isOpen={!!selectedItem && !!actionType}
        onClose={() => !processing && (setSelectedItem(null), setActionType(null))}
        title={actionType === 'equip' ? 'Equipar Item' : 'Usar Item'}
      >
        {selectedItem && selectedItem.item && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#3A3A3A] flex items-center justify-center mx-auto mb-4 overflow-hidden">
              {selectedItem.item.image_url ? (
                <img src={selectedItem.item.image_url} alt={selectedItem.item.name} className="w-full h-full object-cover" />
              ) : selectedItem.item.icon ? (
                <span className="text-5xl">{selectedItem.item.icon}</span>
              ) : (
                <Package className="w-10 h-10 text-gray-500" />
              )}
            </div>
            <h3 className="text-white text-xl font-bold mb-2">{selectedItem.item.name}</h3>
            <p className="text-[#A0A0A0] mb-4">{selectedItem.item.description}</p>

            {actionType === 'use' && selectedItem.item.item_type === 'boost' && (
              <div className="bg-[#252525] rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-[#FFB800] mb-2">
                  <Zap size={16} />
                  <span className="font-medium">Efeito do Boost</span>
                </div>
                <p className="text-[#A0A0A0] text-sm">
                  {selectedItem.item.metadata?.boost_type === 'xp'
                    ? `Ganhe ${selectedItem.item.metadata?.multiplier || 2}x mais XP por ${selectedItem.item.metadata?.duration_hours || 1} hora(s)`
                    : `Ganhe ${selectedItem.item.metadata?.multiplier || 2}x mais moedas por ${selectedItem.item.metadata?.duration_hours || 1} hora(s)`
                  }
                </p>
              </div>
            )}

            {actionType === 'use' && selectedItem.item.item_type === 'powerup' && (
              <div className="bg-[#252525] rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 text-[#2ECC71] mb-2">
                  <Sparkles size={16} />
                  <span className="font-medium">Efeito do Power-up</span>
                </div>
                <p className="text-[#A0A0A0] text-sm">
                  {selectedItem.item.metadata?.effect === 'streak_freeze'
                    ? 'Protege sua ofensiva por 1 dia caso voce nao estude'
                    : selectedItem.item.metadata?.effect === 'hint'
                    ? 'Revela uma dica para a questao atual'
                    : selectedItem.item.metadata?.effect === 'skip'
                    ? 'Pula a questao atual sem perder pontos'
                    : selectedItem.item.metadata?.effect === 'reveal'
                    ? 'Revela a resposta correta da questao'
                    : 'Aplica um efeito especial'
                  }
                </p>
              </div>
            )}

            {actionType === 'use' && (
              <div className="flex items-center justify-center gap-2 text-[#A0A0A0] text-sm mb-6">
                <AlertCircle size={14} />
                <span>
                  Quantidade atual: {selectedItem.quantity} | Apos uso: {selectedItem.quantity - 1}
                </span>
              </div>
            )}

            <div className="flex gap-3">
              <Button
                fullWidth
                variant="ghost"
                onClick={() => {
                  setSelectedItem(null);
                  setActionType(null);
                }}
                disabled={processing}
              >
                Cancelar
              </Button>
              <Button
                fullWidth
                onClick={confirmAction}
                disabled={processing}
              >
                {processing ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : actionType === 'equip' ? (
                  'Equipar'
                ) : (
                  'Usar'
                )}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
