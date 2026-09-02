// Bygger og læser "del-link"-parametre, så en visning (punkter, koordinatsystem, kortudsnit)
// kan deles med andre via en almindelig URL — uden nogen server eller database.
//
// Format: ?cs=dktm3&view=lat,lng,zoom&pts=lat,lng,kilde,skelpunktId;lat,lng,kilde,skelpunktId;...
// 'kilde' er 's' (skelpunkt) eller 'm' (manuel). skelpunktId er tomt for manuelle punkter.

export function buildShareURL({ points, coordSystem, center, zoom }) {
  const params = new URLSearchParams()
  params.set('cs', coordSystem)
  params.set('view', `${center.lat.toFixed(6)},${center.lng.toFixed(6)},${zoom}`)

  const ptsEncoded = points
    .map((p) => {
      const kilde = p.kilde === 'skelpunkt' ? 's' : 'm'
      const skelpunktId = p.kilde === 'skelpunkt' && p.skelpunktId ? p.skelpunktId : ''
      return `${p.lat.toFixed(6)},${p.lng.toFixed(6)},${kilde},${skelpunktId}`
    })
    .join(';')
  params.set('pts', ptsEncoded)

  const url = new URL(window.location.href)
  url.search = params.toString()
  return url.toString()
}

export function parseShareURL() {
  const params = new URLSearchParams(window.location.search)
  if (!params.has('pts') && !params.has('view')) return null

  const coordSystem = params.get('cs') || 'dktm3'

  let center = null
  let zoom = null
  if (params.has('view')) {
    const [lat, lng, z] = params.get('view').split(',').map(Number)
    center = { lat, lng }
    zoom = z
  }

  let points = []
  if (params.has('pts')) {
    points = params
      .get('pts')
      .split(';')
      .filter(Boolean)
      .map((entry) => {
        const [lat, lng, k, skelpunktId] = entry.split(',')
        return {
          lat: parseFloat(lat),
          lng: parseFloat(lng),
          kilde: k === 's' ? 'skelpunkt' : 'manuel',
          skelpunktId: skelpunktId || undefined,
        }
      })
  }

  return { coordSystem, center, zoom, points }
}