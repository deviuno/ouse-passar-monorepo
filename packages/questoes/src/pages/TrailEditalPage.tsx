import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, Lock, ExternalLink } from 'lucide-react';
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
    let isMounted = true;
    let timeoutId: ReturnType<typeof setTimeout>;

    async function loadData() {
      if (!slug) {
        setError('Preparatório não encontrado');
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      setError(null);

      // Timeout de segurança de 10 segundos
      timeoutId = setTimeout(() => {
        if (isMounted) {
          console.warn('[TrailEditalPage] Timeout ao carregar dados');
          setError('Tempo limite excedido. Tente novamente.');
          setIsLoading(false);
        }
      }, 10000);

      try {
        // Buscar preparatório pelo slug
        const { data: prep, error: prepError } = await supabase
          .from('preparatorios')
          .select('*')
          .eq('slug', slug)
          .eq('is_active', true)
          .single();

        if (!isMounted) return;

        if (prepError || !prep) {
          setError('Preparatório não encontrado');
          setIsLoading(false);
          return;
        }

        setPreparatorio(prep);

        // Verificar se usuário tem acesso
        if (user?.id) {
          const { data: userTrail } = await supabase
            .from('user_trails')
            .select('id')
            .eq('user_id', user.id)
            .eq('preparatorio_id', prep.id)
            .limit(1);

          if (isMounted) {
            setHasAccess(!!(userTrail && userTrail.length > 0));
          }
        } else {
          if (isMounted) {
            setHasAccess(false);
          }
        }
      } catch (err) {
        console.error('Erro ao carregar dados:', err);
        if (isMounted) {
          setError('Erro ao carregar dados');
        }
      } finally {
        if (isMounted) {
          clearTimeout(timeoutId);
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
      clearTimeout(timeoutId);
    };
  }, [slug, user?.id]);

  const handleComprar = () => {
    if (preparatorio?.checkout_trilhas) {
      window.open(preparatorio.checkout_trilhas, '_blank');
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  if (error || !preparatorio) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-400">{error || 'Preparatório não encontrado'}</p>
        <button
          onClick={() => navigate('/trilhas')}
          className="mt-4 text-[#FFB800] hover:underline"
        >
          Voltar para Trilhas
        </button>
      </div>
    );
  }

  // Se não tem acesso, mostrar tela de bloqueio
  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4">
        <div className="p-4 bg-[#2A2A2A] rounded-full mb-4">
          <Lock size={48} className="text-gray-500" />
        </div>
        <h2 className="text-xl font-bold text-white mb-2 text-center">
          Acesso Bloqueado
        </h2>
        <p className="text-gray-400 max-w-md text-center mb-6">
          Você ainda não tem acesso a esta trilha de questões.
          Adquira agora para desbloquear o edital verticalizado completo!
        </p>

        {preparatorio.checkout_trilhas && (
          <button
            onClick={handleComprar}
            className="bg-[#FFB800] hover:bg-[#FFC933] text-[#121212] font-bold py-3 px-6 rounded-lg transition-colors flex items-center gap-2"
          >
            <ExternalLink size={18} />
            Comprar Acesso
          </button>
        )}

        <button
          onClick={() => navigate('/trilhas')}
          className="mt-4 text-gray-400 hover:text-white transition-colors"
        >
          Voltar para Trilhas
        </button>
      </div>
    );
  }

  // Usuário tem acesso, mostrar o edital
  return (
    <div className="max-w-6xl mx-auto">
      <div className="min-h-[calc(100vh-120px)] bg-[#1A1A1A] border-x border-[#2A2A2A]">
        <TrailsTab
          preparatorioId={preparatorio.id}
          banca={preparatorio.banca}
          preparatorioNome={preparatorio.nome}
        />
      </div>
    </div>
  );
};

export default TrailEditalPage;
