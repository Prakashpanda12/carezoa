// ============================================================================
// Theme — Colors, typography, spacing
// ============================================================================

export const colors = {
  primary: '#0F766E', // Teal 700
  primaryLight: '#14B8A6', // Teal 500
  primaryDark: '#0D5B56',
  secondary: '#6366F1', // Indigo 500

  success: '#16A34A',
  warning: '#EAB308',
  error: '#DC2626',
  info: '#3B82F6',

  background: '#F8FAFC',
  surface: '#FFFFFF',
  card: '#FFFFFF',
  border: '#E2E8F0',

  text: '#0F172A',
  textSecondary: '#64748B',
  textMuted: '#94A3B8',
  textInverse: '#FFFFFF',

  badge: {
    verified: '#16A34A',
    pending: '#EAB308',
    unverified: '#94A3B8',
    suspended: '#DC2626',
  },

  booking: {
    pending_payment: '#94A3B8',
    confirmed: '#3B82F6',
    en_route: '#8B5CF6',
    checked_in: '#14B8A6',
    in_service: '#F59E0B',
    completed: '#16A34A',
    cancelled: '#DC2626',
    no_show: '#EF4444',
    disputed: '#EF4444',
  },
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export const fontSize = {
  xs: 10,
  sm: 12,
  md: 14,
  lg: 16,
  xl: 18,
  xxl: 24,
  xxxl: 32,
  title: 28,
};

export const borderRadius = {
  sm: 4,
  md: 8,
  lg: 12,
  xl: 16,
  full: 9999,
};

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
};
