import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../../types';
import { LoadingScreen } from './LoadingScreen';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    // Si no tiene el rol permitido, redirigir a su página principal predeterminada
    const target = (user.role === UserRole.CLIENTE || user.role === UserRole.EMPLEADO)
      ? '/home'
      : '/dashboard';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};
