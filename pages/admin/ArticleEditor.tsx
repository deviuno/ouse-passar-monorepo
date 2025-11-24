import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Eye, Loader2, AlertCircle } from 'lucide-react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import { createPost, updatePost, getPostBySlugAdmin, BlogPostStatus } from '../../services/blogService';
import { ImageUpload } from '../../components/admin/ImageUpload';

export const ArticleEditor: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug?: string }>();
  const isEditMode = !!slug;

  const [loading, setLoading] = useState(isEditMode);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form fields
  const [title, setTitle] = useState('');
  const [slugValue, setSlugValue] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [content, setContent] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [category, setCategory] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [author, setAuthor] = useState('');
  const [readTime, setReadTime] = useState('');
  const [status, setStatus] = useState<BlogPostStatus>('draft');

  // Load existing article if editing
  useEffect(() => {
    if (isEditMode && slug) {
      loadArticle(slug);
    }
  }, [isEditMode, slug]);

  const loadArticle = async (articleSlug: string) => {
    setLoading(true);
    setError('');
    try {
      const result = await getPostBySlugAdmin(articleSlug);

      if (result.error) {
        setError(result.error);
      } else if (result.post) {
        const post = result.post;
        setTitle(post.title);
        setSlugValue(post.slug);
        setExcerpt(post.excerpt);
        setContent(post.content);
        setImageUrl(post.imageUrl);
        setCategory(post.category);
        setTags(post.tags || []);
        setAuthor(post.author);
        setReadTime(post.readTime);
        setStatus(post.status);
      } else {
        setError('Artigo não encontrado');
      }
    } catch (err) {
      console.error('Erro ao carregar artigo:', err);
      setError('Erro ao carregar artigo: ' + (err instanceof Error ? err.message : String(err)));
    } finally {
      setLoading(false);
    }
  };

  const generateSlug = (text: string) => {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  };

  const handleTitleChange = (value: string) => {
    setTitle(value);
    if (!isEditMode) {
      setSlugValue(generateSlug(value));
    }
  };

  const addTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim())) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(t => t !== tagToRemove));
  };

  const handleSave = async (newStatus: BlogPostStatus) => {
    if (!title.trim() || !content.trim() || !author.trim()) {
      setError('Título, conteúdo e autor são obrigatórios');
      return;
    }

    setSaving(true);
    setError('');
    setSuccess('');

    try {
      const postData = {
        title: title.trim(),
        slug: slugValue.trim() || generateSlug(title),
        excerpt: excerpt.trim(),
        content: content.trim(),
        imageUrl: imageUrl.trim(),
        category: category.trim(),
        tags,
        author: author.trim(),
        readTime: readTime.trim() || '5 min',
        status: newStatus,
        date: new Date().toISOString().split('T')[0]
      };

      let result;
      if (isEditMode) {
        result = await updatePost(slug!, postData);
      } else {
        result = await createPost(postData);
      }

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(isEditMode ? 'Artigo atualizado com sucesso!' : 'Artigo criado com sucesso!');
        setTimeout(() => {
          navigate('/admin/articles');
        }, 1500);
      }
    } catch (err) {
      setError('Erro ao salvar artigo');
    } finally {
      setSaving(false);
    }
  };

  const quillModules = {
    toolbar: [
      [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      ['bold', 'italic', 'underline', 'strike'],
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      [{ 'indent': '-1' }, { 'indent': '+1' }],
      [{ 'align': [] }],
      ['blockquote', 'code-block'],
      ['link', 'image', 'video'],
      [{ 'color': [] }, { 'background': [] }],
      ['clean']
    ]
  };

  const quillFormats = [
    'header', 'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent', 'align',
    'blockquote', 'code-block', 'link', 'image', 'video',
    'color', 'background'
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-white/10">
        <button
          onClick={() => navigate('/admin/articles')}
          className="flex items-center text-gray-400 hover:text-brand-yellow transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Artigos
        </button>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black text-white font-display uppercase mb-2">
              {isEditMode ? 'Editar Artigo' : 'Novo Artigo'}
            </h1>
            <p className="text-gray-400 text-sm">
              {isEditMode ? 'Atualize as informações do artigo' : 'Crie um novo artigo para o blog'}
            </p>
          </div>

          <div className="flex gap-3">
            <button
              onClick={() => handleSave('draft')}
              disabled={saving}
              className="px-6 py-3 bg-white/5 border border-white/10 text-white font-bold uppercase text-sm hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Salvar Rascunho
            </button>
            <button
              onClick={() => handleSave('published')}
              disabled={saving}
              className="px-6 py-3 bg-brand-yellow text-brand-darker font-black uppercase text-sm hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
            >
              {saving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Eye className="w-4 h-4 mr-2" />}
              Publicar
            </button>
          </div>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="mb-6 bg-red-900/20 border border-red-500/50 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-red-400 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-6 bg-green-900/20 border border-green-500/50 p-4 flex items-start">
          <AlertCircle className="w-5 h-5 text-green-400 mr-3 flex-shrink-0 mt-0.5" />
          <p className="text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Form */}
      <div className="space-y-6">
        {/* Top Row - Main Fields */}
        <div className="grid grid-cols-12 gap-4">
          {/* Title - 6 cols */}
          <div className="col-span-6">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Título *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => handleTitleChange(e.target.value)}
              placeholder="Digite o título do artigo"
              className="w-full bg-brand-card border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow transition-colors"
            />
          </div>

          {/* Slug - 3 cols */}
          <div className="col-span-3">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Slug (URL)
            </label>
            <input
              type="text"
              value={slugValue}
              onChange={(e) => setSlugValue(e.target.value)}
              placeholder="url-do-artigo"
              className="w-full bg-brand-card border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow transition-colors font-mono"
            />
          </div>

          {/* Author - 3 cols */}
          <div className="col-span-3">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Autor *
            </label>
            <input
              type="text"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              placeholder="Nome do autor"
              className="w-full bg-brand-card border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow transition-colors"
            />
          </div>
        </div>

        {/* Second Row - Meta Fields */}
        <div className="grid grid-cols-12 gap-4">
          {/* Excerpt - 6 cols */}
          <div className="col-span-6">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Resumo
            </label>
            <textarea
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Breve descrição do artigo"
              rows={2}
              className="w-full bg-brand-card border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow transition-colors resize-none"
            />
          </div>

          {/* Category - 2 cols */}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Categoria
            </label>
            <input
              type="text"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Ex: Estratégia"
              className="w-full bg-brand-card border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow transition-colors"
            />
          </div>

          {/* Read Time - 2 cols */}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Tempo Leitura
            </label>
            <input
              type="text"
              value={readTime}
              onChange={(e) => setReadTime(e.target.value)}
              placeholder="Ex: 5 min"
              className="w-full bg-brand-card border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow transition-colors"
            />
          </div>

          {/* Status - 2 cols */}
          <div className="col-span-2">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as BlogPostStatus)}
              className="w-full bg-brand-card border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow transition-colors"
            >
              <option value="draft">Rascunho</option>
              <option value="published">Publicado</option>
            </select>
          </div>
        </div>

        {/* Third Row - Tags */}
        <div className="grid grid-cols-12 gap-4">
          {/* Tags - 12 cols */}
          <div className="col-span-12">
            <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
              Tags
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                placeholder="Adicionar tag"
                className="flex-1 bg-brand-card border border-white/10 text-white px-3 py-2 text-sm focus:outline-none focus:border-brand-yellow transition-colors"
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-brand-yellow text-brand-darker font-bold text-sm hover:bg-white transition-colors"
              >
                +
              </button>
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="bg-brand-dark border border-white/10 px-2 py-1 text-xs text-gray-300 flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-red-400 hover:text-red-300"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Image Upload */}
        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
            Imagem Destacada
          </label>
          <ImageUpload
            value={imageUrl}
            onChange={setImageUrl}
            folder="article-images"
          />
        </div>

        {/* Content Editor - Full Width */}
        <div>
          <label className="block text-xs font-bold text-gray-300 uppercase tracking-wider mb-2">
            Conteúdo do Artigo *
          </label>
          <div className="article-editor">
            <ReactQuill
              theme="snow"
              value={content}
              onChange={setContent}
              modules={quillModules}
              formats={quillFormats}
              placeholder="Escreva o conteúdo do seu artigo aqui..."
            />
          </div>
        </div>
      </div>

      {/* Custom Styles for Quill Editor */}
      <style>{`
        .article-editor {
          background: #1a1a1a;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .article-editor .ql-toolbar {
          background: #2a2a2a;
          border: none !important;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1) !important;
          padding: 12px;
        }

        .article-editor .ql-container {
          min-height: 500px;
          font-size: 16px;
          font-family: 'Inter', sans-serif;
          background: #1a1a1a;
          border: none !important;
        }

        .article-editor .ql-editor {
          min-height: 500px;
          padding: 20px;
          color: #ffffff;
        }

        .article-editor .ql-editor.ql-blank::before {
          color: rgba(255, 255, 255, 0.4);
          font-style: normal;
        }

        /* Toolbar buttons */
        .article-editor .ql-toolbar button {
          color: #ffffff;
        }

        .article-editor .ql-toolbar button:hover {
          color: #fbbf24;
        }

        .article-editor .ql-toolbar button.ql-active {
          color: #fbbf24;
        }

        .article-editor .ql-toolbar .ql-stroke {
          stroke: #ffffff;
        }

        .article-editor .ql-toolbar .ql-stroke:hover {
          stroke: #fbbf24;
        }

        .article-editor .ql-toolbar .ql-fill {
          fill: #ffffff;
        }

        .article-editor .ql-toolbar .ql-fill:hover {
          fill: #fbbf24;
        }

        .article-editor .ql-toolbar button:hover .ql-stroke {
          stroke: #fbbf24;
        }

        .article-editor .ql-toolbar button:hover .ql-fill {
          fill: #fbbf24;
        }

        .article-editor .ql-toolbar button.ql-active .ql-stroke {
          stroke: #fbbf24;
        }

        .article-editor .ql-toolbar button.ql-active .ql-fill {
          fill: #fbbf24;
        }

        /* Picker labels */
        .article-editor .ql-toolbar .ql-picker-label {
          color: #ffffff;
        }

        .article-editor .ql-toolbar .ql-picker-label:hover {
          color: #fbbf24;
        }

        .article-editor .ql-toolbar .ql-picker-label.ql-active {
          color: #fbbf24;
        }

        .article-editor .ql-toolbar .ql-picker-options {
          background: #2a2a2a;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .article-editor .ql-toolbar .ql-picker-item {
          color: #ffffff;
        }

        .article-editor .ql-toolbar .ql-picker-item:hover {
          color: #fbbf24;
        }

        /* Editor content formatting */
        .article-editor .ql-editor h1,
        .article-editor .ql-editor h2,
        .article-editor .ql-editor h3,
        .article-editor .ql-editor h4,
        .article-editor .ql-editor h5,
        .article-editor .ql-editor h6 {
          color: #ffffff;
        }

        .article-editor .ql-editor a {
          color: #fbbf24;
        }

        .article-editor .ql-editor blockquote {
          border-left-color: #fbbf24;
          color: rgba(255, 255, 255, 0.8);
        }

        .article-editor .ql-editor code,
        .article-editor .ql-editor pre {
          background: #2a2a2a;
          color: #fbbf24;
        }
      `}</style>
    </div>
  );
};
