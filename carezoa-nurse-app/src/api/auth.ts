// ============================================================================
// Auth API
// ============================================================================

import apiClient from './client';
import type { OtpRequestResponse, OtpVerifyResponse } from '../types';

export const authApi = {
  /**
   * Request OTP for phone number
   */
  async requestOtp(phone: string): Promise<OtpRequestResponse> {
    const response = await apiClient.post('/auth/otp/request', { phone });
    return response.data;
  },

  /**
   * Verify OTP and get tokens
   */
  async verifyOtp(phone: string, code: string): Promise<OtpVerifyResponse> {
    const response = await apiClient.post('/auth/otp/verify', { phone, code });
    return response.data;
  },

  /**
   * Refresh access token
   */
  async refreshToken(refreshToken: string): Promise<OtpVerifyResponse> {
    const response = await apiClient.post('/auth/refresh', {
      refresh_token: refreshToken,
    });
    return response.data;
  },
};
