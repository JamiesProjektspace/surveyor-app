import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { URL } from 'node:url'
import skelpunkterHandler from './api/skelpunkter.js'
import ortofotoHandler from './api/ortofoto.js'

// Adapterer Vite dev-serverens rå Node request/response til den samme, lette
// (req, res) => {...}-facade, som Vercel giver vores serverless-funktioner i
// produktion (req.body/req.query allerede parset, res.status().json()/.send()).
//
// Formålet er at dev og produktion deler PRÆCIS samme handler-kode i api/*.js —
// tidligere havde denne fil sin egen, selvstændige kopi af proxy-logikken (ren
// URL-rewrite direkte til Dataforsyningen), som ikke fulgte med, da api/skelpunkter.js
// blev opdateret til at validere/bygge queryen server-side. Det gav en reel bug:
// i dev blev klientens body sendt ucensureret videre til Dataforsyningen, som så
// svarede 400, fordi den ikke kunne genkende formatet. Med denne fælles adapter
// kan det ikke ske igen — der er kun ét sted, hvor proxy-logikken er defineret.
function adaptHandler(handler) {
  return async (req, res) => {
    if (req.method === 'POST') {
      const chunks = []
      for await (const chunk of req) chunks.push(chunk)
      const raw = Buffer.concat(chunks).toString('utf8')
      try {
        req.body = raw ? JSON.parse(raw) : {}
      } catch {
        req.body = {}
      }
    }

    const url = new URL(req.url, 'http://localhost')
    req.query = Object.fromEntries(url.searchParams.entries())

    res.status = (code) => {
      res.statusCode = code
      return res
    }
    res.json = (obj) => {
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(obj))
    }
    res.send = (body) => {
      res.end(body)
    }

    await handler(req, res)
  }
}

// Vite-plugin der registrerer de to endpoints som dev-server-middleware, så de
// rammer samme handler-funktioner som i produktion (Vercel).
function apiDevMiddleware() {
  return {
    name: 'api-dev-middleware',
    configureServer(server) {
      server.middlewares.use('/api/skelpunkter', adaptHandler(skelpunkterHandler))
      server.middlewares.use('/api/ortofoto', adaptHandler(ortofotoHandler))
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load .env variables (without VITE_ prefix, so they stay out of the client bundle)
  const env = loadEnv(mode, process.cwd(), '')
  // api/*.js læser nøglen via process.env (som de også gør når de køres som
  // Vercel-funktioner), så den skal sættes her, for at handler-modulerne kan se den
  // i dev-serverens proces.
  process.env.DATAFORDELER_APIKEY = env.DATAFORDELER_APIKEY || ''

  return {
    // Appen ligger i en undermappe på One.com (dindomæne.dk/skelpunktsfinder/),
    // så alle filstier skal bygges relativt til den, ikke til domænets rod.
    base: '/skelpunktsfinder/',
    plugins: [react(), apiDevMiddleware()],
  }
})