export default function OffsetControl({ value, onChange }) {
  const label = value === 0 ? '0ms' : `${value > 0 ? '+' : ''}${value}ms`

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
      <span
        style={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'var(--text-faint)',
          whiteSpace: 'nowrap',
        }}
      >
        Offset
      </span>
      <input
        type="range"
        min={-2000}
        max={2000}
        step={50}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        style={{ flex: 1 }}
        aria-label="Script timing offset in milliseconds"
      />
      <span
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--text)',
          minWidth: 52,
          textAlign: 'right',
        }}
      >
        {label}
      </span>
      {value !== 0 && (
        <button
          onClick={() => onChange(0)}
          style={{
            fontSize: 11,
            padding: '2px 8px',
            borderRadius: 6,
            border: '1px solid var(--glass-border)',
            background: 'transparent',
            color: 'var(--text-faint)',
            cursor: 'pointer',
          }}
        >
          Reset
        </button>
      )}
    </div>
  )
}
