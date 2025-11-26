import React, { useState, useEffect } from 'react';
import { ArrowLeft, Calendar, Clock, ChevronRight, Hash, Eye, Loader2, Search, X } from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { BlogPost } from '../types';
import { getPublishedPosts, getPostBySlug, getCategories, getPostsByCategory, searchPosts } from '../services/blogService';
import { formatDate, getAvatarUrl } from '../lib/utils';
import { SEOHead } from './SEOHead';
import { PageHero } from './PageHero';
import { useScrollAnimation } from '../lib/useScrollAnimation';

export const BlogList: React.FC = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'recent' | 'oldest' | 'relevant'>('recent');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPosts();
  }, [selectedCategory]);

  useEffect(() => {
    if (searchQuery.trim()) {
      handleSearch();
    } else {
      loadPosts();
    }
  }, [searchQuery]);

  useEffect(() => {
    applySorting();
  }, [sortOrder, allPosts]);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    await loadPosts();
    await loadCategories();
  };

  const loadPosts = async () => {
    setLoading(true);
    setError(null);

    // Load all posts and filter locally for better performance
    const result = await getPublishedPosts(200);

    if (result.error) {
      setError(result.error);
    } else {
      // Filter by category if not "Todos"
      const filteredPosts = selectedCategory === 'Todos'
        ? result.posts
        : result.posts.filter(post => post.category === selectedCategory);

      setAllPosts(filteredPosts);
      applySortingToList(filteredPosts);
    }

    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadPosts();
      return;
    }

    setLoading(true);
    setError(null);

    const result = await searchPosts(searchQuery);

    if (result.error) {
      setError(result.error);
    } else {
      setAllPosts(result.posts);
      applySortingToList(result.posts);
    }

    setLoading(false);
  };

  const applySortingToList = (postList: BlogPost[]) => {
    let sorted = [...postList];

    if (sortOrder === 'recent') {
      sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    } else if (sortOrder === 'oldest') {
      sorted.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    } else if (sortOrder === 'relevant') {
      // Relevant: sort by title length as proxy for quality (can be improved)
      sorted.sort((a, b) => b.title.length - a.title.length);
    }

    setPosts(sorted);
  };

  const applySorting = () => {
    applySortingToList(allPosts);
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSelectedCategory('Todos');
  };

  const loadCategories = async () => {
    // Load all posts to get categories that have articles
    const result = await getPublishedPosts(200);

    if (!result.error && result.posts.length > 0) {
      // Extract unique categories from posts
      const uniqueCategories = Array.from(
        new Set(result.posts.map(post => post.category).filter(Boolean))
      ).sort();

      setCategories(['Todos', ...uniqueCategories]);
    } else {
      // Fallback to API call
      const catResult = await getCategories();
      if (!catResult.error) {
        setCategories(['Todos', ...catResult.categories]);
      }
    }
  };

  return (
    <>
      <SEOHead
        title="Blog Tático - Ouse Passar"
        description="Inteligência, análise de editais e técnicas de estudo. Conteúdo para quem joga o jogo profissional dos concursos públicos."
      />

      <PageHero
        title="Blog"
        titleHighlight="Tático"
        description="Inteligência, análise de editais e técnicas de estudo. Conteúdo para quem joga o jogo profissional."
      >
        {/* Categories Pills */}
        <div className="flex gap-2 flex-wrap justify-end">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 border text-xs font-bold uppercase transition-colors ${selectedCategory === cat
                ? 'border-brand-yellow text-brand-yellow bg-brand-yellow/10'
                : 'border-white/10 text-gray-300 hover:border-brand-yellow hover:text-brand-yellow bg-brand-card'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </PageHero>

      <div className="bg-brand-dark min-h-screen py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Search Bar */}
          <div className="mb-12">
            <div className="max-w-2xl mx-auto relative">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
                <input
                  type="text"
                  placeholder="Buscar artigos por título ou descrição..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-brand-card border border-white/10 text-white pl-12 pr-12 py-4 focus:outline-none focus:border-brand-yellow transition-colors placeholder:text-gray-500 font-light"
                />
                {searchQuery && (
                  <button
                    onClick={clearSearch}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-brand-yellow transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                )}
              </div>
              {searchQuery && (
                <p className="mt-3 text-sm text-gray-400 font-mono">
                  Buscando por: <span className="text-brand-yellow font-bold">"{searchQuery}"</span>
                  {!loading && ` · ${posts.length} resultado${posts.length !== 1 ? 's' : ''} encontrado${posts.length !== 1 ? 's' : ''}`}
                </p>
              )}
            </div>
          </div>

          {/* Sort Filter */}
          <div className="mb-8 flex justify-between items-center">
            <p className="text-gray-400 text-sm font-mono">
              {!loading && `${posts.length} artigo${posts.length !== 1 ? 's' : ''}`}
            </p>
            <div className="flex items-center gap-2">
              <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Ordenar:</span>
              <select
                value={sortOrder}
                onChange={(e) => setSortOrder(e.target.value as 'recent' | 'oldest' | 'relevant')}
                className="bg-brand-card border border-white/10 text-white px-4 py-2 text-xs font-bold uppercase focus:outline-none focus:border-brand-yellow transition-colors cursor-pointer hover:border-brand-yellow"
              >
                <option value="recent">Mais Recentes</option>
                <option value="oldest">Mais Antigos</option>
                <option value="relevant">Mais Relevantes</option>
              </select>
            </div>
          </div>

          {/* Loading State */}
          {loading && (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
              <span className="ml-3 text-gray-400 font-mono uppercase text-sm">Carregando artigos...</span>
            </div>
          )}

          {/* Error State */}
          {error && !loading && (
            <div className="bg-red-900/20 border border-red-500/50 rounded-sm p-8 text-center">
              <p className="text-red-400 font-mono text-sm mb-4">Erro ao carregar artigos</p>
              <p className="text-gray-400 text-xs">{error}</p>
              <button
                onClick={loadPosts}
                className="mt-4 px-6 py-2 bg-brand-yellow text-brand-darker font-bold uppercase text-xs hover:bg-brand-yellow/90 transition-colors"
              >
                Tentar Novamente
              </button>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && posts.length === 0 && (
            <div className="bg-brand-card border border-white/5 rounded-sm p-12 text-center">
              <Hash className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400 font-mono uppercase text-sm">
                {selectedCategory === 'Todos'
                  ? 'Nenhum artigo publicado ainda'
                  : `Nenhum artigo na categoria "${selectedCategory}"`}
              </p>
            </div>
          )}

          {/* Posts Grid */}
          {!loading && !error && posts.length > 0 && (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
              {posts.map((post, index) => (
                <article
                  key={post.id}
                  className="group bg-brand-card border border-white/5 overflow-hidden hover:border-brand-yellow/50 transition-all duration-500 flex flex-col h-full hover:shadow-[0_0_20px_rgba(255,184,0,0.1)] hover:-translate-y-2"
                >
                  <Link to={`/blog/${post.slug}`} className="block h-full flex flex-col">
                    <div className="relative overflow-hidden h-48 sm:h-52">
                      <div className="absolute inset-0 bg-brand-dark/20 group-hover:bg-transparent transition-colors z-10"></div>
                      <img
                        src={post.imageUrl}
                        alt={post.title}
                        className="w-full h-full object-cover transform group-hover:scale-110 transition-transform duration-700"
                      />
                      <div className="absolute top-3 left-3 sm:top-4 sm:left-4 z-20 bg-brand-yellow text-brand-darker px-2.5 py-1 sm:px-3 text-[0.65rem] sm:text-xs font-black uppercase tracking-wide">
                        {post.category}
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 md:p-8 flex-1 flex flex-col">
                      <div className="flex items-center text-gray-500 text-[0.65rem] sm:text-xs mb-3 sm:mb-4 space-x-3 sm:space-x-4 font-mono uppercase">
                        <span className="flex items-center"><Calendar className="w-3 h-3 mr-1" /> {formatDate(post.date)}</span>
                        <span className="flex items-center"><Clock className="w-3 h-3 mr-1" /> {post.readTime}</span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-bold text-white mb-3 sm:mb-4 group-hover:text-brand-yellow transition-colors leading-tight">
                        {post.title}
                      </h2>

                      <p className="text-gray-400 text-sm mb-4 sm:mb-6 line-clamp-3 flex-1 leading-relaxed border-l-2 border-white/10 pl-3 sm:pl-4">
                        {post.excerpt}
                      </p>

                      <div className="mt-auto flex items-center justify-between pt-4 sm:pt-6 border-t border-white/5">
                        <span className="text-[0.65rem] sm:text-xs font-bold text-gray-500 uppercase">Por {post.author}</span>
                        <span className="flex items-center text-brand-yellow text-[0.65rem] sm:text-xs font-black uppercase tracking-widest group-hover:translate-x-1 transition-transform">
                          Ler Artigo <ChevronRight className="ml-1 w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

/**
 * Process HTML content to handle line breaks (\n and \n\n)
 * Converts text line breaks to HTML where needed
 */
const processHtmlContent = (html: string): string => {
  if (!html) return '';

  // Only process if the content has literal \n characters (not already processed)
  // Check if content already has proper HTML tags
  const hasHtmlTags = /<(p|br|div|h[1-6]|ul|ol|li|blockquote|pre)[\s>]/i.test(html);

  // If already has HTML structure, just handle any remaining \n in text nodes
  if (hasHtmlTags) {
    // Replace \n\n with <br><br> for paragraph breaks in text
    // Replace single \n with <br> for line breaks in text
    return html
      .replace(/\n\n/g, '<br><br>')
      .replace(/\n/g, '<br>');
  }

  // If content is plain text with \n, convert to HTML
  // Split by double line breaks to create paragraphs
  const paragraphs = html.split(/\n\n+/);

  return paragraphs
    .map(para => {
      // Replace single line breaks within paragraph with <br>
      const content = para.trim().replace(/\n/g, '<br>');
      return content ? `<p>${content}</p>` : '';
    })
    .filter(Boolean)
    .join('\n');
};

export const BlogPostView: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (slug) {
      loadPost(slug);
    }
  }, [slug]);

  const loadPost = async (slug: string) => {
    setLoading(true);
    try {
      const data = await getPostBySlug(slug);
      if (data.post) {
        setPost(data.post);
      } else {
        setError('Artigo não encontrado');
      }
    } catch (err) {
      setError('Erro ao carregar o artigo');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-dark">
        <Loader2 className="w-12 h-12 text-brand-yellow animate-spin" />
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4 bg-brand-dark">
        <h2 className="text-2xl font-bold text-white mb-4">{error || 'Artigo não encontrado'}</h2>
        <Link to="/blog" className="text-brand-yellow hover:underline">
          Voltar para o Blog
        </Link>
      </div>
    );
  }

  // Generate canonical URL
  const canonicalUrl = `https://ousepassar.com.br/blog/${post.slug}`;

  // Create meta description optimized for SEO
  const metaDescription = post.excerpt || `${post.title} - Preparação estratégica para concursos públicos. ${post.category}. Leitura de ${post.readTime}.`;

  return (
    <>
      <SEOHead
        title={`${post.title} | Ouse Passar - Preparação para Concursos`}
        description={metaDescription}
        image={post.imageUrl}
        url={canonicalUrl}
        type="article"
        author={post.author}
        publishedTime={post.date}
        tags={post.keywords || post.tags}
      />
      <article className="bg-brand-dark min-h-screen pb-24">
        {/* Progress Bar placeholder */}
        <div className="fixed top-0 left-0 h-1 bg-brand-yellow w-full z-50 origin-left transform scale-x-0 animate-[progress_1s_ease-out_forwards]"></div>

        {/* Header com imagem de fundo */}
        <header
          className="w-full border-b border-white/10 relative overflow-hidden"
          style={{
            backgroundImage: `url(${post.imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
          }}
        >
          {/* Overlay escuro para legibilidade */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black/75 to-black/90"></div>

          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 md:py-16 lg:py-20 relative z-10">
            <Link
              to="/blog"
              className="inline-flex items-center text-brand-yellow hover:text-white mb-6 sm:mb-8 transition-colors font-bold uppercase text-[0.65rem] sm:text-xs tracking-widest"
            >
              <ArrowLeft className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
              Voltar para o Blog
            </Link>

            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-4 sm:mb-6">
              <span className="bg-brand-yellow text-brand-darker px-2.5 py-1 sm:px-3 text-[0.6rem] sm:text-[0.65rem] font-black uppercase tracking-[0.15em] sm:tracking-[0.2em]">
                {post.category}
              </span>
              {post.tags && post.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="bg-white/5 text-gray-300 px-2.5 py-1 sm:px-3 text-[0.6rem] sm:text-[0.65rem] font-bold uppercase tracking-[0.15em] sm:tracking-[0.2em] backdrop-blur-sm"
                >
                  #{tag}
                </span>
              ))}
            </div>

            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white font-display leading-tight mb-4 sm:mb-6 drop-shadow-[0_2px_10px_rgba(0,0,0,0.9)]">
              {post.title}
            </h1>

            <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-gray-200 text-[0.65rem] sm:text-xs font-medium mt-4 sm:mt-6">
              <div className="flex items-center bg-black/40 backdrop-blur-sm px-2.5 py-1.5 sm:px-3 sm:py-2 rounded">
                <img
                  src={post.authorAvatar || getAvatarUrl(post.author)}
                  alt={post.author}
                  className="w-7 h-7 sm:w-9 sm:h-9 rounded-full border-2 border-brand-yellow mr-2 sm:mr-3"
                />
                <span className="uppercase tracking-[0.15em] sm:tracking-[0.2em]">{post.author}</span>
              </div>
              <div className="flex items-center bg-black/40 backdrop-blur-sm px-2.5 py-1.5 sm:px-3 sm:py-2 rounded">
                <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-brand-yellow" />
                <span className="uppercase tracking-[0.15em] sm:tracking-[0.2em]">{formatDate(post.date)}</span>
              </div>
              <div className="flex items-center bg-black/40 backdrop-blur-sm px-2.5 py-1.5 sm:px-3 sm:py-2 rounded">
                <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1.5 sm:mr-2 text-brand-yellow" />
                <span className="uppercase tracking-[0.15em] sm:tracking-[0.2em]">{post.readTime}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Conteúdo em container de leitura */}
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 md:mt-12">
          <div className="bg-brand-card/60 border border-white/10 px-4 sm:px-6 md:px-10 lg:px-12 py-8 sm:py-10 md:py-12">
            <div className="blog-content">
              <div dangerouslySetInnerHTML={{ __html: processHtmlContent(post.content) }} />
            </div>

            {/* Tags Estruturadas */}
            {(post.tags && post.tags.length > 0) || (post.keywords && post.keywords.length > 0) ? (
              <div className="mt-8 sm:mt-10 md:mt-12 pt-6 sm:pt-8 border-t-2 border-brand-yellow/30">
                <div className="flex items-center gap-2 mb-3 sm:mb-4">
                  <Hash className="w-4 h-4 sm:w-5 sm:h-5 text-brand-yellow" />
                  <h3 className="text-xs sm:text-sm font-black text-brand-yellow uppercase tracking-widest">
                    Tópicos Estratégicos
                  </h3>
                </div>
                <div className="flex flex-wrap gap-1.5 sm:gap-2">
                  {(post.keywords || post.tags)?.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center gap-1 px-3 py-1.5 sm:px-4 sm:py-2 bg-brand-darker/80 border border-brand-yellow/20 text-gray-300 text-[0.65rem] sm:text-xs font-bold hover:border-brand-yellow hover:text-brand-yellow transition-all cursor-default"
                    >
                      <span className="text-brand-yellow">#</span>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            ) : null}

            {/* CTA Box */}
            <div className="mt-12 sm:mt-16 md:mt-20 bg-brand-yellow relative overflow-hidden rounded-sm p-8 sm:p-10 md:p-14 text-center">
              <div className="relative z-10">
                <h3 className="text-xl sm:text-2xl md:text-3xl font-black text-brand-darker mb-3 sm:mb-4 font-display uppercase leading-tight">
                  Não estude errado.
                </h3>
                <p className="text-brand-darker/80 mb-6 sm:mb-8 max-w-xl mx-auto font-medium text-sm sm:text-base">
                  Esse conteúdo é apenas a ponta do iceberg. Nossa plataforma completa tem o cronograma exato para sua aprovação.
                </p>
                <button className="bg-brand-darker text-white px-6 py-3 sm:px-8 sm:py-4 font-black uppercase tracking-widest hover:scale-105 transition-transform shadow-2xl text-xs sm:text-sm">
                  Destravar Minha Aprovação
                </button>
              </div>
              {/* Background pattern */}
              <div className="absolute top-0 right-0 w-48 h-48 sm:w-64 sm:h-64 bg-white/20 rounded-full mix-blend-overlay blur-3xl -translate-y-1/2 translate-x-1/2"></div>
            </div>
          </div>
        </div>
      </article>
    </>
  );
};