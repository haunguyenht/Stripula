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
        manualChunks: {
          // Core React runtime
          'react-vendor': ['react', 'react-dom'],
          // Radix UI components
          'radix-vendor': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-dropdown-menu',
            '@radix-ui/react-select',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-slider',
            '@radix-ui/react-switch',
            '@radix-ui/react-separator',
            '@radix-ui/react-label',
            '@radix-ui/react-slot',
          ],
          // Animation library
          'motion-vendor': ['motion'],
          // Icons (large)
          'icons-vendor': ['lucide-react'],
          // Virtualization
          'virtual-vendor': ['@tanstack/react-virtual'],
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
