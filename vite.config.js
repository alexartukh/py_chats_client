import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Все запросы /api/... Vite пересылает на сервер, поэтому CORS настраивать не нужно.
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': 'http://localhost:8000',
    },
  },
})
