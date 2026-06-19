import Icon from '../design-system/components/Icon'

function ScriptStashMark({ size = 24 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      style={{ display: 'block', flexShrink: 0 }}
    >
      <defs>
        <linearGradient id="tb-wine" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
          <stop offset="0" stopColor="#bd4257" />
          <stop offset="0.52" stopColor="#92223a" />
          <stop offset="1" stopColor="#5e1326" />
        </linearGradient>
        <radialGradient id="tb-sheen" cx="30%" cy="-6%" r="92%">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.38" />
          <stop offset="56%" stopColor="#ffffff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect x="0" y="0" width="100" height="100" rx="26" fill="url(#tb-wine)" />
      <rect x="0" y="0" width="100" height="100" rx="26" fill="url(#tb-sheen)" />
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

function WinBtn({ title, color, onClick }) {
  return (
    <button
      onClick={onClick}
      title={title}
      style={{
        width: 30,
        height: 30,
        borderRadius: 9,
        display: 'grid',
        placeItems: 'center',
        border: '1px solid var(--glass-border)',
        background: 'var(--glass)',
        color: 'var(--text-muted)',
        cursor: 'pointer',
        transition: 'all var(--t-fast)',
        WebkitAppRegion: 'no-drag',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.color = color
        e.currentTarget.style.borderColor = color
        e.currentTarget.style.background = 'var(--glass-hover)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.color = 'var(--text-muted)'
        e.currentTarget.style.borderColor = 'var(--glass-border)'
        e.currentTarget.style.background = 'var(--glass)'
      }}
    >
      <Icon
        name={title === 'Minimize' ? 'minus' : title === 'Maximize' ? 'square' : 'close'}
        size={13}
        stroke={2}
      />
    </button>
  )
}

export default function Titlebar() {
  const api = window.electronAPI
  return (
    <div
      style={{
        height: 'var(--titlebar-height)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 14px 0 18px',
        flexShrink: 0,
        WebkitAppRegion: 'drag',
        userSelect: 'none',
        borderBottom: '1px solid var(--glass-border)',
        background: 'var(--glass-strong)',
        backdropFilter: 'blur(20px) saturate(160%)',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <ScriptStashMark size={24} />
        <span
          className="display"
          style={{
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--text)',
          }}
        >
          Script<span style={{ color: '#92223a' }}>Stash</span>
        </span>
      </div>

      <div style={{ display: 'flex', gap: 7 }}>
        <WinBtn title="Minimize" color="#ffc24b" onClick={() => api?.minimizeWindow?.()} />
        <WinBtn title="Maximize" color="#3be0a0" onClick={() => api?.maximizeWindow?.()} />
        <WinBtn title="Close" color="#ff5d6c" onClick={() => api?.closeWindow?.()} />
      </div>
    </div>
  )
}
