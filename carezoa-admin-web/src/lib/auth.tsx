// ============================================================================
// Auth Context — Manage admin authentication state
// ============================================================================

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiClient, { tokenManager } from '@/lib/api';
import type { User, AuthTokens } from '@/types';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (phone: string, code: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const token = tokenManager.getAccessToken();
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      // Fetch current user profile
      const response = await apiClient.get('/patients/me');
      const userData = response.data;
      
      // Only allow admin/support_agent roles
      if (userData.role !== 'admin' && userData.role !== 'support_agent') {
        logout();
        return;
      }
      
      setUser(userData);
    } catch (error) {
      console.error('Auth check failed:', error);
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (phone: string, code: string) => {
    try {
      const response = await apiClient.post('/auth/otp/verify', { phone, code });
      const { access_token, refresh_token } = response.data as AuthTokens;
      tokenManager.setTokens(access_token, refresh_token);

      // Fetch user profile
      const profileResponse = await apiClient.get('/patients/me');
      const userData = profileResponse.data;
      
      // Only allow admin/support_agent roles
      if (userData.role !== 'admin' && userData.role !== 'support_agent') {
        logout();
        throw new Error('Access denied. Admin or support agent role required.');
      }
      
      setUser(userData);
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    tokenManager.clearTokens();
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
