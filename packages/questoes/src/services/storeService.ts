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
    const { data, error } = await supabase
      .from('store_categories')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching store categories:', error);
      return [];
    }

    return (data || []).map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      icon: cat.icon,
      color: cat.color,
      display_order: cat.display_order,
      is_active: cat.is_active,
    }));
  } catch (error) {
    console.error('Error fetching store categories:', error);
    return [];
  }
}

// Fetch store products
export async function getStoreProducts(categorySlug?: string): Promise<StoreItem[]> {
  try {
    let query = supabase
      .from('store_items')
      .select('*')
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    // If category slug is provided, filter by category
    if (categorySlug) {
      const { data: catData } = await supabase
        .from('store_categories')
        .select('id')
        .eq('slug', categorySlug)
        .single();

      if (catData) {
        query = query.eq('category_id', catData.id);
      }
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching store products:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      item_type: item.item_type,
      product_type: item.product_type || item.item_type,
      price_coins: item.price_coins || 0,
      price_real: item.price_real,
      icon: item.icon,
      image_url: item.image_url,
      is_active: item.is_active,
      is_featured: item.is_featured || false,
      category_id: item.category_id,
      metadata: item.metadata || {},
    }));
  } catch (error) {
    console.error('Error fetching store products:', error);
    return [];
  }
}

// Fetch featured products
export async function getFeaturedProducts(): Promise<StoreItem[]> {
  try {
    const { data, error } = await supabase
      .from('store_items')
      .select('*')
      .eq('is_active', true)
      .eq('is_featured', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('Error fetching featured products:', error);
      return [];
    }

    return (data || []).map((item: any) => ({
      id: item.id,
      name: item.name,
      description: item.description,
      item_type: item.item_type,
      product_type: item.product_type || item.item_type,
      price_coins: item.price_coins || 0,
      price_real: item.price_real,
      icon: item.icon,
      image_url: item.image_url,
      is_active: item.is_active,
      is_featured: item.is_featured || false,
      category_id: item.category_id,
      metadata: item.metadata || {},
    }));
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return [];
  }
}

// Get user inventory
export async function getUserInventory(userId: string): Promise<UserInventoryItem[]> {
  try {
    // First get user's inventory items
    const { data: inventoryData, error: inventoryError } = await supabase
      .from('user_inventory')
      .select('*')
      .eq('user_id', userId);

    if (inventoryError) {
      console.error('Error fetching user inventory:', inventoryError);
      return [];
    }

    if (!inventoryData || inventoryData.length === 0) {
      return [];
    }

    // Get unique item IDs
    const itemIds = [...new Set(inventoryData.map((inv: any) => inv.item_id))];

    // Fetch store items for these IDs
    const { data: itemsData, error: itemsError } = await supabase
      .from('store_items')
      .select('*')
      .in('id', itemIds);

    if (itemsError) {
      console.error('Error fetching store items:', itemsError);
    }

    // Create a map for quick lookup
    const itemsMap = new Map((itemsData || []).map((item: any) => [item.id, item]));

    return inventoryData.map((inv: any) => {
      const item = itemsMap.get(inv.item_id);
      return {
        id: inv.id,
        user_id: inv.user_id,
        item_id: inv.item_id,
        quantity: 1, // user_inventory doesn't have quantity column, default to 1
        is_equipped: inv.is_equipped || false,
        acquired_at: inv.purchased_at || new Date().toISOString(),
        expires_at: null,
        item: item ? {
          id: item.id,
          name: item.name,
          description: item.description,
          item_type: item.item_type,
          product_type: item.product_type || item.item_type,
          price_coins: item.price_coins,
          price_real: item.price_real,
          icon: item.icon,
          image_url: item.image_url,
          is_active: item.is_active,
          is_featured: item.is_featured,
          category_id: item.category_id,
          metadata: item.metadata || {},
        } : undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching user inventory:', error);
    return [];
  }
}

// Get user active boosts
export async function getUserActiveBoosts(userId: string): Promise<UserBoost[]> {
  try {
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('user_boosts')
      .select('*')
      .eq('user_id', userId)
      .gt('expires_at', now);

    if (error) {
      console.error('Error fetching user boosts:', error);
      return [];
    }

    return (data || []).map((boost: any) => ({
      id: boost.id,
      user_id: boost.user_id,
      boost_type: boost.boost_type,
      multiplier: boost.boost_value || 1, // DB uses boost_value
      started_at: boost.used_at || boost.created_at,
      expires_at: boost.expires_at,
      is_active: boost.expires_at > now,
    }));
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

// Get user's coin balance (from user_profiles)
export async function getUserCoins(userId: string): Promise<number> {
  try {
    const { data, error } = await supabase
      .from('user_profiles')
      .select('coins')
      .eq('id', userId)
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
