import { defineConfig } from 'vite'
import path from 'path'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: './',
  plugins: [
    // The React and Tailwind plugins are both required for Make, even if
    // Tailwind is not being actively used – do not remove them
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      // Alias @ to the src directory
      '@': path.resolve(__dirname, './src'),
    },
  },

  // File types to support raw imports. Never add .css, .tsx, or .ts files to this.
  assetsInclude: ['**/*.svg', '**/*.csv', '**/*.png', '**/*.jpg', '**/*.jpeg', '**/*.webp'],

  // Entry point configuration
  root: '.',
  publicDir: 'public',

  // Build configuration
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    copyPublicDir: true,
    rollupOptions: {
      input: {
        main: path.resolve(__dirname, 'index.html'),
      },
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            // 将React和Radix UI合并到同一个chunk避免循环依赖
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router') ||
                id.includes('scheduler') || id.includes('@radix-ui') || id.includes('@emotion')) {
              return 'vendor-react-ui'
            }
            if (id.includes('motion')) {
              return 'vendor-motion'
            }
            if (id.includes('recharts') || id.includes('d3-')) {
              return 'vendor-chart'
            }
            if (id.includes('monaco-editor')) {
              return 'vendor-editor'
            }
          }
        },
        // Asset file naming for better caching
        assetFileNames: (assetInfo) => {
          const info = assetInfo.name?.split('.') ?? []
          const extType = info[info.length - 1]
          if (/\.(css)$/.test(assetInfo.name ?? '')) {
            return `assets/css/[name]-[hash][extname]`
          }
          if (/\.(png|jpe?g|svg|gif|tiff|bmp|ico)$/.test(assetInfo.name ?? '')) {
            return `assets/images/[name]-[hash][extname]`
          }
          return `assets/[name]-[hash][extname]`
        },
        chunkFileNames: 'assets/js/[name]-[hash].js',
        entryFileNames: 'assets/js/[name]-[hash].js',
      },
    },
    // Enable better caching with content hashing
    chunkSizeWarningLimit: 1000,
    // Optimize dependencies
    commonjsOptions: {
      transformMixedEsModules: true,
    },
  },
  server: {
    port: 3160,
    host: true,
    open: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },

  // Preview server configuration
  preview: {
    port: 4173,
    host: true,
    open: true,
    headers: {
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  },
})