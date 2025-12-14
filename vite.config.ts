import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/aztv/',
  plugins: [react(), tailwindcss()],
  server: {
    port: 15173,
    proxy: {
      '/aztv/api': {
        target: 'http://localhost:8000',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/aztv/, ''),
      },
    },
  },
})
