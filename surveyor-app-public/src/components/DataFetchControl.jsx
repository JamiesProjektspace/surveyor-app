import { useEffect } from 'react'
import InfoButton from './InfoButton'
import { useToast } from '../context/ToastContext'

// id skal være unik pr. brug af komponenten (fx "skelpunkter"/"skellinjer") — det
// er nøglen, beskederne fra DENNE knap vises under i den fælles toast-boks.
export default function DataFetchControl({
  id,
  label,
  loadingLabel,
  onFetch,
  loading,
  limitReached,
  error,
  infoText,
}) {
  const { showToast } = useToast()

  // Beskeder vises nu i en fast toast-boks (se ToastStack) i stedet for direkte
  // under knappen — knappens egen plads i layoutet er derfor altid fast, uanset
  // om der er en fejl, en "over 1000 resultater"-advarsel, eller ingen af de to.
  useEffect(() => {
    if (loading) {
      showToast(`${id}-limit`, null)
      showToast(`${id}-error`, null)
      return
    }
    showToast(
      `${id}-limit`,
      limitReached ? 'Der er flere end 1000 resultater i dette udsnit — nogle mangler. Zoom ind for at se alle.' : null
    )
    showToast(`${id}-error`, error || null, 'error')
  }, [id, loading, limitReached, error, showToast])

  return (
    <div className="control-group" style={{ display: 'flex', justifyContent: 'center' }}>
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
    </div>
  )
}