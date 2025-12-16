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
import StatsPage from '../pages/StatsPage';
import StorePage from '../pages/StorePage';
import PreparatoriosStorePage from '../pages/PreparatoriosStorePage';
import ProfilePage from '../pages/ProfilePage';

// Auth pages (will redirect from existing components)
import AuthPage from '../pages/AuthPage';

// Guards
import { ProtectedRoute } from '../components/auth/ProtectedRoute';
import { OnboardingGuard } from '../components/auth/OnboardingGuard';

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
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: 'trilha',
        element: <HomePage />,
      },
      {
        path: 'missao/:missionId',
        element: <MissionPage />,
      },
      {
        path: 'praticar',
        element: <PracticePage />,
      },
      {
        path: 'simulados',
        element: <SimuladosPage />,
      },
      {
        path: 'estatisticas',
        element: <StatsPage />,
      },
      {
        path: 'loja',
        element: <StorePage />,
      },
      {
        path: 'loja/preparatorios',
        element: <PreparatoriosStorePage />,
      },
      {
        path: 'perfil',
        element: <ProfilePage />,
      },
    ],
  },

  // Catch-all redirect
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
]);
