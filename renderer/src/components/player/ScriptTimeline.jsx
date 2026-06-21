import { useRef, useEffect } from 'react'

const WINDOW_MS = 10000
const HALF_WINDOW_MS = 5000

function drawTimeline(canvas, actions, currentTimeMs) {
  const ctx = canvas.getContext('2d')
  const { width, height } = canvas
  ctx.clearRect(0, 0, width, height)

  const startMs = currentTimeMs - HALF_WINDOW_MS
  const endMs = currentTimeMs + HALF_WINDOW_MS

  const visible = []
  for (let i = 0; i < actions.length; i++) {
    if (actions[i].at >= startMs - 500 && actions[i].at <= endMs + 500) {
      visible.push(actions[i])
    }
  }

  // Faint grid lines
  ctx.strokeStyle = 'rgba(255,255,255,0.06)'
  ctx.lineWidth = 1
  for (const y of [0.25, 0.5, 0.75]) {
    ctx.beginPath()
    ctx.moveTo(0, Math.round(height * y))
    ctx.lineTo(width, Math.round(height * y))
    ctx.stroke()
  }

  // Script line
  if (visible.length >= 2) {
    ctx.strokeStyle = '#6c8eff'
    ctx.lineWidth = 2
    ctx.lineJoin = 'round'
    ctx.beginPath()
    for (let i = 0; i < visible.length; i++) {
      const x = ((visible[i].at - startMs) / WINDOW_MS) * width
      const y = height - (visible[i].pos / 99) * height
      if (i === 0) ctx.moveTo(x, y)
      else ctx.lineTo(x, y)
    }
    ctx.stroke()
  }

  // "Now" line
  ctx.strokeStyle = 'rgba(255, 80, 80, 0.85)'
  ctx.lineWidth = 1.5
  ctx.beginPath()
  ctx.moveTo(width / 2, 0)
  ctx.lineTo(width / 2, height)
  ctx.stroke()
}

export default function ScriptTimeline({ actions, currentTimeMs }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    drawTimeline(canvas, actions, currentTimeMs)
  }, [actions, currentTimeMs])

  return (
    <canvas
      ref={canvasRef}
      width={800}
      height={60}
      style={{ width: '100%', height: 60, display: 'block', borderRadius: 6 }}
    />
  )
}
