import path from 'path';
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    }
  },
  server: {
    port: 3000,
    host: true
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    assetsDir: 'assets',
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'ui-vendor': ['lucide-react', 'framer-motion'],
          'chart-vendor': ['recharts'],
          'form-vendor': ['react-hook-form', 'zod']
        }
      },
      onwarn(warning, warn) {
        // Suppress warnings for faster deployment
        if (
          warning.code === 'UNRESOLVED_IMPORT' ||
          warning.code === 'MODULE_LEVEL_DIRECTIVE' ||
          warning.code === 'EVAL' ||
          warning.message.includes('TypeScript')
        ) {
          return;
        }
        warn(warning);
      }
    },
    chunkSizeWarningLimit: 1000
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'react-router-dom', 'lucide-react', 'framer-motion']
  },
  define: {
    'process.env': process.env
  }
});
