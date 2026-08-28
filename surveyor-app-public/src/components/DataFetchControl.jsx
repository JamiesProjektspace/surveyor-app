import InfoButton from './InfoButton'

export default function DataFetchControl({
  label,
  loadingLabel,
  onFetch,
  loading,
  limitReached,
  error,
  infoText,
}) {
  return (
    <div className="skelpunkt-controls" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '16px' }}>
      <div style={{ position: 'relative', display: 'inline-block' }}>
        <button onClick={onFetch} disabled={loading}>
          {loading ? loadingLabel : label}
        </button>
        {infoText && (
          <div
            style={{
              position: 'absolute',
              top: '50%',
              left: '100%',
              transform: 'translateY(-50%)',
              marginLeft: '6px',
            }}
          >
            <InfoButton text={infoText} />
          </div>
        )}
      </div>
      {limitReached && !loading && (
        <p className="warning">
          ⚠️ Der er flere end 1000 resultater i dette udsnit — nogle mangler. Zoom ind for at se alle.
        </p>
      )}
      {error && <p className="warning">⚠️ {error}</p>}
    </div>
  )
}