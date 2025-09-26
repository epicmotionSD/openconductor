import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  
  // Build configuration for production deployment
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: false, // Disable source maps in production for security
    minify: 'terser',
    target: 'es2020',
    
    // Optimize chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunk for stable dependencies  
          vendor: ['react', 'react-dom'],
          
          // Trinity AI components chunk
          trinity: [
            './src/components/trinity/TrinityMCPUnified',
            './src/components/trinity/TrinityTerminal', 
            './src/components/trinity/TrinityTerminalEnhanced'
          ],
          
          // MCP components chunk
          mcp: [
            './src/components/mcp/MCPDashboard',
            './src/components/mcp/MCPMinimalMode',
            './src/components/mcp/MCPProfessionalMinimal',
            './src/components/mcp/MCPQuickTrainer',
            './src/components/mcp/MCPUnifiedInterface'
          ],
          
          // Services and utilities
          services: [
            './src/services/mockMCPData',
            './src/utils/errorHandling',
            './src/utils/cn'
          ]
        }
      }
    },
    
    // Asset optimization
    assetsInlineLimit: 4096,
    cssCodeSplit: true,
    
    // Bundle analysis
    reportCompressedSize: true,
    chunkSizeWarningLimit: 1000
  },
  
  // Development server configuration
  server: {
    port: 5173,
    host: true, // Allow external connections
    cors: true,
    
    // Proxy configuration for backend API
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://localhost:3000',
        changeOrigin: true,
        secure: false
      },
      '/ws': {
        target: process.env.VITE_WEBSOCKET_URL || 'ws://localhost:8080',
        ws: true,
        changeOrigin: true
      }
    }
  },
  
  // Path resolution
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@services': resolve(__dirname, './src/services'),
      '@utils': resolve(__dirname, './src/utils'),
      '@styles': resolve(__dirname, './src/styles')
    }
  },
  
  // Environment variables
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version || '2.1.0'),
    __BUILD_DATE__: JSON.stringify(new Date().toISOString())
  },
  
  // CSS configuration  
  css: {
    modules: {
      localsConvention: 'camelCase'
    },
    preprocessorOptions: {
      css: {
        charset: false
      }
    }
  },
  
  // Optimization
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'lucide-react'
    ],
    exclude: []
  },
  
  // Preview server for production testing
  preview: {
    port: 4173,
    host: true,
    cors: true
  },
  
  // Base URL for deployment
  base: process.env.VITE_BASE_URL || '/'
});