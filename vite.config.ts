import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  base: '/aztv/',
  plugins: [react(), tailwindcss()],
  define: {
    __API_BASE__: JSON.stringify('/aztv/api'),
  },
  server: {
    port: 15173,
  },
})
