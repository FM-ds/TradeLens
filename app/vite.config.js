import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  // Remove base path for Cloudflare Pages root domain deployment
  // base: '/TradeLens/', // Comment out for Cloudflare Pages
})
