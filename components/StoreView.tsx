
import React, { useState } from 'react';
import { ArrowLeft, ShoppingBag, Lock, Check, Coins } from 'lucide-react';
import { UserStats, StoreItem, StoreItemType } from '../types';
import { STORE_ITEMS } from '../constants';

interface StoreViewProps {
  stats: UserStats;
  inventory: string[]; // List of item IDs owned by user
  onBack: () => void;
  onBuy: (item: StoreItem) => void;
  onEquip: (item: StoreItem) => void;
}

const StoreView: React.FC<StoreViewProps> = ({ stats, inventory, onBack, onBuy, onEquip }) => {
  const [activeTab, setActiveTab] = useState<StoreItemType>('avatar');

  const filteredItems = STORE_ITEMS.filter(item => item.type === activeTab);

  return (
    <div className="pb-24 overflow-y-auto h-full no-scrollbar bg-[#1A1A1A] flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-gray-800 bg-[#252525] sticky top-0 z-10">
        <div className="flex items-center justify-between mb-4">
            <button onClick={onBack} className="text-gray-400 hover:text-white">
                <ArrowLeft size={24} />
            </button>
            <div className="flex items-center bg-[#1A1A1A] px-3 py-1.5 rounded-full border border-yellow-900/50">
                <Coins size={16} className="text-[#FFB800] mr-2" />
                <span className="font-bold text-[#FFB800]">{stats.coins}</span>
            </div>
        </div>
        
        <h1 className="text-2xl font-bold text-white flex items-center mb-1">
            <ShoppingBag className="mr-2 text-[#FFB800]" />
            Loja de Itens
        </h1>
        <p className="text-xs text-gray-400">Personalize seu perfil e garanta vantagens.</p>

        {/* Tabs */}
        <div className="flex space-x-2 mt-6 overflow-x-auto no-scrollbar">
            <button 
                onClick={() => setActiveTab('avatar')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'avatar' ? 'bg-[#FFB800] text-black' : 'bg-[#1A1A1A] text-gray-400 border border-gray-700'}`}
            >
                Avatares 🎭
            </button>
            <button 
                onClick={() => setActiveTab('theme')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'theme' ? 'bg-[#FFB800] text-black' : 'bg-[#1A1A1A] text-gray-400 border border-gray-700'}`}
            >
                Temas 🎨
            </button>
            <button 
                onClick={() => setActiveTab('powerup')}
                className={`px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors ${activeTab === 'powerup' ? 'bg-[#FFB800] text-black' : 'bg-[#1A1A1A] text-gray-400 border border-gray-700'}`}
            >
                Power-ups ⚡
            </button>
        </div>
      </div>

      {/* Items Grid */}
      <div className="p-4 grid grid-cols-2 gap-3">
        {filteredItems.map(item => {
            const isOwned = inventory.includes(item.id);
            const isEquipped = stats.avatarId === item.id; // Basic check for avatars
            const canAfford = stats.coins >= item.price;

            return (
                <div key={item.id} className={`bg-[#252525] p-4 rounded-xl border flex flex-col items-center text-center relative overflow-hidden ${isEquipped ? 'border-[#FFB800] bg-[#FFB800]/5' : 'border-gray-800'}`}>
                    
                    {/* Icon / Preview */}
                    <div className="w-16 h-16 bg-[#1A1A1A] rounded-full flex items-center justify-center text-3xl mb-3 shadow-inner relative">
                        {item.type === 'avatar' && item.value ? (
                            <img src={item.value} alt={item.name} className="w-full h-full rounded-full object-cover" />
                        ) : (
                            <span>{item.icon}</span>
                        )}
                        
                        {isEquipped && (
                            <div className="absolute -bottom-1 -right-1 bg-[#2ECC71] rounded-full p-1 border-2 border-[#1A1A1A]">
                                <Check size={12} className="text-black stroke-[4]" />
                            </div>
                        )}
                    </div>

                    <h3 className="font-bold text-sm text-white mb-1">{item.name}</h3>
                    <p className="text-[10px] text-gray-500 mb-4 h-8 leading-tight">{item.description}</p>

                    <div className="mt-auto w-full">
                        {isOwned ? (
                            <button 
                                onClick={() => onEquip(item)}
                                disabled={isEquipped || item.type === 'powerup'}
                                className={`w-full py-2 rounded-lg font-bold text-xs transition-colors ${
                                    isEquipped 
                                    ? 'bg-gray-700 text-gray-400 cursor-default' 
                                    : 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-600'
                                }`}
                            >
                                {isEquipped ? 'Equipado' : item.type === 'powerup' ? 'Adquirido' : 'Equipar'}
                            </button>
                        ) : (
                            <button 
                                onClick={() => onBuy(item)}
                                disabled={!canAfford}
                                className={`w-full py-2 rounded-lg font-bold text-xs flex items-center justify-center transition-colors ${
                                    canAfford 
                                    ? 'bg-[#FFB800] text-black hover:bg-[#FFC933]' 
                                    : 'bg-gray-800 text-gray-500 cursor-not-allowed'
                                }`}
                            >
                                {canAfford ? (
                                    <>
                                        <Coins size={12} className="mr-1" />
                                        {item.price}
                                    </>
                                ) : (
                                    <>
                                        <Lock size={12} className="mr-1" />
                                        {item.price}
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            )
        })}
      </div>
    </div>
  );
};

export default StoreView;
