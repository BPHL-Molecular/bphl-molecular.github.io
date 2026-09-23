import react from '@vitejs/plugin-react'
import { env } from 'node:process'
import { defineConfig } from 'vite'

export default defineConfig({
  base: env.PAGES_BASE_PATH || '/',
  plugins: [react()],
})
