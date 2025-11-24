import React from 'react';
import { Shield, Scale, FileText, Crosshair, ArrowRight } from 'lucide-react';
import { useScrollAnimation } from '../lib/useScrollAnimation';

export const Methodology: React.FC = () => {
  const { ref: sectionRef, isVisible } = useScrollAnimation({ threshold: 0.15 });
  const tracks = [
    {
      icon: <Shield className="w-10 h-10 text-brand-darker" />,
      title: "Carreiras Policiais",
      subtitle: "PF, PRF, PC e PM",
      description: "Foco total em legislação penal, processo penal e TAF. Preparação de elite para quem quer a farda.",
      color: "bg-brand-yellow"
    },
    {
      icon: <Scale className="w-10 h-10 text-white" />,
      title: "Tribunais",
      subtitle: "TJs, TRTs e TREs",
      description: "Profundidade em Direito Constitucional e Administrativo. O caminho para a estabilidade do judiciário.",
      color: "bg-blue-600"
    },
    {
      icon: <FileText className="w-10 h-10 text-white" />,
      title: "Administrativos",
      subtitle: "INSS, Bancos e Prefeituras",
      description: "A porta de entrada mais rápida para o serviço público. Conteúdo focado em Língua Portuguesa e RLM.",
      color: "bg-purple-600"
    },
    {
      icon: <Crosshair className="w-10 h-10 text-white" />,
      title: "Fiscais & Controle",
      subtitle: "Receita e TCUs",
      description: "O mais alto nível de exigência. Contabilidade, Auditoria e Economia para salários de 20k+.",
      color: "bg-green-600"
    }
  ];

  return (
    <section ref={sectionRef} className="py-24 bg-brand-dark">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 border-b border-white/10 pb-8">
            <div className={`max-w-2xl scroll-animate ${isVisible ? 'visible animate-fade-in-left' : ''}`}>
                <h2 className="text-brand-yellow font-bold tracking-[0.2em] uppercase text-sm mb-2">Segmentação Estratégica</h2>
                <h3 className="text-4xl md:text-5xl font-black text-white font-display tracking-tight">
                    ESCOLHA O SEU <br/> CAMPO DE BATALHA
                </h3>
            </div>
            <div className={`mt-6 md:mt-0 scroll-animate ${isVisible ? 'visible animate-fade-in-right' : ''}`}>
                <p className="text-gray-400 max-w-md text-right md:text-left">
                    Não existe "estudar para concurso" de forma genérica. Aqui você treina especificamente para o inimigo que vai enfrentar.
                </p>
            </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {tracks.map((track, idx) => (
            <div key={idx} className={`group relative bg-brand-card border border-white/5 p-8 hover:-translate-y-2 transition-all duration-300 hover:shadow-xl hover:shadow-${track.color.split('-')[1]}-500/20 scroll-animate ${isVisible ? `visible animate-scale-in stagger-${idx + 1}` : ''}`}>
              <div className={`absolute top-0 right-0 w-24 h-24 ${track.color} opacity-10 rounded-bl-full transition-all group-hover:scale-150 duration-500`}></div>
              
              <div className={`w-16 h-16 ${track.color} flex items-center justify-center mb-6 shadow-lg`}>
                {track.icon}
              </div>
              
              <h4 className="text-xl font-black text-white mb-1 uppercase font-display">{track.title}</h4>
              <p className="text-sm font-bold text-brand-yellow mb-4">{track.subtitle}</p>
              
              <p className="text-gray-400 text-sm leading-relaxed mb-6 border-t border-white/10 pt-4">
                {track.description}
              </p>

              <a href="#" className="inline-flex items-center text-xs font-bold text-white uppercase tracking-widest hover:text-brand-yellow transition-colors">
                Ver Trilha <ArrowRight className="ml-2 w-3 h-3" />
              </a>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};