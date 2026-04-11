import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: './' ensures that built asset paths are relative
  // (e.g., ./assets/index.js instead of /assets/index.js)
  // This is essential for pywebview to load the built files
  // from disk using a file:// URL.
  base: './',
  server:{
    host: true
  }
})
