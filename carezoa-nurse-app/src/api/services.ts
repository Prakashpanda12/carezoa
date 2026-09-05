// ============================================================================
// Service Catalogue API
// ============================================================================

import apiClient from './client';
import type { Service, ProviderServiceOffering } from '../types';

export const servicesApi = {
  /**
   * Get all available services in the catalogue
   */
  async getAllServices(): Promise<{ categories: string[]; items: Service[] }> {
    const response = await apiClient.get('/services');
    return response.data;
  },

  /**
   * Get current provider's service offerings
   */
  async getMyOfferings(): Promise<ProviderServiceOffering[]> {
    const response = await apiClient.get('/providers/me/offerings');
    return response.data.items || response.data;
  },

  /**
   * Add or update a service offering
   */
  async setOffering(serviceId: number, priceInr: number): Promise<ProviderServiceOffering> {
    const response = await apiClient.post('/providers/me/offerings', {
      service_id: serviceId,
      price_inr: priceInr,
    });
    return response.data;
  },

  /**
   * Remove a service offering
   */
  async removeOffering(offeringId: number): Promise<void> {
    await apiClient.delete(`/providers/me/offerings/${offeringId}`);
  },

  /**
   * Toggle offering active status
   */
  async toggleOffering(offeringId: number, active: boolean): Promise<ProviderServiceOffering> {
    const response = await apiClient.patch(`/providers/me/offerings/${offeringId}`, { active });
    return response.data;
  },
};
