import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'
import { visualizer } from 'rollup-plugin-visualizer'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [
    react(),
    // Bundle analyzer - generates stats.html on build
    mode === 'production' && visualizer({
      filename: 'stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    // Target modern browsers for smaller bundles
    target: 'es2020',
    
    // Chunk size warning threshold (500KB)
    chunkSizeWarningLimit: 500,
    
    // Production minification with terser
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
    
    // Disable sourcemaps in production
    sourcemap: false,
    
    // CSS code splitting
    cssCodeSplit: true,
    
    // Manual chunk splitting for optimal caching
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Core React runtime
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'react-vendor';
          }
          // Radix UI components
          if (id.includes('node_modules/@radix-ui/')) {
            return 'radix-vendor';
          }
          // Animation library
          if (id.includes('node_modules/motion/')) {
            return 'motion-vendor';
          }
          // Icons (large)
          if (id.includes('node_modules/lucide-react/')) {
            return 'icons-vendor';
          }
          // Virtualization
          if (id.includes('node_modules/@tanstack/react-virtual/')) {
            return 'virtual-vendor';
          }
          // Axios and HTTP utilities
          if (id.includes('node_modules/axios/')) {
            return 'http-vendor';
          }
          // Form utilities (clsx, tailwind-merge, class-variance-authority)
          if (id.includes('node_modules/clsx/') || 
              id.includes('node_modules/tailwind-merge/') || 
              id.includes('node_modules/class-variance-authority/')) {
            return 'utils-vendor';
          }
          // Sonner toasts
          if (id.includes('node_modules/sonner/')) {
            return 'toast-vendor';
          }
          // Credit card icons
          if (id.includes('node_modules/react-svg-credit-card-payment-icons/')) {
            return 'card-icons-vendor';
          }
        },
      },
    },
  },
  server: {
    host: '127.0.0.1',
    port: 80,
    proxy: {
      '/api': {
        target: 'http://localhost:5001',
        changeOrigin: true,
      }
    }
  }
}))
