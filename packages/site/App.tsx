import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Layout } from './components/Layout';
import { SalesLayout } from './components/SalesLayout';
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
import { AdminOnlyRoute } from './components/AdminOnlyRoute';
import { StudentProtectedRoute } from './components/StudentProtectedRoute';

// UI
import { ToastProvider } from './components/ui/Toast';

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
import { EditarPreparatorio } from './pages/admin/EditarPreparatorio';
import { DocsIntegracao } from './pages/DocsIntegracao';
import { PlanejamentoPRFForm } from './pages/PlanejamentoPRF';
import { PlanejamentoPRFView } from './pages/PlanejamentoPRFView';
import { Planejamentos as PlanejamentosPublic } from './pages/Planejamentos';
import { PlanejamentoVendas } from './pages/PlanejamentoVendas';
import { Obrigado } from './pages/Obrigado';
import { EditalVerticalizadoView } from './pages/EditalVerticalizadoView';
import { StudentDashboardView } from './pages/StudentDashboardView';
import { PlanejadorSemanalView } from './pages/PlanejadorSemanalView';
import { PlannerPerformanceView } from './pages/PlannerPerformanceView';
import { PlannerPerfilView } from './pages/PlannerPerfilView';
import { Users } from './pages/admin/Users';
import { Planejamentos as PlanejamentosAdmin } from './pages/admin/Planejamentos';
import { Leads } from './pages/admin/Leads';
import { Profile } from './pages/admin/Profile';
import { StudentLogin } from './pages/StudentLogin';
import { AdminIndex } from './pages/admin/AdminIndex';
import { PreparatoriosPlanos } from './pages/admin/PreparatoriosPlanos';
import { RodadasAdmin } from './pages/admin/Rodadas';
import { MissoesAdmin } from './pages/admin/Missoes';
import { MensagensIncentivoAdmin } from './pages/admin/MensagensIncentivo';

// Gamification Admin
import {
  GamificationSettingsPage,
  LevelsPage,
  LeaguesPage,
  XpActionsPage,
  AchievementsPage,
} from './pages/admin/gamification';

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
        <ToastProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="mentoria" element={<Mentorship />} />
              <Route path="blog" element={<BlogList />} />
              <Route path="blog/:slug" element={<BlogPostView />} />
              <Route path="planejamento-prf" element={<PlanejamentoPRFForm />} />
            </Route>

            {/* Sales Pages - Layout com footer minimalista */}
            <Route path="/" element={<SalesLayout />}>
              <Route path="planejamentos" element={<PlanejamentosPublic />} />
            </Route>

            {/* Pagina de Vendas - Sem header, apenas footer */}
            <Route path="/planejamento/:slug" element={<PlanejamentoVendas />} />

            {/* Planejamento PRF View (fora do Layout principal para ter layout proprio) */}
            <Route path="/planejamento-prf/:id" element={<PlanejamentoPRFView />} />

            {/* Planejamento Dinâmico View */}
            <Route path="/planejamento/:slug/:id" element={<PlanejamentoPRFView />} />

            {/* Edital Verticalizado View */}
            <Route path="/edital-verticalizado/:slug/:id" element={<EditalVerticalizadoView />} />

            {/* Planejador Semanal View */}
            <Route path="/planejador-semanal/:slug/:id" element={<PlanejadorSemanalView />} />

            {/* Planner de Performance View */}
            <Route path="/planner/:slug/:id" element={<PlannerPerformanceView />} />

            {/* Perfil do Aluno View */}
            <Route path="/perfil/:slug/:id" element={<PlannerPerfilView />} />

            {/* Página de Obrigado (pós-compra com agendamento) */}
            <Route path="/obrigado" element={<Obrigado />} />

            {/* Admin Login (Public) */}
            <Route path="/admin/login" element={<Login />} />

            {/* Student Login (Public) */}
            <Route path="/login" element={<StudentLogin />} />

            {/* Documentation (Public - Direct access only, no menu links) */}
            <Route path="/docs/integracao-questoes" element={<DocsIntegracao />} />

            {/* Dashboard do Aluno - Protegido por StudentProtectedRoute (não admin) */}
            <Route path="/dashboard-aluno/:id" element={
              <StudentProtectedRoute>
                <StudentDashboardView />
              </StudentProtectedRoute>
            } />

            {/* Protected Admin Routes */}
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<AdminIndex />} />
              <Route path="users" element={<AdminOnlyRoute><Users /></AdminOnlyRoute>} />
              <Route path="planejamentos" element={<PlanejamentosAdmin />} />
              <Route path="leads" element={<Leads />} />
              <Route path="profile" element={<Profile />} />
              <Route path="authors" element={<AdminOnlyRoute><Authors /></AdminOnlyRoute>} />
              <Route path="categories" element={<AdminOnlyRoute><Categories /></AdminOnlyRoute>} />
              <Route path="articles" element={<AdminOnlyRoute><Articles /></AdminOnlyRoute>} />
              <Route path="articles/new" element={<AdminOnlyRoute><ArticleEditor /></AdminOnlyRoute>} />
              <Route path="articles/new-ai" element={<AdminOnlyRoute><NewArticleAI /></AdminOnlyRoute>} />
              <Route path="articles/edit/:slug" element={<AdminOnlyRoute><ArticleEditor /></AdminOnlyRoute>} />
              <Route path="settings" element={<AdminOnlyRoute><Settings /></AdminOnlyRoute>} />
              <Route path="preparatorios" element={<AdminOnlyRoute><Preparatorios /></AdminOnlyRoute>} />
              <Route path="preparatorios/new" element={<AdminOnlyRoute><NewPreparatorio /></AdminOnlyRoute>} />
              <Route path="preparatorios/edit/:id" element={<AdminOnlyRoute><EditarPreparatorio /></AdminOnlyRoute>} />

              {/* Gamification Admin */}
              <Route path="gamification" element={<AdminOnlyRoute><GamificationSettingsPage /></AdminOnlyRoute>} />
              <Route path="gamification/levels" element={<AdminOnlyRoute><LevelsPage /></AdminOnlyRoute>} />
              <Route path="gamification/leagues" element={<AdminOnlyRoute><LeaguesPage /></AdminOnlyRoute>} />
              <Route path="gamification/xp-actions" element={<AdminOnlyRoute><XpActionsPage /></AdminOnlyRoute>} />
              <Route path="gamification/achievements" element={<AdminOnlyRoute><AchievementsPage /></AdminOnlyRoute>} />

              {/* Planejamentos - Sistema Dinâmico */}
              <Route path="planos-preparatorios" element={<AdminOnlyRoute><PreparatoriosPlanos /></AdminOnlyRoute>} />
              <Route path="planos-preparatorios/:preparatorioId/rodadas" element={<AdminOnlyRoute><RodadasAdmin /></AdminOnlyRoute>} />
              <Route path="planos-preparatorios/:preparatorioId/rodadas/:rodadaId/missoes" element={<AdminOnlyRoute><MissoesAdmin /></AdminOnlyRoute>} />
              <Route path="planos-preparatorios/:preparatorioId/mensagens" element={<AdminOnlyRoute><MensagensIncentivoAdmin /></AdminOnlyRoute>} />
            </Route>

            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </Router>
  );
};

export default App;