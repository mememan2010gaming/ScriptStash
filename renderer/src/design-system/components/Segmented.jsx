import { useRef, useEffect } from 'react'

export default function Segmented({ tabs, value, onChange }) {
  const wrapRef = useRef(null)
  const indRef = useRef(null)

  useEffect(() => {
    const wrap = wrapRef.current
    const ind = indRef.current
    if (!wrap || !ind) return
    const btns = wrap.querySelectorAll('[data-seg]')
    const idx = tabs.findIndex(t => t.id === value)
    if (idx === -1) return
    const tabWidth = 100 / tabs.length
    ind.style.transform = `translateX(${idx * 100}%)`
  }, [value, tabs])

  return (
    <div
      ref={wrapRef}
      className="glass"
      style={{
        position: 'relative',
        display: 'flex',
        gap: 2,
        padding: 4,
        borderRadius: 14,
        flexShrink: 0,
      }}
    >
      <div
        ref={indRef}
        style={{
          position: 'absolute',
          top: 4,
          bottom: 4,
          left: 0,
          width: `${100 / tabs.length}%`,
          borderRadius: 10,
          zIndex: 0,
          background: 'var(--accent-gradient)',
          boxShadow: '0 4px 14px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.35)',
          transition: 'transform var(--t)',
          transform: 'translateX(0%)',
        }}
      />
      {tabs.map(t => (
        <button
          key={t.id}
          data-seg
          onClick={() => onChange(t.id)}
          style={{
            position: 'relative',
            zIndex: 1,
            flex: 1,
            padding: '7px 16px',
            border: 'none',
            background: 'transparent',
            cursor: 'pointer',
            fontSize: 13,
            fontWeight: 700,
            borderRadius: 10,
            color: value === t.id ? 'var(--on-accent)' : 'var(--text-muted)',
            transition: 'color var(--t)',
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
