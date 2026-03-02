import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // This builds a firewall telling Vite to ignore backend databases
  optimizeDeps: {
    exclude: ['mongoose', 'mongodb']
  },
  build: {
    rollupOptions: {
      external: ['mongoose', 'mongodb']
    }
  }
})