// ============================================================================
// Provider API — Profile, Credentials, Onboarding
// ============================================================================

import apiClient from './client';
import type {
  Provider,
  ProviderCredential,
  CredentialUploadResponse,
  VerificationStatus,
} from '../types';

export const providerApi = {
  /**
   * Get current provider's profile
   */
  async getMyProfile(): Promise<Provider> {
    const response = await apiClient.get('/providers/me');
    return response.data;
  },

  /**
   * Update provider profile
   */
  async updateProfile(data: Partial<Provider>): Promise<Provider> {
    const response = await apiClient.patch('/providers/me', data);
    return response.data;
  },

  /**
   * Get all credentials for current provider
   */
  async getCredentials(): Promise<ProviderCredential[]> {
    const response = await apiClient.get('/providers/me/credentials');
    return response.data.items || response.data;
  },

  /**
   * Request upload URL for a credential document
   */
  async requestCredentialUpload(
    docType: 'license' | 'id_proof' | 'certificate'
  ): Promise<CredentialUploadResponse> {
    const response = await apiClient.post('/providers/me/credentials', {
      doc_type: docType,
    });
    return response.data;
  },

  /**
   * Upload file to presigned URL
   */
  async uploadFile(uploadUrl: string, file: Blob | FormData): Promise<void> {
    await fetch(uploadUrl, {
      method: 'PUT',
      body: file,
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    });
  },

  /**
   * Update service area (lat, lng, coverage_km)
   */
  async updateServiceArea(data: {
    lat: number;
    lng: number;
    coverage_km: number;
    city: string;
  }): Promise<Provider> {
    const response = await apiClient.patch('/providers/me/service-area', data);
    return response.data;
  },

  /**
   * Get verification status summary
   */
  async getVerificationStatus(): Promise<{
    status: VerificationStatus;
    credentials: ProviderCredential[];
  }> {
    const response = await apiClient.get('/providers/me/verification');
    return response.data;
  },
};
