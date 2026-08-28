import { COORDINATE_SYSTEMS } from '../utils/coordinates'

export default function CoordinateSystemSelector({ coordSystem, onChange }) {
  const current = COORDINATE_SYSTEMS[coordSystem]

  return (
    <div className="coord-toggle">
      <label>
        Koordinatsystem:{' '}
        <select value={coordSystem} onChange={(e) => onChange(e.target.value)}>
          <option value="wgs84">{COORDINATE_SYSTEMS.wgs84.label}</option>
          {Object.entries(COORDINATE_SYSTEMS)
            .filter(([key]) => key !== 'wgs84')
            .map(([key, sys]) => (
              <option key={key} value={key}>
                {sys.label}
              </option>
            ))}
        </select>
      </label>
      {current?.approx && (
        <p className="warning">
          ⚠️ Kun omtrentlig konvertering — ikke nøjagtig nok til juridisk eller matrikulær brug.
        </p>
      )}
    </div>
  )
}