import { useRef, useLayoutEffect } from 'react'

export default function Segmented({ tabs, value, onChange }) {
  const wrapRef = useRef(null)
  const indRef = useRef(null)
  const initialised = useRef(false)

  useLayoutEffect(() => {
    const wrap = wrapRef.current
    const ind = indRef.current
    if (!wrap || !ind) return
    const btns = [...wrap.querySelectorAll('[data-seg]')]
    const idx = tabs.findIndex(t => t.id === value)
    if (idx === -1 || !btns[idx]) return

    const wrapRect = wrap.getBoundingClientRect()
    const btnRect = btns[idx].getBoundingClientRect()
    const offsetX = btnRect.left - wrapRect.left

    if (!initialised.current) {
      // First render — snap into place with no animation
      ind.style.transition = 'none'
      ind.style.width = `${btnRect.width}px`
      ind.style.transform = `translateX(${offsetX}px)`
      ind.offsetWidth // eslint-disable-line no-unused-expressions -- force reflow
      ind.style.transition = 'transform var(--t)'
      initialised.current = true
    } else {
      // Width never changes (equal tabs), only position animates
      ind.style.width = `${btnRect.width}px`
      ind.style.transform = `translateX(${offsetX}px)`
    }
  }, [value, tabs])

  return (
    <div
      ref={wrapRef}
      className="glass"
      style={{
        position: 'relative',
        display: 'flex',
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
          width: 0,
          borderRadius: 10,
          zIndex: 0,
          background: 'var(--accent-gradient)',
          boxShadow: '0 4px 14px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.35)',
          transform: 'translateX(0)',
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
