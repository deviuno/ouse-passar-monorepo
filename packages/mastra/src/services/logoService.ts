/**
 * Logo Service - Busca e geração de logos de órgãos públicos
 *
 * Estratégia:
 * 1. Buscar logo no Google Custom Search API
 * 2. Se não encontrar, gerar com Google Imagen 3 (Nano-Banana Pro)
 * 3. Fazer upload para Supabase Storage
 */

import { GoogleGenAI } from '@google/genai';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy initialization do Supabase
let _supabase: SupabaseClient | null = null;

const getSupabase = () => {
    if (!_supabase) {
        const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
        const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || '';
        if (!supabaseUrl || !supabaseKey) {
            throw new Error('Supabase URL or Key not configured');
        }
        _supabase = createClient(supabaseUrl, supabaseKey);
    }
    return _supabase;
};

// Inicialização do Gemini
const getGeminiClient = () => {
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({ apiKey });
};

export interface LogoSearchResult {
    success: boolean;
    logoUrl: string | null;
    source: 'google_search' | 'ai_generated' | null;
    error?: string;
}

/**
 * Busca logo no Google Custom Search API
 */
async function searchLogoOnGoogle(orgao: string): Promise<string | null> {
    const apiKey = process.env.GOOGLE_CUSTOM_SEARCH_API_KEY;
    const searchEngineId = process.env.GOOGLE_CUSTOM_SEARCH_ENGINE_ID;

    if (!apiKey || !searchEngineId) {
        console.log('[LogoService] Google Custom Search não configurado, pulando busca');
        return null;
    }

    try {
        const query = `logo oficial ${orgao} Brasil emblema`;
        const url = `https://www.googleapis.com/customsearch/v1?q=${encodeURIComponent(query)}&cx=${searchEngineId}&key=${apiKey}&searchType=image&num=5&imgSize=medium&imgType=clipart`;

        console.log(`[LogoService] Buscando logo no Google para: ${orgao}`);

        const response = await fetch(url);

        if (!response.ok) {
            console.error(`[LogoService] Erro na busca Google: ${response.status}`);
            return null;
        }

        const data = await response.json();

        if (data.items && data.items.length > 0) {
            // Filtrar resultados para pegar logos mais relevantes
            const relevantItems = data.items.filter((item: any) => {
                const link = item.link?.toLowerCase() || '';
                const title = item.title?.toLowerCase() || '';
                // Preferir imagens de sites oficiais (.gov.br) ou que mencionem "logo"
                return link.includes('.gov.br') ||
                       link.includes('logo') ||
                       title.includes('logo') ||
                       title.includes('emblema') ||
                       title.includes('brasão');
            });

            const selectedItem = relevantItems[0] || data.items[0];
            console.log(`[LogoService] Logo encontrada: ${selectedItem.link}`);
            return selectedItem.link;
        }

        console.log('[LogoService] Nenhuma logo encontrada no Google');
        return null;
    } catch (error: any) {
        console.error('[LogoService] Erro ao buscar no Google:', error.message);
        return null;
    }
}

/**
 * Gera logo com Imagen 3 (Nano-Banana Pro)
 */
async function generateLogoWithImagen(orgao: string): Promise<string | null> {
    const client = getGeminiClient();
    if (!client) {
        console.warn('[LogoService] API do Gemini não configurada');
        return null;
    }

    try {
        console.log(`[LogoService] Gerando logo com IA para: ${orgao}`);

        // Prompt otimizado para gerar emblemas institucionais
        const prompt = `Create a professional institutional emblem/logo for "${orgao}" (Brazilian government institution).

Style requirements:
- Clean, official government emblem style
- Square format, centered design
- Simple and recognizable silhouette
- Professional color scheme (blues, gold, green)
- Minimalist design suitable for small sizes
- White or transparent background
- NO text, letters or words in the image
- Focus on symbolic elements related to the institution

The emblem should look official and suitable for use as a small icon in a mobile app.`;

        const response = await client.models.generateContent({
            model: 'imagen-3.0-generate-002',
            contents: prompt,
            config: {
                responseModalities: ['image'],
            },
        });

        // Extrair imagem da resposta
        const parts = response.candidates?.[0]?.content?.parts || [];
        let imageData: string | null = null;

        for (const part of parts) {
            if (part.inlineData?.data) {
                imageData = part.inlineData.data;
                break;
            }
        }

        if (!imageData) {
            console.error('[LogoService] Imagen 3 não retornou imagem');
            return null;
        }

        console.log('[LogoService] Logo gerada com sucesso via Imagen 3');
        return imageData; // Retorna base64
    } catch (error: any) {
        console.error('[LogoService] Erro ao gerar com Imagen 3:', error.message);

        // Fallback para o modelo de imagem do Gemini padrão
        try {
            console.log('[LogoService] Tentando fallback com gemini-3-pro-image-preview...');

            const fallbackPrompt = `Simple, clean government emblem icon for "${orgao}" Brazil. Minimalist design, square format, no text, suitable for app icon. Professional blue and gold colors.`;

            const fallbackResponse = await client.models.generateContent({
                model: 'gemini-3-pro-image-preview',
                contents: fallbackPrompt,
                config: {
                    responseModalities: ['image', 'text'],
                },
            });

            const fallbackParts = fallbackResponse.candidates?.[0]?.content?.parts || [];
            for (const part of fallbackParts) {
                if (part.inlineData?.data) {
                    console.log('[LogoService] Logo gerada via fallback');
                    return part.inlineData.data;
                }
            }
        } catch (fallbackError: any) {
            console.error('[LogoService] Fallback também falhou:', fallbackError.message);
        }

        return null;
    }
}

/**
 * Faz download de uma imagem externa e upload para Supabase
 */
async function downloadAndUploadImage(imageUrl: string, orgao: string): Promise<string | null> {
    try {
        console.log(`[LogoService] Baixando imagem: ${imageUrl}`);

        const response = await fetch(imageUrl);
        if (!response.ok) {
            console.error(`[LogoService] Erro ao baixar imagem: ${response.status}`);
            return null;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Determinar extensão
        const contentType = response.headers.get('content-type') || 'image/png';
        const ext = contentType.includes('jpeg') || contentType.includes('jpg') ? 'jpg' : 'png';

        const fileName = `logo-${slugify(orgao)}-${Date.now()}.${ext}`;

        const { error: uploadError } = await getSupabase().storage
            .from('preparatorios')
            .upload(fileName, buffer, {
                contentType,
                upsert: true,
            });

        if (uploadError) {
            console.error('[LogoService] Erro no upload:', uploadError);
            return null;
        }

        const { data: publicUrlData } = getSupabase().storage
            .from('preparatorios')
            .getPublicUrl(fileName);

        console.log(`[LogoService] Upload concluído: ${publicUrlData?.publicUrl}`);
        return publicUrlData?.publicUrl || null;
    } catch (error: any) {
        console.error('[LogoService] Erro ao baixar/fazer upload:', error.message);
        return null;
    }
}

/**
 * Faz upload de imagem base64 para Supabase
 */
async function uploadBase64Image(base64Data: string, orgao: string): Promise<string | null> {
    try {
        const fileName = `logo-${slugify(orgao)}-ai-${Date.now()}.png`;
        const buffer = Buffer.from(base64Data, 'base64');

        const { error: uploadError } = await getSupabase().storage
            .from('preparatorios')
            .upload(fileName, buffer, {
                contentType: 'image/png',
                upsert: true,
            });

        if (uploadError) {
            console.error('[LogoService] Erro no upload base64:', uploadError);
            return null;
        }

        const { data: publicUrlData } = getSupabase().storage
            .from('preparatorios')
            .getPublicUrl(fileName);

        console.log(`[LogoService] Upload base64 concluído: ${publicUrlData?.publicUrl}`);
        return publicUrlData?.publicUrl || null;
    } catch (error: any) {
        console.error('[LogoService] Erro no upload base64:', error.message);
        return null;
    }
}

/**
 * Converte string para slug
 */
function slugify(text: string): string {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '')
        .substring(0, 50);
}

/**
 * Busca ou gera logo para um órgão
 *
 * @param orgao Nome do órgão (ex: "Polícia Federal", "PRF", "Receita Federal")
 * @returns URL da logo no Supabase Storage
 */
export async function buscarOuGerarLogo(orgao: string): Promise<LogoSearchResult> {
    if (!orgao || orgao.trim() === '') {
        return {
            success: false,
            logoUrl: null,
            source: null,
            error: 'Nome do órgão é obrigatório',
        };
    }

    console.log(`[LogoService] Iniciando busca de logo para: ${orgao}`);

    // 1. Tentar buscar no Google
    const googleImageUrl = await searchLogoOnGoogle(orgao);

    if (googleImageUrl) {
        // Fazer download e upload para Supabase
        const uploadedUrl = await downloadAndUploadImage(googleImageUrl, orgao);

        if (uploadedUrl) {
            return {
                success: true,
                logoUrl: uploadedUrl,
                source: 'google_search',
            };
        }
    }

    // 2. Fallback: Gerar com IA
    console.log('[LogoService] Busca no Google falhou, gerando com IA...');

    const generatedBase64 = await generateLogoWithImagen(orgao);

    if (generatedBase64) {
        const uploadedUrl = await uploadBase64Image(generatedBase64, orgao);

        if (uploadedUrl) {
            return {
                success: true,
                logoUrl: uploadedUrl,
                source: 'ai_generated',
            };
        }
    }

    return {
        success: false,
        logoUrl: null,
        source: null,
        error: 'Não foi possível buscar nem gerar a logo',
    };
}

export default {
    buscarOuGerarLogo,
};
