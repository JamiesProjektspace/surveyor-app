import LZString from 'lz-string'

// Bygger og læser "del-link"-parametre, så en visning (punkter, koordinatsystem, kortudsnit)
// kan deles med andre via en almindelig URL — uden nogen server eller database.
//
// Selve punkt-listen komprimeres med lz-string, før den lægges i URL'en — det holder
// linket rimeligt kort, selv med mange punkter, og undgår browserens/serverens grænser
// for URL-længde (som vi konkret stødte på ved ca. 30+ punkter uden komprimering).
//
// Skelpunkter/skellinjer (de røde/orange lag) deles bevidst IKKE i selve linket — de kan
// altid hentes friskt igen fra Dataforsyningen. Se App.jsx, hvor de auto-hentes, når en
// delt visning åbnes.

export function buildShareURL({ points, coordSystem, center, zoom }) {
  const params = new URLSearchParams()
  params.set('cs', coordSystem)
  params.set('view', `${center.lat.toFixed(6)},${center.lng.toFixed(6)},${zoom}`)

  const ptsRaw = points
    .map((p) => {
      const kilde = p.kilde === 'skelpunkt' ? 's' : 'm'
      const skelpunktId = p.kilde === 'skelpunkt' && p.skelpunktId ? p.skelpunktId : ''
      return `${p.lat.toFixed(6)},${p.lng.toFixed(6)},${kilde},${skelpunktId}`
    })
    .join(';')
  params.set('pts', LZString.compressToEncodedURIComponent(ptsRaw))

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
    const ptsRaw = LZString.decompressFromEncodedURIComponent(params.get('pts'))
    if (ptsRaw) {
      points = ptsRaw
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
  }

  return { coordSystem, center, zoom, points }
}