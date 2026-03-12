import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const railwayHost = env.RAILWAY_PUBLIC_DOMAIN
  const explicitAllowedHosts = [
    'rental-app-production-bda0.up.railway.app',
    ...(railwayHost ? [railwayHost] : []),
  ]

  return {
    plugins: [
      react(),
      tailwindcss()
    ],
    server: {
      allowedHosts: explicitAllowedHosts,
    },
    preview: {
      allowedHosts: explicitAllowedHosts,
    },
  }
})
