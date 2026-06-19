import './GlassPanel.css'

export default function GlassPanel({
  children,
  className = '',
  variant = 'default',
  padding = true,
  hover = false,
  onClick,
  ...props
}) {
  const classes = [
    'glass-panel',
    `glass-panel--${variant}`,
    padding && 'glass-panel--padded',
    hover && 'glass-panel--hover',
    onClick && 'glass-panel--clickable',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const Component = onClick ? 'button' : 'div'

  return (
    <Component className={classes} onClick={onClick} {...props}>
      {children}
    </Component>
  )
}
