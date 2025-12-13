import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from './supabase';
import { UserRole } from './database.types';

interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar_url: string | null;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAdmin: boolean;
  isVendedor: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for stored session on mount
  useEffect(() => {
    const storedUser = localStorage.getItem('ouse_admin_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        localStorage.removeItem('ouse_admin_user');
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      // Buscar usuário no banco de dados
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('email', email)
        .eq('is_active', true)
        .single();

      if (error || !data) {
        console.error('Erro ao buscar usuário:', error);
        return false;
      }

      // Verificar senha (em produção, usar hash)
      if (data.password_hash !== password) {
        return false;
      }

      // IMPORTANTE: Bloquear login de clientes no painel admin
      // Clientes devem usar a página /login (StudentLogin)
      if (data.role === 'cliente') {
        console.warn('Tentativa de login de cliente no painel admin bloqueada');
        return false;
      }

      // Atualizar último login
      await supabase
        .from('admin_users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', data.id);

      const loggedUser: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        avatar_url: data.avatar_url
      };

      setUser(loggedUser);
      localStorage.setItem('ouse_admin_user', JSON.stringify(loggedUser));
      return true;
    } catch (error) {
      console.error('Erro no login:', error);
      return false;
    }
  };

  const refreshUser = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error || !data) {
        console.error('Erro ao atualizar usuário:', error);
        return;
      }

      const updatedUser: User = {
        id: data.id,
        email: data.email,
        name: data.name,
        role: data.role as UserRole,
        avatar_url: data.avatar_url
      };

      setUser(updatedUser);
      localStorage.setItem('ouse_admin_user', JSON.stringify(updatedUser));
    } catch (error) {
      console.error('Erro ao atualizar usuário:', error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('ouse_admin_user');
  };

  const isAdmin = user?.role === 'admin';
  const isVendedor = user?.role === 'vendedor';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isLoading,
        isAdmin,
        isVendedor
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
