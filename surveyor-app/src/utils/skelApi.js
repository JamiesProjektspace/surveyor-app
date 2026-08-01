import { toUTM32N, fromUTM32N } from './coordinates'

async function postQuery(query) {
  const res = await fetch('/api/skelpunkter', {
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

// Henter skelpunkter og matrikelskel fra Dataforsyningen (MAT/v2 GraphQL) for et givet kortudsnit (Leaflet bounds).
// Returnerer { points, lines, limitReached }.
export async function fetchSkelData(bounds) {
  const sw = toUTM32N(bounds.getSouth(), bounds.getWest())
  const ne = toUTM32N(bounds.getNorth(), bounds.getEast())

  // Byg en lukket polygon (WKT) der repræsenterer kortudsnittets bounding box i UTM32N
  const wkt = `POLYGON((${sw.easting} ${sw.northing}, ${ne.easting} ${sw.northing}, ${ne.easting} ${ne.northing}, ${sw.easting} ${ne.northing}, ${sw.easting} ${sw.northing}))`

  const now = new Date().toISOString()

  const skelpunktQuery = `
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

  const matrikelskelQuery = `
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

  const [skelpunktData, matrikelskelData] = await Promise.all([
    postQuery(skelpunktQuery),
    postQuery(matrikelskelQuery),
  ])

  const pointsExceeded = skelpunktData.data?.MAT_Skelpunkt?.pageInfo?.hasNextPage
  const linesExceeded = matrikelskelData.data?.MAT_Matrikelskel?.pageInfo?.hasNextPage
  const limitReached = Boolean(pointsExceeded || linesExceeded)

  const pointNodes = skelpunktData.data?.MAT_Skelpunkt?.nodes || []
  const points = pointNodes.map((node) => {
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

  const lineNodes = matrikelskelData.data?.MAT_Matrikelskel?.nodes || []
  const lines = lineNodes.map((node) => {
    // WKT-format for en linje: "LINESTRING (e1 n1, e2 n2, ...)"
    const inner = node.geometri.wkt.match(/LINESTRING\s*\((.+)\)/)[1]
    const positions = inner.split(',').map((pair) => {
      const [easting, northing] = pair.trim().split(/\s+/).map(Number)
      const { lat, lng } = fromUTM32N(easting, northing)
      return [lat, lng]
    })
    return { id: node.id_lokalId, positions, skeltype: node.skeltype, status: node.status }
  })

  return { points, lines, limitReached }
}