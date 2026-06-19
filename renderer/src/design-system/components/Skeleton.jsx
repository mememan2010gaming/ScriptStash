export default function Skeleton({
  width = '100%',
  height = 16,
  radius = 'var(--radius-sm)',
  style,
}) {
  return (
    <div
      style={{
        width,
        height,
        borderRadius: radius,
        background:
          'linear-gradient(90deg, var(--surface-2) 25%, var(--surface-3) 50%, var(--surface-2) 75%)',
        backgroundSize: '200% 100%',
        animation: 'skeleton-shimmer 1.5s infinite',
        flexShrink: 0,
        ...style,
      }}
    />
  )
}
