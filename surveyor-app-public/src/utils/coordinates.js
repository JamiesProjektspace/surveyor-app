import proj4 from 'proj4'

// ETRS89 / UTM zone 32N — standard projected coordinate system for Denmark
proj4.defs('EPSG:25832', '+proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs')

// ETRS89 / DKTM3 — Danish national engineering/construction grid, zone 3 (Zealand & Lolland)
proj4.defs('EPSG:4095', '+proj=tmerc +lat_0=0 +lon_0=11.75 +k=0.99998 +x_0=600000 +y_0=-5000000 +ellps=GRS80 +units=m +no_defs')

// System 34 Sjælland (S34S) — APPROXIMATE reconstruction only.
// The official conversion uses a Danish grid-shift correction file (SDFI) that
// isn't supported by this browser library. This uses a generic historical datum
// shift instead, which can be off by several meters — NOT suitable for legal/cadastral use.
proj4.defs('S34S_APPROX', '+proj=tmerc +lat_0=0 +lon_0=10.37 +k=1 +x_0=-210327 +y_0=-6034310 +ellps=intl +towgs84=-89.5,-93.8,-123.1,0,0,0,0 +units=m +no_defs')

// Convert a WGS84 lat/lng point to UTM32N easting/northing
export function toUTM32N(lat, lng) {
  const [easting, northing] = proj4('EPSG:4326', 'EPSG:25832', [lng, lat])
  return { easting, northing }
}

// Convert a WGS84 lat/lng point to DKTM3 easting/northing
export function toDKTM3(lat, lng) {
  const [easting, northing] = proj4('EPSG:4326', 'EPSG:4095', [lng, lat])
  return { easting, northing }
}

// Convert a WGS84 lat/lng point to S34S easting/northing (approximate)
export function toS34SApprox(lat, lng) {
  const [easting, northing] = proj4('EPSG:4326', 'S34S_APPROX', [lng, lat])
  return { easting, northing }
}

// Inverse conversions: projected easting/northing back to WGS84 lat/lng
export function fromUTM32N(easting, northing) {
  const [lng, lat] = proj4('EPSG:25832', 'EPSG:4326', [easting, northing])
  return { lat, lng }
}

export function fromDKTM3(easting, northing) {
  const [lng, lat] = proj4('EPSG:4095', 'EPSG:4326', [easting, northing])
  return { lat, lng }
}

export function fromS34SApprox(easting, northing) {
  const [lng, lat] = proj4('S34S_APPROX', 'EPSG:4326', [easting, northing])
  return { lat, lng }
}

const EARTH_RADIUS = 6371000 // meters

// Convert lat/lng points to local flat X,Y meters relative to the first point
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

// Shoelace formula for polygon area (in square meters)
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

// Perimeter: sum of distances between consecutive points (closing the loop)
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

// Labels og eksempel-placeholders for det manuelle inputfelt, afhængigt af valgt koordinatsystem
export const manualInputLabelsBySystem = {
  wgs84: { labelA: 'Breddegrad', labelB: 'Længdegrad', placeholderA: 'f.eks. 55.6761', placeholderB: 'f.eks. 12.5683' },
  utm32n: { labelA: 'Øst (m)', labelB: 'Nord (m)', placeholderA: 'f.eks. 725000', placeholderB: 'f.eks. 6175000' },
  dktm3: { labelA: 'Øst (m)', labelB: 'Nord (m)', placeholderA: 'f.eks. 725000', placeholderB: 'f.eks. 6175000' },
  s34s: { labelA: 'Øst (m)', labelB: 'Nord (m)', placeholderA: 'f.eks. 120000', placeholderB: 'f.eks. 60000' },
}

// Konverter et lat/lng-punkt til visningsværdier (a/b) for det valgte koordinatsystem
export function toDisplayCoords(point, coordSystem) {
  if (coordSystem === 'wgs84') {
    return { a: point.lat.toFixed(6), b: point.lng.toFixed(6) }
  }
  if (coordSystem === 'utm32n') {
    const c = toUTM32N(point.lat, point.lng)
    return { a: c.easting.toFixed(4), b: c.northing.toFixed(4) }
  }
  if (coordSystem === 'dktm3') {
    const c = toDKTM3(point.lat, point.lng)
    return { a: c.easting.toFixed(4), b: c.northing.toFixed(4) }
  }
  if (coordSystem === 's34s') {
    const c = toS34SApprox(point.lat, point.lng)
    return { a: c.easting.toFixed(4), b: c.northing.toFixed(4) }
  }
  return { a: '', b: '' }
}

// Konverter manuelt indtastede a/b-værdier (i det valgte system) til et lat/lng-punkt
export function fromManualInput(a, b, coordSystem) {
  if (coordSystem === 'wgs84') {
    if (a < -90 || a > 90 || b < -180 || b > 180) return null
    return { lat: a, lng: b }
  }
  if (coordSystem === 'utm32n') return fromUTM32N(a, b)
  if (coordSystem === 'dktm3') return fromDKTM3(a, b)
  if (coordSystem === 's34s') return fromS34SApprox(a, b)
  return null
}