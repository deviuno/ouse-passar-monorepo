import React from 'react';
import { Link } from 'react-router-dom';

export const FooterMinimal: React.FC = () => {
  return (
    <footer className="bg-black text-gray-500 py-8 border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          {/* Logo */}
          <div className="flex items-center gap-4">
            <img
              src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
              alt="Ouse Passar"
              className="h-8 w-auto object-contain opacity-70"
            />
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs">
            <Link to="/" className="hover:text-brand-yellow transition-colors">
              Inicio
            </Link>
            <Link to="/planejamentos" className="hover:text-brand-yellow transition-colors">
              Planejamentos
            </Link>
            <a
              href="https://api.whatsapp.com/send?phone=558388979236&text=Ola%20Silvana%20da%20Equipe%20Ouse%20Passar,%20tudo%20bem%20com%20voc%C3%AAs?%20Eu%20vim%20pelo%20link%20do%20*Site%20do%20OP*%20,%20poderiam%20me%20auxiliar?"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-brand-yellow transition-colors"
            >
              Contato
            </a>
          </div>

          {/* Copyright */}
          <div className="text-xs text-gray-600">
            &copy; {new Date().getFullYear()} Ouse Passar
          </div>
        </div>
      </div>
    </footer>
  );
};
