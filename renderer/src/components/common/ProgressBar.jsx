import './ProgressBar.css'

export default function ProgressBar({
  value = 0,
  max = 100,
  size = 'md',
  variant = 'primary',
  label,
  showPercent = false,
  className = '',
}) {
  const percent = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={`progress ${className}`}>
      {label && <span className="progress-label">{label}</span>}
      <div className={`progress-track progress-track--${size}`}>
        <div
          className={`progress-fill progress-fill--${variant}`}
          style={{ width: `${percent}%` }}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
        />
      </div>
      {showPercent && <span className="progress-percent">{Math.round(percent)}%</span>}
    </div>
  )
}
