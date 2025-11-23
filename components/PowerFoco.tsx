import React from 'react';
import { Zap, Brain, Battery, ArrowRight, CheckCircle2 } from 'lucide-react';

export const PowerFoco: React.FC = () => {
  const benefits = [
    {
      icon: <CrosshairIcon className="w-6 h-6 text-cyan-400" />,
      text: "Aumento do foco e concentração extrema"
    },
    {
      icon: <Battery className="w-6 h-6 text-cyan-400" />,
      text: "Redução drástica da fadiga mental"
    },
    {
      icon: <Brain className="w-6 h-6 text-cyan-400" />,
      text: "Maior retenção de aprendizado e memória"
    },
    {
      icon: <Zap className="w-6 h-6 text-cyan-400" />,
      text: "Sessões de estudo mais produtivas"
    }
  ];

  return (
    <section className="relative py-24 bg-[#0F1115] overflow-hidden border-t border-white/5">
      {/* Background Ambience */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-500/10 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none"></div>
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-yellow/5 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none"></div>
      
      {/* Grid Pattern Overlay */}
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Content Column */}
          <div className="order-2 lg:order-1">
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-cyan-900/30 border border-cyan-500/30 text-cyan-400 text-xs font-bold uppercase tracking-widest mb-6 animate-pulse">
              <Brain className="w-3 h-3 mr-2" />
              Nootrópico de Alta Performance
            </div>
            
            <h2 className="text-4xl md:text-5xl font-black text-white font-display leading-tight mb-6">
              Aumente Seu Foco e <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600">
                Potencial Cognitivo!
              </span> 🧠🔥
            </h2>
            
            <p className="text-gray-400 text-lg leading-relaxed mb-8 border-l-4 border-cyan-500 pl-6">
              Você sabia que seu cérebro pode trabalhar a todo vapor com os nutrientes certos? O <strong className="text-white">Power Foco</strong> é um suplemento desenvolvido especialmente para concurseiros que precisam de máximo desempenho mental.
            </p>

            {/* Benefits List */}
            <div className="space-y-4 mb-10">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center bg-white/5 border border-white/5 p-4 rounded-lg hover:border-cyan-500/50 transition-colors group">
                  <div className="bg-cyan-500/10 p-2 rounded-full mr-4 group-hover:bg-cyan-500/20 transition-colors">
                    {benefit.icon}
                  </div>
                  <span className="text-gray-200 font-medium">{benefit.text}</span>
                </div>
              ))}
            </div>

            {/* CTA Area */}
            <div className="flex flex-col sm:items-start gap-4">
              <p className="text-sm text-gray-400 uppercase tracking-wider font-bold mb-2 flex items-center">
                <ArrowRight className="w-4 h-4 text-brand-yellow mr-2 animate-bounce-x" />
                Descubra como turbinar seus estudos
              </p>
              <button className="w-full sm:w-auto px-8 py-5 bg-gradient-to-r from-orange-500 to-brand-yellow text-brand-darker font-black text-lg uppercase tracking-wider rounded-sm shadow-[0_0_30px_rgba(255,184,0,0.3)] hover:shadow-[0_0_50px_rgba(255,184,0,0.5)] hover:scale-105 transition-all duration-300 flex items-center justify-center">
                Quero mais foco e memorização!
                <Zap className="ml-2 w-5 h-5 fill-current" />
              </button>
            </div>
          </div>

          {/* Product Image Column */}
          <div className="order-1 lg:order-2 flex justify-center relative group">
            {/* Glow behind product */}
            <div className="absolute inset-0 bg-cyan-500/20 blur-3xl rounded-full transform scale-75 group-hover:scale-90 transition-transform duration-700"></div>
            
            {/* Floating Animation Container */}
            <div className="relative animate-float">
                <img 
                  src="https://ousepassar.com/wp-content/uploads/2025/02/IMAGEM-5.webp" 
                  alt="Power Foco Suplemento" 
                  className="relative z-10 w-full max-w-md mx-auto drop-shadow-2xl transform rotate-3 group-hover:rotate-0 transition-all duration-500 hover:drop-shadow-[0_0_30px_rgba(6,182,212,0.5)]"
                />
                
                {/* Floating Badge */}
                <div className="absolute top-10 -right-4 bg-brand-card border border-cyan-500/30 p-4 rounded-lg shadow-xl z-20 hidden md:block animate-pulse-slow">
                    <div className="flex items-center space-x-2 mb-1">
                        <CheckCircle2 className="w-4 h-4 text-cyan-400" />
                        <span className="text-white font-bold text-xs uppercase">Fórmula Avançada</span>
                    </div>
                    <p className="text-2xl font-black text-white">60 <span className="text-xs font-normal text-gray-400">Cápsulas</span></p>
                </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// Helper Icon for specific visual
const CrosshairIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <circle cx="12" cy="12" r="10" />
    <line x1="22" y1="12" x2="18" y2="12" />
    <line x1="6" y1="12" x2="2" y2="12" />
    <line x1="12" y1="6" x2="12" y2="2" />
    <line x1="12" y1="22" x2="12" y2="18" />
  </svg>
);
