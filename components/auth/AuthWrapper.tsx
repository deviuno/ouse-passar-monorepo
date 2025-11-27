import React, { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import LoginView from './LoginView';
import RegisterView from './RegisterView';
import ForgotPasswordView from './ForgotPasswordView';
import ResetPasswordView from './ResetPasswordView';
import { LOGO_URL } from '../../constants';
import { supabase } from '../../services/supabaseClient';

type AuthView = 'login' | 'register' | 'forgot_password' | 'reset_password';

interface AuthWrapperProps {
  children: React.ReactNode;
}

const AuthWrapper: React.FC<AuthWrapperProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const [authView, setAuthView] = useState<AuthView>('login');
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

  // Check for password recovery mode (user clicked reset link in email)
  useEffect(() => {
    const checkForRecovery = async () => {
      // Check URL hash for recovery token
      const hashParams = new URLSearchParams(window.location.hash.substring(1));
      const accessToken = hashParams.get('access_token');
      const type = hashParams.get('type');

      if (type === 'recovery' && accessToken) {
        setIsPasswordRecovery(true);
        setAuthView('reset_password');
      }
    };

    checkForRecovery();

    // Also listen for PASSWORD_RECOVERY event
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        setAuthView('reset_password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] flex flex-col items-center justify-center">
        <img src={LOGO_URL} alt="Ouse Passar" className="h-16 mb-6" />
        <Loader2 className="animate-spin text-[#FFB800]" size={32} />
        <p className="text-gray-400 mt-4 text-sm">Carregando...</p>
      </div>
    );
  }

  // Show reset password view if in recovery mode (even if authenticated)
  if (isPasswordRecovery) {
    return (
      <ResetPasswordView
        onSuccess={() => {
          setIsPasswordRecovery(false);
          // Clear URL hash
          window.history.replaceState(null, '', window.location.pathname);
        }}
        logoUrl={LOGO_URL}
      />
    );
  }

  // If authenticated, show the app
  if (isAuthenticated) {
    return <>{children}</>;
  }

  // Show auth views
  switch (authView) {
    case 'login':
      return (
        <LoginView
          onSuccess={() => {
            // Auth state will update automatically
          }}
          onNavigateToRegister={() => setAuthView('register')}
          onNavigateToForgotPassword={() => setAuthView('forgot_password')}
          logoUrl={LOGO_URL}
        />
      );

    case 'register':
      return (
        <RegisterView
          onSuccess={() => {
            // After successful registration, go to login
            setAuthView('login');
          }}
          onNavigateToLogin={() => setAuthView('login')}
          logoUrl={LOGO_URL}
        />
      );

    case 'forgot_password':
      return (
        <ForgotPasswordView
          onNavigateToLogin={() => setAuthView('login')}
          logoUrl={LOGO_URL}
        />
      );

    case 'reset_password':
      return (
        <ResetPasswordView
          onSuccess={() => {
            setAuthView('login');
          }}
          logoUrl={LOGO_URL}
        />
      );

    default:
      return (
        <LoginView
          onSuccess={() => {}}
          onNavigateToRegister={() => setAuthView('register')}
          onNavigateToForgotPassword={() => setAuthView('forgot_password')}
          logoUrl={LOGO_URL}
        />
      );
  }
};

export default AuthWrapper;
