import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Map, Loader2, ExternalLink, CheckCircle, ShoppingBag } from 'lucide-react';
import { useAuthStore, useUIStore } from '../stores';
import { getPreparatoriosForTrilhasStore, TrilhasStoreItem } from '../services/preparatoriosService';
import { getOptimizedImageUrl } from '../utils/image';

export const TrailsPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { setHeaderOverride, clearHeaderOverride } = useUIStore();
  const [preparatorios, setPreparatorios] = useState<TrilhasStoreItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Configurar header override
  useEffect(() => {
    setHeaderOverride({
      title: 'Trilhas de Questões',
      showBackButton: true,
      backPath: '/questoes',
    });

    return () => {
      clearHeaderOverride();
    };
  }, [setHeaderOverride, clearHeaderOverride]);

  useEffect(() => {
    const abortController = new AbortController();
    const startTime = Date.now();

    async function loadPreparatorios() {
      console.log('[TrailsPage] Iniciando carregamento...', { userId: user?.id, timestamp: new Date().toISOString() });
      setIsLoading(true);

      try {
        console.log('[TrailsPage] Chamando getPreparatoriosForTrilhasStore...');
        const data = await getPreparatoriosForTrilhasStore(user?.id);

        // Verificar se o componente ainda está montado
        if (abortController.signal.aborted) {
          console.log('[TrailsPage] Requisição abortada, ignorando dados');
          return;
        }

        console.log('[TrailsPage] Dados recebidos:', { count: data.length, elapsed: Date.now() - startTime + 'ms' });
        setPreparatorios(data);
      } catch (error: any) {
        if (error?.name === 'AbortError' || abortController.signal.aborted) {
          console.log('[TrailsPage] Requisição cancelada');
          return;
        }
        console.error('[TrailsPage] Erro ao carregar preparatórios:', error);
      } finally {
        if (!abortController.signal.aborted) {
          setIsLoading(false);
          console.log('[TrailsPage] Carregamento finalizado em', Date.now() - startTime + 'ms');
        }
      }
    }

    loadPreparatorios();

    return () => {
      console.log('[TrailsPage] Cleanup - abortando requisições pendentes');
      abortController.abort();
    };
  }, [user?.id]);

  const handleComprar = (prep: TrilhasStoreItem) => {
    if (prep.checkout_trilhas) {
      window.open(prep.checkout_trilhas, '_blank');
    }
  };

  const handleAcessar = (prep: TrilhasStoreItem) => {
    navigate(`/trilhas/${prep.slug}`);
  };

  const formatPrice = (price?: number) => {
    if (!price) return 'Grátis';
    return `R$ ${price.toFixed(2).replace('.', ',')}`;
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-main)] theme-transition">
      {/* Content */}
      <div className="max-w-6xl mx-auto p-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-[var(--color-success)] animate-spin" />
          </div>
        ) : preparatorios.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="p-4 bg-[var(--color-bg-elevated)] rounded-full mb-4">
              <ShoppingBag size={48} className="text-[var(--color-text-muted)]" />
            </div>
            <h2 className="text-xl font-bold text-[var(--color-text-main)] mb-2">
              Nenhuma trilha disponível
            </h2>
            <p className="text-[var(--color-text-sec)] max-w-md">
              No momento não há trilhas de questões disponíveis para compra.
              Volte em breve para conferir as novidades!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {preparatorios.map((prep) => (
              <div
                key={prep.id}
                className="bg-[var(--color-bg-card)] border border-[var(--color-bg-elevated)] rounded-xl overflow-hidden hover:border-[var(--color-border)] transition-all group theme-transition"
              >
                {/* Imagem de Capa */}
                <div className="relative h-40 bg-[var(--color-bg-elevated)] overflow-hidden">
                  {prep.imagem_capa ? (
                    <img
                      src={getOptimizedImageUrl(prep.imagem_capa, 400, 80)}
                      alt={prep.nome}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Map size={48} className="text-[var(--color-text-muted)]" />
                    </div>
                  )}
                  {/* Badge de acesso */}
                  {prep.userHasAccess && (
                    <div className="absolute top-2 right-2 bg-[var(--color-success)] text-white text-xs font-bold px-2 py-1 rounded-full flex items-center gap-1">
                      <CheckCircle size={12} />
                      Liberado
                    </div>
                  )}
                  {/* Logo do órgão */}
                  {prep.logo_url && (
                    <div className="absolute bottom-2 left-2 w-10 h-10 bg-white rounded-lg p-1 shadow-lg">
                      <img
                        src={getOptimizedImageUrl(prep.logo_url, 80, 80)}
                        alt={prep.orgao || ''}
                        className="w-full h-full object-contain"
                        loading="lazy"
                      />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="p-4">
                  {/* Banca badge */}
                  {prep.banca && (
                    <span className="text-xs font-bold text-[var(--color-brand)] uppercase tracking-wide">
                      {prep.banca}
                    </span>
                  )}

                  <h3 className="text-lg font-bold text-[var(--color-text-main)] mt-1 line-clamp-2">
                    {prep.nome}
                  </h3>

                  {prep.descricao_curta && (
                    <p className="text-sm text-[var(--color-text-sec)] mt-1 line-clamp-2">
                      {prep.descricao_curta}
                    </p>
                  )}

                  {/* Preço - só mostra se o usuário NÃO tem acesso */}
                  {!prep.userHasAccess && (
                    <div className="mt-4 flex items-center justify-between">
                      <div>
                        {prep.preco_trilhas_desconto ? (
                          <div className="flex items-center gap-2">
                            <span className="text-[var(--color-text-muted)] line-through text-sm">
                              {formatPrice(prep.preco_trilhas)}
                            </span>
                            <span className="text-[var(--color-success)] font-bold text-lg">
                              {formatPrice(prep.preco_trilhas_desconto)}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[var(--color-text-main)] font-bold text-lg">
                            {formatPrice(prep.preco_trilhas)}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Botão */}
                  <div className="mt-4">
                    {prep.userHasAccess ? (
                      <button
                        onClick={() => handleAcessar(prep)}
                        className="w-full bg-[var(--color-success)] hover:brightness-110 text-white font-bold py-3 px-4 rounded-lg transition-all flex items-center justify-center gap-2"
                      >
                        Acessar Trilha
                      </button>
                    ) : (
                      <button
                        onClick={() => handleComprar(prep)}
                        disabled={!prep.checkout_trilhas}
                        className="w-full bg-[var(--color-brand)] hover:bg-[var(--color-brand-hover)] text-black font-bold py-3 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <ExternalLink size={18} />
                        Comprar Acesso
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrailsPage;
