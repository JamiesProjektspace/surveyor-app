import proj4 from 'proj4'

// --- Præcise, officielle systemer (ETRS89-baserede, EPSG-bekræftede) ---
proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs') // UTM32N
proj4.defs('EPSG:25833', '+proj=utm +zone=33 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs') // UTM33N (Bornholm)
proj4.defs('EPSG:4093', '+proj=tmerc +lat_0=0 +lon_0=9 +k=0.99998 +x_0=200000 +y_0=-5000000 +ellps=GRS80 +units=m +no_defs') // DKTM1
proj4.defs('EPSG:4094', '+proj=tmerc +lat_0=0 +lon_0=10 +k=0.99998 +x_0=400000 +y_0=-5000000 +ellps=GRS80 +units=m +no_defs') // DKTM2
proj4.defs('EPSG:4095', '+proj=tmerc +lat_0=0 +lon_0=11.75 +k=0.99998 +x_0=600000 +y_0=-5000000 +ellps=GRS80 +units=m +no_defs') // DKTM3
proj4.defs('EPSG:4096', '+proj=tmerc +lat_0=0 +lon_0=15 +k=1 +x_0=800000 +y_0=-5000000 +ellps=GRS80 +units=m +no_defs') // DKTM4 (Bornholm)

// --- Omtrentlige systemer (før-GPS, kræver officielt en grid-shift-fil vi ikke har adgang til) ---
// Bruger samme "S34-reconstruction"-projektion og generiske historiske datumskift for begge —
// IKKE præcist nok til juridisk/matrikulært brug, kun til at give en tilnærmet lokalisering.
proj4.defs('S34S_APPROX', '+proj=tmerc +lat_0=0 +lon_0=10.37 +k=1 +x_0=-210327 +y_0=-6034310 +ellps=intl +towgs84=-89.5,-93.8,-123.1,0,0,0,0 +units=m +no_defs')
proj4.defs('S34J_APPROX', '+proj=tmerc +lat_0=0 +lon_0=10.37 +k=1 +x_0=-210327 +y_0=-6034310 +ellps=intl +towgs84=-89.5,-93.8,-123.1,0,0,0,0 +units=m +no_defs')

// Alle valgbare koordinatsystemer, med de labels/oplysninger UI'et skal bruge
export const COORDINATE_SYSTEMS = {
  wgs84: {
    label: 'WGS84 (Bredde-/Længdegrad)',
    labelA: 'Breddegrad',
    labelB: 'Længdegrad',
    placeholderA: 'f.eks. 55.6761',
    placeholderB: 'f.eks. 12.5683',
  },
  utm32n: {
    label: 'UTM Zone 32N (ETRS89)',
    epsg: 'EPSG:25832',
    labelA: 'Øst (m)',
    labelB: 'Nord (m)',
    placeholderA: 'f.eks. 725000',
    placeholderB: 'f.eks. 6175000',
  },
  utm33n: {
    label: 'UTM Zone 33N (ETRS89) — Bornholm',
    epsg: 'EPSG:25833',
    labelA: 'Øst (m)',
    labelB: 'Nord (m)',
    placeholderA: 'f.eks. 890000',
    placeholderB: 'f.eks. 6115000',
  },
  dktm1: {
    label: 'DKTM1 — Jylland vest for 10°Ø',
    epsg: 'EPSG:4093',
    labelA: 'Øst (m)',
    labelB: 'Nord (m)',
    placeholderA: 'f.eks. 500000',
    placeholderB: 'f.eks. 1170000',
  },
  dktm2: {
    label: 'DKTM2 — Jylland øst for 9°Ø / Fyn',
    epsg: 'EPSG:4094',
    labelA: 'Øst (m)',
    labelB: 'Nord (m)',
    placeholderA: 'f.eks. 500000',
    placeholderB: 'f.eks. 1170000',
  },
  dktm3: {
    label: 'DKTM3 — Sjælland, Lolland, Falster, Møn',
    epsg: 'EPSG:4095',
    labelA: 'Øst (m)',
    labelB: 'Nord (m)',
    placeholderA: 'f.eks. 725000',
    placeholderB: 'f.eks. 1175000',
  },
  dktm4: {
    label: 'DKTM4 — Bornholm',
    epsg: 'EPSG:4096',
    labelA: 'Øst (m)',
    labelB: 'Nord (m)',
    placeholderA: 'f.eks. 890000',
    placeholderB: 'f.eks. 1170000',
  },
  s34s: {
    label: 'System 34 Sjælland (omtrentlig)',
    epsg: 'S34S_APPROX',
    approx: true,
    labelA: 'Øst (m)',
    labelB: 'Nord (m)',
    placeholderA: 'f.eks. 120000',
    placeholderB: 'f.eks. 60000',
  },
  s34j: {
    label: 'System 34 Jylland (omtrentlig)',
    epsg: 'S34J_APPROX',
    approx: true,
    labelA: 'Øst (m)',
    labelB: 'Nord (m)',
    placeholderA: 'f.eks. 120000',
    placeholderB: 'f.eks. 60000',
  },
}

// Bagudkompatibel liste, bruges af ManualPointInput.jsx
export const manualInputLabelsBySystem = Object.fromEntries(
  Object.entries(COORDINATE_SYSTEMS).map(([key, sys]) => [
    key,
    { labelA: sys.labelA, labelB: sys.labelB, placeholderA: sys.placeholderA, placeholderB: sys.placeholderB },
  ])
)

// Generiske konverteringsfunktioner, der virker for ethvert system i COORDINATE_SYSTEMS (undtagen wgs84 selv)
export function toDisplayCoords(point, coordSystem) {
  if (coordSystem === 'wgs84') {
    return { a: point.lat.toFixed(6), b: point.lng.toFixed(6) }
  }
  const sys = COORDINATE_SYSTEMS[coordSystem]
  if (!sys) return { a: '', b: '' }
  const [easting, northing] = proj4('EPSG:4326', sys.epsg, [point.lng, point.lat])
  return { a: easting.toFixed(4), b: northing.toFixed(4) }
}

export function fromManualInput(a, b, coordSystem) {
  if (coordSystem === 'wgs84') {
    if (a < -90 || a > 90 || b < -180 || b > 180) return null
    return { lat: a, lng: b }
  }
  const sys = COORDINATE_SYSTEMS[coordSystem]
  if (!sys) return null
  const [lng, lat] = proj4(sys.epsg, 'EPSG:4326', [a, b])
  return { lat, lng }
}

// Bruges specifikt til skelpunkt-relateret logik (bounding box til Dataforsyningen, snap-afstand)
export function toUTM32N(lat, lng) {
  const [easting, northing] = proj4('EPSG:4326', 'EPSG:25832', [lng, lat])
  return { easting, northing }
}

export function fromUTM32N(easting, northing) {
  const [lng, lat] = proj4('EPSG:25832', 'EPSG:4326', [easting, northing])
  return { lat, lng }
}

const EARTH_RADIUS = 6371000

export function toLocalMeters(points) {
  if (points.length === 0) return []
  const originLat = (points[0].lat * Math.PI) / 180
  return points.map((p) => {
    const dLat = ((p.lat - points[0].lat) * Math.PI) / 180
    const dLng = ((p.lng - points[0].lng) * Math.PI) / 180
    const x = dLng * Math.cos(originLat) * EARTH_RADIUS
    const y = dLat * EARTH_RADIUS
    return { x, y }
  })
}

export function calculateArea(localPoints) {
  if (localPoints.length < 3) return 0
  let sum = 0
  for (let i = 0; i < localPoints.length; i++) {
    const j = (i + 1) % localPoints.length
    sum += localPoints[i].x * localPoints[j].y
    sum -= localPoints[j].x * localPoints[i].y
  }
  return Math.abs(sum / 2)
}

export function calculatePerimeter(localPoints) {
  if (localPoints.length < 2) return 0
  let total = 0
  for (let i = 0; i < localPoints.length; i++) {
    const j = (i + 1) % localPoints.length
    const dx = localPoints[j].x - localPoints[i].x
    const dy = localPoints[j].y - localPoints[i].y
    total += Math.sqrt(dx * dx + dy * dy)
  }
  return total
}