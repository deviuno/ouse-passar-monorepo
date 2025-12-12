import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Target,
  CheckCircle,
  ArrowRight,
  Clock,
  Shield,
  Zap,
  BookOpen,
  Award,
  Star,
  ChevronDown
} from 'lucide-react';
import { preparatoriosService } from '../services/preparatoriosService';
import { Preparatorio } from '../lib/database.types';
import { SEOHead } from '../components/SEOHead';

export const PlanejamentoVendas: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const [preparatorio, setPreparatorio] = useState<Preparatorio | null>(null);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ rodadas: 0, missoes: 0 });

  useEffect(() => {
    const load = async () => {
      if (!slug) return;

      try {
        const data = await preparatoriosService.getBySlug(slug);
        if (!data || !data.is_active) {
          navigate('/planejamentos');
          return;
        }
        setPreparatorio(data);

        // Load stats
        const statsData = await preparatoriosService.getStats(data.id);
        setStats({ rodadas: statsData.rodadas, missoes: statsData.missoes });
      } catch (error) {
        console.error('Erro ao carregar preparatorio:', error);
        navigate('/planejamentos');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [slug, navigate]);

  const formatPrice = (value: number | null): string => {
    if (!value) return '';
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  };

  const scrollToCheckout = () => {
    const checkoutSection = document.getElementById('checkout-section');
    checkoutSection?.scrollIntoView({ behavior: 'smooth' });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-darker flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-yellow"></div>
      </div>
    );
  }

  if (!preparatorio) {
    return null;
  }

  const hasDiscount = preparatorio.preco_desconto && preparatorio.preco;
  const discountPercentage = hasDiscount
    ? Math.round(((preparatorio.preco! - preparatorio.preco_desconto!) / preparatorio.preco!) * 100)
    : 0;

  return (
    <div className="animate-fade-in bg-brand-darker">
      <SEOHead
        title={`${preparatorio.nome} - Planejamento de Estudos | Ouse Passar`}
        description={preparatorio.descricao_curta || preparatorio.descricao || `Planejamento completo para ${preparatorio.nome}`}
      />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center overflow-hidden">
        {/* Background Image */}
        {preparatorio.imagem_capa && (
          <div className="absolute inset-0">
            <img
              src={preparatorio.imagem_capa}
              alt={preparatorio.nome}
              className="w-full h-full object-cover opacity-20"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-brand-darker via-brand-darker/90 to-brand-darker" />
          </div>
        )}



        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          {/* Logo centralizada no topo */}
          <div className="flex justify-center mb-16">
            <img
              src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
              alt="Ouse Passar"
              className="h-12 md:h-16 object-contain"
            />
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left Content */}
            <div className="text-center lg:text-left">
              {hasDiscount && (
                <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-full text-sm font-bold uppercase mb-6 animate-pulse">
                  <Zap className="w-4 h-4" />
                  {discountPercentage}% de desconto
                </div>
              )}

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white uppercase tracking-tight mb-6">
                Planejamento
                <span className="block" style={{ color: preparatorio.cor }}>
                  {preparatorio.nome}
                </span>
              </h1>

              {preparatorio.descricao_curta && (
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  {preparatorio.descricao_curta}
                </p>
              )}

              {/* Stats */}
              <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-8">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-yellow/10 flex items-center justify-center">
                    <Target className="w-6 h-6 text-brand-yellow" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{stats.rodadas}</p>
                    <p className="text-sm text-gray-400 uppercase">Rodadas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-brand-yellow/10 flex items-center justify-center">
                    <BookOpen className="w-6 h-6 text-brand-yellow" />
                  </div>
                  <div>
                    <p className="text-2xl font-black text-white">{stats.missoes}</p>
                    <p className="text-sm text-gray-400 uppercase">Missoes</p>
                  </div>
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={scrollToCheckout}
                className="group inline-flex items-center gap-3 bg-brand-yellow text-brand-darker px-8 py-4 font-bold uppercase tracking-widest text-lg hover:bg-yellow-400 transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-yellow/20"
              >
                Quero comecar agora
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              {/* Scroll indicator */}
              <div className="mt-12 flex justify-center lg:justify-start">
                <button onClick={scrollToCheckout} className="text-gray-500 animate-bounce">
                  <ChevronDown className="w-8 h-8" />
                </button>
              </div>
            </div>

            {/* Right - Image Preview */}
            {preparatorio.imagem_capa && (
              <div className="hidden lg:block relative">
                <div className="relative rounded-lg overflow-hidden shadow-2xl transition-transform duration-500 hover:scale-105">
                  <img
                    src={preparatorio.imagem_capa}
                    alt={preparatorio.nome}
                    className="w-full h-auto"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                </div>

                {/* Floating badge - Atualizado */}
                <div className="absolute -bottom-6 -left-6 bg-brand-card border border-white/10 rounded-lg p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-green-400" />
                    </div>
                    <div>
                      <p className="text-white font-bold text-sm">Atualizado</p>
                      <p className="text-gray-400 text-xs">{new Date().getFullYear()}</p>
                    </div>
                  </div>
                </div>

                {/* Floating badge - Alunos Aprovados */}
                <div className="absolute -top-4 -right-4 bg-brand-card border border-brand-yellow/30 rounded-lg p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-brand-yellow/20 flex items-center justify-center">
                      <Award className="w-5 h-5 text-brand-yellow" />
                    </div>
                    <div>
                      <p className="text-brand-yellow font-black text-lg">+368</p>
                      <p className="text-gray-400 text-xs uppercase">Alunos aprovados</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 bg-brand-dark border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-4">
              O que voce vai <span className="text-brand-yellow">receber</span>
            </h2>
            <p className="text-gray-400 max-w-2xl mx-auto">
              Um planejamento completo e estruturado para maximizar seus resultados
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: Target,
                title: 'Cronograma Completo',
                description: `${stats.rodadas} rodadas organizadas estrategicamente`
              },
              {
                icon: BookOpen,
                title: 'Missoes Detalhadas',
                description: `${stats.missoes} missoes com instrucoes passo a passo`
              },
              {
                icon: Clock,
                title: 'Otimizado',
                description: 'Maximize seu tempo de estudo com foco no que importa'
              },
              {
                icon: Award,
                title: 'Personalizado',
                description: 'Seu nome e uma mensagem de incentivo exclusiva'
              }
            ].map((benefit, index) => (
              <div
                key={index}
                className="bg-brand-card border border-white/10 rounded-lg p-6 text-center hover:border-brand-yellow/30 transition-all duration-300 hover:-translate-y-1"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <div className="w-14 h-14 rounded-full bg-brand-yellow/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="w-7 h-7 text-brand-yellow" />
                </div>
                <h3 className="text-lg font-bold text-white uppercase mb-2">{benefit.title}</h3>
                <p className="text-gray-400 text-sm">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Description Section */}
      {preparatorio.descricao_vendas && (
        <section className="py-20 bg-brand-darker">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div
              className="sales-content prose prose-invert prose-lg max-w-none"
              dangerouslySetInnerHTML={{ __html: preparatorio.descricao_vendas }}
            />
          </div>

          {/* Styles for rich text content */}
          <style>{`
            .sales-content {
              color: #d1d5db;
            }
            .sales-content h1 {
              font-size: 2.25rem;
              font-weight: 900;
              color: #ffffff;
              text-transform: uppercase;
              letter-spacing: -0.025em;
              margin-bottom: 1.5rem;
            }
            .sales-content h2 {
              font-size: 1.875rem;
              font-weight: 900;
              color: #ffffff;
              text-transform: uppercase;
              letter-spacing: -0.025em;
              margin-bottom: 1rem;
              margin-top: 3rem;
            }
            .sales-content h3 {
              font-size: 1.25rem;
              font-weight: 700;
              color: #fbbf24;
              text-transform: uppercase;
              margin-bottom: 0.75rem;
              margin-top: 2rem;
            }
            .sales-content p {
              margin-bottom: 1rem;
              line-height: 1.75;
            }
            .sales-content strong {
              color: #ffffff;
              font-weight: 700;
            }
            .sales-content ul, .sales-content ol {
              margin: 1.5rem 0;
              padding-left: 1.5rem;
            }
            .sales-content li {
              margin-bottom: 0.75rem;
            }
            .sales-content a {
              color: #fbbf24;
              text-decoration: underline;
            }
            .sales-content a:hover {
              color: #ffffff;
            }
            .sales-content blockquote {
              border-left: 4px solid #fbbf24;
              padding-left: 1rem;
              margin: 1.5rem 0;
              color: rgba(255, 255, 255, 0.8);
              font-style: italic;
            }
            .sales-content code, .sales-content pre {
              background: #2a2a2a;
              color: #fbbf24;
              padding: 0.25rem 0.5rem;
              border-radius: 0.25rem;
            }
            .sales-content img {
              max-width: 100%;
              height: auto;
              border-radius: 0.5rem;
              margin: 1.5rem 0;
            }
          `}</style>
        </section>
      )}

      {/* Testimonials/Social Proof */}
      <section className="py-20 bg-brand-dark border-y border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="flex justify-center gap-1 mb-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-6 h-6 text-brand-yellow fill-brand-yellow" />
            ))}
          </div>
          <p className="text-gray-400 text-lg mb-2">Avaliacao dos alunos</p>
          <p className="text-white text-3xl font-black">Mais de 1.000 aprovados</p>
        </div>
      </section>

      {/* Checkout Section */}
      <section id="checkout-section" className="py-20 bg-brand-darker">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-brand-card border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            {/* Header */}
            <div className="p-8 text-center border-b border-white/10" style={{ backgroundColor: `${preparatorio.cor}10` }}>
              <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight mb-2">
                Garanta seu acesso agora
              </h2>
              <p className="text-gray-400">Comece sua jornada rumo a aprovacao hoje mesmo</p>
            </div>

            {/* Pricing */}
            <div className="p-8 text-center">
              {preparatorio.preco && (
                <div className="mb-8">
                  {hasDiscount ? (
                    <>
                      <p className="text-gray-500 line-through text-xl mb-2">
                        De {formatPrice(preparatorio.preco)}
                      </p>
                      <p className="text-gray-400 text-lg mb-1">Por apenas</p>
                      <p className="text-5xl md:text-6xl font-black text-brand-yellow">
                        {formatPrice(preparatorio.preco_desconto)}
                      </p>
                      <div className="mt-4 inline-flex items-center gap-2 bg-red-500/20 border border-red-500/50 text-red-400 px-4 py-2 rounded-full text-sm font-bold">
                        <Zap className="w-4 h-4" />
                        Economize {formatPrice(preparatorio.preco - preparatorio.preco_desconto!)}
                      </div>
                    </>
                  ) : (
                    <p className="text-5xl md:text-6xl font-black text-brand-yellow">
                      {formatPrice(preparatorio.preco)}
                    </p>
                  )}
                </div>
              )}

              {/* Features List */}
              <ul className="text-left max-w-md mx-auto mb-8 space-y-3">
                {[
                  `${stats.rodadas} rodadas de estudo organizadas`,
                  `${stats.missoes} missoes detalhadas`,
                  'Acesso imediato apos confirmacao',
                  'Planejamento personalizado com seu nome',
                  'Opcao de imprimir ou apresentar em slides'
                ].map((feature, index) => (
                  <li key={index} className="flex items-center gap-3 text-gray-300">
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              {preparatorio.checkout_url ? (
                <a
                  href={preparatorio.checkout_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center justify-center gap-3 w-full md:w-auto bg-brand-yellow text-brand-darker px-12 py-5 font-bold uppercase tracking-widest text-lg hover:bg-yellow-400 transition-all duration-300 hover:scale-105 shadow-lg shadow-brand-yellow/20"
                >
                  Quero garantir minha vaga
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </a>
              ) : (
                <p className="text-gray-500">Em breve disponivel para compra</p>
              )}

              {/* Security badges */}
              <div className="mt-8 pt-8 border-t border-white/10 flex flex-wrap justify-center gap-6 text-gray-500 text-sm">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  <span>Compra segura</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  <span>Acesso imediato</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-20 bg-brand-dark">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight mb-6">
            Sua aprovacao comeca <span className="text-brand-yellow">agora</span>
          </h2>
          <p className="text-gray-400 text-lg mb-8 max-w-2xl mx-auto">
            Nao deixe para depois. Cada dia que passa e um dia a menos de preparacao.
            Invista em voce e conquiste sua vaga.
          </p>
          <button
            onClick={scrollToCheckout}
            className="group inline-flex items-center gap-3 bg-brand-yellow text-brand-darker px-8 py-4 font-bold uppercase tracking-widest text-lg hover:bg-yellow-400 transition-all duration-300 hover:scale-105"
          >
            Comecar minha preparacao
            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
          </button>
        </div>
      </section>
    </div>
  );
};

export default PlanejamentoVendas;
