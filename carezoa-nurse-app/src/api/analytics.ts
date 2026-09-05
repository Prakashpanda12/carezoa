// ============================================================================
// Analytics & Quality Scorecard API
// ============================================================================

import apiClient from './client';
import type { QualityScorecard } from '../types';

export const analyticsApi = {
  /**
   * Get quality scorecard for current provider
   */
  async getQualityScorecard(): Promise<QualityScorecard> {
    const response = await apiClient.get('/providers/me/scorecard');
    return response.data;
  },

  /**
   * Get rating history
   */
  async getRatingHistory(): Promise<{
    rating_avg: number;
    rating_count: number;
    reviews: Array<{
      id: number;
      rating: number;
      text: string;
      author_label: string;
      created_at: string;
    }>;
  }> {
    const response = await apiClient.get('/providers/me/ratings');
    return response.data;
  },
};
