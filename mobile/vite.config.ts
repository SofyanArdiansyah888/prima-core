/// <reference types="vitest" />

import legacy from '@vitejs/plugin-legacy'
import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { BUILD_ID, buildVersionPlugin } from './build-version'

// https://vitejs.dev/config/
export default defineConfig({
  define: {
    __BUILD_ID__: JSON.stringify(BUILD_ID),
  },
  server: {
    port: 5888,
  },
  preview: {
    port: 5888,
  },
  plugins: [
    react(),
    tailwindcss(),
    legacy(),
    buildVersionPlugin(),
  ],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './src/setupTests.ts',
  }
})
