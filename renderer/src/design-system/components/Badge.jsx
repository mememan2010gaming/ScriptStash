export default function Badge({ children, color = 'default', style }) {
  const colors = {
    default: { background: 'var(--surface-3)', color: 'var(--text-muted)' },
    accent: { background: 'rgba(139,92,246,0.2)', color: 'var(--accent)' },
    green: { background: 'rgba(52,211,153,0.15)', color: 'var(--green)' },
    red: { background: 'rgba(248,113,113,0.15)', color: 'var(--red)' },
    yellow: { background: 'rgba(251,191,36,0.15)', color: 'var(--yellow)' },
  }

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: 'var(--radius-pill)',
        fontSize: 11,
        fontWeight: 600,
        letterSpacing: '0.03em',
        textTransform: 'uppercase',
        whiteSpace: 'nowrap',
        ...(colors[color] || colors.default),
        ...style,
      }}
    >
      {children}
    </span>
  )
}
