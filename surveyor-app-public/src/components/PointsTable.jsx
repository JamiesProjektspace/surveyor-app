import { useState } from 'react'
import { toDisplayCoords, manualInputLabelsBySystem } from '../utils/coordinates'
import {
  MAX_ROWS_PER_COLUMN,
  MAX_COLUMNS,
  downloadFile,
  splitIntoColumns,
  buildCSV,
  buildDXF,
  buildGPX,
  buildGeoJSON,
} from '../utils/pointExport'

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

  const handleExport = async () => {
    if (exportFormat === 'csv') {
      try {
        await navigator.clipboard.writeText(buildCSV(points, coordSystem, colHeaderA, colHeaderB))
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      } catch (err) {
        console.error('Kunne ikke kopiere til udklipsholder', err)
      }
      return
    }

    if (exportFormat === 'dxf') {
      downloadFile('punkter.dxf', buildDXF(points, coordSystem), 'application/dxf')
    } else if (exportFormat === 'gpx') {
      downloadFile('punkter.gpx', buildGPX(points), 'application/gpx+xml')
    } else if (exportFormat === 'geojson') {
      downloadFile('punkter.geojson', buildGeoJSON(points), 'application/geo+json')
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
      <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', overflowX: 'auto' }}>
        {splitIntoColumns(
          points.map((p, i) => ({ p, i })),
          MAX_ROWS_PER_COLUMN,
          MAX_COLUMNS
        ).map((column, colIndex) => (
          <table key={colIndex} style={{ flexShrink: 0, fontSize: '15px', borderCollapse: 'collapse' }}>
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
              {column.map(({ p, i }) => {
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

                    <td style={{ textAlign: 'left', whiteSpace: 'nowrap' }}>
                      {isEditing ? (
                        <>
                          <button onClick={() => saveEdit(i)} style={{ padding: '2px 6px' }}>Gem</button>
                          <button onClick={cancelEdit} style={{ marginLeft: '4px', padding: '2px 6px' }}>Annuller</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => onRemove(i)} style={{ padding: '2px 6px' }}>Fjern</button>
                          {!erSkelpunkt && (
                            <button onClick={() => startEdit(i, a, b)} style={{ marginLeft: '4px', padding: '2px 6px' }}>Rediger</button>
                          )}
                        </>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        ))}
      </div>
    </>
  )
}