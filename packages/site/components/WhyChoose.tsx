import React from 'react';
import { CheckCircle2 } from 'lucide-react';
import { useScrollAnimation } from '../lib/useScrollAnimation';

export const WhyChoose: React.FC = () => {
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.2 });

  return (
    <section className="pt-24 pb-0 bg-brand-darker relative border-t border-white/5" style={{ overflow: 'clip' }}>
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-b from-brand-yellow/5 to-transparent pointer-events-none"></div>

      {/* Image as Background - Positioned absolutely on the right side */}
      <div className="hidden lg:block absolute right-0 bottom-0 top-24 w-[60%] pointer-events-none z-0">
        <div className="absolute right-0 bottom-0 h-full flex items-end justify-end overflow-visible">
          <img
            src="https://ousepassar.com/wp-content/uploads/2025/02/PQ-devo-escolher-copiar.webp"
            alt="Alunos Ouse Passar"
            className="h-full w-auto max-w-none object-contain object-bottom-right drop-shadow-2xl mask-bottom-fade"
            style={{ display: 'block', marginRight: '-10%' }}
          />
        </div>
        {/* Glow effect behind image */}
        <div className="absolute bottom-0 right-1/4 w-[50%] h-[50%] bg-brand-yellow/10 rounded-t-full blur-3xl -z-10"></div>
      </div>

      <div ref={sectionRef} className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-16 items-center lg:items-end min-h-[600px] lg:min-h-[700px]">

          {/* Text Content */}
          <div className="relative z-20 pb-24">
            <div className={`inline-block mb-6 scroll-animate ${isVisible ? 'visible animate-fade-in-left' : ''}`}>
               <div className="flex items-center space-x-2">
                 <span className="h-1 w-10 bg-brand-yellow"></span>
                 <span className="text-brand-yellow font-bold uppercase tracking-widest text-xs">Diferencial</span>
               </div>
            </div>

            <h2 className={`text-4xl md:text-5xl font-black text-white font-display leading-tight mb-8 scroll-animate ${isVisible ? 'visible animate-fade-in-up stagger-1' : ''}`}>
              Por que devo escolher o <br/>
              <span className="text-brand-yellow">Ouse Passar?</span>
            </h2>

            <div className={`space-y-6 text-gray-400 text-lg font-light leading-relaxed mb-10 scroll-animate ${isVisible ? 'visible animate-fade-in-up stagger-2' : ''}`}>
              <p>
                O nosso grande diferencial é a <strong className="text-white font-bold">metodologia Ouse Passar</strong> e nossa plataforma de estudos.
              </p>
              <p>
                Com nossa metodologia você consegue <strong className="text-white font-bold">estudar menos tempo e aprender muito mais</strong> do que os outros concurseiros.
              </p>
              <p className="border-l-4 border-brand-yellow pl-6 italic text-white/80">
                Além disso nossa plataforma tem tudo para que você não precise de absolutamente <strong className="text-brand-yellow">NADA</strong> por fora e tenha toda a tranquilidade de estar estudando com uma metodologia que funciona.
              </p>
            </div>

            <div className={`grid sm:grid-cols-2 gap-4 scroll-animate ${isVisible ? 'visible animate-fade-in-up stagger-3' : ''}`}>
              {[
                "Metodologia 80/20",
                "Plataforma Completa",
                "Estudo Otimizado",
                "Tranquilidade Total"
              ].map((item, index) => (
                <div key={index} className="flex items-center bg-brand-card border border-white/5 p-3 rounded-sm hover:border-brand-yellow/30 transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-brand-yellow/20">
                  <CheckCircle2 className="w-5 h-5 text-brand-yellow mr-3 flex-shrink-0" />
                  <span className="text-white font-bold text-sm uppercase">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Empty column for spacing - mobile image */}
          <div className="lg:hidden relative order-1">
            <img
              src="https://ousepassar.com/wp-content/uploads/2025/02/PQ-devo-escolher-copiar.webp"
              alt="Alunos Ouse Passar"
              className="w-full h-auto drop-shadow-2xl"
            />
          </div>

        </div>
      </div>
    </section>
  );
};