import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@mock': path.resolve(__dirname, '../mock-data'),
    },
  },
  server: {
    fs: { allow: ['..'] },
    proxy: {
      '/api/slsp': {
        target: 'https://swisscovery.slsp.ch',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/slsp/, ''),
      },
    },
  },
})
