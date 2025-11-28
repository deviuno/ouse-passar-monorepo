import { supabase } from './supabaseClient';
import { User, Session } from '@supabase/supabase-js';

// ============================================
// AUTH STATE
// ============================================

export const getCurrentUser = async (): Promise<User | null> => {
  const { data: { user } } = await supabase.auth.getUser();
  return user;
};

export const getCurrentSession = async (): Promise<Session | null> => {
  const { data: { session } } = await supabase.auth.getSession();
  return session;
};

// ============================================
// SIGN UP / SIGN IN
// ============================================

export const signUpWithEmail = async (
  email: string,
  password: string,
  metadata?: { name?: string }
): Promise<{ user: User | null; error: string | null }> => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: metadata,
    },
  });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
};

export const signInWithEmail = async (
  email: string,
  password: string
): Promise<{ user: User | null; error: string | null }> => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
};

export const signInWithGoogle = async (): Promise<{ error: string | null }> => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: window.location.origin,
    },
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
};

// ============================================
// SIGN OUT
// ============================================

export const signOut = async (): Promise<{ error: string | null }> => {
  const { error } = await supabase.auth.signOut();

  if (error) {
    return { error: error.message };
  }

  return { error: null };
};

// ============================================
// PASSWORD RESET
// ============================================

export const resetPassword = async (email: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${window.location.origin}/reset-password`,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
};

export const updatePassword = async (newPassword: string): Promise<{ error: string | null }> => {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { error: null };
};

// ============================================
// AUTH STATE LISTENER
// ============================================

export const onAuthStateChange = (
  callback: (event: string, session: Session | null) => void
) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(event, session);
  });
};

// ============================================
// ANONYMOUS AUTH (for guests)
// ============================================

export const signInAnonymously = async (): Promise<{ user: User | null; error: string | null }> => {
  const { data, error } = await supabase.auth.signInAnonymously();

  if (error) {
    return { user: null, error: error.message };
  }

  return { user: data.user, error: null };
};
