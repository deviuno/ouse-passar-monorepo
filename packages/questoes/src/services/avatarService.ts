import { supabase } from './supabaseClient';

/**
 * Faz o upload de uma imagem para o bucket 'avatars' e retorna a URL pública.
 * @param userId ID do usuário
 * @param file Arquivo de imagem
 * @returns {Promise<{url: string | null, error: any}>}
 */
export async function uploadAvatar(userId: string, file: File): Promise<{ url: string | null; error: any }> {
    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // 1. Upload do arquivo
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(fileName, file, {
                cacheControl: '3600',
                upsert: true
            });

        if (uploadError) {
            return { url: null, error: uploadError };
        }

        // 2. Obter URL pública
        const { data } = supabase.storage
            .from('avatars')
            .getPublicUrl(fileName);

        return { url: data.publicUrl, error: null };
    } catch (error) {
        console.error('Erro no upload do avatar:', error);
        return { url: null, error };
    }
}

/**
 * Remove o avatar antigo do bucket, se necessário.
 * @param url URL completa da imagem para determinar o caminho
 */
export async function deleteAvatar(url: string) {
    try {
        // Extrair o caminho relativo do bucket a partir da URL
        // Ex: https://.../storage/v1/object/public/avatars/userId/timestamp.jpg -> userId/timestamp.jpg
        const parts = url.split('/avatars/');
        if (parts.length > 1) {
            const filePath = parts[1];
            await supabase.storage.from('avatars').remove([filePath]);
        }
    } catch (error) {
        console.warn('Erro ao deletar avatar antigo:', error);
    }
}
