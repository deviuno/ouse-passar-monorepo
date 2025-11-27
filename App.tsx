import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Hero } from './components/Hero';
import { Methodology } from './components/Methodology';
import { WhyChoose } from './components/WhyChoose';
import { VideoTestimonials } from './components/VideoTestimonials';
import { PowerFoco } from './components/PowerFoco';
import { BlogList, BlogPostView } from './components/Blog';
import { SEOHead } from './components/SEOHead';
import { PageHero } from './components/PageHero';
import { ViewState } from './types';
import { useScrollAnimation } from './lib/useScrollAnimation';

// Auth
import { AuthProvider } from './lib/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

// Admin Imports
import { AdminLayout } from './components/admin/AdminLayout';
import { Dashboard } from './pages/admin/Dashboard';
import { Authors } from './pages/admin/Authors';
import { Categories } from './pages/admin/Categories';
import { Articles } from './pages/admin/Articles';
import { ArticleEditor } from './pages/admin/ArticleEditor';
import { NewArticleAI } from './pages/admin/NewArticleAI';
import { Settings } from './pages/admin/Settings';
import { Login } from './pages/admin/Login';
import { Preparatorios } from './pages/admin/Preparatorios';
import { NewPreparatorio } from './pages/admin/NewPreparatorio';
import { DocsIntegracao } from './pages/DocsIntegracao';

// Wrapper for Home Page components
const Home = () => {
  const navigate = useNavigate();
  const { ref: ctaRef, isVisible: ctaVisible } = useScrollAnimation({ threshold: 0.3 });

  return (
    <div className="animate-fade-in">
      <SEOHead />
      <Hero />
      <Methodology />
      <WhyChoose />
      <VideoTestimonials />
      <PowerFoco />

      {/* CTA Section for Blog on Homepage */}
      <div ref={ctaRef} className="py-20 bg-brand-darker border-t border-white/5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-brand-yellow/5 skew-x-12"></div>
        <div className="max-w-4xl mx-auto px-4 text-center relative z-10">
          <h3 className={`text-3xl font-black text-white uppercase tracking-tight mb-6 font-display scroll-animate ${ctaVisible ? 'visible animate-fade-in-up' : ''}`}>
            A Inteligência vence a força
          </h3>
          <p className={`text-gray-400 mb-8 text-lg scroll-animate ${ctaVisible ? 'visible animate-fade-in-up stagger-1' : ''}`}>
            Acesse nossas análises de editais e pare de estudar o que não cai na prova.
          </p>
          <button
            onClick={() => navigate('/blog')}
            className={`inline-block border-2 border-brand-yellow text-brand-yellow px-8 py-3 font-bold uppercase tracking-widest hover:bg-brand-yellow hover:text-brand-darker transition-all duration-300 scroll-animate ${ctaVisible ? 'visible animate-scale-in stagger-2' : ''}`}
          >
            Acessar QG de Conteúdo
          </button>
        </div>
      </div>
    </div>
  );
};

// Wrapper for Mentorship Page
const Mentorship = () => (
  <div className="animate-fade-in">
    <SEOHead
      title="Trilhas & Cursos - Ouse Passar"
      description="Domine sua preparação com nossa metodologia exclusiva. Trilhas personalizadas e mentorias para concurseiros profissionais."
    />

    <PageHero
      title="Trilhas &"
      titleHighlight="Cursos"
      description="Domine sua preparação com nossa metodologia exclusiva. Trilhas personalizadas e mentorias para concurseiros profissionais."
    />

    <Methodology />

    <div className="py-32 text-center bg-brand-card border-t border-white/5">
      <h2 className="text-4xl font-black text-white font-display uppercase mb-4">Escolha seu Plano</h2>
      <p className="text-gray-400">Tabela de preços em construção.</p>
    </div>
  </div>
);

const App: React.FC = () => {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="mentoria" element={<Mentorship />} />
            <Route path="blog" element={<BlogList />} />
            <Route path="blog/:slug" element={<BlogPostView />} />
          </Route>

          {/* Admin Login (Public) */}
          <Route path="/admin/login" element={<Login />} />

          {/* Documentation (Public - Direct access only, no menu links) */}
          <Route path="/docs/integracao-questoes" element={<DocsIntegracao />} />

          {/* Protected Admin Routes */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <AdminLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="authors" element={<Authors />} />
            <Route path="categories" element={<Categories />} />
            <Route path="articles" element={<Articles />} />
            <Route path="articles/new" element={<ArticleEditor />} />
            <Route path="articles/new-ai" element={<NewArticleAI />} />
            <Route path="articles/edit/:slug" element={<ArticleEditor />} />
            <Route path="settings" element={<Settings />} />
            <Route path="preparatorios" element={<Preparatorios />} />
            <Route path="preparatorios/new" element={<NewPreparatorio />} />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
};

export default App;