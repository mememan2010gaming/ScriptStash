import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { useToast } from '../../contexts/ToastContext'

function ToastItem({ toast }) {
  const ref = useRef(null)
  const colors = { success: 'var(--green)', error: 'var(--red)', info: 'var(--accent)' }

  useEffect(() => {
    if (!ref.current) return
    animate(ref.current, {
      opacity: [0, 1],
      translateY: [-8, 0],
      duration: 200,
      ease: 'easeOutQuad',
    })
  }, [])

  return (
    <div
      ref={ref}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        padding: '10px 14px',
        borderRadius: 'var(--radius)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow)',
        opacity: 0,
        borderLeft: `3px solid ${colors[toast.type] || colors.info}`,
        minWidth: 240,
        maxWidth: 360,
      }}
    >
      <span style={{ color: 'var(--text)', fontSize: 13, flex: 1 }}>{toast.message}</span>
      {toast.action && (
        <button
          onClick={toast.action.fn}
          style={{
            flexShrink: 0,
            padding: '4px 10px',
            borderRadius: 'var(--radius)',
            background: 'var(--accent)',
            border: 'none',
            color: 'var(--on-accent)',
            fontSize: 12,
            fontWeight: 700,
            cursor: 'pointer',
            pointerEvents: 'auto',
          }}
        >
          {toast.action.label}
        </button>
      )}
    </div>
  )
}

export default function ToastContainer() {
  const { toasts } = useToast()
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 20,
        right: 20,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
