// ============================================================================
// Provider Hooks
// ============================================================================

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { providerApi } from '../api/provider';
import { servicesApi } from '../api/services';
import { availabilityApi } from '../api/availability';
import { payoutsApi } from '../api/payouts';
import { analyticsApi } from '../api/analytics';
import type { AvailabilityWindow } from '../types';

export function useMyProvider() {
  return useQuery({
    queryKey: ['provider', 'me'],
    queryFn: () => providerApi.getMyProfile(),
  });
}

export function useUpdateProvider() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<any>) => providerApi.updateProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['provider', 'me'] });
    },
  });
}

export function useCredentials() {
  return useQuery({
    queryKey: ['credentials'],
    queryFn: () => providerApi.getCredentials(),
  });
}

export function useServices() {
  return useQuery({
    queryKey: ['services'],
    queryFn: () => servicesApi.getAllServices(),
  });
}

export function useMyOfferings() {
  return useQuery({
    queryKey: ['offerings'],
    queryFn: () => servicesApi.getMyOfferings(),
  });
}

export function useSetOffering() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ serviceId, priceInr }: { serviceId: number; priceInr: number }) =>
      servicesApi.setOffering(serviceId, priceInr),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offerings'] });
    },
  });
}

export function useMyAvailability() {
  return useQuery({
    queryKey: ['availability'],
    queryFn: () => availabilityApi.getMyAvailability(),
  });
}

export function useSetAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (windows: AvailabilityWindow[]) =>
      availabilityApi.setAvailability(windows),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['availability'] });
    },
  });
}

export function usePayouts() {
  return useQuery({
    queryKey: ['payouts'],
    queryFn: () => payoutsApi.getMyPayouts(),
  });
}

export function useEarningsSummary() {
  return useQuery({
    queryKey: ['earnings-summary'],
    queryFn: () => payoutsApi.getEarningsSummary(),
  });
}

export function useQualityScorecard() {
  return useQuery({
    queryKey: ['scorecard'],
    queryFn: () => analyticsApi.getQualityScorecard(),
  });
}

export function useRatingHistory() {
  return useQuery({
    queryKey: ['ratings'],
    queryFn: () => analyticsApi.getRatingHistory(),
  });
}
