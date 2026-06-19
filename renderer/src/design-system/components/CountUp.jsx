import { useEffect, useRef } from 'react'

export default function CountUp({ to = 0, dur = 1100, format, className = 'num', style }) {
  const ref = useRef(null)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const fin = format ? format(to) : Math.round(to).toLocaleString()
    el.textContent = fin
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let start = null
    let frame
    const step = ts => {
      if (!start) start = ts
      const p = Math.min((ts - start) / dur, 1)
      const eased = 1 - Math.pow(1 - p, 4) // easeOutQuart
      const cur = to * eased
      el.textContent = format ? format(cur) : Math.round(cur).toLocaleString()
      if (p < 1) frame = requestAnimationFrame(step)
      else el.textContent = fin
    }
    frame = requestAnimationFrame(step)
    return () => cancelAnimationFrame(frame)
  }, [to, dur, format])

  return (
    <span ref={ref} className={className} style={style}>
      {format ? format(to) : Math.round(to).toLocaleString()}
    </span>
  )
}
