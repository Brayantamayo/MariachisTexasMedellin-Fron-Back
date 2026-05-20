import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { UserRole } from '../../types';
import { LoadingScreen } from './LoadingScreen';

interface PublicRouteProps {
  children: React.ReactNode;
}

/**
 * Envuelve rutas de auth (login, register, etc.)
 * Si el usuario ya está autenticado, lo redirige al dashboard/home según su rol.
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) return <LoadingScreen />;

  if (isAuthenticated) {
    const target = (user?.role === UserRole.CLIENTE || user?.role === UserRole.EMPLEADO)
      ? '/home'
      : '/dashboard';
    return <Navigate to={target} replace />;
  }

  return <>{children}</>;
};
