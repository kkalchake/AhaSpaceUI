import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    // Backend CORS (SecurityConfig.java) only allows http://localhost:3000 —
    // without this, Vite silently falls back to 3001 when 3000 is taken,
    // and every request then fails CORS with no obvious cause.
    strictPort: true,
  }
})