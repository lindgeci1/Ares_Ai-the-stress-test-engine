import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: 'Admin' | 'User';
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredRole,
}) => {
  const { isAuthenticated, user, loading } = useAuth();

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#050505] flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-2 border-[#EF4444] border-t-transparent animate-spin mx-auto mb-4"></div>
          <p className="font-mono text-xs text-[#666] tracking-widest">AUTHENTICATING...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && user) {
    const userRole = user.roles?.[0]?.name;
    if (userRole !== requiredRole && userRole !== 'Admin') {
      return <Navigate to="/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
