import { toDisplayCoords } from './coordinates'

export const MAX_ROWS_PER_COLUMN = 20
export const MAX_COLUMNS = 3

// Udløser en fil-download i browseren ud fra en tekststreng
export function downloadFile(filename, content, mimeType) {
  const blob = new Blob([content], { type: mimeType })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Deler en liste op i op til MAX_COLUMNS kolonner, så jævnt fordelt som muligt.
// Antal kolonner vokser først til MAX_COLUMNS (ved mere end 20, så 40 punkter),
// men derefter bliver kolonnetallet ved MAX_COLUMNS uanset hvor mange punkter der
// tilføjes — de fordeler sig i stedet jævnere ud på de samme 3 kolonner.
// Går det ikke helt lige op, får kolonnerne længst til venstre det ekstra punkt først.
export function splitIntoColumns(items, maxPerColumn, maxColumns) {
  if (items.length <= maxPerColumn) return [items]

  const numColumns = Math.min(maxColumns, Math.ceil(items.length / maxPerColumn))
  const baseSize = Math.floor(items.length / numColumns)
  const remainder = items.length % numColumns

  const columns = []
  let idx = 0
  for (let c = 0; c < numColumns; c++) {
    const size = baseSize + (c < remainder ? 1 : 0)
    columns.push(items.slice(idx, idx + size))
    idx += size
  }
  return columns
}

// Punktklasse-teksten skal tydeligt vise, at manuelle punkter ikke er skelpunkter —
// ikke bare stå tomme, som om data mangler.
export function punktklasseText(p) {
  return p.kilde === 'skelpunkt' ? p.punktKlasse || '–' : 'Manuelt placeret punkt'
}

// ---------- CSV (kolonne-justeret, til udklipsholder) ----------
export function buildCSV(points, coordSystem, colHeaderA, colHeaderB) {
  const headerRow = ['Punktnr', colHeaderA, colHeaderB, 'Kilde', 'Punktklasse']
  const dataRows = points.map((p, i) => {
    const { a, b } = toDisplayCoords(p, coordSystem)
    return [`P${i + 1}`, a, b, p.kilde === 'skelpunkt' ? 'Skelpunkt' : 'Manuel', punktklasseText(p)]
  })
  const allRows = [headerRow, ...dataRows]
  const colWidths = headerRow.map((_, colIndex) =>
    Math.max(...allRows.map((row) => row[colIndex].length))
  )
  return allRows
    .map((row) => row.map((cell, colIndex) => cell.padEnd(colWidths[colIndex])).join(', '))
    .join('\n')
}

// ---------- DXF (R12 — bredt understøttet CAD-format) ----------
// Bruger det aktuelt valgte koordinatsystem, da DXF/CAD-tegninger arbejder i meter, ikke grader.
export function buildDXF(points, coordSystem) {
  const lines = ['0', 'SECTION', '2', 'HEADER', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES']
  points.forEach((p, i) => {
    const { a, b } = toDisplayCoords(p, coordSystem)
    lines.push('0', 'POINT', '8', 'Punkter', '10', a, '20', b, '30', '0')
    lines.push('0', 'TEXT', '8', 'Punkter', '10', a, '20', b, '30', '0', '40', '0.5', '1', `P${i + 1}`)
  })
  lines.push('0', 'ENDSEC', '0', 'EOF')
  return lines.join('\n')
}

// ---------- GPX (altid WGS84 — det er et krav i selve GPX-standarden) ----------
export function buildGPX(points) {
  const waypoints = points
    .map(
      (p, i) => `  <wpt lat="${p.lat}" lon="${p.lng}">
    <name>P${i + 1}</name>
    <desc>${p.kilde === 'skelpunkt' ? 'Skelpunkt' : 'Manuel'}${p.punktKlasse ? ` — Punktklasse: ${p.punktKlasse}` : ''}</desc>
  </wpt>`
    )
    .join('\n')
  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Landmålerberegner" xmlns="http://www.topografix.com/GPX/1/1">
${waypoints}
</gpx>`
}

// ---------- GeoJSON (altid WGS84 — samme krav som GPX) ----------
export function buildGeoJSON(points) {
  const geojson = {
    type: 'FeatureCollection',
    features: points.map((p, i) => ({
      type: 'Feature',
      geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, // NB: GeoJSON er [lng, lat], ikke [lat, lng]
      properties: {
        punktnr: `P${i + 1}`,
        kilde: p.kilde === 'skelpunkt' ? 'Skelpunkt' : 'Manuel',
        punktklasse: punktklasseText(p),
      },
    })),
  }
  return JSON.stringify(geojson, null, 2)
}