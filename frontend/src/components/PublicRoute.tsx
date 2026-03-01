import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface PublicRouteProps {
  children: React.ReactNode;
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ children }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  // Don't redirect while loading
  if (loading) {
    return null; // Or show a minimal loader
  }

  if (isAuthenticated) {
    // Redirect based on user role
    return <Navigate to={isAdmin ? "/admin" : "/dashboard"} replace />;
  }

  return <>{children}</>;
};
