import { QueryClient, useQuery, type UseQueryOptions } from "@tanstack/react-query";
import { api } from "./client";

export const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { retry: 1, staleTime: 15_000, refetchOnWindowFocus: false },
    },
  });

export const keys = {
  services: ["services"] as const,
  providers: (q?: string) => ["providers", q ?? ""] as const,
  provider: (id: string | number) => ["provider", String(id)] as const,
  bookings: (scope: string) => ["bookings", scope] as const,
  booking: (id: string | number) => ["booking", String(id)] as const,
  messages: (id: string | number) => ["messages", String(id)] as const,
  records: ["records"] as const,
  family: ["family"] as const,
  packages: ["packages"] as const,
  tickets: ["tickets"] as const,
  payMethods: ["payMethods"] as const,
  profile: ["profile"] as const,
};

export const useServices = () =>
  useQuery({ queryKey: keys.services, queryFn: api.getServices });

export const useProviders = (q?: string) =>
  useQuery({ queryKey: keys.providers(q), queryFn: () => api.getProviders({ q }) });

export const useProvider = (id: string | number) =>
  useQuery({ queryKey: keys.provider(id), queryFn: () => api.getProvider(id), enabled: !!id });

export const useBookings = (scope: "upcoming" | "past" | "all", refetchInterval?: number) =>
  useQuery({ queryKey: keys.bookings(scope), queryFn: () => api.getBookings(scope), refetchInterval });

export const useBooking = (id: string | number, refetchInterval = 10_000) =>
  useQuery({ queryKey: keys.booking(id), queryFn: () => api.getBooking(id), enabled: !!id, refetchInterval });

export const useMessages = (bookingId: string | number) =>
  useQuery({
    queryKey: keys.messages(bookingId),
    queryFn: () => api.getMessages(bookingId),
    enabled: !!bookingId,
    refetchInterval: 8_000,
  });

export const useRecords = () =>
  useQuery({ queryKey: keys.records, queryFn: api.getRecords });

export const useFamily = () =>
  useQuery({ queryKey: keys.family, queryFn: api.getFamily });

export const usePackages = () =>
  useQuery({ queryKey: keys.packages, queryFn: api.getPackages });

export const useTickets = () =>
  useQuery({ queryKey: keys.tickets, queryFn: api.getTickets });

export const usePaymentMethods = () =>
  useQuery({ queryKey: keys.payMethods, queryFn: api.getPaymentMethods });

export const useProfile = (opts?: Partial<UseQueryOptions>) =>
  useQuery({ queryKey: keys.profile, queryFn: api.getProfile, ...opts });
