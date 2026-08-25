export default function CoordinateSystemSelector({ coordSystem, onChange }) {
  return (
    <div className="coord-toggle">
      <label>
        Koordinatsystem:{' '}
        <select value={coordSystem} onChange={(e) => onChange(e.target.value)}>
          <option value="wgs84">WGS84 (Bredde-/Længdegrad)</option>
          <option value="utm32n">UTM Zone 32N (ETRS89)</option>
          <option value="dktm3">DKTM3 (ETRS89)</option>
          <option value="s34s">System 34 Sjælland (omtrentlig)</option>
        </select>
      </label>
      {coordSystem === 's34s' && (
        <p className="warning">
          ⚠️ Kun omtrentlig konvertering — ikke nøjagtig nok til juridisk eller matrikulær brug.
        </p>
      )}
    </div>
  )
}