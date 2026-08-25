// Vercel serverless function. Modtager z/x/y flise-koordinater fra Leaflet,
// bygger det korrekte WMTS-kald til Dataforsyningens ortofoto-tjeneste med
// API-nøglen tilføjet på serversiden, og sender billedet (flisen) tilbage.

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*')

  const apiKey = process.env.DATAFORDELER_APIKEY
  if (!apiKey) {
    res.status(500).json({ error: 'DATAFORDELER_APIKEY er ikke sat på serveren' })
    return
  }

  const { z, x, y } = req.query

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
    apikey: apiKey,
  })

  try {
    const upstreamRes = await fetch(
      `https://wmts.datafordeler.dk/GeoDanmarkOrto/orto_foraar_webm/1.0.0/WMTS?${params.toString()}`
    )
    const buffer = await upstreamRes.arrayBuffer()
    res.setHeader('Content-Type', upstreamRes.headers.get('content-type') || 'image/jpeg')
    res.status(upstreamRes.status).send(Buffer.from(buffer))
  } catch (err) {
    res.status(502).json({ error: 'Kunne ikke hente ortofoto-flise', detail: err.message })
  }
}
