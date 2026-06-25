import { useState, useEffect } from 'react'
import { useDownloads } from '../contexts/DownloadContext'
import CountUp from '../design-system/components/CountUp'
import Icon from '../design-system/components/Icon'
import ProgressBar from '../design-system/components/ProgressBar'

function fmtBytes(b) {
  if (!b || b <= 0) return '0 B'
  if (b < 1024) return `${b} B`
  if (b < 1e6) return `${(b / 1024).toFixed(1)} KB`
  if (b < 1e9) return `${(b / 1e6).toFixed(1)} MB`
  return `${(b / 1e9).toFixed(2)} GB`
}

function StatTile({ label, children }) {
  return (
    <div className="glass glass-sheen" style={{ padding: '18px 18px', borderRadius: 18 }}>
      <div className="num" style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)' }}>
        {children}
      </div>
      <div
        style={{
          fontSize: 11.5,
          color: 'var(--text-faint)',
          marginTop: 4,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          fontWeight: 600,
        }}
      >
        {label}
      </div>
    </div>
  )
}

function Stepper({ value, onInc, onDec }) {
  const btn = (icon, fn) => (
    <button
      onClick={fn}
      className="glass glass-hover"
      style={{
        width: 34,
        height: 34,
        borderRadius: 11,
        display: 'grid',
        placeItems: 'center',
        cursor: 'pointer',
        color: 'var(--text)',
        border: '1px solid var(--glass-border)',
      }}
    >
      <Icon name={icon} size={15} stroke={2.2} />
    </button>
  )
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        width: '100%',
        justifyContent: 'space-between',
      }}
    >
      {btn('minus', onDec)}
      <span className="num" style={{ fontSize: 22, fontWeight: 700 }}>
        {value}
      </span>
      {btn('plus', onInc)}
    </div>
  )
}

export default function DownloadsView() {
  const { active, queued, history, clearHistory } = useDownloads()
  const [savePath, setSavePath] = useState('')
  const [maxDl, setMaxDl] = useState(6)

  useEffect(() => {
    window.electronAPI
      ?.getDownloadPath?.()
      .then(r => {
        if (r?.success) setSavePath(r.data || '')
      })
      .catch(() => {})
    window.electronAPI
      ?.getMaxDownloads?.()
      .then(r => {
        if (r?.success && r.data) setMaxDl(r.data)
      })
      .catch(() => {})
  }, [])

  const totalSize = history.reduce((s, h) => s + (h.size || 0), 0)

  const setMax = async n => {
    const c = Math.max(1, Math.min(50, n))
    setMaxDl(c)
    await window.electronAPI?.setMaxDownloads?.(c)
  }

  const handleChangePath = async () => {
    const r = await window.electronAPI?.setDownloadPath?.()
    if (r?.success && r.data) setSavePath(r.data)
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      <div style={{ flex: 1, overflow: 'auto', minWidth: 0 }}>
        {/* Header */}
        <div
          style={{
            padding: '28px 36px 22px',
            flexShrink: 0,
            borderBottom: '1px solid var(--glass-border)',
          }}
        >
          <h1
            className="display"
            style={{ fontSize: 30, fontWeight: 700, color: 'var(--text)', lineHeight: 1.05 }}
          >
            Downloads
          </h1>
        </div>

        <div
          style={{ padding: '6px 30px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}
        >
          {/* Active */}
          <section>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 13 }}>
              <span className="display" style={{ fontSize: 15, fontWeight: 700 }}>
                Active <span style={{ color: 'var(--text-faint)' }}>({active.length})</span>
              </span>
            </div>
            {active.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--text-faint)', padding: '8px 0' }}>
                No active downloads
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 11 }}>
                {active.map(d => (
                  <div
                    key={d.downloadId || d.url}
                    className="glass"
                    style={{ padding: 16, borderRadius: 16 }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        marginBottom: 11,
                        gap: 12,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 9,
                          overflow: 'hidden',
                        }}
                      >
                        <span
                          style={{
                            color: 'var(--accent-2)',
                            display: 'grid',
                            placeItems: 'center',
                            flexShrink: 0,
                          }}
                        >
                          <Icon name="file" size={16} />
                        </span>
                        <span
                          style={{
                            fontSize: 13.5,
                            fontWeight: 600,
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {d.filename}
                        </span>
                      </div>
                      <span
                        className="num"
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--accent-2)',
                          flexShrink: 0,
                        }}
                      >
                        {d.progress ?? 0}%
                      </span>
                    </div>
                    <ProgressBar
                      value={d.progress ?? 0}
                      color="var(--accent-gradient)"
                      height={6}
                      glow
                    />
                    {(d.bytesReceived > 0 || d.totalBytes > 0) && (
                      <div
                        style={{
                          display: 'flex',
                          gap: 8,
                          marginTop: 9,
                          fontSize: 11.5,
                          color: 'var(--text-faint)',
                        }}
                        className="num"
                      >
                        {d.bytesReceived > 0 && <span>{fmtBytes(d.bytesReceived)}</span>}
                        {d.totalBytes > 0 && <span>/ {fmtBytes(d.totalBytes)}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Queue */}
          <section>
            <div className="display" style={{ fontSize: 15, fontWeight: 700, marginBottom: 13 }}>
              Queue <span style={{ color: 'var(--text-faint)' }}>({queued.length})</span>
            </div>
            {queued.length === 0 ? (
              <div style={{ fontSize: 12.5, color: 'var(--text-faint)' }}>Queue is empty</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {queued.map((d, i) => (
                  <div
                    key={d.downloadId || i}
                    className="glass"
                    style={{
                      padding: '13px 16px',
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                  >
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 10, overflow: 'hidden' }}
                    >
                      <span
                        className="num"
                        style={{ fontSize: 12, color: 'var(--text-faint)', width: 22 }}
                      >
                        #{i + 1}
                      </span>
                      <span
                        style={{
                          fontSize: 13.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {d.filename}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10.5,
                        fontWeight: 700,
                        padding: '2px 9px',
                        borderRadius: 99,
                        background: 'rgba(255,194,75,0.13)',
                        color: 'var(--yellow)',
                        border: '1px solid rgba(255,194,75,0.3)',
                        textTransform: 'uppercase',
                        letterSpacing: '0.03em',
                        flexShrink: 0,
                      }}
                    >
                      Queued
                    </span>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* History */}
          <section>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 13,
              }}
            >
              <div className="display" style={{ fontSize: 15, fontWeight: 700 }}>
                History <span style={{ color: 'var(--text-faint)' }}>({history.length})</span>
              </div>
              {history.length > 0 && (
                <button
                  onClick={clearHistory}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 99,
                    cursor: 'pointer',
                    fontSize: 12,
                    fontWeight: 600,
                    background: 'transparent',
                    border: '1px solid var(--glass-border)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Clear all
                </button>
              )}
            </div>
            {history.length === 0 ? (
              <div
                style={{
                  padding: '32px 0',
                  textAlign: 'center',
                  color: 'var(--text-faint)',
                  fontSize: 13,
                }}
              >
                No completed downloads
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                {history.map((d, i) => (
                  <button
                    key={i}
                    onClick={() => window.electronAPI?.openFolder?.(d.path)}
                    className="glass glass-hover"
                    style={{
                      padding: '12px 15px',
                      borderRadius: 13,
                      cursor: 'pointer',
                      textAlign: 'left',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 13,
                    }}
                  >
                    <span
                      style={{
                        color: 'var(--text-muted)',
                        display: 'grid',
                        placeItems: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <Icon name="file" size={17} />
                    </span>
                    <div style={{ flex: 1, overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: 13.5,
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                          color: 'var(--text)',
                        }}
                      >
                        {d.filename}
                      </div>
                      <div
                        className="num"
                        style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 2 }}
                      >
                        {fmtBytes(d.size)} ·{' '}
                        {d.completedAt ? new Date(d.completedAt).toLocaleDateString() : ''}
                      </div>
                    </div>
                    <span
                      style={{
                        fontSize: 11.5,
                        color: 'var(--text-faint)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        flexShrink: 0,
                      }}
                    >
                      Open <Icon name="external" size={12} />
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Right sidebar */}
      <div
        style={{
          width: 268,
          flexShrink: 0,
          borderLeft: '1px solid var(--glass-border)',
          padding: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
          overflow: 'auto',
          background: 'rgba(255,255,255,0.02)',
        }}
      >
        <StatTile label="Files downloaded">
          <CountUp to={history.length} />
        </StatTile>
        <StatTile label="Total size">
          <CountUp to={totalSize} format={fmtBytes} />
        </StatTile>

        <div className="glass" style={{ padding: 16, borderRadius: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 9,
            }}
          >
            Save Location
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-faint)',
              marginBottom: 12,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {savePath || 'Default folder'}
          </div>
          <button
            onClick={handleChangePath}
            style={{
              width: '100%',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '9px 13px',
              borderRadius: 99,
              cursor: 'pointer',
              background: 'var(--glass-strong)',
              border: '1px solid var(--glass-border-bright)',
              color: 'var(--text)',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Icon name="folder" size={14} /> Change
          </button>
        </div>

        <div className="glass" style={{ padding: 16, borderRadius: 16 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              letterSpacing: '0.08em',
              marginBottom: 14,
            }}
          >
            Max Parallel
          </div>
          <Stepper value={maxDl} onInc={() => setMax(maxDl + 1)} onDec={() => setMax(maxDl - 1)} />
        </div>
      </div>
    </div>
  )
}
