import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layout/MainLayout';
import { MusicLayout } from '../components/music/MusicLayout';

// Pages
import OnboardingPage from '../pages/OnboardingPage';
import HomePage from '../pages/HomePage';
import MissionPage from '../pages/MissionPage';
import PracticePage from '../pages/PracticePage';
import SimuladosPage from '../pages/SimuladosPage';
import SimuladoDetailPage from '../pages/SimuladoDetailPage';
import SimuladoExecPage from '../pages/SimuladoExecPage';
import QuestoesHubPage from '../pages/QuestoesHubPage';
import NotebooksPage from '../pages/NotebooksPage';
import TrailsPage from '../pages/TrailsPage';
import TrailEditalPage from '../pages/TrailEditalPage';
import StatsPage from '../pages/StatsPage';
import StorePage from '../pages/StorePage';
import InventoryPage from '../pages/InventoryPage';
import PreparatoriosStorePage from '../pages/PreparatoriosStorePage';
import ProfilePage from '../pages/ProfilePage';
import NotificationsPage from '../pages/NotificationsPage';
import PrivacySettingsPage from '../pages/PrivacySettingsPage';
import HelpPage from '../pages/HelpPage';
import TermsPage from '../pages/TermsPage';
import PrivacyPage from '../pages/PrivacyPage';
import CoursesPage from '../pages/CoursesPage';
import CourseViewPage from '../pages/CourseViewPage';
import GoldenNotebookPage from '../pages/GoldenNotebookPage';
import GoldenNotebookDetailPage from '../pages/GoldenNotebookDetailPage';
import MyErrorsPage from '../pages/MyErrorsPage';
import MyContentPage from '../pages/MyContentPage';

// Music pages
import Music from '../pages/Music';
import MusicPlaylist from '../pages/MusicPlaylist';
import MusicLibrary from '../pages/MusicLibrary';
import MusicSearch from '../pages/MusicSearch';
import MusicCategory from '../pages/MusicCategory';
import MusicLessonPodcasts from '../pages/MusicLessonPodcasts';
import MusicRequestAudio from '../pages/MusicRequestAudio';
import MusicMyRequests from '../pages/MusicMyRequests';

// Auth pages (will redirect from existing components)
import AuthPage from '../pages/AuthPage';

// Guards
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { OnboardingGuard } from '../components/auth/OnboardingGuard';
import { ModuleGuard } from '../components/auth/ModuleGuard';

export const router = createBrowserRouter([
  // Auth routes (public)
  {
    path: '/auth',
    element: <AuthPage />,
  },
  {
    path: '/login',
    element: <Navigate to="/auth" replace />,
  },
  {
    path: '/register',
    element: <Navigate to="/onboarding" replace />,
  },
  {
    path: '/reset-password',
    element: <AuthPage mode="reset" />,
  },

  // Onboarding (público - cadastro acontece aqui)
  {
    path: '/onboarding',
    element: <OnboardingPage />,
  },

  // Legal pages (public)
  {
    path: '/termos-de-uso',
    element: <TermsPage />,
  },
  {
    path: '/politica-de-privacidade',
    element: <PrivacyPage />,
  },

  // Simulado execution (protected, full-screen without MainLayout)
  {
    path: '/simulados/:id/prova',
    element: (
      <ProtectedRoute>
        <OnboardingGuard>
          <ModuleGuard module="simulados">
            <SimuladoExecPage />
          </ModuleGuard>
        </OnboardingGuard>
      </ProtectedRoute>
    ),
  },

  // Course viewing (protected, full-screen without MainLayout)
  {
    path: '/cursos/:slug',
    element: (
      <ProtectedRoute>
        <OnboardingGuard>
          <CourseViewPage />
        </OnboardingGuard>
      </ProtectedRoute>
    ),
  },

  // Main app routes (requires auth + onboarding)
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <OnboardingGuard>
          <MainLayout />
        </OnboardingGuard>
      </ProtectedRoute>
    ),
    children: [
      // Trilha (Home) - protected by ModuleGuard
      {
        index: true,
        element: <ModuleGuard module="trilha"><HomePage /></ModuleGuard>,
      },
      {
        path: 'trilha',
        element: <ModuleGuard module="trilha"><HomePage /></ModuleGuard>,
      },
      {
        path: 'missao/:missionId',
        element: <ModuleGuard module="trilha"><MissionPage /></ModuleGuard>,
      },
      {
        path: ':prepSlug/r/:roundNum/m/:missionNum',
        element: <ModuleGuard module="trilha"><MissionPage /></ModuleGuard>,
      },
      // Questões Hub - protected by ModuleGuard
      {
        path: 'questoes',
        element: <ModuleGuard module="praticar"><QuestoesHubPage /></ModuleGuard>,
      },
      // Praticar - protected by ModuleGuard
      {
        path: 'praticar',
        element: <ModuleGuard module="praticar"><PracticePage /></ModuleGuard>,
      },
      // Cadernos - protected by ModuleGuard
      {
        path: 'cadernos',
        element: <ModuleGuard module="praticar"><NotebooksPage /></ModuleGuard>,
      },
      // Trilhas - protected by ModuleGuard
      {
        path: 'trilhas',
        element: <ModuleGuard module="praticar"><TrailsPage /></ModuleGuard>,
      },
      {
        path: 'trilhas/:slug',
        element: <ModuleGuard module="praticar"><TrailEditalPage /></ModuleGuard>,
      },
      // Minhas Anotações - protected by ModuleGuard
      {
        path: 'minhas-anotacoes',
        element: <ModuleGuard module="praticar"><GoldenNotebookPage /></ModuleGuard>,
      },
      {
        path: 'minhas-anotacoes/:id',
        element: <ModuleGuard module="praticar"><GoldenNotebookDetailPage /></ModuleGuard>,
      },
      // Meus Erros - protected by ModuleGuard
      {
        path: 'meus-erros',
        element: <ModuleGuard module="praticar"><MyErrorsPage /></ModuleGuard>,
      },
      // Meus Conteúdos - protected by ModuleGuard
      {
        path: 'meus-conteudos',
        element: <ModuleGuard module="praticar"><MyContentPage /></ModuleGuard>,
      },
      // Cursos
      {
        path: 'cursos',
        element: <CoursesPage />,
      },
      // Simulados - protected by ModuleGuard
      {
        path: 'simulados',
        element: <ModuleGuard module="simulados"><SimuladosPage /></ModuleGuard>,
      },
      {
        path: 'simulados/:id',
        element: <ModuleGuard module="simulados"><SimuladoDetailPage /></ModuleGuard>,
      },
      // Estatísticas - protected by ModuleGuard
      {
        path: 'estatisticas',
        element: <ModuleGuard module="estatisticas"><StatsPage /></ModuleGuard>,
      },
      // Loja - protected by ModuleGuard
      {
        path: 'loja',
        element: <ModuleGuard module="loja"><StorePage /></ModuleGuard>,
      },
      {
        path: 'loja/preparatorios',
        element: <ModuleGuard module="loja"><PreparatoriosStorePage /></ModuleGuard>,
      },
      // Inventário - not protected (user's own inventory)
      {
        path: 'inventario',
        element: <InventoryPage />,
      },
      // Settings/Profile pages - not protected
      {
        path: 'perfil',
        element: <ProfilePage />,
      },
      {
        path: 'notificacoes',
        element: <NotificationsPage />,
      },
      {
        path: 'privacidade',
        element: <PrivacySettingsPage />,
      },
      {
        path: 'ajuda',
        element: <HelpPage />,
      },

      // Music routes (inside MainLayout)
      {
        path: 'music',
        element: <ModuleGuard module="music"><MusicLayout /></ModuleGuard>,
        children: [
          {
            index: true,
            element: <Music />,
          },
          {
            path: 'playlist/:id',
            element: <MusicPlaylist />,
          },
          {
            path: 'library',
            element: <MusicLibrary />,
          },
          {
            path: 'search',
            element: <MusicSearch />,
          },
          {
            path: 'category/:slug',
            element: <MusicCategory />,
          },
          {
            path: 'aulas',
            element: <MusicLessonPodcasts />,
          },
          {
            path: 'solicitar',
            element: <MusicRequestAudio />,
          },
          {
            path: 'solicitacoes',
            element: <MusicMyRequests />,
          },
        ],
      },

    ],
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
