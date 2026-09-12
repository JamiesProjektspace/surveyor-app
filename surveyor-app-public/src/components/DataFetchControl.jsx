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
    <div className="control-group" style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
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
      {((limitReached && !loading) || error) && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 10,
            width: 'max-content',
            maxWidth: '280px',
            marginTop: '4px',
          }}
        >
          {limitReached && !loading && (
            <p className="warning">
              ⚠️ Der er flere end 1000 resultater i dette udsnit — nogle mangler. Zoom ind for at se alle.
            </p>
          )}
          {error && <p className="warning">⚠️ {error}</p>}
        </div>
      )}
    </div>
  )
}