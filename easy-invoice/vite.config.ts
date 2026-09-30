import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

// This app is published as a static SPA at https://diinislaam.com/invoice/
// alongside the rest of the site (which is served straight from the repo
// root by GitHub Pages, with no server-side build step). The production
// build output goes to ../invoice so it can be committed and served as-is.
export default defineConfig({
  base: '/invoice/',
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      '@': path.resolve(dirname, './src'),
    },
  },
  build: {
    outDir: '../invoice',
    emptyOutDir: true,
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
    exclude: ['node_modules', 'dist', '../invoice', 'tests/emulator/**'],
  },
})
