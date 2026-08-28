import { useState } from 'react'

export default function InfoButton({ text }) {
  const [open, setOpen] = useState(false)

  return (
    <span style={{ position: 'relative', display: 'inline-block', marginLeft: '6px' }}>
      <button
        onClick={() => setOpen(!open)}
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
      {open && (
        <div
          style={{
            position: 'absolute',
            top: '24px',
            left: '0',
            zIndex: 1000,
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
        </div>
      )}
    </span>
  )
}