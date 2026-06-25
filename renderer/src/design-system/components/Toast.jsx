import { useEffect, useRef } from 'react'
import { animate } from 'animejs'
import { useToast } from '../../contexts/ToastContext'
import Icon from './Icon'

const TYPE_ICON = { success: 'check', error: 'close', info: 'bolt' }
const TYPE_COLOR = { success: 'var(--green)', error: 'var(--red)', info: 'var(--accent)' }

function ToastItem({ toast }) {
  const ref = useRef(null)
  const iconName = TYPE_ICON[toast.type] || TYPE_ICON.info
  const iconColor = TYPE_COLOR[toast.type] || TYPE_COLOR.info

  useEffect(() => {
    if (!ref.current) return
    animate(ref.current, {
      opacity: [0, 1],
      translateY: [-8, 0],
      duration: 200,
      ease: 'outExpo',
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
        background: 'var(--glass-strong)',
        backdropFilter: `blur(var(--glass-blur)) saturate(var(--glass-saturate))`,
        border: '1px solid var(--glass-border-bright)',
        opacity: 0,
        minWidth: 240,
        maxWidth: 360,
      }}
    >
      <span style={{ color: iconColor, display: 'grid', placeItems: 'center', flexShrink: 0 }}>
        <Icon name={iconName} size={15} stroke={2.2} />
      </span>
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
        zIndex: 'var(--z-toast)',
        pointerEvents: 'none',
      }}
    >
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} />
      ))}
    </div>
  )
}
