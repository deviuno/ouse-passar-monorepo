import React from 'react';
import { Instagram, Youtube, Twitter, MapPin, Mail, Phone } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-black text-gray-400 py-16 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-12">
          
          {/* Brand Column */}
          <div className="col-span-1">
            <div className="mb-6">
                <img 
                  src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp" 
                  alt="Ouse Passar" 
                  className="h-12 w-auto object-contain"
                />
            </div>
            <p className="text-sm leading-relaxed mb-6 border-l-2 border-brand-yellow pl-4">
              A plataforma que trata concurso público como guerra, e o candidato como soldado. Sua farda começa aqui.
            </p>
            <div className="flex space-x-4">
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-brand-yellow hover:text-brand-darker transition-all"><Instagram className="w-5 h-5"/></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-red-600 hover:text-white transition-all"><Youtube className="w-5 h-5"/></a>
                <a href="#" className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all"><Twitter className="w-5 h-5"/></a>
            </div>
          </div>
          
          {/* Links 1 */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-widest border-b border-brand-yellow/30 pb-2 inline-block">Carreiras</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#" className="hover:text-brand-yellow hover:translate-x-1 transition-all inline-block">Polícia Federal</a></li>
              <li><a href="#" className="hover:text-brand-yellow hover:translate-x-1 transition-all inline-block">Polícia Rodoviária Federal</a></li>
              <li><a href="#" className="hover:text-brand-yellow hover:translate-x-1 transition-all inline-block">Polícia Civil</a></li>
              <li><a href="#" className="hover:text-brand-yellow hover:translate-x-1 transition-all inline-block">Tribunais (TJs/TRTs)</a></li>
              <li><a href="#" className="hover:text-brand-yellow hover:translate-x-1 transition-all inline-block">Receita Federal</a></li>
            </ul>
          </div>

          {/* Links 2 */}
          <div>
            <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-widest border-b border-brand-yellow/30 pb-2 inline-block">Institucional</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><a href="#" className="hover:text-brand-yellow hover:translate-x-1 transition-all inline-block">Sobre Nós</a></li>
              <li><a href="#" className="hover:text-brand-yellow hover:translate-x-1 transition-all inline-block">Metodologia</a></li>
              <li><a href="#" className="hover:text-brand-yellow hover:translate-x-1 transition-all inline-block">Blog Tático</a></li>
              <li><a href="https://ouse-passar.memberkit.com.br/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-yellow hover:translate-x-1 transition-all inline-block">Área do Aluno</a></li>
              <li><a href="#" className="hover:text-brand-yellow hover:translate-x-1 transition-all inline-block">Política de Privacidade</a></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
             <h4 className="text-white font-bold mb-6 uppercase text-sm tracking-widest border-b border-brand-yellow/30 pb-2 inline-block">Contato QG</h4>
             <ul className="space-y-4 text-sm">
                <li className="flex items-start">
                    <MapPin className="w-5 h-5 text-brand-yellow mr-3 mt-0.5" />
                    <span>Av. Paulista, 1000 - Bela Vista<br/>São Paulo - SP</span>
                </li>
                <li className="flex items-center">
                    <Mail className="w-5 h-5 text-brand-yellow mr-3" />
                    <span>contato@ousepassar.com.br</span>
                </li>
                <li className="flex items-center">
                    <Phone className="w-5 h-5 text-brand-yellow mr-3" />
                    <span>(11) 99999-9999</span>
                </li>
             </ul>
          </div>
        </div>
        
        <div className="pt-8 border-t border-white/10 flex flex-col md:flex-row justify-between items-center text-xs text-gray-600">
          <p>© {new Date().getFullYear()} Ouse Passar Educacional Ltda. Todos os direitos reservados.</p>
          <div className="mt-4 md:mt-0">
             <span className="uppercase font-bold tracking-widest opacity-50">Feito para vencer</span>
          </div>
        </div>
      </div>
    </footer>
  );
};