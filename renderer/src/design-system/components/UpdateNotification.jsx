import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'

/**
 * Persistent "update ready" prompt. The main process downloads updates silently
 * and fires `update-ready` once an update is staged; we surface a restart prompt.
 * "Later" just hides it — the update still applies on the next app restart.
 */
export default function UpdateNotification() {
  const [info, setInfo] = useState(null) // { version }
  const [dismissed, setDismissed] = useState(false)
  const [installing, setInstalling] = useState(false)
  const ref = useRef(null)
  const api = typeof window !== 'undefined' ? window.electronAPI : null

  useEffect(() => {
    if (!api) return

    // Handle the event, plus a status check in case it fired before mount.
    if (api.onUpdateReady) {
      api.onUpdateReady(data => {
        setInfo(data || {})
        setDismissed(false)
      })
    }
    if (api.getUpdateStatus) {
      api.getUpdateStatus().then(status => {
        if (status?.updateDownloaded) {
          setInfo({ version: status.pendingVersion })
        }
      })
    }

    return () => {
      if (api.removeAllListeners) api.removeAllListeners('update-ready')
    }
  }, [api])

  useEffect(() => {
    if (info && !dismissed && ref.current) {
      animate(ref.current, {
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 220,
        ease: 'easeOutQuad',
      })
    }
  }, [info, dismissed])

  if (!info || dismissed) return null

  const handleRestart = async () => {
    setInstalling(true)
    await api.installUpdate()
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'fixed',
        bottom: 20,
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 16px',
        borderRadius: 'var(--radius)',
        background: 'var(--surface-2)',
        border: '1px solid var(--border)',
        borderLeft: '3px solid var(--accent)',
        boxShadow: 'var(--shadow)',
        zIndex: 10000,
        maxWidth: 460,
      }}
    >
      <span style={{ color: 'var(--text)', fontSize: 13 }}>
        {info.version
          ? `Update ${info.version} is ready to install.`
          : 'An update is ready to install.'}
      </span>
      <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
        <button
          onClick={() => setDismissed(true)}
          disabled={installing}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            background: 'transparent',
            border: '1px solid var(--border)',
            color: 'var(--text-muted, var(--text))',
            fontSize: 13,
            cursor: 'pointer',
          }}
        >
          Later
        </button>
        <button
          onClick={handleRestart}
          disabled={installing}
          style={{
            padding: '6px 12px',
            borderRadius: 'var(--radius)',
            background: 'var(--accent)',
            border: '1px solid var(--accent)',
            color: 'var(--on-accent)',
            fontSize: 13,
            fontWeight: 600,
            cursor: installing ? 'default' : 'pointer',
            opacity: installing ? 0.7 : 1,
          }}
        >
          {installing ? 'Restarting…' : 'Restart now'}
        </button>
      </div>
    </div>
  )
}
