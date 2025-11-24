import { supabase } from '../lib/supabase';
import { Database } from '../lib/database.types';

type Artigo = Database['public']['Tables']['artigos']['Row'];

export interface BlogPost {
    id: string;
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    author: string;
    authorAvatar?: string;
    date: string;
    category: string;
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
    author: string;
    category: string;
    imageUrl: string;
    readTime: string;
    tags?: string[];
    status: BlogPostStatus;
    date: string;
}

/**
 * Convert database artigo to BlogPost format
 */
function artigoToBlogPost(artigo: Artigo): BlogPost {
    return {
        id: artigo.id,
        title: artigo.titulo,
        slug: artigo.slug,
        excerpt: artigo.descricao,
        content: artigo.conteudo,
        author: artigo.autor_nome || 'Equipe Ouse Passar',
        authorAvatar: artigo.autor_avatar || undefined,
        date: artigo.data_publicacao || artigo.data_criacao,
        category: artigo.categoria || 'Geral',
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

        // Get posts
        const { data, error } = await supabase
            .from('artigos')
            .select('*')
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
            .select('*')
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
            .select('*')
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
    category: string,
    limit: number = 10,
    offset: number = 0
): Promise<{ posts: BlogPost[]; total: number; error?: string }> {
    try {
        // Get total count
        const { count, error: countError } = await supabase
            .from('artigos')
            .select('*', { count: 'exact', head: true })
            .eq('status_publicacao', 'publicado')
            .eq('categoria', category);

        if (countError) throw countError;

        // Get posts
        const { data, error } = await supabase
            .from('artigos')
            .select('*')
            .eq('status_publicacao', 'publicado')
            .eq('categoria', category)
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
        const { data, error } = await supabase
            .from('artigos')
            .select('categoria')
            .eq('status_publicacao', 'publicado')
            .not('categoria', 'is', null);

        if (error) throw error;

        // Get unique categories
        const uniqueCategories = Array.from(
            new Set(data?.map((item) => item.categoria).filter(Boolean) as string[])
        ).sort();

        return {
            categories: uniqueCategories,
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
            .select('*')
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
            categoria: postData.category || null,
            status_publicacao: postData.status === 'published' ? 'publicado' : 'rascunho',
            autor_nome: postData.author || null,
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
            .select()
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
            categoria: postData.category || null,
            status_publicacao: postData.status === 'published' ? 'publicado' : 'rascunho',
            autor_nome: postData.author || null,
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
            .select()
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
            .select('*')
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
