import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // Permite acesso de outros dispositivos na rede
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:8081',
        changeOrigin: true,
        secure: false,
      },
      '/uploads': {
        target: 'http://localhost:8081',
        changeOrigin: true,
      }
    }
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  assetsInclude: ['**/*.png'], // Incluir arquivos PNG como assets
});
