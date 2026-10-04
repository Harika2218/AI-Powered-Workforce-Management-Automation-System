import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    port: 5173,
    proxy: {
      '/auth': 'http://localhost:8000',
      '/employees': 'http://localhost:8000',
      '/attendance': 'http://localhost:8000',
      '/leave': 'http://localhost:8000',
      '/shifts': 'http://localhost:8000',
      '/timesheets': 'http://localhost:8000',
      '/payroll': 'http://localhost:8000',
      '/performance': 'http://localhost:8000',
      '/dashboards': 'http://localhost:8000',
      '/analytics': 'http://localhost:8000',
      '/notifications': 'http://localhost:8000',
      '/audit-logs': 'http://localhost:8000',
      '/ai': 'http://localhost:8000',
      '/users': 'http://localhost:8000',
      '/health': 'http://localhost:8000',
    },
  },
});
