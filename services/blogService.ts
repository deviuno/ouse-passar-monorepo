import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

// Updated to reflect the join structure
type ArtigoRow = Database['public']['Tables']['artigos']['Row'];
interface ArtigoWithRelations extends Omit<ArtigoRow, 'autor_nome' | 'autor_avatar' | 'categoria'> {
    autores_artigos?: {
        nome: string;
        imagem_perfil: string | null;
    } | null;
    categories?: {
        name: string;
        slug: string;
    } | null;
    // Keep these for backward compatibility if needed, or mapped from relations
    autor_nome?: string;
    autor_avatar?: string;
    categoria?: string;
}

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    authorId?: string; // New field
    authorAvatar?: string;
    date: string;
    category: string;
    categoryId?: string; // New field
    imageUrl: string;
    readTime: string;
    tags?: string[];
    keywords?: string[];
    status: 'draft' | 'published';
}

export type BlogPostStatus = 'draft' | 'published';

export interface CreatePostData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    authorId: string; // Changed from author name to ID
    categoryId: string; // Changed from category name to ID
    imageUrl: string;
    readTime: string;
    tags?: string[];
    status: BlogPostStatus;
    date: string;
}

// Helper to convert bytea hex string to base64/url
const getImageUrlFromHex = (hexString: string | null) => {
    if (!hexString) return undefined;
    try {
        const hex = hexString.startsWith('\\x') ? hexString.slice(2) : hexString;
        const bytes = new Uint8Array(hex.match(/.{1,2}/g)?.map(byte => parseInt(byte, 16)) || []);
        const blob = new Blob([bytes], { type: 'image/jpeg' });
        return URL.createObjectURL(blob);
    } catch (e) {
        return undefined;
    }
};

/**
 * Convert database artigo to BlogPost format
 */
function artigoToBlogPost(artigo: any): BlogPost {
    // Handle relation data
    const authorName = artigo.autores_artigos?.nome || 'Equipe Ouse Passar';
    const authorAvatar = getImageUrlFromHex(artigo.autores_artigos?.imagem_perfil);
    const categoryName = artigo.categories?.name || 'Geral';

    return {
        id: artigo.id,
        title: artigo.titulo,
        slug: artigo.slug,
        excerpt: artigo.descricao,
        content: artigo.conteudo,
        author: authorName,
        authorId: artigo.autor_id,
        authorAvatar: authorAvatar,
        date: artigo.data_publicacao || artigo.data_criacao,
        category: categoryName,
        categoryId: artigo.categoria_id,
        imageUrl: artigo.imagem_capa || 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?q=80&w=1000&auto=format&fit=crop',
        readTime: artigo.tempo_leitura ? `${artigo.tempo_leitura} min` : '5 min',
        tags: artigo.tags || undefined,
        keywords: artigo.palavras_chave || undefined,
        status: artigo.status_publicacao === 'publicado' ? 'published' : 'draft',
    };
}

/**
 * Get all published blog posts with pagination
 */
export async function getPublishedPosts(
    limit: number = 10,
    offset: number = 0
): Promise<{ posts: BlogPost[]; total: number; error?: string }> {
    try {
        // Get total count
        const { count, error: countError } = await supabase
            .from('artigos')
            .select('*', { count: 'exact', head: true })
            .eq('status_publicacao', 'publicado');

        if (countError) throw countError;

        // Get posts with relations
        const { data, error } = await supabase
            .from('artigos')
            .select('*, autores_artigos(nome, imagem_perfil), categories(name, slug)')
            .eq('status_publicacao', 'publicado')
            .order('data_publicacao', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            posts: (data || []).map(artigoToBlogPost),
            total: count || 0,
        };
    } catch (error) {
        console.error('Erro ao carregar artigos publicados:', error);
        return {
            posts: [],
            total: 0,
            error: 'Erro ao carregar artigos',
        };
    }
}

/**
 * Get a single blog post by slug
 */
export async function getPostBySlug(slug: string): Promise<{ post: BlogPost | null; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('artigos')
            .select('*, autores_artigos(nome, imagem_perfil), categories(name, slug)')
            .eq('slug', slug)
            .eq('status_publicacao', 'publicado')
            .single();

        if (error) throw error;

        return {
            post: data ? artigoToBlogPost(data) : null,
        };
    } catch (error) {
        return {
            post: null,
            error: 'Erro ao carregar o artigo',
        };
    }
}

/**
 * Get featured blog posts
 */
export async function getFeaturedPosts(limit: number = 3): Promise<{ posts: BlogPost[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('artigos')
            .select('*, autores_artigos(nome, imagem_perfil), categories(name, slug)')
            .eq('status_publicacao', 'publicado')
            .order('data_publicacao', { ascending: false })
            .limit(limit);

        if (error) throw error;

        return {
            posts: (data || []).map(artigoToBlogPost),
        };
    } catch (error) {
        return {
            posts: [],
            error: 'Erro ao carregar artigos em destaque',
        };
    }
}

/**
 * Get posts by category
 */
export async function getPostsByCategory(
    categorySlug: string,
    limit: number = 10,
    offset: number = 0
): Promise<{ posts: BlogPost[]; total: number; error?: string }> {
    try {
        // First find the category ID from the slug
        const { data: catData, error: catError } = await supabase
            .from('categories')
            .select('id')
            .eq('slug', categorySlug)
            .single();

        if (catError || !catData) throw new Error('Categoria não encontrada');

        // Get total count
        const { count, error: countError } = await supabase
            .from('artigos')
            .select('*', { count: 'exact', head: true })
            .eq('status_publicacao', 'publicado')
            .eq('categoria_id', catData.id);

        if (countError) throw countError;

        // Get posts
        const { data, error } = await supabase
            .from('artigos')
            .select('*, autores_artigos(nome, imagem_perfil), categories(name, slug)')
            .eq('status_publicacao', 'publicado')
            .eq('categoria_id', catData.id)
            .order('data_publicacao', { ascending: false })
            .range(offset, offset + limit - 1);

        if (error) throw error;

        return {
            posts: (data || []).map(artigoToBlogPost),
            total: count || 0,
        };
    } catch (error) {
        return {
            posts: [],
            total: 0,
            error: 'Erro ao carregar artigos da categoria',
        };
    }
}

/**
 * Get all unique categories from published posts
 */
export async function getCategories(): Promise<{ categories: string[]; error?: string }> {
    try {
        // Fetch from categories table directly
        const { data, error } = await supabase
            .from('categories')
            .select('name')
            .order('name');

        if (error) throw error;

        return {
            categories: (data || []).map((c: any) => c.name),
        };
    } catch (error) {
        return {
            categories: [],
            error: 'Erro ao carregar categorias',
        };
    }
}

/**
 * Search posts by title or content
 */
export async function searchPosts(query: string): Promise<{ posts: BlogPost[]; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('artigos')
            .select('*, autores_artigos(nome, imagem_perfil), categories(name, slug)')
            .eq('status_publicacao', 'publicado')
            .or(`titulo.ilike.%${query}%,descricao.ilike.%${query}%`)
            .order('data_publicacao', { ascending: false });

        if (error) throw error;

        return {
            posts: (data || []).map(artigoToBlogPost),
        };
    } catch (error) {
        return {
            posts: [],
            error: 'Erro ao buscar artigos',
        };
    }
}

/**
 * Create a new blog post
 */
export async function createPost(postData: CreatePostData): Promise<{ post?: BlogPost; error?: string }> {
    try {
        const supabaseClient = supabase as any;
        const readTimeNumber = parseInt(postData.readTime.replace(/\D/g, '')) || 5;

        const articleData = {
            titulo: postData.title,
            slug: postData.slug,
            descricao: postData.excerpt,
            conteudo: postData.content,
            categoria_id: postData.categoryId || null, // Use ID
            status_publicacao: postData.status === 'published' ? 'publicado' : 'rascunho',
            autor_id: postData.authorId || null, // Use ID
            imagem_capa: postData.imageUrl || null,
            tempo_leitura: readTimeNumber,
            tags: postData.tags || null,
            data_criacao: new Date().toISOString(),
            data_atualizacao: new Date().toISOString(),
            data_publicacao: postData.status === 'published' ? new Date().toISOString() : null,
        };

        const { data, error } = await supabaseClient
            .from('artigos')
            .insert(articleData)
            .select('*, autores_artigos(nome, imagem_perfil), categories(name, slug)')
            .single();

        if (error) throw error;

        return {
            post: data ? artigoToBlogPost(data) : undefined,
        };
    } catch (error: any) {
        console.error('Erro ao criar artigo:', error);
        return {
            error: error.message || 'Erro ao criar artigo',
        };
    }
}

/**
 * Update an existing blog post
 */
export async function updatePost(slug: string, postData: CreatePostData): Promise<{ post?: BlogPost; error?: string }> {
    try {
        const supabaseClient = supabase as any;
        const readTimeNumber = parseInt(postData.readTime.replace(/\D/g, '')) || 5;

        const articleData = {
            titulo: postData.title,
            slug: postData.slug,
            descricao: postData.excerpt,
            conteudo: postData.content,
            categoria_id: postData.categoryId || null, // Use ID
            status_publicacao: postData.status === 'published' ? 'publicado' : 'rascunho',
            autor_id: postData.authorId || null, // Use ID
            imagem_capa: postData.imageUrl || null,
            tempo_leitura: readTimeNumber,
            tags: postData.tags || null,
            data_atualizacao: new Date().toISOString(),
            data_publicacao: postData.status === 'published' ? new Date().toISOString() : null,
        };

        const { data, error } = await supabaseClient
            .from('artigos')
            .update(articleData)
            .eq('slug', slug)
            .select('*, autores_artigos(nome, imagem_perfil), categories(name, slug)')
            .single();

        if (error) throw error;

        return {
            post: data ? artigoToBlogPost(data) : undefined,
        };
    } catch (error: any) {
        console.error('Erro ao atualizar artigo:', error);
        return {
            error: error.message || 'Erro ao atualizar artigo',
        };
    }
}

/**
 * Get a blog post by slug (including drafts, for admin)
 */
export async function getPostBySlugAdmin(slug: string): Promise<{ post: BlogPost | null; error?: string }> {
    try {
        const { data, error } = await supabase
            .from('artigos')
            .select('*, autores_artigos(nome, imagem_perfil), categories(name, slug)')
            .eq('slug', slug)
            .single();

        if (error) throw error;

        return {
            post: data ? artigoToBlogPost(data) : null,
        };
    } catch (error: any) {
        console.error('Erro ao carregar artigo:', error);
        return {
            post: null,
            error: error.message || 'Erro ao carregar o artigo',
        };
    }
}
