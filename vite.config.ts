import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    return {
  base: './',
      server: {
        port: 7770,
        strictPort: true,
        host: '0.0.0.0',
        allowedHosts: ['carlos-caban.tail68c757.ts.net'],
        proxy: {
          '/api': {
            target: 'http://localhost:3001',
            changeOrigin: true,
          }
        }
      },
      preview: {
        port: 7770,
        strictPort: true,
        host: '0.0.0.0',
        allowedHosts: ['carlos-caban.tail68c757.ts.net']
      },
      plugins: [react()],
      resolve: {
         alias: {
           '@': path.resolve(__dirname, './src'),
           '@convex': path.resolve(__dirname, './convex'),
         }
       }
    };
});
