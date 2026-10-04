import { apiClient } from './client';
import type { AIAssistantResponse } from '../types/api';

export interface AttendanceInsightsData {
  insights: Array<{
    category: string;
    level: 'info' | 'warning' | 'alert';
    headline: string;
    details: string;
    metric_value?: any;
  }>;
  generated_at: string;
}

export interface WorkforceForecastData {
  historical_growth: Array<{ month: string; headcount: number }>;
  forecast_next_6_months: Array<{ month: string; projected_headcount: number; confidence_interval: [number, number] }>;
  projected_attrition_rate: number;
}

export const aiApi = {
  askAssistant: async (query: string): Promise<AIAssistantResponse> => {
    const res = await apiClient.post<AIAssistantResponse>('/ai/assistant', { query });
    return res.data;
  },

  getAttendanceInsights: async (): Promise<AttendanceInsightsData> => {
    const res = await apiClient.get<AttendanceInsightsData>('/ai/attendance-insights');
    return res.data;
  },

  getWorkforceForecast: async (): Promise<WorkforceForecastData> => {
    const res = await apiClient.get<WorkforceForecastData>('/ai/workforce-forecast');
    return res.data;
  },
};
