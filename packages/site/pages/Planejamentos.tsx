import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Target, Book, ArrowRight, Sparkles } from 'lucide-react';
import { preparatoriosService } from '../services/preparatoriosService';
import { Preparatorio } from '../lib/database.types';
import { SEOHead } from '../components/SEOHead';
import { PageHero } from '../components/PageHero';

export const Planejamentos: React.FC = () => {
  const [preparatorios, setPreparatorios] = useState<Preparatorio[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPreparatorios = async () => {
      try {
        const data = await preparatoriosService.getAll(false); // Only active ones
        setPreparatorios(data);
      } catch (error) {
        console.error('Erro ao carregar preparatorios:', error);
      } finally {
        setLoading(false);
      }
    };

    loadPreparatorios();
  }, []);

  const formatPrice = (value: number | null): string => {
    if (!value) return '';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in">
      <SEOHead
        title="Planejamentos de Estudo | Ouse Passar"
        description="Escolha o planejamento perfeito para seu concurso. Cronogramas completos e personalizados para sua aprovacao."
      />

      <PageHero
        title="Planejamentos de"
        titleHighlight="Estudo"
        description="Escolha o planejamento ideal para o seu concurso e comece sua jornada rumo a aprovacao"
      />

      <section className="py-20 bg-brand-darker">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {preparatorios.length === 0 ? (
            <div className="text-center py-16">
              <Book className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-white mb-2">Nenhum planejamento disponivel</h3>
              <p className="text-gray-500">Em breve teremos novos planejamentos para voce.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {preparatorios.map((prep, index) => (
                <Link
                  key={prep.id}
                  to={`/planejamento/${prep.slug}`}
                  className="group"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="bg-brand-card border border-white/10 rounded-lg overflow-hidden transition-all duration-500 hover:border-brand-yellow/50 hover:shadow-2xl hover:shadow-brand-yellow/10 hover:-translate-y-2">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      {prep.imagem_capa ? (
                        <img
                          src={prep.imagem_capa}
                          alt={prep.nome}
                          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ backgroundColor: `${prep.cor}20` }}
                        >
                          <Book className="w-16 h-16" style={{ color: prep.cor }} />
                        </div>
                      )}
                      {/* Overlay gradient */}
                      <div className="absolute inset-0 bg-gradient-to-t from-brand-card via-transparent to-transparent" />

                      {/* Badge */}
                      {prep.preco_desconto && prep.preco && (
                        <div className="absolute top-4 right-4 bg-red-500 text-white px-3 py-1 text-xs font-bold uppercase rounded-full animate-pulse">
                          {Math.round(((prep.preco - prep.preco_desconto) / prep.preco) * 100)}% OFF
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-6">
                      <div
                        className="w-12 h-1 mb-4 transition-all duration-300 group-hover:w-20"
                        style={{ backgroundColor: prep.cor }}
                      />

                      <h3 className="text-xl font-black text-white uppercase mb-2 tracking-tight">
                        {prep.nome}
                      </h3>

                      {prep.descricao_curta && (
                        <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                          {prep.descricao_curta}
                        </p>
                      )}

                      {/* Price */}
                      {(prep.preco || prep.preco_desconto) && (
                        <div className="mb-4">
                          {prep.preco_desconto ? (
                            <div className="flex items-baseline gap-2">
                              <span className="text-gray-500 line-through text-sm">
                                {formatPrice(prep.preco)}
                              </span>
                              <span className="text-2xl font-black text-brand-yellow">
                                {formatPrice(prep.preco_desconto)}
                              </span>
                            </div>
                          ) : (
                            <span className="text-2xl font-black text-brand-yellow">
                              {formatPrice(prep.preco)}
                            </span>
                          )}
                        </div>
                      )}

                      {/* CTA */}
                      <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider transition-colors" style={{ color: prep.cor }}>
                        <span>Ver detalhes</span>
                        <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-2" />
                      </div>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-brand-dark border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
              Por que escolher nossos <span className="text-brand-yellow">planejamentos</span>?
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-brand-card border border-white/10 rounded-lg p-8 text-center hover:border-brand-yellow/30 transition-colors">
              <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target className="w-8 h-8 text-brand-yellow" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase mb-3">Foco Total</h3>
              <p className="text-gray-400 text-sm">
                Cronogramas desenvolvidos especificamente para cada carreira, maximizando seu tempo de estudo.
              </p>
            </div>

            <div className="bg-brand-card border border-white/10 rounded-lg p-8 text-center hover:border-brand-yellow/30 transition-colors">
              <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Sparkles className="w-8 h-8 text-brand-yellow" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase mb-3">Personalizado</h3>
              <p className="text-gray-400 text-sm">
                Cada planejamento e gerado com seu nome e uma mensagem de incentivo unica para voce.
              </p>
            </div>

            <div className="bg-brand-card border border-white/10 rounded-lg p-8 text-center hover:border-brand-yellow/30 transition-colors">
              <div className="w-16 h-16 bg-brand-yellow/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <Book className="w-8 h-8 text-brand-yellow" />
              </div>
              <h3 className="text-lg font-bold text-white uppercase mb-3">Completo</h3>
              <p className="text-gray-400 text-sm">
                Rodadas organizadas com missoes detalhadas cobrindo todo o edital do seu concurso.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Planejamentos;
