import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env variables (without VITE_ prefix, so they stay out of the client bundle)
  const env = loadEnv(mode, process.cwd(), '')
  const DATAFORDELER_APIKEY = env.DATAFORDELER_APIKEY || ''

  // Midlertidig debug-linje — fjern igen når nøglen virker
  console.log('DATAFORDELER_APIKEY indlæst:', DATAFORDELER_APIKEY ? `ja (${DATAFORDELER_APIKEY.length} tegn)` : 'NEJ — tom!')

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/skelpunkter': {
          target: 'https://graphql.datafordeler.dk',
          changeOrigin: true,
          rewrite: () => `/MAT/v2?apiKey=${DATAFORDELER_APIKEY}`,
        },
      },
    },
  }
})