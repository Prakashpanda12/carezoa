// ============================================================================
// Formatting utilities
// ============================================================================

import { format, formatDistanceToNow, isToday, isTomorrow, parseISO } from 'date-fns';

/**
 * Format date as "Today, 2:30 PM" or "Sep 5, 2:30 PM"
 */
export function formatBookingDate(dateString: string): string {
  const date = parseISO(dateString);
  if (isToday(date)) {
    return `Today, ${format(date, 'h:mm a')}`;
  }
  if (isTomorrow(date)) {
    return `Tomorrow, ${format(date, 'h:mm a')}`;
  }
  return format(date, 'MMM d, h:mm a');
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

/**
 * Format time (e.g., "2:30 PM")
 */
export function formatTime(dateString: string): string {
  return format(parseISO(dateString), 'h:mm a');
}

/**
 * Format currency in INR
 */
export function formatCurrency(amountInr: number): string {
  return `₹${amountInr.toLocaleString('en-IN')}`;
}

/**
 * Format minutes as "1h 30m" or "45m"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

/**
 * Format minutes from midnight as "9:00 AM"
 */
export function formatMinutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  const period = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m.toString().padStart(2, '0')} ${period}`;
}

/**
 * Get weekday name
 */
export function getWeekdayName(weekday: number): string {
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  return days[weekday] || '';
}

/**
 * Get status label and color
 */
export function getStatusInfo(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    pending_payment: { label: 'Pending Payment', color: '#94A3B8' },
    confirmed: { label: 'Confirmed', color: '#3B82F6' },
    en_route: { label: 'En Route', color: '#8B5CF6' },
    checked_in: { label: 'Checked In', color: '#14B8A6' },
    in_service: { label: 'In Service', color: '#F59E0B' },
    completed: { label: 'Completed', color: '#16A34A' },
    cancelled: { label: 'Cancelled', color: '#DC2626' },
    no_show: { label: 'No Show', color: '#EF4444' },
    disputed: { label: 'Disputed', color: '#EF4444' },
  };
  return statusMap[status] || { label: status, color: '#94A3B8' };
}

/**
 * Get verification status info
 */
export function getVerificationInfo(status: string): { label: string; color: string } {
  const statusMap: Record<string, { label: string; color: string }> = {
    verified: { label: 'Verified', color: '#16A34A' },
    pending_review: { label: 'Pending Review', color: '#EAB308' },
    unverified: { label: 'Unverified', color: '#94A3B8' },
    suspended: { label: 'Suspended', color: '#DC2626' },
  };
  return statusMap[status] || { label: status, color: '#94A3B8' };
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Format phone number with mask
 */
export function maskPhone(phone: string): string {
  if (phone.length < 4) return phone;
  return '•'.repeat(phone.length - 4) + phone.slice(-4);
}
