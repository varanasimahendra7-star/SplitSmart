import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  build: {
    // Increases the warning limit to 1000kb
    chunkSizeWarningLimit: 1000, 
    // Tells Vite to split your libraries into a separate chunk
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            return 'vendor'; 
          }
        }
      }
    }
  }
})
