import axios from 'axios';

// Live tunnel URL documented in DEPLOYMENT.md and configured for deployed environment
export const TUNNEL_API_URL = 'https://tender-panda-50.loca.lt';

export const isProductionOrigin =
  typeof window !== 'undefined' &&
  window.location.hostname !== 'localhost' &&
  window.location.hostname !== '127.0.0.1';

export const resolveApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  if (isProductionOrigin) {
    // In deployed production, never use localhost/127.0.0.1
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }
    return TUNNEL_API_URL;
  }
  // Local development
  return envUrl || 'http://localhost:8000';
};

export const API_BASE_URL = resolveApiBaseUrl();

export const isLocalhostApi =
  API_BASE_URL.includes('localhost') || API_BASE_URL.includes('127.0.0.1');

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Bypass-Tunnel-Reminder': 'true',
  },
});

// Request interceptor to attach JWT token and guarantee production safety
apiClient.interceptors.request.use(
  (config) => {
    // Safety check: When running in a deployed browser origin, ensure requests never hit localhost
    if (
      typeof window !== 'undefined' &&
      window.location.hostname !== 'localhost' &&
      window.location.hostname !== '127.0.0.1'
    ) {
      if (
        !config.baseURL ||
        config.baseURL.includes('localhost') ||
        config.baseURL.includes('127.0.0.1')
      ) {
        config.baseURL = TUNNEL_API_URL;
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
