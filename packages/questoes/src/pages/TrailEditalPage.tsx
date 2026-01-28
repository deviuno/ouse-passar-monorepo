import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Lock, ExternalLink, BookOpen, ArrowLeft } from 'lucide-react';
import { useAuthStore, useUIStore } from '../stores';
import { supabase } from '../services/supabaseClient';
import { TrailsTab } from '../components/practice/TrailsTab';
import { Preparatorio } from '../types';

export const TrailEditalPage: React.FC = () => {
  const navigate = useNavigate();
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuthStore();
  const { setHeaderOverride, clearHeaderOverride } = useUIStore();

  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [hasAccess, setHasAccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Limpar header override ao desmontar
  useEffect(() => {
    return () => {
      clearHeaderOverride();
    };
  }, [clearHeaderOverride]);

  // Atualizar header override quando preparatorio carregar
  useEffect(() => {
    if (preparatorio) {
      setHeaderOverride({
        title: preparatorio.nome,
        subtitle: preparatorio.banca || undefined,
        logoUrl: preparatorio.logo_url || undefined,
        showBackButton: true,
        backPath: '/trilhas',
      });
    }
  }, [preparatorio, setHeaderOverride]);

  useEffect(() => {
    const abortController = new AbortController();

    async function loadData() {
      if (!slug) {
        setError('Preparatório não encontrado');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('[TrailEditalPage] Buscando preparatório:', slug);

        // Buscar preparatório pelo slug
        const { data: prep, error: prepError } = await supabase
          .from('preparatorios')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single()
          .abortSignal(abortController.signal);

        if (abortController.signal.aborted) {
          console.log('[TrailEditalPage] Requisição abortada');
          return;
        }

        if (prepError || !prep) {
          console.error('[TrailEditalPage] Erro ao buscar preparatório:', prepError);
          setError('Preparatório não encontrado');
          setIsLoading(false);
          return;
        }

        console.log('[TrailEditalPage] Preparatório encontrado:', prep.nome);
        setPreparatorio(prep);

        // Verificar se usuário tem acesso
        if (user?.id) {
          const { data: userTrail } = await supabase
            .from('user_trails')
            .select('id')
            .eq('user_id', user.id)
            .eq('preparatorio_id', prep.id)
            .limit(1)
            .abortSignal(abortController.signal);

          if (!abortController.signal.aborted) {
            setHasAccess(!!(userTrail && userTrail.length > 0));
          }
        } else {
          if (!abortController.signal.aborted) {
            setHasAccess(false);
          }
        }
      } catch (err: any) {
        if (err?.name === 'AbortError' || abortController.signal.aborted) {
          console.log('[TrailEditalPage] Requisição cancelada');
          return;
        }
        console.error('[TrailEditalPage] Erro ao carregar dados:', err);
        setError('Erro ao carregar dados');
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      console.log('[TrailEditalPage] Cleanup - abortando requisições');
      abortController.abort();
    };
  }, [slug, user?.id]);

  const handleComprar = () => {
    if (preparatorio?.checkout_trilhas) {
      window.open(preparatorio.checkout_trilhas, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <div className="w-12 h-12 rounded-xl bg-[var(--color-bg-card)] flex items-center justify-center mb-4 shadow-[var(--shadow-card)]">
          <Loader2 className="w-6 h-6 text-[var(--color-brand)] animate-spin" />
        </div>
        <p className="text-[var(--color-text-sec)] text-sm">Carregando trilha...</p>
      </div>
    );
  }

  if (error || !preparatorio) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-card)] flex items-center justify-center mb-4 shadow-[var(--shadow-card)]">
          <BookOpen className="w-8 h-8 text-[var(--color-text-muted)]" />
        </div>
        <h2 className="text-lg font-semibold text-[var(--color-text-main)] mb-2">
          {error || 'Preparatório não encontrado'}
        </h2>
        <button
          onClick={() => navigate('/trilhas')}
          className="mt-4 flex items-center gap-2 text-[var(--color-brand)] hover:text-[var(--color-brand-light)] font-medium transition-colors"
        >
          <ArrowLeft size={16} />
          Voltar para Trilhas
        </button>
      </div>
    );
  }

  // Se não tem acesso, mostrar tela de bloqueio
  if (!hasAccess) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4">
        <div className="max-w-sm w-full bg-[var(--color-bg-card)] rounded-2xl p-8 shadow-[var(--shadow-card)] text-center">
          <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-elevated)] flex items-center justify-center mx-auto mb-5">
            <Lock size={32} className="text-[var(--color-text-muted)]" />
          </div>
          <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
            Acesso Bloqueado
          </h2>
          <p className="text-[var(--color-text-sec)] text-sm mb-6 leading-relaxed">
            Você ainda não tem acesso a esta trilha de questões.
            Adquira agora para desbloquear o edital verticalizado completo!
          </p>

          {preparatorio.checkout_trilhas && (
            <button
              onClick={handleComprar}
              className="w-full bg-[#ffac00] hover:bg-[#ffbc33] text-black font-bold py-3 px-6 rounded-xl transition-all flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
            >
              <ExternalLink size={18} />
              Comprar Acesso
            </button>
          )}

          <button
            onClick={() => navigate('/trilhas')}
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-[var(--color-text-muted)] hover:text-[var(--color-text-main)] font-medium transition-colors"
          >
            <ArrowLeft size={16} />
            Voltar para Trilhas
          </button>
        </div>
      </div>
    );
  }

  // Usuário tem acesso, mostrar o edital
  return (
    <div className="max-w-5xl mx-auto">
      <div className="bg-[var(--color-bg-card)] rounded-xl lg:rounded-2xl shadow-[var(--shadow-card)] overflow-hidden min-h-[calc(100vh-180px)]">
        <TrailsTab
          preparatorioId={preparatorio.id}
          banca={preparatorio.banca}
          preparatorioNome={preparatorio.nome}
          preparatorioSlug={slug}
        />
      </div>
    </div>
  );
};

export default TrailEditalPage;
