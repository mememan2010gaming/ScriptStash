import { useEffect, useRef } from 'react'
import { animate } from 'animejs'

export default function ProgressBar({ value = 0, color = 'var(--accent)', height = 4 }) {
  const fillRef = useRef(null)
  const mountedRef = useRef(false)

  useEffect(() => {
    if (!fillRef.current) return
    if (!mountedRef.current) {
      // First render: set without animation
      fillRef.current.style.width = `${value}%`
      mountedRef.current = true
      return
    }
    animate(fillRef.current, {
      width: `${value}%`,
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
          width: '0%',
          borderRadius: height,
        }}
      />
    </div>
  )
}
