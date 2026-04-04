import { useState, createContext, useContext, useEffect, ReactNode } from 'react';
import { User, authService } from '../services/authService';

const noop = () => undefined;
const noopAsync = async () => undefined;

type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  roleId: number | null;
  isAdmin: boolean;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
  refreshUser: () => Promise<void>;
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
  login: noop,
  logout: noop,
  refreshUser: noopAsync,
  loginAsUser: noop,
  loginAsAdmin: noop,
});

export { AuthContext };

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const currentUser = await authService.getCurrentUser();
    setUser(currentUser);
  };

  // Load user from backend on mount using silent refresh
  useEffect(() => {
    const loadUser = async () => {
      try {
        await authService.refreshToken();
        await refreshUser();
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    loadUser();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
  };

  const logout = async () => {
    try {
      await authService.logout();
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
        refreshUser,
        loginAsUser,
        loginAsAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  return useContext(AuthContext);
}