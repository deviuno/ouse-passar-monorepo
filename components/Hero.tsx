import React, { useState, useEffect } from 'react';
import { ArrowRight, PlayCircle, ShieldCheck } from 'lucide-react';

interface HeroSlide {
  id: number;
  name: string;
  detail: string;
  exam: string;
  image: string;
  quote: string;
}

const HERO_SLIDES: HeroSlide[] = [
  {
    id: 1,
    name: "Lenore Menezes",
    detail: "7º Lugar Geral",
    exam: "PRF 2021",
    image: "https://i.ibb.co/WNzRG2v6/unnamed-3.jpg",
    quote: "O método Ouse Passar mudou minha vida. Deixei de ser amadora e virei profissional."
  },
  {
    id: 2,
    name: "João Carlos",
    detail: "Aprovado",
    exam: "PRF 2021",
    image: "https://i.ibb.co/YxHD82m/unnamed-5.jpg",
    quote: "Segui o cronograma à risca e a aprovação veio na primeira tentativa séria."
  },
  {
    id: 3,
    name: "Gabriel",
    detail: "Aprovado Duplo",
    exam: "PF e Polícia Penal 2021",
    image: "https://i.ibb.co/S7D6LXG3/unnamed-6.jpg",
    quote: "A estratégia de resolução de questões foi fundamental para garantir as duas vagas."
  }
];

export const Hero: React.FC = () => {
  const [currentSlide, setCurrentSlide] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 5000); // 5 seconds per slide

    return () => clearInterval(interval);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center pt-20 overflow-hidden bg-brand-darker">
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-radial from-brand-yellow/10 to-transparent opacity-50 blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-1/3 h-1/2 bg-blue-900/20 blur-3xl pointer-events-none"></div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          
          {/* Copy Content */}
          <div className="lg:col-span-7 text-center lg:text-left">
            <div className="inline-flex items-center px-4 py-2 rounded-sm bg-brand-yellow/10 border border-brand-yellow/20 text-brand-yellow font-bold text-xs uppercase tracking-widest mb-8 animate-fade-in">
              <span className="w-2 h-2 rounded-full bg-brand-yellow mr-2 animate-pulse"></span>
              Inscrições Abertas: PF & PRF 2025
            </div>
            
            <h1 className="font-display text-5xl sm:text-6xl md:text-7xl font-black text-white tracking-tighter leading-[1.1] mb-8">
              SUA NOMEAÇÃO <br/>
              É NOSSA <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-yellow to-brand-yellowHover text-glow">OBSESSÃO.</span>
            </h1>
            
            <p className="text-lg md:text-xl text-gray-400 mb-10 leading-relaxed max-w-2xl mx-auto lg:mx-0 font-light border-l-4 border-brand-yellow pl-6">
              Esqueça métodos arcaicos. O <strong className="text-white">Ouse Passar</strong> entrega a estratégia exata, validada por centenas de aprovados nas carreiras policiais e tribunais mais difíceis do país.
            </p>

            <div className="flex flex-col sm:flex-row gap-5 justify-center lg:justify-start mb-12">
              <button className="group relative px-8 py-4 bg-brand-yellow text-brand-darker font-black text-lg uppercase tracking-wider skew-x-[-10deg] hover:bg-white transition-all duration-300 shadow-[0_0_30px_rgba(255,184,0,0.4)] hover:shadow-[0_0_50px_rgba(255,184,0,0.6)]">
                <span className="flex items-center justify-center skew-x-[10deg]">
                  Quero ser Aprovado
                  <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </button>
              
              <button className="group px-8 py-4 border border-white/20 bg-white/5 text-white font-bold text-lg uppercase tracking-wider skew-x-[-10deg] hover:bg-white/10 transition-all backdrop-blur-sm">
                <span className="flex items-center justify-center skew-x-[10deg]">
                  <PlayCircle className="mr-2 w-5 h-5 text-brand-yellow" />
                  Ver Metodologia
                </span>
              </button>
            </div>

            {/* Social Proof Stats */}
            <div className="grid grid-cols-3 gap-8 border-t border-white/10 pt-8">
              <div>
                <div className="flex items-center justify-center lg:justify-start text-3xl font-black text-white mb-1">
                  1.2k<span className="text-brand-yellow">+</span>
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Aprovados</p>
              </div>
              <div>
                <div className="flex items-center justify-center lg:justify-start text-3xl font-black text-white mb-1">
                  84%
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Taxa de Acerto</p>
              </div>
              <div>
                <div className="flex items-center justify-center lg:justify-start text-3xl font-black text-white mb-1">
                  4.9
                </div>
                <p className="text-xs text-gray-500 uppercase tracking-widest font-bold">Avaliação</p>
              </div>
            </div>
          </div>

          {/* Image/Visual Content (Slideshow) */}
          <div className="lg:col-span-5 relative hidden lg:block h-[600px] w-full">
            <div className="relative z-10 w-full h-full">
                {/* Fixed Background Glow */}
                <div className="absolute inset-0 bg-brand-yellow transform rotate-3 rounded-2xl opacity-20 blur-md z-0"></div>
                
                {HERO_SLIDES.map((slide, index) => (
                  <div 
                    key={slide.id}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
                      index === currentSlide ? 'opacity-100 z-10' : 'opacity-0 z-0'
                    }`}
                  >
                    <img 
                        src={slide.image} 
                        alt={`${slide.name} - ${slide.exam}`} 
                        className="relative rounded-sm shadow-2xl border border-white/10 w-full h-full object-cover object-top mask-gradient"
                        style={{ clipPath: 'polygon(0 0, 100% 0, 100% 85%, 85% 100%, 0 100%)' }}
                    />
                    
                    {/* Floating Card */}
                    <div className="absolute bottom-10 -left-10 bg-brand-card p-6 rounded-sm border-l-4 border-brand-yellow shadow-2xl max-w-xs animate-in slide-in-from-bottom-5 fade-in duration-700 fill-mode-both">
                        <div className="flex items-start mb-3">
                            <div className="bg-green-500/20 p-2 rounded-full mr-3 shrink-0">
                                <ShieldCheck className="w-6 h-6 text-green-500" />
                            </div>
                            <div>
                                <p className="font-bold text-white text-sm leading-tight">{slide.detail}</p>
                                <p className="font-black text-brand-yellow text-lg uppercase leading-none my-1">{slide.name}</p>
                                <p className="text-xs text-gray-400 font-bold uppercase tracking-wider">{slide.exam}</p>
                            </div>
                        </div>
                        <p className="text-xs text-gray-300 italic border-t border-white/10 pt-2 mt-2">"{slide.quote}"</p>
                    </div>
                  </div>
                ))}

                {/* Slider Indicators */}
                <div className="absolute bottom-4 right-4 z-20 flex space-x-2">
                  {HERO_SLIDES.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrentSlide(idx)}
                      className={`h-1 rounded-full transition-all duration-300 ${
                        idx === currentSlide ? 'w-8 bg-brand-yellow' : 'w-2 bg-white/30 hover:bg-white/50'
                      }`}
                    />
                  ))}
                </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};