import axios from 'axios';

export const resolveApiBaseUrl = (): string => {
  const envUrl = import.meta.env.VITE_API_URL;
  // Use the environment variable if set, otherwise default to localhost for development
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
