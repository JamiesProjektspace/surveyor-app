export default function DataFetchControl({
  label,
  loadingLabel,
  onFetch,
  loading,
  count,
  countLabel,
  limitReached,
  error,
}) {
  return (
    <div className="skelpunkt-controls">
      <button onClick={onFetch} disabled={loading}>
        {loading ? loadingLabel : label}
      </button>
      {count > 0 && !loading && (
        <span className="skel-count">{count} {countLabel} fundet</span>
      )}
      {limitReached && !loading && (
        <p className="warning">
          ⚠️ Der er flere end 1000 resultater i dette udsnit — nogle mangler. Zoom ind for at se alle.
        </p>
      )}
      {error && <p className="warning">⚠️ {error}</p>}
    </div>
  )
}