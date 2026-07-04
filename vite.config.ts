import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'src/renderer'),
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src/renderer/src'),
      '@components': path.resolve(__dirname, 'src/renderer/src/components'),
      '@hooks': path.resolve(__dirname, 'src/renderer/src/hooks'),
      '@stores': path.resolve(__dirname, 'src/renderer/src/stores'),
      '@services': path.resolve(__dirname, 'src/renderer/src/services'),
      '@types': path.resolve(__dirname, 'src/renderer/src/types'),
      '@utils': path.resolve(__dirname, 'src/renderer/src/utils'),
      '@assets': path.resolve(__dirname, 'src/renderer/src/assets'),
    },
  },
  build: {
    outDir: path.resolve(__dirname, 'dist'),
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom'],
          'framer-motion': ['framer-motion'],
          'lucide': ['lucide-react'],
          'zustand': ['zustand'],
        },
      },
    },
    target: 'chrome108',
    sourcemap: false,
    minify: 'esbuild',
  },
  server: {
    port: 5173,
    strictPort: true,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'framer-motion', 'lucide-react', 'zustand'],
  },
});
