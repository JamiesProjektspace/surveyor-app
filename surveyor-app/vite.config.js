import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env variables (without VITE_ prefix, so they stay out of the client bundle)
  const env = loadEnv(mode, process.cwd(), '')
  const DATAFORDELER_APIKEY = env.DATAFORDELER_APIKEY || ''

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api/skelpunkter': {
          target: 'https://graphql.datafordeler.dk',
          changeOrigin: true,
          rewrite: () => `/MAT/v2?apiKey=${DATAFORDELER_APIKEY}`,
        },
        '/api/ortofoto': {
          target: 'https://wmts.datafordeler.dk',
          changeOrigin: true,
          rewrite: (path) => {
            // Indkommende: /api/ortofoto?z=15&x=1234&y=5678
            const url = new URL(path, 'http://localhost')
            const z = url.searchParams.get('z')
            const x = url.searchParams.get('x')
            const y = url.searchParams.get('y')

            const params = new URLSearchParams({
              SERVICE: 'WMTS',
              REQUEST: 'GetTile',
              VERSION: '1.0.0',
              STYLE: 'default',
              FORMAT: 'image/jpeg',
              TILEMATRIXSET: 'DFD_GoogleMapsCompatible',
              TILEMATRIX: z,
              TILEROW: y,
              TILECOL: x,
              Layer: 'orto_foraar_webm',
              apikey: DATAFORDELER_APIKEY,
            })

            return `/GeoDanmarkOrto/orto_foraar_webm/1.0.0/WMTS?${params.toString()}`
          },
        },
      },
    },
  }
})