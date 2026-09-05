// ============================================================================
// Availability API
// ============================================================================

import apiClient from './client';
import type { AvailabilityWindow } from '../types';

export const availabilityApi = {
  /**
   * Get current provider's availability windows
   */
  async getMyAvailability(): Promise<AvailabilityWindow[]> {
    const response = await apiClient.get('/providers/me/availability');
    return response.data.items || response.data;
  },

  /**
   * Set availability windows (replaces all existing)
   */
  async setAvailability(windows: AvailabilityWindow[]): Promise<void> {
    await apiClient.put('/providers/me/availability', windows);
  },
};
