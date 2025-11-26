import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, Sparkles, Loader2, CheckCircle } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface Author {
  autor_id: string;
  nome: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

export const NewArticleAI: React.FC = () => {
  const navigate = useNavigate();
  const [authors, setAuthors] = useState<Author[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    authorId: '',
    categoryId: '',
    subject: '',
  });

  useEffect(() => {
    loadAuthors();
    loadCategories();
  }, []);

  const loadAuthors = async () => {
    const { data, error } = await supabase
      .from('autores_artigos')
      .select('autor_id, nome')
      .eq('ativo', true)
      .order('nome');

    if (!error && data) {
      setAuthors(data);
    }
  };

  const loadCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug')
      .order('name');

    if (!error && data) {
      setCategories(data);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // Buscar informações completas do autor e categoria
      const author = authors.find(a => a.autor_id === formData.authorId);
      const category = categories.find(c => c.id === formData.categoryId);

      if (!author || !category) {
        throw new Error('Autor ou categoria não encontrados');
      }

      // Enviar ao webhook
      const response = await fetch('https://72.61.217.225:5678/webhook-test/criar_artigo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subject: formData.subject,
          author_id: formData.authorId,
          author_name: author.nome,
          category_id: formData.categoryId,
          category_name: category.name,
          category_slug: category.slug,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao gerar artigo');
      }

      setSuccess(true);

      // Redirecionar após 2 segundos
      setTimeout(() => {
        navigate('/admin/articles');
      }, 2000);

    } catch (err: any) {
      setError(err.message || 'Erro ao gerar artigo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-dark p-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Link
            to="/admin/articles"
            className="inline-flex items-center text-brand-yellow hover:text-white mb-4 transition-colors font-bold uppercase text-xs tracking-widest"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para Artigos
          </Link>
          <h1 className="text-3xl font-black text-white font-display uppercase mb-2">
            Criar Artigo com IA
          </h1>
          <p className="text-gray-400">
            Gere um artigo completo automaticamente usando inteligência artificial
          </p>
        </div>

        {/* Formulário */}
        <div className="bg-brand-card border border-white/10 p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Autor */}
            <div>
              <label className="block text-sm font-bold text-brand-yellow uppercase tracking-wider mb-2">
                Autor *
              </label>
              <select
                required
                value={formData.authorId}
                onChange={(e) => setFormData({ ...formData, authorId: e.target.value })}
                className="w-full bg-brand-darker border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-brand-yellow transition-colors"
                disabled={loading || success}
              >
                <option value="">Selecione um autor</option>
                {authors.map((author) => (
                  <option key={author.autor_id} value={author.autor_id}>
                    {author.nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Categoria */}
            <div>
              <label className="block text-sm font-bold text-brand-yellow uppercase tracking-wider mb-2">
                Categoria *
              </label>
              <select
                required
                value={formData.categoryId}
                onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                className="w-full bg-brand-darker border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-brand-yellow transition-colors"
                disabled={loading || success}
              >
                <option value="">Selecione uma categoria</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Assunto */}
            <div>
              <label className="block text-sm font-bold text-brand-yellow uppercase tracking-wider mb-2">
                Sugestão de Assunto *
              </label>
              <textarea
                required
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Ex: Técnicas de memorização para concursos públicos, focando em mapas mentais e repetição espaçada..."
                rows={4}
                className="w-full bg-brand-darker border border-white/10 text-white px-4 py-3 focus:outline-none focus:border-brand-yellow transition-colors resize-none placeholder:text-gray-600"
                disabled={loading || success}
              />
              <p className="text-xs text-gray-500 mt-2">
                Descreva o tema e os pontos principais que o artigo deve abordar
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-900/20 border border-red-500/50 rounded-sm p-4">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="bg-green-900/20 border border-green-500/50 rounded-sm p-4 flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <p className="text-green-400 text-sm font-bold">
                  Seu artigo foi gerado com sucesso!
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex gap-4 pt-4">
              <button
                type="submit"
                disabled={loading || success}
                className="flex-1 bg-brand-yellow text-brand-darker px-8 py-4 font-black uppercase tracking-widest hover:bg-brand-yellow/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Gerando artigo...
                  </>
                ) : success ? (
                  <>
                    <CheckCircle className="w-5 h-5" />
                    Artigo gerado!
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Gerar Artigo com IA
                  </>
                )}
              </button>

              {!loading && !success && (
                <Link
                  to="/admin/articles"
                  className="px-8 py-4 border-2 border-white/10 text-white font-bold uppercase tracking-widest hover:border-brand-yellow hover:text-brand-yellow transition-all flex items-center justify-center"
                >
                  Cancelar
                </Link>
              )}
            </div>
          </form>

          {/* Loading Info */}
          {loading && (
            <div className="mt-6 bg-brand-darker border-l-4 border-brand-yellow p-4">
              <p className="text-sm text-gray-300">
                <span className="font-bold text-brand-yellow">Aguarde...</span> A IA está gerando seu artigo.
                Este processo pode levar alguns minutos para garantir um conteúdo de qualidade.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
