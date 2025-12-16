import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, User, Palette, Zap, Lock, Check } from 'lucide-react';
import { Card, Button, Modal, StaggerContainer, StaggerItem } from '../components/ui';
import { useUserStore, useUIStore } from '../stores';

type StoreCategory = 'avatars' | 'themes' | 'powerups';

interface StoreItem {
  id: string;
  name: string;
  description: string;
  price: number;
  type: StoreCategory;
  emoji: string;
  owned: boolean;
}

const STORE_ITEMS: StoreItem[] = [
  // Avatars
  { id: 'avatar_lion', name: 'Leao da Lei', description: 'Para quem domina a selva dos concursos', price: 500, type: 'avatars', emoji: '🦁', owned: false },
  { id: 'avatar_robot', name: 'Robo Focado', description: 'Programado para nao errar', price: 800, type: 'avatars', emoji: '🤖', owned: false },
  { id: 'avatar_police', name: 'Agente Federal', description: 'O distintivo ja e quase seu', price: 1200, type: 'avatars', emoji: '👮', owned: true },
  { id: 'avatar_ninja', name: 'Ninja Estudioso', description: 'Silencioso e certeiro', price: 1000, type: 'avatars', emoji: '🥷', owned: false },

  // Themes
  { id: 'theme_cyber', name: 'Cyberpunk Neon', description: 'Visual futurista roxo e azul', price: 1000, type: 'themes', emoji: '🌃', owned: false },
  { id: 'theme_darkblue', name: 'Azul Tatico', description: 'Foco total com tons de azul', price: 500, type: 'themes', emoji: '🔵', owned: true },
  { id: 'theme_forest', name: 'Floresta Zen', description: 'Tons verdes para acalmar', price: 700, type: 'themes', emoji: '🌲', owned: false },

  // Power-ups
  { id: 'freeze_streak', name: 'Congelar Ofensiva', description: 'Protege seus dias seguidos por 24h', price: 300, type: 'powerups', emoji: '❄️', owned: false },
  { id: 'double_xp', name: 'XP em Dobro', description: 'Ganhe XP em dobro por 1 hora', price: 200, type: 'powerups', emoji: '⚡', owned: false },
  { id: 'hint', name: 'Dica Extra', description: 'Remove uma alternativa errada', price: 50, type: 'powerups', emoji: '💡', owned: false },
];

const CATEGORY_INFO = {
  avatars: { icon: User, label: 'Avatares', color: '#3498DB' },
  themes: { icon: Palette, label: 'Temas', color: '#9B59B6' },
  powerups: { icon: Zap, label: 'Power-ups', color: '#F39C12' },
};

function StoreItemCard({
  item,
  onBuy,
}: {
  item: StoreItem;
  onBuy: (item: StoreItem) => void;
}) {
  const { stats } = useUserStore();
  const canAfford = stats.coins >= item.price;

  return (
    <Card
      hoverable={!item.owned}
      className={item.owned ? 'opacity-70' : ''}
    >
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-xl bg-[#3A3A3A] flex items-center justify-center text-3xl">
          {item.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="text-white font-medium">{item.name}</h3>
            {item.owned && (
              <span className="px-2 py-0.5 bg-[#2ECC71]/20 text-[#2ECC71] text-xs rounded-full">
                Adquirido
              </span>
            )}
          </div>
          <p className="text-[#6E6E6E] text-sm">{item.description}</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          {item.owned ? (
            <div className="w-8 h-8 rounded-full bg-[#2ECC71]/20 flex items-center justify-center">
              <Check size={16} className="text-[#2ECC71]" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-1">
                <span className="text-xl">💰</span>
                <span className={`font-bold ${canAfford ? 'text-[#FFB800]' : 'text-[#E74C3C]'}`}>
                  {item.price}
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
  const [activeCategory, setActiveCategory] = useState<StoreCategory>('avatars');
  const [selectedItem, setSelectedItem] = useState<StoreItem | null>(null);
  const { stats, incrementStats, addToInventory } = useUserStore();
  const { addToast } = useUIStore();

  const filteredItems = STORE_ITEMS.filter((item) => item.type === activeCategory);

  const handleBuy = (item: StoreItem) => {
    setSelectedItem(item);
  };

  const confirmPurchase = () => {
    if (!selectedItem) return;

    if (stats.coins >= selectedItem.price) {
      incrementStats({ coins: -selectedItem.price });
      addToInventory(selectedItem.id);
      addToast('success', `${selectedItem.name} adquirido com sucesso!`);
      setSelectedItem(null);
    }
  };

  return (
    <div className="p-4 pb-24">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <h1 className="text-2xl font-bold text-white">Loja</h1>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-[#252525] rounded-full">
            <span className="text-xl">💰</span>
            <span className="text-[#FFB800] font-bold">{stats.coins}</span>
          </div>
        </div>
        <p className="text-[#A0A0A0]">
          Personalize sua experiencia de estudo
        </p>
      </div>

      {/* Category Tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
        {(Object.keys(CATEGORY_INFO) as StoreCategory[]).map((category) => {
          const info = CATEGORY_INFO[category];
          const Icon = info.icon;
          const isActive = activeCategory === category;

          return (
            <motion.button
              key={category}
              whileTap={{ scale: 0.95 }}
              onClick={() => setActiveCategory(category)}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap
                transition-colors
                ${isActive
                  ? 'bg-[#FFB800] text-black'
                  : 'bg-[#252525] text-white hover:bg-[#3A3A3A]'
                }
              `}
            >
              <Icon size={18} />
              <span className="font-medium">{info.label}</span>
            </motion.button>
          );
        })}
      </div>

      {/* Items Grid */}
      <StaggerContainer className="space-y-3">
        {filteredItems.map((item) => (
          <StaggerItem key={item.id}>
            <StoreItemCard item={item} onBuy={handleBuy} />
          </StaggerItem>
        ))}
      </StaggerContainer>

      {/* Purchase Confirmation Modal */}
      <Modal
        isOpen={!!selectedItem}
        onClose={() => setSelectedItem(null)}
        title="Confirmar Compra"
      >
        {selectedItem && (
          <div className="text-center">
            <div className="w-20 h-20 rounded-2xl bg-[#3A3A3A] flex items-center justify-center text-5xl mx-auto mb-4">
              {selectedItem.emoji}
            </div>
            <h3 className="text-white text-xl font-bold mb-2">{selectedItem.name}</h3>
            <p className="text-[#A0A0A0] mb-4">{selectedItem.description}</p>

            <div className="flex items-center justify-center gap-2 mb-6">
              <span className="text-2xl">💰</span>
              <span className="text-[#FFB800] text-2xl font-bold">{selectedItem.price}</span>
            </div>

            <div className="flex gap-3">
              <Button
                fullWidth
                variant="ghost"
                onClick={() => setSelectedItem(null)}
              >
                Cancelar
              </Button>
              <Button
                fullWidth
                onClick={confirmPurchase}
              >
                Confirmar
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
