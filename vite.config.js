import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  root: 'renderer',
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'renderer/src'),
      '@components': path.resolve(__dirname, 'renderer/src/components'),
      '@hooks': path.resolve(__dirname, 'renderer/src/hooks'),
      '@styles': path.resolve(__dirname, 'renderer/src/styles'),
      '@utils': path.resolve(__dirname, 'renderer/src/utils'),
      '@context': path.resolve(__dirname, 'renderer/src/context'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
  },
  server: {
    port: 3000,
    strictPort: true,
  },
})
