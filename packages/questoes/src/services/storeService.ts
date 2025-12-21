import { supabase } from './supabaseClient';

const MASTRA_URL = import.meta.env.VITE_MASTRA_URL || 'http://localhost:4000';

export interface StoreCategory {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string;
  color: string;
  display_order: number;
  is_active: boolean;
}

export interface StoreItem {
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
  metadata: Record<string, any>;
  category?: StoreCategory;
}

export interface UserInventoryItem {
  id: string;
  user_id: string;
  item_id: string;
  quantity: number;
  is_equipped: boolean;
  acquired_at: string;
  expires_at: string | null;
  item?: StoreItem;
}

export interface UserBoost {
  id: string;
  user_id: string;
  boost_type: string;
  multiplier: number;
  started_at: string;
  expires_at: string;
  is_active: boolean;
}

// Fetch store categories
export async function getStoreCategories(): Promise<StoreCategory[]> {
  try {
    const response = await fetch(`${MASTRA_URL}/api/store/categories`);
    if (!response.ok) throw new Error('Failed to fetch categories');
    const data = await response.json();
    return data?.categories || data || [];
  } catch (error) {
    console.error('Error fetching store categories:', error);
    return [];
  }
}

// Fetch store products
export async function getStoreProducts(categorySlug?: string): Promise<StoreItem[]> {
  try {
    const url = categorySlug
      ? `${MASTRA_URL}/api/store/products?category=${categorySlug}`
      : `${MASTRA_URL}/api/store/products`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch products');
    const data = await response.json();
    return data?.products || data || [];
  } catch (error) {
    console.error('Error fetching store products:', error);
    return [];
  }
}

// Fetch featured products
export async function getFeaturedProducts(): Promise<StoreItem[]> {
  try {
    const response = await fetch(`${MASTRA_URL}/api/store/featured`);
    if (!response.ok) throw new Error('Failed to fetch featured products');
    const data = await response.json();
    return data?.products || data || [];
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

// Get user inventory
export async function getUserInventory(userId: string): Promise<UserInventoryItem[]> {
  try {
    const response = await fetch(`${MASTRA_URL}/api/store/inventory/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch inventory');
    const data = await response.json();
    return data?.inventory || data || [];
  } catch (error) {
    console.error('Error fetching user inventory:', error);
    return [];
  }
}

// Get user active boosts
export async function getUserActiveBoosts(userId: string): Promise<UserBoost[]> {
  try {
    const response = await fetch(`${MASTRA_URL}/api/store/boosts/${userId}`);
    if (!response.ok) throw new Error('Failed to fetch boosts');
    const data = await response.json();
    return data?.boosts || data || [];
  } catch (error) {
    console.error('Error fetching user boosts:', error);
    return [];
  }
}

// Purchase item with coins
export async function purchaseWithCoins(
  userId: string,
  itemId: string,
  quantity: number = 1
): Promise<{ success: boolean; message?: string; purchase?: any }> {
  try {
    const response = await fetch(`${MASTRA_URL}/api/store/purchase/coins`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, itemId, quantity }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Erro ao processar compra' };
    }

    return { success: true, purchase: data.purchase };
  } catch (error) {
    console.error('Error purchasing item:', error);
    return { success: false, message: 'Erro de conexao' };
  }
}

// Equip item (for avatars, themes, etc.)
export async function equipItem(
  userId: string,
  inventoryId: string
): Promise<{ success: boolean; message?: string }> {
  try {
    const response = await fetch(`${MASTRA_URL}/api/store/inventory/${inventoryId}/equip`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Erro ao equipar item' };
    }

    return { success: true };
  } catch (error) {
    console.error('Error equipping item:', error);
    return { success: false, message: 'Erro de conexao' };
  }
}

// Use boost item
export async function useBoost(
  userId: string,
  boostId: string
): Promise<{ success: boolean; message?: string; boost?: UserBoost }> {
  try {
    const response = await fetch(`${MASTRA_URL}/api/store/boosts/${boostId}/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Erro ao usar boost' };
    }

    return { success: true, boost: data.boost };
  } catch (error) {
    console.error('Error using boost:', error);
    return { success: false, message: 'Erro de conexao' };
  }
}

// Use power-up (streak freeze, reveal, skip, hint)
export async function usePowerUp(
  userId: string,
  inventoryId: string,
  powerUpType: string
): Promise<{ success: boolean; message?: string; remainingUses?: number }> {
  try {
    const response = await fetch(`${MASTRA_URL}/api/store/powerup/use`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, inventoryId, powerUpType }),
    });

    const data = await response.json();

    if (!response.ok) {
      return { success: false, message: data.error || 'Erro ao usar power-up' };
    }

    return { success: true, remainingUses: data.remainingUses };
  } catch (error) {
    console.error('Error using power-up:', error);
    return { success: false, message: 'Erro de conexao' };
  }
}

// Get user's coin balance (from gamification)
export async function getUserCoins(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_gamification')
      .select('coins')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('Error fetching user coins:', error);
      return 0;
    }

    return data?.coins || 0;
  } catch (error) {
    console.error('Error fetching user coins:', error);
    return 0;
  }
}

// Check if user owns an item
export async function checkOwnership(userId: string, itemId: string): Promise<boolean> {
  try {
    const inventory = await getUserInventory(userId);
    return inventory.some(inv => inv.item_id === itemId && inv.quantity > 0);
  } catch (error) {
    console.error('Error checking ownership:', error);
    return false;
  }
}

// Get category icon component name based on slug
export function getCategoryIcon(slug: string): string {
  const icons: Record<string, string> = {
    'avatares': 'User',
    'boosters': 'Zap',
    'protetores': 'Shield',
    'power-ups': 'Sparkles',
    'temas': 'Palette',
    'preparatorios': 'GraduationCap',
    'simulados': 'ClipboardList',
  };
  return icons[slug] || 'Package';
}
