import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig, loadEnv } from 'vite'
import { portfolioMetadata } from './scripts/metadata.js'

// https://vite.dev/config/
export default defineConfig(({ mode, command }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root, ['SITE_', 'SOCIAL_'])
  return {
    plugins: [
      vue(),
      tailwindcss(),
      portfolioMetadata({
        root,
        siteUrl: env.SITE_URL,
        imagePath: env.SOCIAL_IMAGE_PATH,
        production: command === 'build' && process.env.VERCEL_ENV === 'production',
        preview: process.env.VERCEL_ENV === 'preview',
      }),
    ],
  }
})
