export const getOptimizedImageUrl = (url: string | null | undefined, width: number = 400, quality: number = 80): string => {
    if (!url) return '';
    if (url.includes('base64')) return url;

    // If it's a Supabase Storage URL, we can append transformation params
    if (url.includes('supabase.co/storage/v1/object/public')) {
        // Check if it already has query params
        const separator = url.includes('?') ? '&' : '?';
        return `${url}${separator}width=${width}&quality=${quality}`;
    }

    return url;
};
