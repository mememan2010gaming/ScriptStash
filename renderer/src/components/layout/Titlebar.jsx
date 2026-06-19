import { useState, useEffect } from 'react'
import './Titlebar.css'

function ScriptStashMark({ size = 20 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient
          id="tb2-wine"
          x1="10"
          y1="10"
          x2="90"
          y2="90"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#bd4257" />
          <stop offset="0.52" stopColor="#92223a" />
          <stop offset="1" stopColor="#5e1326" />
        </linearGradient>
        <radialGradient id="tb2-sheen" cx="30%" cy="-6%" r="92%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="56%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx="26" fill="url(#tb2-wine)" />
      <rect x="0" y="0" width="100" height="100" rx="26" fill="url(#tb2-sheen)" />
      <rect
        x="0.75"
        y="0.75"
        width="98.5"
        height="98.5"
        rx="25.5"
        fill="none"
        stroke="rgba(255,255,255,0.22)"
        strokeWidth="1.5"
      />
      <g fill="none" stroke="white" strokeWidth="11" strokeLinecap="round" strokeLinejoin="round">
        <path d="M27 39 L50 57 L73 39" />
        <path d="M27 58 L50 76 L73 58" />
      </g>
    </svg>
  )
}

export default function Titlebar() {
  const [isMaximized, setIsMaximized] = useState(false)
  const api = window.electronAPI

  useEffect(() => {
    if (!api?.onMaximizeChange) return
    api.onMaximizeChange(maximized => setIsMaximized(maximized))
    return () => api.removeAllListeners?.('window-maximized')
  }, [api])

  return (
    <header className="titlebar" onDoubleClick={() => api?.maximizeWindow()}>
      <div className="titlebar-drag">
        <div className="titlebar-title">
          <ScriptStashMark size={20} />
          <span className="titlebar-name">
            Script<span className="titlebar-name-accent">Stash</span>
          </span>
        </div>
      </div>
      <div className="titlebar-controls">
        <button
          className="titlebar-btn"
          onClick={() => api?.minimizeWindow()}
          aria-label="Minimize"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <rect x="1" y="5.5" width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button
          className="titlebar-btn"
          onClick={() => api?.maximizeWindow()}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
        >
          {isMaximized ? (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect
                x="2.5"
                y="0.5"
                width="8.5"
                height="8.5"
                rx="1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
              />
              <rect
                x="1"
                y="3"
                width="8.5"
                height="8.5"
                rx="1"
                fill="var(--bg-primary)"
                stroke="currentColor"
                strokeWidth="1"
              />
            </svg>
          ) : (
            <svg width="12" height="12" viewBox="0 0 12 12">
              <rect
                x="1"
                y="1"
                width="10"
                height="10"
                rx="1"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.2"
              />
            </svg>
          )}
        </button>
        <button
          className="titlebar-btn titlebar-btn-close"
          onClick={() => api?.closeWindow()}
          aria-label="Close"
        >
          <svg width="12" height="12" viewBox="0 0 12 12">
            <line x1="2" y1="2" x2="10" y2="10" stroke="currentColor" strokeWidth="1.2" />
            <line x1="10" y1="2" x2="2" y2="10" stroke="currentColor" strokeWidth="1.2" />
          </svg>
        </button>
      </div>
    </header>
  )
}
