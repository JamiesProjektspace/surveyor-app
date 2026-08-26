import { useState } from 'react'
import { toDisplayCoords, manualInputLabelsBySystem } from '../utils/coordinates'

export default function PointsTable({ points, coordSystem, onRemove, onUpdateCoordinates }) {
  const [editingIndex, setEditingIndex] = useState(null)
  const [editA, setEditA] = useState('')
  const [editB, setEditB] = useState('')
  const [copied, setCopied] = useState(false)

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

  // Bygger hele tabellen som ren tekst, med kolonner der er "polstret" med mellemrum,
  // så de linjer pænt op, når teksten indsættes i et almindeligt tekstprogram.
  const buildClipboardText = () => {
    const headerRow = ['Punktnr', colHeaderA, colHeaderB, 'Kilde']
    const dataRows = points.map((p, i) => {
      const { a, b } = toDisplayCoords(p, coordSystem)
      return [`P${i + 1}`, a, b, p.kilde === 'skelpunkt' ? 'Skelpunkt' : 'Manuel']
    })
    const allRows = [headerRow, ...dataRows]

    // Find den bredeste værdi i hver kolonne, så vi ved hvor meget hver kolonne skal polstres
    const colWidths = headerRow.map((_, colIndex) =>
      Math.max(...allRows.map((row) => row[colIndex].length))
    )

    return allRows
      .map((row) => row.map((cell, colIndex) => cell.padEnd(colWidths[colIndex])).join(', '))
      .join('\n')
  }

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(buildClipboardText())
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Kunne ikke kopiere til udklipsholder', err)
    }
  }

  return (
    <>
      {points.length > 0 && (
        <div className="copy-points-wrapper">
          <button onClick={copyToClipboard}>Kopiér punkter</button>
          {copied && <span className="copied-feedback"> Kopieret!</span>}
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