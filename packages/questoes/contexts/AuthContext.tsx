import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase, DbUserProfile } from '../services/supabaseClient';
import {
  signInWithEmail,
  signUpWithEmail,
  signInWithGoogle,
  signOut as authSignOut,
  resetPassword,
  updatePassword,
  signInAnonymously
} from '../services/authService';

interface AuthContextType {
  // State
  user: User | null;
  session: Session | null;
  profile: DbUserProfile | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, name?: string) => Promise<{ error: string | null }>;
  loginWithGoogle: () => Promise<{ error: string | null }>;
  logout: () => Promise<{ error: string | null }>;
  forgotPassword: (email: string) => Promise<{ error: string | null }>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;
  loginAnonymously: () => Promise<{ error: string | null }>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<DbUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch user profile from database
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        // Profile might not exist yet (new user)
        if (error.code === 'PGRST116') {
          console.log('Profile not found, might be creating...');
          return;
        }
        console.error('Error fetching profile:', error);
        return;
      }

      setProfile(data);
    } catch (err) {
      console.error('Error loading profile:', err);
    }
  }, []);

  // Initialize auth state
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        // Get current session
        const { data: { session: currentSession } } = await supabase.auth.getSession();

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        if (currentSession?.user) {
          await loadProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('Auth state changed:', event);

        setSession(newSession);
        setUser(newSession?.user ?? null);

        if (event === 'SIGNED_IN' && newSession?.user) {
          // Small delay to allow trigger to create profile
          setTimeout(() => loadProfile(newSession.user.id), 500);
        }

        if (event === 'SIGNED_OUT') {
          setProfile(null);
        }

        if (event === 'USER_UPDATED' && newSession?.user) {
          await loadProfile(newSession.user.id);
        }

        if (event === 'PASSWORD_RECOVERY') {
          // User clicked on password reset link
          console.log('Password recovery mode');
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [loadProfile]);

  // Login with email/password
  const login = async (email: string, password: string) => {
    const { user: loggedUser, error } = await signInWithEmail(email, password);

    if (error) {
      return { error };
    }

    if (loggedUser) {
      await loadProfile(loggedUser.id);
    }

    return { error: null };
  };

  // Register new user
  const register = async (email: string, password: string, name?: string) => {
    const { user: newUser, error } = await signUpWithEmail(email, password, { name });

    if (error) {
      return { error };
    }

    // If auto-confirm is enabled, load profile
    if (newUser) {
      setTimeout(() => loadProfile(newUser.id), 1000);
    }

    return { error: null };
  };

  // Login with Google
  const loginWithGoogle = async () => {
    const { error } = await signInWithGoogle();
    return { error };
  };

  // Logout
  const logout = async () => {
    const { error } = await authSignOut();

    if (!error) {
      setUser(null);
      setSession(null);
      setProfile(null);
    }

    return { error };
  };

  // Forgot password
  const forgotPassword = async (email: string) => {
    const { error } = await resetPassword(email);
    return { error };
  };

  // Change password
  const changePassword = async (newPassword: string) => {
    const { error } = await updatePassword(newPassword);
    return { error };
  };

  // Login anonymously (for guests)
  const loginAnonymously = async () => {
    const { user: anonUser, error } = await signInAnonymously();

    if (error) {
      return { error };
    }

    if (anonUser) {
      await loadProfile(anonUser.id);
    }

    return { error: null };
  };

  // Refresh profile data
  const refreshProfile = async () => {
    if (user) {
      await loadProfile(user.id);
    }
  };

  const value: AuthContextType = {
    user,
    session,
    profile,
    isLoading,
    isAuthenticated: !!user,
    login,
    register,
    loginWithGoogle,
    logout,
    forgotPassword,
    changePassword,
    loginAnonymously,
    refreshProfile,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
