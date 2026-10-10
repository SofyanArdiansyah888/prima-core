/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    port: 5888,
  },
  preview: {
    port: 5888,
  },
  plugins: [
    react(),
    tailwindcss(),
    legacy()
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
