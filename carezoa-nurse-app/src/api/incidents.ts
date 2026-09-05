// ============================================================================
// Incidents API
// ============================================================================

import apiClient from './client';
import type { Incident, IncidentReportInput } from '../types';

export const incidentsApi = {
  /**
   * Report an incident for a booking
   */
  async reportIncident(
    bookingId: number,
    data: IncidentReportInput
  ): Promise<{ incident_id: number; status: string }> {
    const response = await apiClient.post(`/bookings/${bookingId}/incident`, data);
    return response.data;
  },

  /**
   * Get incidents reported by current provider
   */
  async getMyIncidents(): Promise<Incident[]> {
    const response = await apiClient.get('/incidents/me');
    return response.data.items || response.data;
  },
};
