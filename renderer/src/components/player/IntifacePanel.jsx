import { useState, useRef, useEffect } from 'react'
import { ButtplugClient, ButtplugBrowserWebsocketClientConnector } from 'buttplug'

const INTIFACE_URL = 'ws://localhost:12345'

export default function IntifacePanel({ onDevicesChange }) {
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState('disconnected') // 'disconnected' | 'connecting' | 'connected'
  const [error, setError] = useState(null)
  const [devices, setDevices] = useState([])
  const clientRef = useRef(null)

  function syncDevices(client) {
    const list = client ? [...client.devices.values()] : []
    setDevices(list)
    onDevicesChange(list)
  }

  async function connect() {
    setStatus('connecting')
    setError(null)
    try {
      const client = new ButtplugClient('ScriptStash')
      client.on('deviceadded', () => syncDevices(client))
      client.on('deviceremoved', () => syncDevices(client))
      client.on('disconnect', () => {
        setStatus('disconnected')
        setDevices([])
        onDevicesChange([])
        clientRef.current = null
      })
      await client.connect(new ButtplugBrowserWebsocketClientConnector(INTIFACE_URL))
      clientRef.current = client
      setStatus('connected')
      syncDevices(client)
    } catch {
      setStatus('disconnected')
      setError('Could not connect to Intiface Central. Is it running?')
    }
  }

  async function disconnect() {
    try {
      await clientRef.current?.disconnect()
    } catch {
      // ignore
    }
    clientRef.current = null
    setStatus('disconnected')
    setDevices([])
    onDevicesChange([])
  }

  useEffect(() => {
    return () => {
      clientRef.current?.disconnect().catch(() => {})
    }
  }, [])

  const dotColor = status === 'connected' ? '#4caf50' : status === 'connecting' ? '#ff9800' : '#666'

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'transparent',
          border: '1px solid var(--glass-border)',
          borderRadius: 8,
          padding: '4px 10px',
          cursor: 'pointer',
          color: 'var(--text)',
        }}
        title="Intiface devices"
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: dotColor,
            display: 'inline-block',
            flexShrink: 0,
          }}
        />
        <span style={{ fontSize: 11.5, fontWeight: 600 }}>
          {status === 'connected'
            ? `${devices.length} device${devices.length !== 1 ? 's' : ''}`
            : 'Intiface'}
        </span>
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '110%',
            right: 0,
            background: 'var(--bg)',
            border: '1px solid var(--glass-border)',
            borderRadius: 12,
            padding: 16,
            minWidth: 240,
            zIndex: 100,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
          }}
        >
          <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 10, color: 'var(--text)' }}>
            Intiface Central
          </div>

          {error && (
            <div style={{ fontSize: 11.5, color: '#f44336', marginBottom: 8 }}>{error}</div>
          )}

          {status === 'disconnected' && (
            <button
              onClick={connect}
              style={{
                width: '100%',
                padding: '6px 0',
                borderRadius: 8,
                border: 'none',
                background: '#6c8eff',
                color: '#fff',
                fontWeight: 600,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              Connect
            </button>
          )}

          {status === 'connecting' && (
            <div style={{ fontSize: 12, color: 'var(--text-faint)' }}>Connecting…</div>
          )}

          {status === 'connected' && (
            <>
              <div style={{ fontSize: 11.5, color: 'var(--text-faint)', marginBottom: 8 }}>
                {devices.length === 0
                  ? 'No devices detected. Check Intiface Central.'
                  : 'Connected devices:'}
              </div>
              {devices.map((d, i) => (
                <div
                  key={i}
                  style={{
                    fontSize: 12,
                    padding: '4px 0',
                    color: 'var(--text)',
                    borderBottom: '1px solid var(--glass-border)',
                  }}
                >
                  {d.name ?? `Device ${i + 1}`}
                </div>
              ))}
              <button
                onClick={disconnect}
                style={{
                  marginTop: 10,
                  width: '100%',
                  padding: '5px 0',
                  borderRadius: 8,
                  border: '1px solid var(--glass-border)',
                  background: 'transparent',
                  color: 'var(--text-faint)',
                  fontSize: 11.5,
                  cursor: 'pointer',
                }}
              >
                Disconnect
              </button>
            </>
          )}
        </div>
      )}
    </div>
  )
}
