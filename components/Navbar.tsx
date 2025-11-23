import React, { useState, useEffect } from 'react';
import { Menu, X, BookOpen, Target, Home, GraduationCap } from 'lucide-react';
import { ViewState } from '../types';

interface NavbarProps {
  currentView: ViewState;
  onChangeView: (view: ViewState) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentView, onChangeView }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Início', value: ViewState.HOME, icon: <Home className="w-4 h-4 mr-2" /> },
    { label: 'Trilhas & Cursos', value: ViewState.MENTORSHIP, icon: <Target className="w-4 h-4 mr-2" /> },
    { label: 'Blog Tático', value: ViewState.BLOG_LIST, icon: <BookOpen className="w-4 h-4 mr-2" /> },
  ];

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-brand-dark/95 backdrop-blur-md border-b border-white/10 shadow-lg' : 'bg-transparent border-b border-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-24 items-center">
          {/* Logo - Tamanho aumentado */}
          <div 
            className="flex-shrink-0 flex items-center cursor-pointer group" 
            onClick={() => onChangeView(ViewState.HOME)}
          >
            <img 
              src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp" 
              alt="Ouse Passar" 
              className="h-12 md:h-16 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </div>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => onChangeView(link.value)}
                className={`flex items-center text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
                  currentView === link.value || (link.value === ViewState.BLOG_LIST && currentView === ViewState.BLOG_POST)
                    ? 'text-brand-yellow' 
                    : 'text-gray-300 hover:text-white'
                }`}
              >
                {link.label}
              </button>
            ))}
            <a 
              href="https://ouse-passar.memberkit.com.br/" 
              target="_blank"
              rel="noopener noreferrer"
              className="bg-brand-yellow text-brand-darker px-6 py-3 rounded-none skew-x-[-10deg] font-black uppercase text-sm hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,184,0,0.3)]"
            >
              <span className="skew-x-[10deg] inline-block">Área do Aluno</span>
            </a>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-white hover:text-brand-yellow focus:outline-none p-2"
            >
              {isOpen ? <X className="w-8 h-8" /> : <Menu className="w-8 h-8" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden bg-brand-card border-b border-white/10 absolute w-full">
          <div className="px-4 pt-2 pb-6 space-y-2">
            {navLinks.map((link) => (
              <button
                key={link.label}
                onClick={() => {
                  onChangeView(link.value);
                  setIsOpen(false);
                }}
                className={`block w-full text-left px-4 py-4 border-l-4 transition-all font-bold uppercase ${
                   currentView === link.value 
                   ? 'border-brand-yellow text-brand-yellow bg-white/5' 
                   : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center">
                  {link.icon}
                  {link.label}
                </div>
              </button>
            ))}
             <a 
              href="https://ouse-passar.memberkit.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="block text-center w-full mt-4 bg-brand-yellow text-brand-darker px-5 py-4 font-black uppercase hover:bg-white transition-colors"
            >
              Área do Aluno
            </a>
          </div>
        </div>
      )}
    </nav>
  );
};