export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  onClick,
  disabled,
  style,
}) {
  const base = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 6,
    fontFamily: 'inherit',
    fontWeight: 600,
    cursor: disabled ? 'not-allowed' : 'pointer',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    transition: 'opacity var(--transition)',
    opacity: disabled ? 0.4 : 1,
    textDecoration: 'none',
  }
  const sizes = {
    sm: { padding: '4px 10px', fontSize: 12 },
    md: { padding: '7px 14px', fontSize: 13 },
    lg: { padding: '10px 20px', fontSize: 14 },
  }
  const variants = {
    primary: { background: 'var(--accent-gradient)', color: 'var(--on-accent)' },
    secondary: {
      background: 'var(--surface-2)',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    ghost: { background: 'transparent', color: 'var(--text-muted)' },
    danger: { background: 'var(--red)', color: '#fff' },
  }

  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...sizes[size], ...variants[variant], ...style }}
    >
      {children}
    </button>
  )
}
