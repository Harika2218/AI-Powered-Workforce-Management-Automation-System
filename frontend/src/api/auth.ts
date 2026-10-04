import { apiClient } from './client';
import type { TokenResponse, User, Employee } from '../types/api';

export interface LoginPayload {
  email: string;
  password: string;
}

export interface ActivationPayload {
  email: string;
  token: string;
  new_password: string;
  confirm_password: string;
}

export interface ResetPasswordPayload {
  token: string;
  new_password: string;
  confirm_password: string;
}

export const authApi = {
  login: async (payload: LoginPayload): Promise<TokenResponse> => {
    const res = await apiClient.post<TokenResponse>('/auth/login', payload);
    return res.data;
  },

  activate: async (payload: ActivationPayload): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/activate', payload);
    return res.data;
  },

  forgotPassword: async (email: string): Promise<{ message: string; reset_token?: string }> => {
    const res = await apiClient.post<{ message: string; reset_token?: string }>('/auth/forgot-password', { email });
    return res.data;
  },

  resetPassword: async (payload: ResetPasswordPayload): Promise<{ message: string }> => {
    const res = await apiClient.post<{ message: string }>('/auth/reset-password', payload);
    return res.data;
  },

  getMe: async (): Promise<{ user: User; employee: Employee | null }> => {
    const res = await apiClient.get<{ user: User; employee: Employee | null }>('/auth/me');
    return res.data;
  },
};
