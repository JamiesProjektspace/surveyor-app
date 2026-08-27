export default function DataFetchControl({
  label,
  loadingLabel,
  onFetch,
  loading,
  limitReached,
  error,
}) {
  return (
    <div className="skelpunkt-controls">
      <button onClick={onFetch} disabled={loading}>
        {loading ? loadingLabel : label}
      </button>
      {limitReached && !loading && (
        <p className="warning">
          ⚠️ Der er flere end 1000 resultater i dette udsnit — nogle mangler. Zoom ind for at se alle.
        </p>
      )}
      {error && <p className="warning">⚠️ {error}</p>}
    </div>
  )
}