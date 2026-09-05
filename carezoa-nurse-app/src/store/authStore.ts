// ============================================================================
// Auth Store — Zustand with persistence
// ============================================================================

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { User } from '../types';
import { tokenManager } from '../api/client';

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;

  setAuth: (user: User, accessToken: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User) => void;
  checkAuth: () => Promise<boolean>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isLoading: false,
      user: null,

      setAuth: async (user, accessToken, refreshToken) => {
        await tokenManager.setTokens(accessToken, refreshToken);
        set({ isAuthenticated: true, user });
      },

      logout: async () => {
        await tokenManager.clearTokens();
        set({ isAuthenticated: false, user: null });
      },

      setUser: (user) => set({ user }),

      checkAuth: async () => {
        const token = await tokenManager.getAccessToken();
        if (token) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },
    }),
    {
      name: 'carezoa-auth',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        user: state.user,
      }),
    }
  )
);
