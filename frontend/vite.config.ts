import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 5173,
    host: true,
    // Mirrors the Vercel rewrite (/api/* -> backend service) for plain `npm run dev`.
    // Under `vercel dev`, Vercel's router handles /api/* before it reaches Vite.
    proxy: {
      '/api': 'http://127.0.0.1:8000',
    },
  },
})
