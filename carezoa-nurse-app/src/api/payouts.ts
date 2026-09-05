// ============================================================================
// Payouts & Earnings API
// ============================================================================

import apiClient from './client';
import type { Payout } from '../types';

export const payoutsApi = {
  /**
   * Get all payouts for current provider
   */
  async getMyPayouts(): Promise<Payout[]> {
    const response = await apiClient.get('/payouts/me');
    return response.data.items || response.data;
  },

  /**
   * Get earnings summary (this week, this month, total)
   */
  async getEarningsSummary(): Promise<{
    this_week_inr: number;
    this_month_inr: number;
    total_inr: number;
    pending_inr: number;
    paid_inr: number;
  }> {
    const response = await apiClient.get('/payouts/me/summary');
    return response.data;
  },
};
