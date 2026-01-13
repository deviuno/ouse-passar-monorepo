import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { Tables } from '../lib/database.types';

type AdminUser = Tables<'admin_users'>;

interface StudentProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Componente de proteção de rota para alunos (clientes).
 * Verifica se há um aluno logado via localStorage (ouse_student_user).
 * Diferente do ProtectedRoute que é para admin/vendedor.
 */
export const StudentProtectedRoute: React.FC<StudentProtectedRouteProps> = ({ children }) => {
  const location = useLocation();
  const [isLoading, setIsLoading] = React.useState(true);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = () => {
      try {
        const storedStudent = localStorage.getItem('ouse_student_user');
        if (storedStudent) {
          const student: AdminUser = JSON.parse(storedStudent);
          // Verificar se é um aluno válido (role = cliente)
          if (student && student.id && student.role === 'cliente') {
            setIsAuthenticated(true);
          }
        }
      } catch (error) {
        console.error('Erro ao verificar autenticação do aluno:', error);
      } finally {
        setIsLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center theme-transition">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-brand-yellow animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-mono uppercase text-sm">Verificando acesso...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Redireciona para login do ALUNO, não do admin
    return <Navigate to={`/login?redirect=${encodeURIComponent(location.pathname)}`} replace />;
  }

  return <>{children}</>;
};
