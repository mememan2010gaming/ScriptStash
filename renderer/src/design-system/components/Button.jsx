import { useState } from 'react'
import Icon from './Icon'

const SIZE = {
  sm: { height: 30, padding: '0 12px', fontSize: 11, gap: 5, iconSize: 28 },
  md: { height: 36, padding: '0 16px', fontSize: 13, gap: 6, iconSize: 34 },
  lg: { height: 42, padding: '0 24px', fontSize: 14, gap: 7, iconSize: 40 },
}

const BASE = {
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  flexShrink: 0,
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-ui)',
  fontWeight: 'var(--font-medium)',
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  userSelect: 'none',
  position: 'relative',
  outline: 'none',
  transition:
    'background var(--t-fast), border-color var(--t-fast), box-shadow var(--t-fast), filter var(--t-fast)',
  textDecoration: 'none',
}

const VARIANT = {
  primary: {
    background: 'var(--primary)',
    color: 'var(--on-accent)',
    border: 'none',
  },
  default: {
    background: 'var(--glass)',
    color: 'var(--text)',
    border: '1px solid var(--glass-border)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-muted)',
    border: 'none',
  },
  danger: {
    background: 'var(--red)',
    color: '#fff',
    border: 'none',
  },
  gradient: {
    background: 'var(--accent-gradient)',
    color: 'var(--on-accent)',
    border: 'none',
  },
  // legacy alias
  secondary: {
    background: 'var(--glass)',
    color: 'var(--text)',
    border: '1px solid var(--glass-border)',
  },
}

const HOVER = {
  primary: {
    background: 'var(--accent-deep)',
    boxShadow: 'var(--shadow-glow, 0 0 20px var(--accent-glow))',
  },
  default: { background: 'var(--glass-hover)', borderColor: 'var(--glass-border-bright)' },
  ghost: { background: 'var(--glass-hover)', color: 'var(--text)' },
  danger: { filter: 'brightness(1.12)' },
  gradient: {
    filter: 'brightness(1.1)',
    boxShadow: 'var(--shadow-glow, 0 0 20px var(--accent-glow))',
  },
  secondary: { background: 'var(--glass-hover)', borderColor: 'var(--glass-border-bright)' },
}

export default function Button({
  children,
  variant = 'default',
  size = 'md',
  onClick,
  disabled = false,
  loading = false,
  iconOnly = false,
  icon,
  iconSize,
  type = 'button',
  style,
  ...rest
}) {
  const [hovered, setHovered] = useState(false)

  const sz = SIZE[size] ?? SIZE.md
  const vBase = VARIANT[variant] ?? VARIANT.default
  const vHover = HOVER[variant] ?? {}

  const buttonStyle = {
    ...BASE,
    height: sz.height,
    padding: iconOnly ? 0 : sz.padding,
    width: iconOnly ? sz.iconSize : undefined,
    fontSize: sz.fontSize,
    gap: sz.gap,
    ...vBase,
    ...(hovered && !disabled && !loading ? vHover : {}),
    opacity: disabled ? 0.5 : 1,
    cursor: disabled || loading ? 'not-allowed' : 'pointer',
    ...style,
  }

  const iconPx = iconSize ?? Math.round(sz.fontSize * 1.15)

  return (
    <button
      type={type}
      onClick={disabled || loading ? undefined : onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      disabled={disabled}
      style={buttonStyle}
      {...rest}
    >
      {loading ? (
        <>
          <span
            style={{
              width: 14,
              height: 14,
              border: '2px solid transparent',
              borderTopColor: 'currentColor',
              borderRadius: '50%',
              animation: 'spin 0.6s linear infinite',
              flexShrink: 0,
            }}
          />
          {children && <span style={{ opacity: 0.6 }}>{children}</span>}
        </>
      ) : (
        <>
          {icon && <Icon name={icon} size={iconPx} />}
          {children}
        </>
      )}
    </button>
  )
}
