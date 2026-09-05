// ============================================================================
// Auth Hooks
// ============================================================================

import { useMutation } from '@tanstack/react-query';
import { authApi } from '../api/auth';
import { tokenManager } from '../api/client';
import { useAuthStore } from '../store/authStore';

export function useRequestOtp() {
  return useMutation({
    mutationFn: (phone: string) => authApi.requestOtp(phone),
  });
}

export function useVerifyOtp() {
  const setAuth = useAuthStore((s) => s.setAuth);

  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      authApi.verifyOtp(phone, code),
    onSuccess: async (data) => {
      await tokenManager.setTokens(data.access_token, data.refresh_token);
      useAuthStore.setState({ isAuthenticated: true });
    },
  });
}
