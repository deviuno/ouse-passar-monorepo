import React from 'react';
import { CheckCircle2 } from 'lucide-react';

export const WhyChoose: React.FC = () => {
  return (
    <section className="pt-24 pb-0 bg-brand-darker relative overflow-hidden border-t border-white/5">
      {/* Background patterns */}
      <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-b from-brand-yellow/5 to-transparent pointer-events-none"></div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-16 items-end relative">
          
          {/* Text Content */}
          <div className="relative z-20 order-2 lg:order-1 pb-24">
            <div className="inline-block mb-6">
               <div className="flex items-center space-x-2">
                 <span className="h-1 w-10 bg-brand-yellow"></span>
                 <span className="text-brand-yellow font-bold uppercase tracking-widest text-xs">Diferencial</span>
               </div>
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-white font-display leading-tight mb-8">
              Por que devo escolher o <br/>
              <span className="text-brand-yellow">Ouse Passar?</span>
            </h2>

            <div className="space-y-6 text-gray-400 text-lg font-light leading-relaxed mb-10">
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

            <div className="grid sm:grid-cols-2 gap-4">
              {[
                "Metodologia 80/20",
                "Plataforma Completa",
                "Estudo Otimizado",
                "Tranquilidade Total"
              ].map((item, index) => (
                <div key={index} className="flex items-center bg-brand-card border border-white/5 p-3 rounded-sm hover:border-brand-yellow/30 transition-colors">
                  <CheckCircle2 className="w-5 h-5 text-brand-yellow mr-3 flex-shrink-0" />
                  <span className="text-white font-bold text-sm uppercase">{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Image Content */}
          <div className="relative order-1 lg:order-2 flex justify-end z-10 pointer-events-none">
             
             {/* Main Image */}
             {/* SCALE UP: lg:w-[190%] to fill vertically. translate-x adjusted to center in empty space. */}
             <div className="relative z-10 w-full lg:w-[190%] lg:max-w-none lg:-translate-x-32 origin-bottom">
                <img 
                    src="https://ousepassar.com/wp-content/uploads/2025/02/PQ-devo-escolher-copiar.webp" 
                    alt="Alunos Ouse Passar" 
                    className="w-full h-auto drop-shadow-2xl mask-bottom-fade"
                    style={{ display: 'block' }} 
                />
             </div>
             
             {/* Glow effect behind image */}
             <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[80%] bg-brand-yellow/10 rounded-t-full blur-3xl -z-10"></div>
          </div>

        </div>
      </div>
    </section>
  );
};