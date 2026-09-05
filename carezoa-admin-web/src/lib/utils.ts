// ============================================================================
// Utility Functions
// ============================================================================

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { format, formatDistanceToNow, parseISO } from 'date-fns';

/**
 * Merge Tailwind classes
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format date as "MMM d, yyyy h:mm a"
 */
export function formatDate(dateString: string): string {
  return format(parseISO(dateString), 'MMM d, yyyy h:mm a');
}

/**
 * Format date as relative time (e.g., "2 hours ago")
 */
export function formatRelativeTime(dateString: string): string {
  return formatDistanceToNow(parseISO(dateString), { addSuffix: true });
}

/**
 * Format currency in INR
 */
export function formatCurrency(amountInr: number): string {
  return `₹${amountInr.toLocaleString('en-IN')}`;
}

/**
 * Format percentage
 */
export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(1)}%`;
}

/**
 * Get status badge color
 */
export function getStatusColor(status: string): string {
  const colorMap: Record<string, string> = {
    // Booking statuses
    pending_payment: 'bg-gray-100 text-gray-800',
    confirmed: 'bg-blue-100 text-blue-800',
    en_route: 'bg-purple-100 text-purple-800',
    checked_in: 'bg-teal-100 text-teal-800',
    in_service: 'bg-yellow-100 text-yellow-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    no_show: 'bg-red-100 text-red-800',
    disputed: 'bg-red-100 text-red-800',
    
    // Verification statuses
    verified: 'bg-green-100 text-green-800',
    pending_review: 'bg-yellow-100 text-yellow-800',
    unverified: 'bg-gray-100 text-gray-800',
    suspended: 'bg-red-100 text-red-800',
    
    // Payment statuses
    paid: 'bg-green-100 text-green-800',
    unpaid: 'bg-gray-100 text-gray-800',
    failed: 'bg-red-100 text-red-800',
    refunded: 'bg-orange-100 text-orange-800',
    
    // Payout statuses
    payout_ready: 'bg-blue-100 text-blue-800',
    processing: 'bg-yellow-100 text-yellow-800',
    on_hold: 'bg-orange-100 text-orange-800',
    
    // Incident statuses
    open: 'bg-red-100 text-red-800',
    investigating: 'bg-yellow-100 text-yellow-800',
    resolved: 'bg-green-100 text-green-800',
    dismissed: 'bg-gray-100 text-gray-800',
    
    // Ticket statuses
    in_progress: 'bg-blue-100 text-blue-800',
  };
  
  return colorMap[status] || 'bg-gray-100 text-gray-800';
}

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + '...';
}
