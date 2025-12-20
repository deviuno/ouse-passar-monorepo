import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-loaded Supabase client
let _supabase: SupabaseClient | null = null;

function getSupabaseClient(): SupabaseClient {
    if (!_supabase) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';

        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL and Key are required. Check your .env file.');
        }

        _supabase = createClient(supabaseUrl, supabaseKey);
    }
    return _supabase;
}

// ==================== TIPOS ====================

export interface StoreCategory {
    id: string;
    name: string;
    slug: string;
    description: string | null;
    icon: string | null;
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
    value: string | null;
    metadata: Record<string, any>;
    is_active: boolean;
    is_featured: boolean;
    available_from: string | null;
    available_until: string | null;
    max_purchases: number | null;
    required_level: number | null;
    stock: number | null;
    external_url: string | null;
    preparatorio_id: string | null;
    category_id: string | null;
    tags: string[];
    display_order: number;
}

export interface StorePurchase {
    id: string;
    user_id: string;
    item_id: string;
    quantity: number;
    price_paid: number | null;
    currency: string;
    payment_status: string;
    payment_method: string | null;
    payment_reference: string | null;
    metadata: Record<string, any>;
    created_at: string;
    completed_at: string | null;
}

export interface UserBoost {
    id: string;
    user_id: string;
    boost_type: string;
    boost_value: number;
    expires_at: string;
    used_at: string | null;
    source: string;
    created_at: string;
}

export interface CreateItemInput {
    id?: string;
    name: string;
    description?: string;
    item_type: string;
    product_type: string;
    price_coins?: number;
    price_real?: number;
    icon?: string;
    image_url?: string;
    value?: string;
    metadata?: Record<string, any>;
    is_active?: boolean;
    is_featured?: boolean;
    available_from?: string;
    available_until?: string;
    max_purchases?: number;
    required_level?: number;
    stock?: number;
    external_url?: string;
    preparatorio_id?: string;
    category_id?: string;
    tags?: string[];
    display_order?: number;
}

// ==================== CATEGORIAS ====================

export async function getCategories(): Promise<StoreCategory[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .eq('is_active', true)
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function getAllCategories(): Promise<StoreCategory[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('store_categories')
        .select('*')
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function createCategory(input: Partial<StoreCategory>): Promise<StoreCategory> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('store_categories')
        .insert(input)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateCategory(id: string, input: Partial<StoreCategory>): Promise<StoreCategory> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('store_categories')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteCategory(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('store_categories')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ==================== PRODUTOS ====================

export async function getProducts(filters?: {
    category_slug?: string;
    product_type?: string;
    is_featured?: boolean;
    search?: string;
}): Promise<StoreItem[]> {
    const supabase = getSupabaseClient();

    let query = supabase
        .from('store_items')
        .select(`
            *,
            category:store_categories(id, name, slug, icon, color)
        `)
        .eq('is_active', true);

    if (filters?.product_type) {
        query = query.eq('product_type', filters.product_type);
    }

    if (filters?.is_featured) {
        query = query.eq('is_featured', true);
    }

    if (filters?.search) {
        query = query.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    const { data, error } = await query.order('display_order', { ascending: true });

    if (error) throw error;

    // Filtrar por categoria se especificado
    let items = data || [];
    if (filters?.category_slug) {
        items = items.filter((item: any) => item.category?.slug === filters.category_slug);
    }

    return items;
}

export async function getAllProducts(): Promise<StoreItem[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('store_items')
        .select(`
            *,
            category:store_categories(id, name, slug, icon, color)
        `)
        .order('display_order', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function getProductById(id: string): Promise<StoreItem | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('store_items')
        .select(`
            *,
            category:store_categories(id, name, slug, icon, color)
        `)
        .eq('id', id)
        .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data;
}

export async function getFeaturedProducts(limit: number = 6): Promise<StoreItem[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('store_items')
        .select(`
            *,
            category:store_categories(id, name, slug, icon, color)
        `)
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('display_order', { ascending: true })
        .limit(limit);

    if (error) throw error;
    return data || [];
}

export async function createProduct(input: CreateItemInput): Promise<StoreItem> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('store_items')
        .insert({
            ...input,
            id: input.id || `item_${Date.now()}`,
            price_coins: input.price_coins || 0,
            metadata: input.metadata || {},
            tags: input.tags || [],
        })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function updateProduct(id: string, input: Partial<CreateItemInput>): Promise<StoreItem> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('store_items')
        .update(input)
        .eq('id', id)
        .select()
        .single();

    if (error) throw error;
    return data;
}

export async function deleteProduct(id: string): Promise<void> {
    const supabase = getSupabaseClient();

    const { error } = await supabase
        .from('store_items')
        .delete()
        .eq('id', id);

    if (error) throw error;
}

// ==================== COMPRAS ====================

export async function purchaseWithCoins(
    userId: string,
    itemId: string,
    quantity: number = 1
): Promise<{ success: boolean; error?: string; purchase?: StorePurchase }> {
    const supabase = getSupabaseClient();

    // 1. Buscar item
    const { data: item, error: itemError } = await supabase
        .from('store_items')
        .select('*')
        .eq('id', itemId)
        .eq('is_active', true)
        .single();

    if (itemError || !item) {
        return { success: false, error: 'Produto não encontrado' };
    }

    // 2. Verificar se tem preço em moedas
    if (!item.price_coins || item.price_coins <= 0) {
        return { success: false, error: 'Este produto não pode ser comprado com moedas' };
    }

    const totalCost = item.price_coins * quantity;

    // 3. Buscar moedas do usuário
    const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('coins')
        .eq('id', userId)
        .single();

    if (profileError || !profile) {
        return { success: false, error: 'Perfil não encontrado' };
    }

    if ((profile.coins || 0) < totalCost) {
        return { success: false, error: `Moedas insuficientes. Necessário: ${totalCost}, Disponível: ${profile.coins || 0}` };
    }

    // 4. Verificar limite de compras
    if (item.max_purchases) {
        const { count } = await supabase
            .from('store_purchases')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
            .eq('item_id', itemId)
            .eq('payment_status', 'completed');

        if ((count || 0) >= item.max_purchases) {
            return { success: false, error: 'Limite de compras atingido para este item' };
        }
    }

    // 5. Verificar estoque
    if (item.stock !== null && item.stock < quantity) {
        return { success: false, error: 'Estoque insuficiente' };
    }

    // 6. Descontar moedas
    const { error: updateError } = await supabase
        .from('user_profiles')
        .update({ coins: (profile.coins || 0) - totalCost })
        .eq('id', userId);

    if (updateError) {
        return { success: false, error: 'Erro ao descontar moedas' };
    }

    // 7. Criar registro de compra
    const { data: purchase, error: purchaseError } = await supabase
        .from('store_purchases')
        .insert({
            user_id: userId,
            item_id: itemId,
            quantity,
            price_paid: totalCost,
            currency: 'COINS',
            payment_status: 'completed',
            payment_method: 'coins',
            completed_at: new Date().toISOString(),
        })
        .select()
        .single();

    if (purchaseError) {
        // Tentar reverter moedas
        await supabase
            .from('user_profiles')
            .update({ coins: profile.coins })
            .eq('id', userId);
        return { success: false, error: 'Erro ao registrar compra' };
    }

    // 8. Adicionar ao inventário
    await supabase
        .from('user_inventory')
        .insert({
            user_id: userId,
            item_id: itemId,
            item_type: item.item_type,
        });

    // 9. Se for boost, ativar
    if (item.item_type === 'boost') {
        const metadata = item.metadata || {};
        const durationHours = metadata.duration_hours || 24;
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + durationHours);

        await supabase
            .from('user_boosts')
            .insert({
                user_id: userId,
                boost_type: metadata.boost_type || item.value,
                boost_value: parseFloat(item.value || '1'),
                expires_at: expiresAt.toISOString(),
                source: 'purchase',
            });
    }

    // 10. Atualizar estoque se aplicável
    if (item.stock !== null) {
        await supabase
            .from('store_items')
            .update({ stock: item.stock - quantity })
            .eq('id', itemId);
    }

    return { success: true, purchase };
}

export async function getUserPurchases(userId: string): Promise<StorePurchase[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('store_purchases')
        .select(`
            *,
            item:store_items(id, name, icon, item_type)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function getAllPurchases(filters?: {
    status?: string;
    limit?: number;
}): Promise<StorePurchase[]> {
    const supabase = getSupabaseClient();

    let query = supabase
        .from('store_purchases')
        .select(`
            *,
            item:store_items(id, name, icon, item_type)
        `)
        .order('created_at', { ascending: false });

    if (filters?.status) {
        query = query.eq('payment_status', filters.status);
    }

    if (filters?.limit) {
        query = query.limit(filters.limit);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
}

// ==================== BOOSTS ====================

export async function getUserActiveBoosts(userId: string): Promise<UserBoost[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('user_boosts')
        .select('*')
        .eq('user_id', userId)
        .gt('expires_at', new Date().toISOString())
        .is('used_at', null)
        .order('expires_at', { ascending: true });

    if (error) throw error;
    return data || [];
}

export async function useBoost(boostId: string, userId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();

    const { data: boost, error: fetchError } = await supabase
        .from('user_boosts')
        .select('*')
        .eq('id', boostId)
        .eq('user_id', userId)
        .is('used_at', null)
        .single();

    if (fetchError || !boost) {
        return { success: false, error: 'Boost não encontrado ou já utilizado' };
    }

    if (new Date(boost.expires_at) < new Date()) {
        return { success: false, error: 'Boost expirado' };
    }

    const { error: updateError } = await supabase
        .from('user_boosts')
        .update({ used_at: new Date().toISOString() })
        .eq('id', boostId);

    if (updateError) {
        return { success: false, error: 'Erro ao usar boost' };
    }

    return { success: true };
}

// ==================== INVENTÁRIO ====================

export async function getUserInventory(userId: string): Promise<any[]> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('user_inventory')
        .select(`
            *,
            item:store_items(id, name, description, icon, item_type, value, metadata)
        `)
        .eq('user_id', userId)
        .order('purchased_at', { ascending: false });

    if (error) throw error;
    return data || [];
}

export async function equipItem(userId: string, inventoryId: string): Promise<{ success: boolean; error?: string }> {
    const supabase = getSupabaseClient();

    // Buscar o item do inventário
    const { data: inventoryItem, error: fetchError } = await supabase
        .from('user_inventory')
        .select('*, item:store_items(*)')
        .eq('id', inventoryId)
        .eq('user_id', userId)
        .single();

    if (fetchError || !inventoryItem) {
        return { success: false, error: 'Item não encontrado no inventário' };
    }

    // Desequipar outros itens do mesmo tipo
    await supabase
        .from('user_inventory')
        .update({ is_equipped: false })
        .eq('user_id', userId)
        .eq('item_type', inventoryItem.item_type);

    // Equipar o item selecionado
    const { error: updateError } = await supabase
        .from('user_inventory')
        .update({ is_equipped: true })
        .eq('id', inventoryId);

    if (updateError) {
        return { success: false, error: 'Erro ao equipar item' };
    }

    // Se for avatar, atualizar perfil
    if (inventoryItem.item_type === 'avatar' && inventoryItem.item?.value) {
        await supabase
            .from('user_profiles')
            .update({ avatar_id: inventoryItem.item_id })
            .eq('id', userId);
    }

    return { success: true };
}

// ==================== RETA FINAL ====================

export async function activateRetaFinal(
    userId: string,
    trailId: string,
    dataProva: string
): Promise<{ success: boolean; error?: string; diasRestantes?: number }> {
    const supabase = getSupabaseClient();

    const provaDate = new Date(dataProva);
    const hoje = new Date();
    const diasRestantes = Math.ceil((provaDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));

    if (diasRestantes <= 0) {
        return { success: false, error: 'A data da prova deve ser no futuro' };
    }

    if (diasRestantes > 90) {
        return { success: false, error: 'Modo Reta Final disponível apenas para provas em até 90 dias' };
    }

    const { error } = await supabase
        .from('user_trails')
        .update({
            is_reta_final: true,
            data_prova: dataProva,
            reta_final_started_at: new Date().toISOString(),
        })
        .eq('id', trailId)
        .eq('user_id', userId);

    if (error) {
        return { success: false, error: 'Erro ao ativar modo Reta Final' };
    }

    return { success: true, diasRestantes };
}

export async function getRetaFinalStatus(userId: string, trailId: string): Promise<{
    isRetaFinal: boolean;
    dataProva: string | null;
    diasRestantes: number | null;
    startedAt: string | null;
} | null> {
    const supabase = getSupabaseClient();

    const { data, error } = await supabase
        .from('user_trails')
        .select('is_reta_final, data_prova, reta_final_started_at')
        .eq('id', trailId)
        .eq('user_id', userId)
        .single();

    if (error || !data) return null;

    let diasRestantes = null;
    if (data.data_prova) {
        const provaDate = new Date(data.data_prova);
        const hoje = new Date();
        diasRestantes = Math.ceil((provaDate.getTime() - hoje.getTime()) / (1000 * 60 * 60 * 24));
    }

    return {
        isRetaFinal: data.is_reta_final || false,
        dataProva: data.data_prova,
        diasRestantes,
        startedAt: data.reta_final_started_at,
    };
}

// ==================== ESTATÍSTICAS ====================

export async function getStoreStats(): Promise<{
    totalProducts: number;
    totalPurchases: number;
    totalRevenue: number;
    recentPurchases: StorePurchase[];
}> {
    const supabase = getSupabaseClient();

    // Total de produtos ativos
    const { count: totalProducts } = await supabase
        .from('store_items')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

    // Total de compras completadas
    const { count: totalPurchases } = await supabase
        .from('store_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('payment_status', 'completed');

    // Receita total (em BRL)
    const { data: revenueData } = await supabase
        .from('store_purchases')
        .select('price_paid')
        .eq('payment_status', 'completed')
        .eq('currency', 'BRL');

    const totalRevenue = revenueData?.reduce((sum, p) => sum + (p.price_paid || 0), 0) || 0;

    // Compras recentes
    const { data: recentPurchases } = await supabase
        .from('store_purchases')
        .select(`
            *,
            item:store_items(id, name, icon)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

    return {
        totalProducts: totalProducts || 0,
        totalPurchases: totalPurchases || 0,
        totalRevenue,
        recentPurchases: recentPurchases || [],
    };
}

// ==================== SINCRONIZAÇÃO ====================

export async function syncPreparatoriosToStore(): Promise<{ synced: number; errors: string[] }> {
    const supabase = getSupabaseClient();
    const errors: string[] = [];
    let synced = 0;

    // Buscar todos os preparatórios ativos
    const { data: preparatorios, error } = await supabase
        .from('preparatorios')
        .select('*')
        .eq('is_active', true);

    if (error) {
        return { synced: 0, errors: [error.message] };
    }

    // Buscar categoria de preparatórios
    const { data: category } = await supabase
        .from('store_categories')
        .select('id')
        .eq('slug', 'preparatorios')
        .single();

    for (const prep of preparatorios || []) {
        try {
            // Verificar se já existe no store
            const { data: existing } = await supabase
                .from('store_items')
                .select('id')
                .eq('preparatorio_id', prep.id)
                .single();

            const itemData = {
                name: prep.nome,
                description: prep.descricao_curta || prep.descricao,
                item_type: 'preparatorio',
                product_type: 'preparatorio',
                price_coins: 0,
                price_real: prep.preco,
                icon: prep.icone || 'book',
                image_url: prep.imagem_capa,
                value: prep.slug,
                metadata: {
                    banca: prep.banca,
                    orgao: prep.orgao,
                    cargo: prep.cargo,
                    nivel: prep.nivel,
                },
                is_active: prep.is_active,
                preparatorio_id: prep.id,
                category_id: category?.id,
                external_url: prep.checkout_url,
            };

            if (existing) {
                await supabase
                    .from('store_items')
                    .update(itemData)
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('store_items')
                    .insert({
                        id: `prep_${prep.id}`,
                        ...itemData,
                    });
            }

            synced++;
        } catch (err: any) {
            errors.push(`Erro ao sincronizar ${prep.nome}: ${err.message}`);
        }
    }

    return { synced, errors };
}
