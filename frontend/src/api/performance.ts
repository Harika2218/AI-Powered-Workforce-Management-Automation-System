import { apiClient } from './client';
import type { PerformanceReview } from '../types/api';

export interface SubmitReviewPayload {
  employee_id: string;
  period: string;
  overall_score: number;
  goals_rating: number;
  strengths: string;
  areas_for_improvement: string;
  comments: string;
}

export interface PaginatedPerformanceResponse {
  items: PerformanceReview[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export const performanceApi = {
  submitReview: async (payload: SubmitReviewPayload): Promise<PerformanceReview> => {
    const res = await apiClient.post<PerformanceReview>('/performance', payload);
    return res.data;
  },

  getMyPerformance: async (): Promise<PerformanceReview[]> => {
    const res = await apiClient.get<PerformanceReview[]>('/performance/my');
    return res.data;
  },

  listReviews: async (params?: { department?: string; period?: string; page?: number; page_size?: number }): Promise<PaginatedPerformanceResponse> => {
    const res = await apiClient.get<PaginatedPerformanceResponse>('/performance', { params });
    return res.data;
  },

  getAnalytics: async (department?: string): Promise<Array<{ department: string; average_score: number; total_reviews: number }>> => {
    const res = await apiClient.get<Array<{ department: string; average_score: number; total_reviews: number }>>('/performance/analytics', { params: { department } });
    return res.data;
  },
};
