import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../services/supabaseClient';
import { UserProfile, UserOnboarding, OnboardingStepName } from '../types';
import { useUserStore } from './useUserStore';

import { STORAGE_KEYS } from '../constants';

interface AuthState {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  onboarding: UserOnboarding | null;
  isLoading: boolean;
  isAuthenticated: boolean;

  // Actions
  setUser: (user: User | null) => void;
  setSession: (session: Session | null) => void;
  setProfile: (profile: UserProfile | null) => void;
  setOnboarding: (onboarding: UserOnboarding | null) => void;
  setLoading: (loading: boolean) => void;

  // Auth methods
  login: (email: string, password: string) => Promise<{ error: string | null }>;
  register: (email: string, password: string, name?: string, phone?: string) => Promise<{ error: string | null }>;
  loginWithGoogle: () => Promise<{ error: string | null }>;
  loginAnonymously: () => Promise<{ error: string | null }>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<{ error: string | null }>;
  changePassword: (newPassword: string) => Promise<{ error: string | null }>;

  // Data methods
  fetchProfile: () => Promise<void>;
  fetchOnboarding: () => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;

  // Onboarding methods (progressive save)
  updateOnboardingStep: (step: OnboardingStepName, data?: Partial<UserOnboarding>) => Promise<{ error: string | null }>;
  completeOnboarding: (data: Partial<UserOnboarding>) => Promise<void>;
  getOnboardingStep: () => OnboardingStepName | null;

  // Init
  initialize: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      session: null,
      profile: null,
      onboarding: null,
      isLoading: true,
      isAuthenticated: false,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      setSession: (session) => set({ session }),
      setProfile: (profile) => set({ profile }),
      setOnboarding: (onboarding) => set({ onboarding }),
      setLoading: (isLoading) => set({ isLoading }),

      login: async (email, password) => {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          if (error) return { error: error.message };
          set({ user: data.user, session: data.session, isAuthenticated: true });
          await get().fetchProfile();
          await get().fetchOnboarding();
          return { error: null };
        } catch (err: any) {
          return { error: err.message || 'Erro ao fazer login' };
        }
      },

      register: async (email, password, name, phone) => {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { name, phone },
            },
          });
          if (error) return { error: error.message };
          set({ user: data.user, session: data.session, isAuthenticated: !!data.user });

          if (data.user) {
            // Criar user_profiles
            await supabase.from('user_profiles').upsert({
              id: data.user.id,
              email,
              name,
              phone,
            });

            // Criar registro de onboarding inicial
            // Usar INSERT com conflict handling
            const onboardingRecord = {
              user_id: data.user.id,
              onboarding_step: 'concurso' as OnboardingStepName,
            };

            // Primeiro tentar buscar se já existe
            const { data: existingOnboarding } = await supabase
              .from('user_onboarding')
              .select('*')
              .eq('user_id', data.user.id)
              .single();

            if (existingOnboarding) {
              // Já existe, fazer UPDATE
              const { data: updatedData, error: updateError } = await supabase
                .from('user_onboarding')
                .update({ onboarding_step: 'concurso' as OnboardingStepName })
                .eq('user_id', data.user.id)
                .select()
                .single();

              if (!updateError && updatedData) {
                set({ onboarding: updatedData as UserOnboarding });
              }
            } else {
              // Não existe, fazer INSERT
              const { data: onboardingData, error: onboardingError } = await supabase
                .from('user_onboarding')
                .insert(onboardingRecord)
                .select()
                .single();

              if (!onboardingError && onboardingData) {
                set({ onboarding: onboardingData as UserOnboarding });
              }
            }
          }

          return { error: null };
        } catch (err: any) {
          return { error: err.message || 'Erro ao criar conta' };
        }
      },

      loginWithGoogle: async () => {
        try {
          const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
              redirectTo: window.location.origin,
            },
          });
          if (error) return { error: error.message };
          return { error: null };
        } catch (err: any) {
          return { error: err.message || 'Erro ao fazer login com Google' };
        }
      },

      loginAnonymously: async () => {
        try {
          const { data, error } = await supabase.auth.signInAnonymously();
          if (error) return { error: error.message };
          set({ user: data.user, session: data.session, isAuthenticated: true });
          return { error: null };
        } catch (err: any) {
          return { error: err.message || 'Erro ao entrar como convidado' };
        }
      },

      logout: async () => {
        await supabase.auth.signOut();

        // Limpar localStorage completamente
        localStorage.removeItem('ousepassar_onboarding_completed');
        localStorage.removeItem('ousepassar_onboarding_data');
        localStorage.removeItem('auth-storage'); // Zustand persist

        // Limpar dados da trilha e gamificação
        Object.values(STORAGE_KEYS).forEach(key => {
          localStorage.removeItem(key);
        });

        // Resetar store de usuário em memória
        useUserStore.getState().reset();

        set({
          user: null,
          session: null,
          profile: null,
          onboarding: null,
          isAuthenticated: false,
        });
      },

      forgotPassword: async (email) => {
        try {
          const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
          });
          if (error) return { error: error.message };
          return { error: null };
        } catch (err: any) {
          return { error: err.message || 'Erro ao enviar email de recuperacao' };
        }
      },

      changePassword: async (newPassword) => {
        try {
          const { error } = await supabase.auth.updateUser({
            password: newPassword,
          });
          if (error) return { error: error.message };
          return { error: null };
        } catch (err: any) {
          return { error: err.message || 'Erro ao alterar senha' };
        }
      },

      fetchProfile: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.error('Error fetching profile:', error);
            return;
          }

          if (data) {
            const profileData = data as UserProfile;
            set({ profile: profileData });

            // Sincronizar dados com useUserStore
            useUserStore.getState().setStats({
              xp: profileData.xp,
              coins: profileData.coins,
              streak: profileData.streak,
              level: profileData.level,
              correctAnswers: profileData.correct_answers,
              totalAnswered: profileData.total_answered,
              avatarId: profileData.avatar_id,
              lastPracticeDate: profileData.last_practice_date,
            });
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }
      },

      fetchOnboarding: async () => {
        const { user } = get();
        if (!user) return;

        try {
          const { data, error } = await supabase
            .from('user_onboarding')
            .select('*')
            .eq('user_id', user.id)
            .single();

          if (error && error.code !== 'PGRST116') {
            console.warn('Database fetch failed, checking local storage:', error.message);
            // Try to load from localStorage
            const localData = localStorage.getItem(`onboarding_${user.id}`);
            if (localData) {
              set({ onboarding: JSON.parse(localData) as UserOnboarding });
            }
            return;
          }

          if (data) {
            set({ onboarding: data as UserOnboarding });
          } else {
            // No data in DB, check localStorage
            const localData = localStorage.getItem(`onboarding_${user.id}`);
            if (localData) {
              set({ onboarding: JSON.parse(localData) as UserOnboarding });
            }
          }
        } catch (err) {
          console.warn('Error fetching onboarding, checking local storage:', err);
          // Try to load from localStorage
          const localData = localStorage.getItem(`onboarding_${user.id}`);
          if (localData) {
            set({ onboarding: JSON.parse(localData) as UserOnboarding });
          }
        }
      },

      updateProfile: async (updates) => {
        const { user, profile } = get();
        if (!user) return;

        try {
          const { error } = await supabase
            .from('user_profiles')
            .update(updates)
            .eq('id', user.id);

          if (error) throw error;

          set({ profile: { ...profile!, ...updates } });
        } catch (err) {
          console.error('Error updating profile:', err);
        }
      },

      // Atualizar etapa do onboarding progressivamente
      updateOnboardingStep: async (step, data = {}) => {
        const { user, onboarding } = get();
        if (!user) return { error: 'Usuário não autenticado' };

        try {
          const updateData = {
            onboarding_step: step,
            ...data,
            updated_at: new Date().toISOString(),
          };

          // Usar UPDATE se já existe registro, senão INSERT
          let result;
          let error;

          if (onboarding?.id) {
            // UPDATE - registro já existe
            const response = await supabase
              .from('user_onboarding')
              .update(updateData)
              .eq('user_id', user.id)
              .select()
              .single();
            result = response.data;
            error = response.error;
          } else {
            // INSERT - primeiro registro
            const response = await supabase
              .from('user_onboarding')
              .insert({ user_id: user.id, ...updateData })
              .select()
              .single();
            result = response.data;
            error = response.error;
          }

          if (error) {
            console.warn('Erro ao salvar etapa do onboarding:', error.message);
            // Salvar localmente como fallback
            const localData = { ...onboarding, user_id: user.id, ...updateData };
            localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(localData));
            set({ onboarding: localData as UserOnboarding });
            return { error: null }; // Não bloquear o fluxo
          }

          set({ onboarding: result as UserOnboarding });
          return { error: null };
        } catch (err: any) {
          console.warn('Erro ao salvar etapa:', err);
          return { error: err.message };
        }
      },

      // Obter etapa atual do onboarding
      getOnboardingStep: () => {
        const { onboarding } = get();
        if (!onboarding) return null;
        return onboarding.onboarding_step || null;
      },

      // Finalizar onboarding
      completeOnboarding: async (data) => {
        const { user, onboarding } = get();
        if (!user) return;

        const completeData = {
          ...data,
          onboarding_step: 'completed' as OnboardingStepName,
          completed_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        try {
          // Usar UPDATE se já existe registro
          let result;
          let error;

          if (onboarding?.id) {
            const response = await supabase
              .from('user_onboarding')
              .update(completeData)
              .eq('user_id', user.id)
              .select()
              .single();
            result = response.data;
            error = response.error;
          } else {
            const response = await supabase
              .from('user_onboarding')
              .insert({ user_id: user.id, ...completeData })
              .select()
              .single();
            result = response.data;
            error = response.error;
          }

          if (error) {
            console.warn('Database save failed, using local storage:', error.message);
            const localData = { ...onboarding, user_id: user.id, ...completeData, id: onboarding?.id || crypto.randomUUID(), created_at: onboarding?.created_at || new Date().toISOString() };
            localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(localData));
            set({ onboarding: localData as UserOnboarding });
          } else {
            set({ onboarding: result as UserOnboarding });
          }
        } catch (err) {
          console.warn('Database error, using local storage:', err);
          const localData = { ...onboarding, user_id: user.id, ...completeData, id: onboarding?.id || crypto.randomUUID(), created_at: onboarding?.created_at || new Date().toISOString() };
          localStorage.setItem(`onboarding_${user.id}`, JSON.stringify(localData));
          set({ onboarding: localData as UserOnboarding });
        }
      },

      initialize: async () => {
        set({ isLoading: true });

        // Check if Supabase is configured
        const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
        const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
          console.warn('Supabase not configured, running in demo mode');
          set({ isLoading: false });
          return;
        }

        try {
          // Add timeout to prevent infinite loading
          const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Timeout')), 5000)
          );

          const sessionPromise = supabase.auth.getSession();

          const { data: { session } } = await Promise.race([
            sessionPromise,
            timeoutPromise,
          ]) as { data: { session: any } };

          if (session?.user) {
            set({
              user: session.user,
              session,
              isAuthenticated: true,
            });
            // Fetch profile and onboarding with timeout
            await Promise.race([
              Promise.all([get().fetchProfile(), get().fetchOnboarding()]),
              new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
            ]).catch(() => console.warn('Profile/onboarding fetch timeout'));
          }

          // Listen for auth changes
          supabase.auth.onAuthStateChange(async (event, session) => {
            set({
              user: session?.user ?? null,
              session,
              isAuthenticated: !!session?.user,
            });

            if (session?.user) {
              await get().fetchProfile();
              await get().fetchOnboarding();
            }
          });
        } catch (err) {
          console.error('Error initializing auth:', err);
        } finally {
          set({ isLoading: false });
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        // Only persist these fields
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
