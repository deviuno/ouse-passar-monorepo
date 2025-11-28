import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, BookOpen, Target, Home } from 'lucide-react';

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const isActive = (path: string) => {
    if (path === '/' && location.pathname !== '/') return false;
    return location.pathname.startsWith(path);
  };

  const navLinks = [
    { label: 'Início', path: '/', icon: <Home className="w-4 h-4 mr-2" /> },
    { label: 'Trilhas & Cursos', path: '/mentoria', icon: <Target className="w-4 h-4 mr-2" /> },
    { label: 'Blog Tático', path: '/blog', icon: <BookOpen className="w-4 h-4 mr-2" /> },
  ];

  // Na home: transparente até rolar, depois aparece com bg
  // Nas outras páginas: sempre com bg
  const navClasses = isHomePage
    ? `fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-brand-dark/95 backdrop-blur-md border-b border-white/10 shadow-lg'
          : 'bg-transparent border-b border-transparent'
      }`
    : 'fixed top-0 w-full z-50 bg-brand-dark border-b border-white/10';

  // Altura do navbar:
  // - Home não rolada: h-24 (padrão)
  // - Home rolada: h-16 (30% menor)
  // - Páginas internas: h-16 (sempre compacto)
  const heightClass = (isHomePage && !scrolled) ? 'h-24' : 'h-16';
  const logoHeight = (isHomePage && !scrolled) ? 'h-12 md:h-16' : 'h-10 md:h-12';
  const buttonSize = (isHomePage && !scrolled) ? 'px-6 py-3 text-sm' : 'px-5 py-2 text-xs';

  return (
    <nav className={navClasses}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className={`flex justify-between ${heightClass} items-center transition-all duration-300`}>
          {/* Logo */}
          <Link
            to="/"
            className="flex-shrink-0 flex items-center cursor-pointer group"
          >
            <img
              src="https://i.ibb.co/dJLPGVb7/ouse-passar-logo-n.webp"
              alt="Ouse Passar"
              className={`w-auto object-contain transition-all group-hover:scale-105 ${logoHeight}`}
            />
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            {navLinks.map((link) => (
              <Link
                key={link.label}
                to={link.path}
                className={`flex items-center text-sm font-bold uppercase tracking-wider transition-all duration-300 ${isActive(link.path)
                    ? 'text-brand-yellow'
                    : 'text-gray-300 hover:text-white'
                  }`}
              >
                {link.label}
              </Link>
            ))}
            <a
              href="https://ouse-passar.memberkit.com.br/"
              target="_blank"
              rel="noopener noreferrer"
              className={`bg-brand-yellow text-brand-darker rounded-none skew-x-[-10deg] font-black uppercase hover:bg-white hover:scale-105 transition-all shadow-[0_0_15px_rgba(255,184,0,0.3)] ${buttonSize}`}
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
              <Link
                key={link.label}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block w-full text-left px-4 py-4 border-l-4 transition-all font-bold uppercase ${isActive(link.path)
                    ? 'border-brand-yellow text-brand-yellow bg-white/5'
                    : 'border-transparent text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
              >
                <div className="flex items-center">
                  {link.icon}
                  {link.label}
                </div>
              </Link>
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