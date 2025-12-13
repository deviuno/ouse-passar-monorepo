import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../lib/AuthContext';
import { Loader2 } from 'lucide-react';

interface AdminOnlyRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AdminOnlyRoute: React.FC<AdminOnlyRouteProps> = ({
  children,
  redirectTo = '/admin/leads'
}) => {
  const { isAdmin, isLoading, isAuthenticated } = useAuth();

  // Espera carregar a autenticação
  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 text-brand-yellow animate-spin" />
      </div>
    );
  }

  // Se não está autenticado, deixa o ProtectedRoute lidar com isso
  if (!isAuthenticated) {
    return null;
  }

  // Se está autenticado mas não é admin, redireciona
  if (!isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
