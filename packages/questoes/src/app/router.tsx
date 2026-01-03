import React from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';

// Layouts
import MainLayout from '../components/layout/MainLayout';

// Pages
import OnboardingPage from '../pages/OnboardingPage';
import HomePage from '../pages/HomePage';
import MissionPage from '../pages/MissionPage';
import PracticePage from '../pages/PracticePage';
import SimuladosPage from '../pages/SimuladosPage';
import SimuladoDetailPage from '../pages/SimuladoDetailPage';
import SimuladoExecPage from '../pages/SimuladoExecPage';
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
      // Praticar - protected by ModuleGuard
      {
        path: 'praticar',
        element: <ModuleGuard module="praticar"><PracticePage /></ModuleGuard>,
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
    ],
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
