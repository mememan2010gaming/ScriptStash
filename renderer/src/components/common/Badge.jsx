import './Badge.css'

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  dot = false,
  className = '',
}) {
  const classes = ['badge', `badge--${variant}`, `badge--${size}`, dot && 'badge--dot', className]
    .filter(Boolean)
    .join(' ')

  return <span className={classes}>{!dot && children}</span>
}
