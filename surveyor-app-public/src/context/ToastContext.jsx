import { createContext, useCallback, useContext, useRef, useState } from 'react'

const ToastContext = createContext(null)

// Central "opslagstavle" for advarsler/fejl fra hele appen. Beskeder vises i en
// fast boks i hjørnet af skærmen (se ToastStack) og påvirker derfor ALDRIG
// knappernes/kontrollernes placering — uanset hvor lange de er, eller hvor mange
// der vises samtidig.
//
// showToast(id, text, type) opdaterer/opretter en besked under den givne id.
// Kalder man showToast igen med samme id, opdateres beskeden i stedet for at
// oprette en ny — det er sådan fx "flere end 1000 resultater" og en efterfølgende
// netværksfejl for samme knap afløser hinanden i stedet for at hobe sig op.
// hideToast(id) fjerner beskeden. At kalde showToast(id, null) er det samme som
// hideToast(id) — bruges typisk i et useEffect, der reagerer på f.eks. en
// error-variabel, der kan blive null igen.
export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const orderRef = useRef(0)

  const showToast = useCallback((id, text, type = 'warning') => {
    setToasts((prev) => {
      if (!text) return prev.filter((t) => t.id !== id)
      const existing = prev.find((t) => t.id === id)
      if (existing) {
        return prev.map((t) => (t.id === id ? { ...t, text, type } : t))
      }
      orderRef.current += 1
      return [...prev, { id, text, type, order: orderRef.current }]
    })
  }, [])

  const hideToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ toasts, showToast, hideToast }}>
      {children}
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast skal bruges inden i en <ToastProvider>')
  return ctx
}