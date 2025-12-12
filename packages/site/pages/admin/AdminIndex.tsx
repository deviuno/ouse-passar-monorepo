import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext';
import { Dashboard } from './Dashboard';

export const AdminIndex: React.FC = () => {
    const { isAdmin, isVendedor } = useAuth();

    // Vendedores são redirecionados para planejamentos
    if (isVendedor && !isAdmin) {
        return <Navigate to="/admin/planejamentos" replace />;
    }

    // Admins veem o dashboard
    return <Dashboard />;
};
