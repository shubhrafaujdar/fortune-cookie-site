import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // relative base so the shop works from any folder, e.g. dailyfortunecookies.com/shop/
  base: './',
  plugins: [react()],
  build: {
    // the built site goes to /shop at the root of the repo (served by GitHub Pages)
    outDir: '../shop',
    emptyOutDir: true,
  },
})
