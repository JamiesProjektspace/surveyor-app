import { useState, useRef } from 'react'
import { createPortal } from 'react-dom'

export default function InfoButton({ text }) {
  const [open, setOpen] = useState(false)
  const [coords, setCoords] = useState({ top: 0, left: 0 })
  const buttonRef = useRef(null)

  const toggleOpen = () => {
    if (!open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setCoords({ top: rect.bottom + 4, left: rect.left })
    }
    setOpen(!open)
  }

  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: '6px' }}>
      <button
        ref={buttonRef}
        onClick={toggleOpen}
        aria-label="Mere information"
        style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          border: '1px solid #888',
          background: 'white',
          color: '#555',
          fontSize: '12px',
          lineHeight: '1',
          cursor: 'pointer',
          padding: 0,
        }}
      >
        i
      </button>
      {open &&
        createPortal(
          <div
            style={{
              position: 'fixed',
              top: `${coords.top}px`,
              left: `${coords.left}px`,
              zIndex: 10000,
              background: 'white',
              border: '1px solid #ccc',
              borderRadius: '6px',
              padding: '10px',
              width: '260px',
              fontSize: '13px',
              lineHeight: '1.4',
              boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
            }}
          >
            {text}
          </div>,
          document.body
        )}
    </span>
  )
}