import axios from 'axios';

export const resolveApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (
    typeof window !== 'undefined' &&
    window.location.hostname !== 'localhost' &&
    window.location.hostname !== '127.0.0.1'
  ) {
    if (envUrl && !envUrl.includes('loca.lt') && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return 'https://ai-powered-workforce-management.onrender.com';
  }
  return envUrl || 'http://localhost:8000';
};

export const API_BASE_URL = resolveApiBaseUrl();

export const isLocalhostApi =
  API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach JWT token
apiClient.interceptors.request.use(
  (config) => {
    if (
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      if (!config.baseURL || config.baseURL.includes('loca.lt') || config.baseURL.includes('localhost') || config.baseURL.includes('127.0.0.1')) {
        config.baseURL = 'https://ai-powered-workforce-management.onrender.com';
      }
    }
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle unauthorized session expiration
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear credentials if token is invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      if (
        !window.location.pathname.includes('/login') &&
        !window.location.pathname.includes('/activate') &&
        !window.location.pathname.includes('/forgot-password')
      ) {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
