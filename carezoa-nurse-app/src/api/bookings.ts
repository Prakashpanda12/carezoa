// ============================================================================
// Bookings API — Provider Side
// ============================================================================

import apiClient from './client';
import type { Booking, BookingStatus } from '../types';

export const bookingsApi = {
  /**
   * Get all bookings for current provider
   */
  async getMyBookings(scope: 'upcoming' | 'past' | 'all' = 'all'): Promise<Booking[]> {
    const response = await apiClient.get('/providers/me/bookings', {
      params: { scope },
    });
    return response.data;
  },

  /**
   * Get new booking requests (pending acceptance)
   */
  async getNewRequests(): Promise<Booking[]> {
    const response = await apiClient.get('/providers/me/requests');
    return response.data;
  },

  /**
   * Accept a booking request
   */
  async acceptBooking(bookingId: number): Promise<Booking> {
    const response = await apiClient.post(`/bookings/${bookingId}/accept`);
    return response.data;
  },

  /**
   * Decline a booking request
   */
  async declineBooking(bookingId: number, reason?: string): Promise<void> {
    await apiClient.post(`/bookings/${bookingId}/decline`, { reason });
  },

  /**
   * Get booking details
   */
  async getBooking(bookingId: number): Promise<Booking> {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data;
  },

  /**
   * Provider departed — starts en_route state
   */
  async providerDeparted(bookingId: number): Promise<Booking> {
    const response = await apiClient.post(`/bookings/${bookingId}/provider-departed`);
    return response.data;
  },

  /**
   * Verify OTP at patient location — checked_in state
   */
  async verifyOtp(bookingId: number, code: string): Promise<Booking> {
    const response = await apiClient.post(`/bookings/${bookingId}/verify-otp`, { code });
    return response.data;
  },

  /**
   * Start service — in_service state
   */
  async startService(bookingId: number): Promise<Booking> {
    const response = await apiClient.post(`/bookings/${bookingId}/start`);
    return response.data;
  },

  /**
   * Complete service — completed state
   */
  async completeService(bookingId: number): Promise<Booking> {
    const response = await apiClient.post(`/bookings/${bookingId}/complete`);
    return response.data;
  },

  /**
   * Cancel booking (provider side)
   */
  async cancelBooking(bookingId: number, reason?: string): Promise<Booking> {
    const response = await apiClient.post(`/bookings/${bookingId}/cancel`, { reason });
    return response.data;
  },

  /**
   * Reschedule booking
   */
  async rescheduleBooking(bookingId: number, startsAt: string): Promise<Booking> {
    const response = await apiClient.post(`/bookings/${bookingId}/reschedule`, {
      starts_at: startsAt,
    });
    return response.data;
  },

  /**
   * Submit service report after visit
   */
  async submitServiceReport(
    bookingId: number,
    data: { summary: string; vitals: Record<string, string>; notes?: string }
  ): Promise<{ report_id: number; payout_status: string }> {
    const response = await apiClient.post(`/bookings/${bookingId}/report`, data);
    return response.data;
  },
};
