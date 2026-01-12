import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
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
import { ThemeProvider } from './lib/ThemeContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { AdminOnlyRoute } from './components/AdminOnlyRoute';
import { StudentProtectedRoute } from './components/StudentProtectedRoute';

// UI
import { ToastProvider } from './components/ui/Toast';

// React Query Client - Cache de dados para navegação rápida
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutos - dados ficam "fresh"
      gcTime: 1000 * 60 * 30, // 30 minutos - cache mantido
      refetchOnWindowFocus: false, // Não refetch ao focar janela
      refetchOnMount: false, // Não refetch ao montar (usa cache)
      retry: 1,
    },
  },
});

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
import { EditPreparatorioNew } from './pages/admin/EditPreparatorioNew';
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
import { PlannerLayout } from './components/PlannerLayout';
import { Users } from './pages/admin/Users';
import { UserDetails } from './pages/admin/UserDetails';
import { Planejamentos as PlanejamentosAdmin } from './pages/admin/Planejamentos';
import { Leads } from './pages/admin/Leads';
import { Profile } from './pages/admin/Profile';
import { StudentLogin } from './pages/StudentLogin';
import { AdminIndex } from './pages/admin/AdminIndex';
import { PreparatoriosPlanos } from './pages/admin/PreparatoriosPlanos';
import { RodadasAdmin } from './pages/admin/Rodadas';
import { MissoesAdmin } from './pages/admin/Missoes';
import { MensagensIncentivoAdmin } from './pages/admin/MensagensIncentivo';
import { EditalAdmin } from './pages/admin/EditalAdmin';
import { GerarQuestoes } from './pages/admin/GerarQuestoes';
import { MissionBuilder } from './pages/admin/MissionBuilder';
import { AutomacaoConteudoMissao } from './pages/admin/AutomacaoConteudoMissao';
import { Suporte } from './pages/admin/Suporte';
import { Tickets } from './pages/admin/Tickets';

// Gamification Admin
import {
  GamificationSettingsPage,
  LevelsPage,
  LeaguesPage,
  XpActionsPage,
  AchievementsPage,
  PlanejamentoAchievementsPage,
} from './pages/admin/gamification';

// Legal Texts Admin
import { LegalTextsPage } from './pages/admin/LegalTexts';

// Store Admin
import { StoreDashboard } from './pages/admin/StoreDashboard';
import { StoreCategories } from './pages/admin/StoreCategories';
import { StoreProducts } from './pages/admin/StoreProducts';
import { StorePurchases } from './pages/admin/StorePurchases';
import { StoreDocumentation } from './pages/admin/StoreDocumentation';

// Academy Admin
import { AcademyDashboard } from './pages/admin/academy/Dashboard';
import { AcademyCategories } from './pages/admin/academy/Categories';
import { AcademyCourses } from './pages/admin/academy/Courses';
import { CourseForm } from './pages/admin/academy/CourseForm';
import { CourseContent } from './pages/admin/academy/CourseContent';

// Music Admin
import { MusicDashboard } from './pages/admin/music/Dashboard';
import { MusicTracks } from './pages/admin/music/Tracks';
import { MusicPlaylists } from './pages/admin/music/Playlists';
import { MusicCategories } from './pages/admin/music/Categories';
import { MusicSettings } from './pages/admin/music/Settings';
import { MusicLyricsGenerator } from './pages/admin/music/LyricsGenerator';

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
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <ThemeProvider>
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

              {/* Planejamento PRF View (legado - fora do Layout principal) */}
              <Route path="/planejamento-prf/:id" element={<PlanejamentoPRFView />} />

              {/* ================================================== */}
              {/* PORTAL DO PLANO - /plano/* */}
              {/* ================================================== */}

              {/* Login do Portal do Plano (público) */}
              <Route path="/plano/login" element={<StudentLogin />} />

              {/* Rotas do Portal do Plano com Layout Compartilhado */}
              <Route path="/plano" element={<PlannerLayout />}>
                <Route path=":slug/:id" element={<PlanejamentoPRFView />} />
                <Route path=":slug/:id/edital" element={<EditalVerticalizadoView />} />
                <Route path=":slug/:id/calendario" element={<PlanejadorSemanalView />} />
                <Route path=":slug/:id/performance" element={<PlannerPerformanceView />} />
                <Route path=":slug/:id/perfil" element={<PlannerPerfilView />} />
              </Route>

              {/* Rotas antigas (mantidas para compatibilidade - podem ser removidas depois) */}
              <Route element={<PlannerLayout />}>
                <Route path="/planejamento/:slug/:id" element={<PlanejamentoPRFView />} />
                <Route path="/edital-verticalizado/:slug/:id" element={<EditalVerticalizadoView />} />
                <Route path="/planejador-semanal/:slug/:id" element={<PlanejadorSemanalView />} />
                <Route path="/planner/:slug/:id" element={<PlannerPerformanceView />} />
                <Route path="/perfil/:slug/:id" element={<PlannerPerfilView />} />
              </Route>

              {/* Página de Obrigado (pós-compra com agendamento) */}
              <Route path="/obrigado" element={<Obrigado />} />

              {/* Admin Login (Public) */}
              <Route path="/admin/login" element={<Login />} />

              {/* Student Login (Public) - Login genérico */}
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
                <Route path="users/:userId" element={<AdminOnlyRoute><UserDetails /></AdminOnlyRoute>} />
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
                <Route path="legal-texts" element={<AdminOnlyRoute><LegalTextsPage /></AdminOnlyRoute>} />
                {/* Preparatórios - Sistema Unificado com Rodadas/Missões */}
                <Route path="preparatorios" element={<AdminOnlyRoute><PreparatoriosPlanos /></AdminOnlyRoute>} />
                <Route path="preparatorios/new" element={<AdminOnlyRoute><NewPreparatorio /></AdminOnlyRoute>} />
                <Route path="preparatorios/edit/:id" element={<AdminOnlyRoute><EditPreparatorioNew /></AdminOnlyRoute>} />
                <Route path="preparatorios/:preparatorioId/rodadas" element={<AdminOnlyRoute><RodadasAdmin /></AdminOnlyRoute>} />
                <Route path="preparatorios/:preparatorioId/rodadas/:rodadaId/missoes" element={<AdminOnlyRoute><MissoesAdmin /></AdminOnlyRoute>} />
                <Route path="preparatorios/:preparatorioId/mensagens" element={<AdminOnlyRoute><MensagensIncentivoAdmin /></AdminOnlyRoute>} />
                <Route path="preparatorios/:preparatorioId/edital" element={<AdminOnlyRoute><EditalAdmin /></AdminOnlyRoute>} />
                <Route path="preparatorios/:preparatorioId/montar-missoes" element={<AdminOnlyRoute><MissionBuilder /></AdminOnlyRoute>} />

                {/* Gerar Questões com IA */}
                <Route path="gerar-questoes" element={<AdminOnlyRoute><GerarQuestoes /></AdminOnlyRoute>} />

                {/* Courses (Simulados) - Sistema legado para app Ouse Questões */}
                <Route path="courses" element={<AdminOnlyRoute><Preparatorios /></AdminOnlyRoute>} />
                <Route path="courses/new" element={<AdminOnlyRoute><NewPreparatorio /></AdminOnlyRoute>} />
                <Route path="courses/edit/:id" element={<AdminOnlyRoute><EditarPreparatorio /></AdminOnlyRoute>} />

                {/* Rotas legadas - redirecionam para novas rotas */}
                <Route path="planos-preparatorios" element={<Navigate to="/admin/preparatorios" replace />} />
                <Route path="planos-preparatorios/:preparatorioId/rodadas" element={<Navigate to="/admin/preparatorios" replace />} />

                {/* Gamification Admin */}
                <Route path="gamification" element={<AdminOnlyRoute><GamificationSettingsPage /></AdminOnlyRoute>} />
                <Route path="gamification/levels" element={<AdminOnlyRoute><LevelsPage /></AdminOnlyRoute>} />
                <Route path="gamification/leagues" element={<AdminOnlyRoute><LeaguesPage /></AdminOnlyRoute>} />
                <Route path="gamification/xp-actions" element={<AdminOnlyRoute><XpActionsPage /></AdminOnlyRoute>} />
                <Route path="gamification/achievements" element={<AdminOnlyRoute><AchievementsPage /></AdminOnlyRoute>} />
                <Route path="gamification/planejamento-conquistas" element={<AdminOnlyRoute><PlanejamentoAchievementsPage /></AdminOnlyRoute>} />

                {/* Store Admin */}
                <Route path="loja" element={<AdminOnlyRoute><StoreDashboard /></AdminOnlyRoute>} />
                <Route path="loja/categorias" element={<AdminOnlyRoute><StoreCategories /></AdminOnlyRoute>} />
                <Route path="loja/produtos" element={<AdminOnlyRoute><StoreProducts /></AdminOnlyRoute>} />
                <Route path="loja/pedidos" element={<AdminOnlyRoute><StorePurchases /></AdminOnlyRoute>} />
                <Route path="loja/documentacao" element={<AdminOnlyRoute><StoreDocumentation /></AdminOnlyRoute>} />

                {/* Academy Admin */}
                <Route path="academy" element={<AdminOnlyRoute><AcademyDashboard /></AdminOnlyRoute>} />
                <Route path="academy/categorias" element={<AdminOnlyRoute><AcademyCategories /></AdminOnlyRoute>} />
                <Route path="academy/cursos" element={<AdminOnlyRoute><AcademyCourses /></AdminOnlyRoute>} />
                <Route path="academy/cursos/novo" element={<AdminOnlyRoute><CourseForm /></AdminOnlyRoute>} />
                <Route path="academy/cursos/:id/editar" element={<AdminOnlyRoute><CourseForm /></AdminOnlyRoute>} />
                <Route path="academy/cursos/:id/conteudo" element={<AdminOnlyRoute><CourseContent /></AdminOnlyRoute>} />

                {/* Suporte - Tickets e Reportes */}
                <Route path="suporte/tickets" element={<AdminOnlyRoute><Tickets /></AdminOnlyRoute>} />
                <Route path="suporte/reportes" element={<AdminOnlyRoute><Suporte /></AdminOnlyRoute>} />
                {/* Redirect old suporte route to tickets */}
                <Route path="suporte" element={<AdminOnlyRoute><Tickets /></AdminOnlyRoute>} />

                {/* Music Admin */}
                <Route path="music" element={<AdminOnlyRoute><MusicDashboard /></AdminOnlyRoute>} />
                <Route path="music/tracks" element={<AdminOnlyRoute><MusicTracks /></AdminOnlyRoute>} />
                <Route path="music/playlists" element={<AdminOnlyRoute><MusicPlaylists /></AdminOnlyRoute>} />
                <Route path="music/categorias" element={<AdminOnlyRoute><MusicCategories /></AdminOnlyRoute>} />
                <Route path="music/configuracoes" element={<AdminOnlyRoute><MusicSettings /></AdminOnlyRoute>} />
                <Route path="music/gerador" element={<AdminOnlyRoute><MusicLyricsGenerator /></AdminOnlyRoute>} />

                {/* Documentação técnica - Acesso apenas via URL direta, sem links */}
                <Route path="automacao-conteudo-missao" element={<AdminOnlyRoute><AutomacaoConteudoMissao /></AdminOnlyRoute>} />
              </Route>

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </ToastProvider>
          </ThemeProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
};

export default App;