import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  // relative paths, so the built shop works from any folder
  base: './',
  plugins: [react()],
})
