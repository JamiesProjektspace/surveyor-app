import { useState } from 'react'
import { toDisplayCoords, manualInputLabelsBySystem } from '../utils/coordinates'

// Udløser en fil-download i browseren ud fra en tekststreng
function downloadFile(filename, content, mimeType) {
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

export default function PointsTable({ points, coordSystem, onRemove, onUpdateCoordinates }) {
  const [editingIndex, setEditingIndex] = useState(null)
  const [editA, setEditA] = useState('')
  const [editB, setEditB] = useState('')
  const [copied, setCopied] = useState(false)
  const [exportFormat, setExportFormat] = useState('csv')

  const labels = manualInputLabelsBySystem[coordSystem]
  const colHeaderA = coordSystem === 'wgs84' ? 'Breddegrad' : 'Øst (m)'
  const colHeaderB = coordSystem === 'wgs84' ? 'Længdegrad' : 'Nord (m)'

  const startEdit = (index, a, b) => {
    setEditingIndex(index)
    setEditA(a)
    setEditB(b)
  }

  const cancelEdit = () => {
    setEditingIndex(null)
  }

  const saveEdit = (index) => {
    onUpdateCoordinates(index, editA, editB)
    setEditingIndex(null)
  }

  // ---------- CSV (kolonne-justeret, til udklipsholder) ----------
  const buildCSV = () => {
    const headerRow = ['Punktnr', colHeaderA, colHeaderB, 'Kilde']
    const dataRows = points.map((p, i) => {
      const { a, b } = toDisplayCoords(p, coordSystem)
      return [`P${i + 1}`, a, b, p.kilde === 'skelpunkt' ? 'Skelpunkt' : 'Manuel']
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
  const buildDXF = () => {
    const lines = ['0', 'SECTION', '2', 'HEADER', '0', 'ENDSEC', '0', 'SECTION', '2', 'ENTITIES']
    points.forEach((p, i) => {
      const { a, b } = toDisplayCoords(p, coordSystem)
      // Selve punktet
      lines.push('0', 'POINT', '8', 'Punkter', '10', a, '20', b, '30', '0')
      // Tekstlabel (punktnummer) placeret lidt ved siden af punktet
      lines.push('0', 'TEXT', '8', 'Punkter', '10', a, '20', b, '30', '0', '40', '0.5', '1', `P${i + 1}`)
    })
    lines.push('0', 'ENDSEC', '0', 'EOF')
    return lines.join('\n')
  }

  // ---------- GPX (altid WGS84 — det er et krav i selve GPX-standarden) ----------
  const buildGPX = () => {
    const waypoints = points
      .map(
        (p, i) => `  <wpt lat="${p.lat}" lon="${p.lng}">
    <name>P${i + 1}</name>
    <desc>${p.kilde === 'skelpunkt' ? 'Skelpunkt' : 'Manuel'}</desc>
  </wpt>`
      )
      .join('\n')
    return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="Landmålerberegner" xmlns="http://www.topografix.com/GPX/1/1">
${waypoints}
</gpx>`
  }

  // ---------- GeoJSON (altid WGS84 — samme krav som GPX) ----------
  const buildGeoJSON = () => {
    const geojson = {
      type: 'FeatureCollection',
      features: points.map((p, i) => ({
        type: 'Feature',
        geometry: { type: 'Point', coordinates: [p.lng, p.lat] }, // NB: GeoJSON er [lng, lat], ikke [lat, lng]
        properties: { punktnr: `P${i + 1}`, kilde: p.kilde === 'skelpunkt' ? 'Skelpunkt' : 'Manuel' },
      })),
    }
    return JSON.stringify(geojson, null, 2)
  }

  const handleExport = async () => {
    if (exportFormat === 'csv') {
      try {
        await navigator.clipboard.writeText(buildCSV())
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Kunne ikke kopiere til udklipsholder', err)
      }
      return
    }

    if (exportFormat === 'dxf') {
      downloadFile('punkter.dxf', buildDXF(), 'application/dxf')
    } else if (exportFormat === 'gpx') {
      downloadFile('punkter.gpx', buildGPX(), 'application/gpx+xml')
    } else if (exportFormat === 'geojson') {
      downloadFile('punkter.geojson', buildGeoJSON(), 'application/geo+json')
    }
  }

  const buttonLabel = exportFormat === 'csv' ? 'Kopiér punkter' : `Download ${exportFormat.toUpperCase()}`

  return (
    <>
      {points.length > 0 && (
        <div className="copy-points-wrapper">
          <button onClick={handleExport}>{buttonLabel}</button>
          <select
            value={exportFormat}
            onChange={(e) => setExportFormat(e.target.value)}
            style={{ marginLeft: '8px' }}
          >
            <option value="csv">CSV</option>
            <option value="dxf">DXF</option>
            <option value="gpx">GPX</option>
            <option value="geojson">GeoJSON</option>
          </select>
          {copied && <span className="copied-feedback"> Kopieret!</span>}
          {exportFormat === 'dxf' && coordSystem === 'wgs84' && (
            <p className="warning">
              ⚠️ DXF med WGS84 (grader) giver upraktiske koordinater i CAD-software — skift til fx UTM32N eller DKTM3 for et brugbart resultat.
            </p>
          )}
        </div>
      )}
      <table>
        <thead>
          <tr>
            <th>#</th>
            <th>{colHeaderA}</th>
            <th>{colHeaderB}</th>
            <th>Kilde</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => {
            const { a, b } = toDisplayCoords(p, coordSystem)
            const erSkelpunkt = p.kilde === 'skelpunkt'
            const isEditing = editingIndex === i

            return (
              <tr key={i}>
                <td>P{i + 1}</td>

                {isEditing ? (
                  <>
                    <td>
                      <input
                        type="number"
                        step="any"
                        value={editA}
                        placeholder={labels.placeholderA}
                        onChange={(e) => setEditA(e.target.value)}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        step="any"
                        value={editB}
                        placeholder={labels.placeholderB}
                        onChange={(e) => setEditB(e.target.value)}
                      />
                    </td>
                  </>
                ) : (
                  <>
                    <td>{a}</td>
                    <td>{b}</td>
                  </>
                )}

                <td>
                  <span
                    title={erSkelpunkt ? 'Skelpunkt' : 'Manuelt punkt'}
                    style={{
                      display: 'inline-block',
                      width: '10px',
                      height: '10px',
                      borderRadius: '50%',
                      backgroundColor: erSkelpunkt ? '#d62728' : '#1f77b4',
                    }}
                  />
                </td>

                <td style={{ textAlign: 'left' }}>
                  {isEditing ? (
                    <>
                      <button onClick={() => saveEdit(i)}>Gem</button>
                      <button onClick={cancelEdit} style={{ marginLeft: '8px' }}>Annuller</button>
                    </>
                  ) : (
                    <>
                      <button onClick={() => onRemove(i)}>Fjern</button>
                      {!erSkelpunkt && (
                        <button onClick={() => startEdit(i, a, b)} style={{ marginLeft: '8px' }}>Rediger</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </>
  )
}