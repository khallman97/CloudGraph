import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  // ADD THIS SERVER BLOCK
  server: {
    watch: {
      usePolling: true, // Fixes hot reload in Docker on Windows/Mac
    },
    host: true, // Needed for Docker port mapping
    strictPort: true,
    port: 5173, 
  }
})