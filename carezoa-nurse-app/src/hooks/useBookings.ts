// ============================================================================
// Booking Hooks — TanStack Query
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { bookingsApi } from '../api/bookings';
import { useOfflineQueueStore } from '../store/offlineQueueStore';

export function useMyBookings(scope: 'upcoming' | 'past' | 'all' = 'all') {
  return useQuery({
    queryKey: ['bookings', scope],
    queryFn: () => bookingsApi.getMyBookings(scope),
  });
}

export function useNewRequests() {
  return useQuery({
    queryKey: ['booking-requests'],
    queryFn: () => bookingsApi.getNewRequests(),
    refetchInterval: 30000, // Poll every 30 seconds
  });
}

export function useBooking(bookingId: number) {
  return useQuery({
    queryKey: ['booking', bookingId],
    queryFn: () => bookingsApi.getBooking(bookingId),
    enabled: !!bookingId,
  });
}

export function useAcceptBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (bookingId: number) => bookingsApi.acceptBooking(bookingId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

export function useDeclineBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: number; reason?: string }) =>
      bookingsApi.declineBooking(bookingId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['booking-requests'] });
    },
  });
}

/**
 * Provider departed — with offline queue fallback
 */
export function useProviderDeparted() {
  const queryClient = useQueryClient();
  const { enqueue } = useOfflineQueueStore();

  return useMutation({
    mutationFn: (bookingId: number) => bookingsApi.providerDeparted(bookingId),
    onSuccess: (_, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (_, bookingId) => {
      enqueue({
        type: 'provider_departed',
        bookingId,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

/**
 * Verify OTP — with offline queue fallback
 */
export function useVerifyBookingOtp() {
  const queryClient = useQueryClient();
  const { enqueue } = useOfflineQueueStore();

  return useMutation({
    mutationFn: ({ bookingId, code }: { bookingId: number; code: string }) =>
      bookingsApi.verifyOtp(bookingId, code),
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (_, { bookingId, code }) => {
      enqueue({
        type: 'verify_otp',
        bookingId,
        code,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

/**
 * Start service — with offline queue fallback
 */
export function useStartService() {
  const queryClient = useQueryClient();
  const { enqueue } = useOfflineQueueStore();

  return useMutation({
    mutationFn: (bookingId: number) => bookingsApi.startService(bookingId),
    onSuccess: (_, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (_, bookingId) => {
      enqueue({
        type: 'start_service',
        bookingId,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

/**
 * Complete service — with offline queue fallback
 */
export function useCompleteService() {
  const queryClient = useQueryClient();
  const { enqueue } = useOfflineQueueStore();

  return useMutation({
    mutationFn: (bookingId: number) => bookingsApi.completeService(bookingId),
    onSuccess: (_, bookingId) => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
    onError: (_, bookingId) => {
      enqueue({
        type: 'complete_service',
        bookingId,
        timestamp: new Date().toISOString(),
      });
    },
  });
}

/**
 * Cancel booking
 */
export function useCancelBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, reason }: { bookingId: number; reason?: string }) =>
      bookingsApi.cancelBooking(bookingId, reason),
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/**
 * Reschedule booking
 */
export function useRescheduleBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ bookingId, startsAt }: { bookingId: number; startsAt: string }) =>
      bookingsApi.rescheduleBooking(bookingId, startsAt),
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
    },
  });
}

/**
 * Submit service report — with offline queue fallback
 */
export function useSubmitReport() {
  const queryClient = useQueryClient();
  const { enqueue } = useOfflineQueueStore();

  return useMutation({
    mutationFn: ({
      bookingId,
      data,
    }: {
      bookingId: number;
      data: { summary: string; vitals: Record<string, string>; notes?: string };
    }) => bookingsApi.submitServiceReport(bookingId, data),
    onSuccess: (_, { bookingId }) => {
      queryClient.invalidateQueries({ queryKey: ['booking', bookingId] });
      queryClient.invalidateQueries({ queryKey: ['bookings'] });
      queryClient.invalidateQueries({ queryKey: ['payouts'] });
    },
    onError: (_, { bookingId, data }) => {
      enqueue({
        type: 'submit_report',
        bookingId,
        data,
        timestamp: new Date().toISOString(),
      });
    },
  });
}
