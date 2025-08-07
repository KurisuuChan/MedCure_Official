import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path' // You need to import the 'path' module

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tailwindcss(),
    react()
  ],
  // This 'resolve' section is essential for the '@/' alias to work
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})