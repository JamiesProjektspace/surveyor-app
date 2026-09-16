// Vercel serverless function. Modtager POST-kald fra appen, med KUN en
// operation ("skelpunkter"/"matrikelskel") og en bounding box i WGS84.
// Selve GraphQL-forespørgslen bygges her på serveren ud fra faste,
// hardcodede templates og sendes til Dataforsyningen med API-nøglen tilføjet
// — nøglen er derfor aldrig synlig i browseren.
//
// Sikkerhedsbemærkning: vi bygger IKKE queryen ud fra klientens frie tekst.
// Tidligere blev req.body.query videresendt direkte til Dataforsyningen, hvilket
// gjorde endpointet til en åben proxy for hele MAT/v2-API'et på vores API-nøgle.
// Nu accepteres kun de to kendte operationer med numeriske bbox-parametre.

import proj4 from 'proj4'

proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')

function toUTM32N(lat, lng) {
  const [easting, northing] = proj4('EPSG:4326', 'EPSG:25832', [lng, lat])
  return { easting, northing }
}

// Grov sanity-bbox for Danmark (inkl. Bornholm og lidt margin) — afviser urealistiske
// eller manipulerede koordinater før de bruges i en WKT-streng.
const DK_BOUNDS = { south: 53, north: 58.5, west: 3, east: 16 }

function isValidBounds(bounds) {
  if (!bounds || typeof bounds !== 'object') return false
  const { south, west, north, east } = bounds
  const nums = [south, west, north, east]
  if (!nums.every((n) => typeof n === 'number' && Number.isFinite(n))) return false
  if (south >= north || west >= east) return false
  if (south < DK_BOUNDS.south || north > DK_BOUNDS.north) return false
  if (west < DK_BOUNDS.west || east > DK_BOUNDS.east) return false
  return true
}

function boundsToWKT(bounds) {
  const sw = toUTM32N(bounds.south, bounds.west)
  const ne = toUTM32N(bounds.north, bounds.east)
  return `POLYGON((${sw.easting} ${sw.northing}, ${ne.easting} ${sw.northing}, ${ne.easting} ${ne.northing}, ${sw.easting} ${ne.northing}, ${sw.easting} ${sw.northing}))`
}

function buildQuery(operation, wkt, now) {
  if (operation === 'skelpunkter') {
    return `
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
  }
  if (operation === 'matrikelskel') {
    return `
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
  }
  return null
}

export default async function handler(req, res) {
  // Tillad kald fra enhver origin (dataen er offentlig/åben, ingen grund til at låse det ned)
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    res.status(200).end()
    return
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Kun POST er tilladt' })
    return
  }

  const { operation, bounds } = req.body || {}

  if (operation !== 'skelpunkter' && operation !== 'matrikelskel') {
    res.status(400).json({ error: 'Ugyldig eller manglende "operation" (skal være "skelpunkter" eller "matrikelskel")' })
    return
  }

  if (!isValidBounds(bounds)) {
    res.status(400).json({ error: 'Ugyldig eller manglende "bounds" (kræver numeriske south/west/north/east inden for Danmark)' })
    return
  }

  const apiKey = process.env.DATAFORDELER_APIKEY
  if (!apiKey) {
    res.status(500).json({ error: 'DATAFORDELER_APIKEY er ikke sat på serveren' })
    return
  }

  const wkt = boundsToWKT(bounds)
  const now = new Date().toISOString()
  const query = buildQuery(operation, wkt, now)

  try {
    const upstreamRes = await fetch(`https://graphql.datafordeler.dk/MAT/v2?apiKey=${apiKey}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    })
    const data = await upstreamRes.json()
    res.status(upstreamRes.status).json(data)
  } catch (err) {
    res.status(502).json({ error: 'Kunne ikke kontakte Dataforsyningen', detail: err.message })
  }
}