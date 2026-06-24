import { useEffect, useRef } from 'react'
import { animate } from 'animejs'

export default function ProgressBar({
  value = 0,
  color = 'var(--accent)',
  height = 4,
  glow = false,
}) {
  const fillRef = useRef(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!fillRef.current) return
    if (!mountedRef.current) {
      fillRef.current.style.transform = `scaleX(${value / 100})`
      mountedRef.current = true
      return
    }
    animate(fillRef.current, {
      scaleX: value / 100,
      duration: 300,
      ease: 'linear',
    })
  }, [value])

  return (
    <div
      style={{
        width: '100%',
        height,
        background: 'var(--surface-3)',
        borderRadius: height,
        overflow: 'hidden',
      }}
    >
      <div
        ref={fillRef}
        style={{
          height: '100%',
          background: color,
          width: '100%',
          borderRadius: height,
          transform: 'scaleX(0)',
          transformOrigin: 'left',
          ...(glow ? { boxShadow: '0 0 12px var(--accent-glow)' } : {}),
        }}
      />
    </div>
  )
}
