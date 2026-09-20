import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vite.dev/config/
export default defineConfig({
  base: process.env.PUBLIC_URL || '/ui/',
  plugins: [react()],
  build: {
    outDir: process.env.BUILD_DIR || 'dist',
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
      // @xterm/headless 6.0.0 ships a dangling "module" entry; point at the
      // real file.
      '@xterm/headless': path.resolve(
        import.meta.dirname,
        'node_modules/@xterm/headless/lib-headless/xterm-headless.mjs'
      ),
    },
  },
  server: {
    proxy: {
      // Proxy API requests to backend
      '/': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
      // Proxy WebSocket connections
      '/ws': {
        target: 'ws://localhost:8080',
        ws: true,
        changeOrigin: true,
      },
    },
  },
});
