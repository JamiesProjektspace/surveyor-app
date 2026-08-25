export default function SkelpunktControls({
  onFetch,
  loading,
  pointCount,
  lineCount,
  limitReached,
  error,
}) {
  return (
    <div className="skelpunkt-controls">
      <button onClick={onFetch} disabled={loading}>
        {loading ? 'Henter skelpunkter…' : 'Hent skelpunkter for kortudsnit'}
      </button>
      {(pointCount > 0 || lineCount > 0) && !loading && (
        <span className="skel-count">{pointCount} skelpunkter og {lineCount} skellinjer fundet</span>
      )}
      {limitReached && !loading && (
        <p className="warning">
          ⚠️ Der er flere end 1000 resultater i dette udsnit — nogle skelpunkter/-linjer mangler. Zoom ind for at se alle.
        </p>
      )}
      {error && <p className="warning">⚠️ {error}</p>}
    </div>
  )
}