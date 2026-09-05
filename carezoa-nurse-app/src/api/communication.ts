// ============================================================================
// Communication API — Chat & Masked Calls
// ============================================================================

import apiClient from './client';
import type { Message, MaskedCall } from '../types';

export const communicationApi = {
  /**
   * Get messages for a booking
   */
  async getMessages(bookingId: number): Promise<Message[]> {
    const response = await apiClient.get(`/bookings/${bookingId}/messages`);
    return response.data;
  },

  /**
   * Send a message
   */
  async sendMessage(bookingId: number, body: string): Promise<Message> {
    const response = await apiClient.post(`/bookings/${bookingId}/messages`, { body });
    return response.data;
  },

  /**
   * Initiate masked call
   */
  async initiateMaskedCall(bookingId: number): Promise<MaskedCall> {
    const response = await apiClient.post(`/bookings/${bookingId}/masked-call`);
    return response.data;
  },
};
