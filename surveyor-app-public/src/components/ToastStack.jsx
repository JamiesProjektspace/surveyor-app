import { useToast } from '../context/ToastContext'

// Fast placeret nederst til højre i viewporten (position: fixed) — ligger derfor
// helt uden for det almindelige layout og kan aldrig skubbe eller overlappe
// knapper/kontroller, uanset hvor mange beskeder der vises samtidig, eller hvor
// lange de er. Sorteret efter oprettelsestidspunkt, så ældste besked ligger i
// bunden og nye lægger sig ovenpå.
export default function ToastStack() {
  const { toasts, hideToast } = useToast()
  if (toasts.length === 0) return null

  const sorted = [...toasts].sort((a, b) => a.order - b.order)

  return (
    <div className="toast-stack">
      {sorted.map((t) => (
        <div key={t.id} className={`toast toast-${t.type}`}>
          <span>⚠️ {t.text}</span>
          <button className="toast-dismiss" onClick={() => hideToast(t.id)} aria-label="Luk besked">
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}