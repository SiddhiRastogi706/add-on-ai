import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: 'src/client',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/client/src'),
      '@shared': path.resolve(__dirname, 'src/shared'),
      '@config': path.resolve(__dirname, 'src/config'),
    },
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
      },
    },
  },
  build: {
    outDir: '../../dist/client',
    emptyOutDir: true,
  },
});
