import { toUTM32N, fromUTM32N } from './coordinates'

// I lokal udvikling er denne tom, og kaldene går til '/api/...', som Vites egen
// proxy (vite.config.js) håndterer. Ved deployment til fx One.com sættes
// VITE_API_BASE_URL (i .env.production) til adressen på de Vercel-funktioner,
// der overtager proxyens rolle i den offentlige version.
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

async function postQuery(query) {
  const res = await fetch(`${API_BASE_URL}/api/skelpunkter`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  const data = await res.json().catch(() => null)
  if (!res.ok) {
    const detail = data?.errors?.map((e) => e.message).join('; ') || `HTTP ${res.status}`
    throw new Error(detail)
  }
  if (data.errors) {
    throw new Error(data.errors.map((e) => e.message).join('; '))
  }
  return data
}

// Byg en lukket bounding box-polygon (WKT) i UTM32N ud fra Leaflets kortgrænser
function boundsToWKT(bounds) {
  const sw = toUTM32N(bounds.getSouth(), bounds.getWest())
  const ne = toUTM32N(bounds.getNorth(), bounds.getEast())
  return `POLYGON((${sw.easting} ${sw.northing}, ${ne.easting} ${sw.northing}, ${ne.easting} ${ne.northing}, ${sw.easting} ${ne.northing}, ${sw.easting} ${sw.northing}))`
}

// Henter skelpunkter fra Dataforsyningen (MAT/v2 GraphQL) for et givet kortudsnit.
// Returnerer { points, limitReached }.
export async function fetchSkelpunkter(bounds) {
  const wkt = boundsToWKT(bounds)
  const now = new Date().toISOString()

  const query = `
    query {
      MAT_Skelpunkt(
        first: 1000
        virkningstid: "${now}"
        registreringstid: "${now}"
        where: {
          status: { eq: "Gældende" }
          geometri: { within: { wkt: "${wkt}", crs: 25832 } }
        }
      ) {
        nodes {
          id_lokalId
          punktKlasse
          status
          indlaegningstype
          geometri { wkt }
        }
        pageInfo { hasNextPage }
      }
    }
  `

  const data = await postQuery(query)
  const limitReached = Boolean(data.data?.MAT_Skelpunkt?.pageInfo?.hasNextPage)

  const nodes = data.data?.MAT_Skelpunkt?.nodes || []
  const points = nodes.map((node) => {
    // WKT-format for et punkt: "POINT (725123.45 6175678.90)"
    const match = node.geometri.wkt.match(/POINT\s*\(([-\d.]+)\s+([-\d.]+)\)/)
    const easting = parseFloat(match[1])
    const northing = parseFloat(match[2])
    const { lat, lng } = fromUTM32N(easting, northing)
    return {
      id: node.id_lokalId,
      lat,
      lng,
      punktKlasse: node.punktKlasse,
      status: node.status,
      indlaegningstype: node.indlaegningstype,
    }
  })

  return { points, limitReached }
}

// Henter matrikelskel (skellinjer) fra Dataforsyningen (MAT/v2 GraphQL) for et givet kortudsnit.
// Returnerer { lines, limitReached }.
export async function fetchMatrikelskel(bounds) {
  const wkt = boundsToWKT(bounds)
  const now = new Date().toISOString()

  const query = `
    query {
      MAT_Matrikelskel(
        first: 1000
        virkningstid: "${now}"
        registreringstid: "${now}"
        where: {
          status: { eq: "Gældende" }
          geometri: { intersects: { wkt: "${wkt}", crs: 25832 } }
        }
      ) {
        nodes {
          id_lokalId
          skeltype
          status
          geometri { wkt }
        }
        pageInfo { hasNextPage }
      }
    }
  `

  const data = await postQuery(query)
  const limitReached = Boolean(data.data?.MAT_Matrikelskel?.pageInfo?.hasNextPage)

  const nodes = data.data?.MAT_Matrikelskel?.nodes || []
  const lines = nodes.map((node) => {
    // WKT-format for en linje: "LINESTRING (e1 n1, e2 n2, ...)"
    const inner = node.geometri.wkt.match(/LINESTRING\s*\((.+)\)/)[1]
    const positions = inner.split(',').map((pair) => {
      const [easting, northing] = pair.trim().split(/\s+/).map(Number)
      const { lat, lng } = fromUTM32N(easting, northing)
      return [lat, lng]
    })
    return { id: node.id_lokalId, positions, skeltype: node.skeltype, status: node.status }
  })

  return { lines, limitReached }
}
