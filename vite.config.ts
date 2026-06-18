import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  const envFiles = mode === 'production'
    ? ['.env.production.local', '.env.production', '.env']
    : ['.env.local', `.env.${mode}.local`, `.env.${mode}`, '.env', '.env.app'];
  return {
  base: './',
      envFile: envFiles,
    server: {
        port: 7770,
        strictPort: true,
        host: '0.0.0.0',
        allowedHosts: ['carlos-caban.tail68c757.ts.net'],
        watch: {
          ignored: ['**/.crawlee-workers/**']
        },
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
       },
       build: {
         rollupOptions: {
           output: {
             manualChunks(id) {
               if (id.includes('node_modules/convex')) return 'vendor-convex';
               if (id.includes('node_modules/framer-motion')) return 'vendor-motion';
               if (id.includes('node_modules/lucide-react')) return 'vendor-icons';
               if (id.includes('node_modules/react-dom')) return 'vendor-react-dom';
               if (id.includes('node_modules/react/') && !id.includes('node_modules/react-dom')) return 'vendor-react';
               if (id.includes('node_modules/@radix-ui') || id.includes('node_modules/class-variance-authority') || id.includes('node_modules/clsx') || id.includes('node_modules/tailwind-merge')) return 'vendor-ui';
             }
           }
         }
       }
    };
});
