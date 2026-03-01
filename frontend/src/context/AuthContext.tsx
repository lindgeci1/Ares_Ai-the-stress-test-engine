import React, { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { User, authService } from '../services/authService';

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  roleId: number | null;
  isAdmin: boolean;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  // Legacy methods for backward compatibility
  loginAsUser: () => void;
  loginAsAdmin: () => void;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  roleId: null,
  isAdmin: false,
  loading: true,
  login: () => {},
  logout: () => {},
  loginAsUser: () => {},
  loginAsAdmin: () => {},
});

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Load user from backend on mount using JWT token
  useEffect(() => {
    const loadUser = async () => {
      const token = authService.getToken();
      if (token) {
        try {
          // Fetch current user from backend - this validates the JWT
          const currentUser = await authService.getCurrentUser();
          setUser(currentUser);
        } catch (error) {
          // Token invalid or expired, clear it
          authService.clearToken();
          setUser(null);
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout(); // Call backend to clear cookies
    } catch (error) {
      console.error('Logout error:', error);
    }
    setUser(null);
    authService.clearToken();
  };

  // Get role ID from user
  const roleId = user ? authService.getRoleIdFromUser(user) : null;
  const isAdmin = user ? authService.isAdmin(user) : false;

  // Legacy methods for backward compatibility
  const loginAsUser = () => {
    // This is for demo purposes, create a mock user
    const mockUser: User = {
      id: Math.floor(Math.random() * 1000000),
      email: 'user@demo.com',
      operator_name: 'Demo User',
      subscription_tier: 'Free',
      status: 'active',
      roles: [{ id: 2, name: 'User', permissions: {} }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    login(mockUser);
  };

  const loginAsAdmin = () => {
    // This is for demo purposes, create a mock admin user
    const mockAdmin: User = {
      id: Math.floor(Math.random() * 1000000),
      email: 'admin@demo.com',
      operator_name: 'Demo Admin',
      subscription_tier: 'Enterprise',
      status: 'active',
      roles: [{ id: 1, name: 'Admin', permissions: {} }],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    login(mockAdmin);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        roleId,
        isAdmin,
        loading,
        login,
        logout,
        loginAsUser,
        loginAsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}