import React, { useEffect } from 'react';

interface SEOHeadProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article';
    author?: string;
    publishedTime?: string;
    tags?: string[];
}

export const SEOHead: React.FC<SEOHeadProps> = ({
    title = 'Ouse Passar - Preparação Estratégica para Concursos Públicos',
    description = 'Plataforma completa de preparação para concursos públicos com metodologia comprovada, análise de editais e técnicas de estudo profissionais.',
    image = 'https://ousepassar.com.br/og-image.jpg',
    url = 'https://ousepassar.com.br',
    type = 'website',
    author,
    publishedTime,
    tags,
}) => {
    useEffect(() => {
        // Update document title
        document.title = title;

        // Update or create meta tags
        updateMetaTag('description', description);
        updateMetaTag('og:title', title, 'property');
        updateMetaTag('og:description', description, 'property');
        updateMetaTag('og:image', image, 'property');
        updateMetaTag('og:url', url, 'property');
        updateMetaTag('og:type', type, 'property');

        // Twitter Card tags
        updateMetaTag('twitter:card', 'summary_large_image');
        updateMetaTag('twitter:title', title);
        updateMetaTag('twitter:description', description);
        updateMetaTag('twitter:image', image);

        // Article-specific tags
        if (type === 'article') {
            if (author) {
                updateMetaTag('article:author', author, 'property');
            }
            if (publishedTime) {
                updateMetaTag('article:published_time', publishedTime, 'property');
            }
            if (tags && tags.length > 0) {
                // Remove existing article:tag tags
                document.querySelectorAll('meta[property="article:tag"]').forEach(el => el.remove());
                // Add new tags
                tags.forEach(tag => {
                    const meta = document.createElement('meta');
                    meta.setAttribute('property', 'article:tag');
                    meta.setAttribute('content', tag);
                    document.head.appendChild(meta);
                });
            }
        }

        // Canonical URL
        updateLinkTag('canonical', url);

        // Additional SEO meta tags
        updateMetaTag('robots', 'index, follow');
        updateMetaTag('language', 'pt-BR');
        updateMetaTag('revisit-after', '7 days');

        // Open Graph locale
        updateMetaTag('og:locale', 'pt_BR', 'property');
        updateMetaTag('og:site_name', 'Ouse Passar', 'property');

        // Keywords (if tags available)
        if (tags && tags.length > 0) {
            updateMetaTag('keywords', tags.join(', '));
        }
    }, [title, description, image, url, type, author, publishedTime, tags]);

    return null; // This component doesn't render anything
};

function updateMetaTag(name: string, content: string, attribute: 'name' | 'property' = 'name') {
    let element = document.querySelector(`meta[${attribute}="${name}"]`);

    if (!element) {
        element = document.createElement('meta');
        element.setAttribute(attribute, name);
        document.head.appendChild(element);
    }

    element.setAttribute('content', content);
}

function updateLinkTag(rel: string, href: string) {
    let element = document.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement;

    if (!element) {
        element = document.createElement('link');
        element.setAttribute('rel', rel);
        document.head.appendChild(element);
    }

    element.href = href;
}
