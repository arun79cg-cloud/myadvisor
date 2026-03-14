import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api/tickers': {
        target: 'https://api.coindcx.com',
        changeOrigin: true,
        rewrite: (path) => '/exchange/ticker',
      },
      '/api/markets': {
        target: 'https://api.coindcx.com',
        changeOrigin: true,
        rewrite: (path) => '/exchange/v1/markets_details',
      },
    },
  },
});
