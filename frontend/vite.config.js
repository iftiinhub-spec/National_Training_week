import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  build: {
    rolldownOptions: {
      output: {
        manualChunks(id) {
          if (!id.includes('node_modules')) return undefined
          if (id.includes('recharts') || id.includes('d3-')) return 'vendor-charts'
          if (id.includes('react') || id.includes('react-dom') || id.includes('react-router-dom')) return 'vendor-react'
          return 'vendor'
        },
      },
    },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5113',
        changeOrigin: true,
      },
      '/uploads': {
        target: process.env.VITE_API_TARGET || 'http://localhost:5113',
        changeOrigin: true,
      },
    },
  },
})
