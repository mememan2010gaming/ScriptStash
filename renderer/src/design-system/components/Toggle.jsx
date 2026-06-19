export default function Toggle({ checked, onChange, disabled }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => !disabled && onChange(!checked)}
      style={{
        width: 40,
        height: 22,
        borderRadius: 11,
        background: checked ? 'var(--accent)' : 'var(--toggle-off)',
        border: 'none',
        cursor: disabled ? 'not-allowed' : 'pointer',
        position: 'relative',
        transition: 'background var(--transition)',
        opacity: disabled ? 0.4 : 1,
        flexShrink: 0,
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 3,
          left: checked ? 21 : 3,
          width: 16,
          height: 16,
          borderRadius: '50%',
          background: 'var(--knob)',
          transition: 'left var(--transition)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          display: 'block',
        }}
      />
    </button>
  )
}
