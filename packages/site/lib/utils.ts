/**
 * Format a date string to a readable format
 */
export function formatDate(dateString: string | null): string {
    if (!dateString) return '';

    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    };

    return date.toLocaleDateString('pt-BR', options);
}

/**
 * Calculate estimated reading time from HTML content
 */
export function calculateReadTime(content: string): string {
    // Remove HTML tags
    const text = content.replace(/<[^>]*>/g, '');

    // Average reading speed: 200 words per minute
    const wordsPerMinute = 200;
    const wordCount = text.trim().split(/\s+/).length;
    const minutes = Math.ceil(wordCount / wordsPerMinute);

    return `${minutes} min`;
}

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove accents
        .replace(/[^\w\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-') // Replace spaces with hyphens
        .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
        .trim();
}

/**
 * Truncate text to a specified length
 */
export function truncateText(text: string, maxLength: number): string {
    if (text.length <= maxLength) return text;

    return text.substring(0, maxLength).trim() + '...';
}

/**
 * Get avatar URL from author name
 */
export function getAvatarUrl(name: string, avatarUrl?: string | null): string {
    if (avatarUrl) return avatarUrl;

    return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FFB800&color=000`;
}
