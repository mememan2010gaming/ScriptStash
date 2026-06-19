import { useState, useEffect } from 'react'
import { useTheme } from '../../context/ThemeContext'
import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import './SettingsView.css'

export default function SettingsView() {
  const { theme, mode, themes, setTheme, toggleMode } = useTheme()
  const [downloadPath, setDownloadPath] = useState('')
  const [maxDownloads, setMaxDownloads] = useState(10)
  const [adBlocker, setAdBlocker] = useState({ enabled: false, blocked: 0 })
  const [version, setVersion] = useState('')
  const api = window.electronAPI

  useEffect(() => {
    api.getDownloadPath().then(r => {
      if (r?.success) setDownloadPath(r.data)
    })
    api.getMaxDownloads().then(r => {
      if (r?.success) setMaxDownloads(r.data)
    })
    api.getAdBlockerStatus().then(r => {
      if (r?.success) setAdBlocker(r.data || {})
    })
    api.getAppVersion().then(r => {
      if (r?.success) setVersion(r.data)
    })
  }, [api])

  const handleChangePath = async () => {
    const result = await api.invoke('set-download-path', {})
    if (result?.success) setDownloadPath(result.data)
  }

  const handleMaxDownloads = async val => {
    const num = Math.max(1, Math.min(50, parseInt(val, 10) || 1))
    setMaxDownloads(num)
    await api.setMaxDownloads(num)
  }

  const handleToggleAdBlocker = async () => {
    const newVal = !adBlocker.enabled
    await api.setAdBlockerEnabled(newVal)
    setAdBlocker(prev => ({ ...prev, enabled: newVal }))
  }

  const handleUpdateBlockList = async () => {
    await api.updateAdBlockerList()
    const r = await api.getAdBlockerStatus()
    if (r?.success) setAdBlocker(r.data || {})
  }

  const handleCheckUpdates = () => {
    api.checkForUpdates()
  }

  const themeColors = {
    ocean: '#3b82f6',
    crimson: '#e11d48',
    violet: '#8b5cf6',
    emerald: '#10b981',
    sunset: '#f97316',
    custom: 'linear-gradient(135deg, #ff6b6b, #4ecdc4)',
  }

  return (
    <div className="settings-view">
      <h1 className="settings-title">Settings</h1>

      {/* Appearance */}
      <GlassPanel className="settings-section" variant="subtle">
        <h2 className="settings-section-title">Appearance</h2>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Theme</span>
            <span className="settings-row-desc">Choose a color theme</span>
          </div>
          <div className="theme-picker">
            {themes.map(t => (
              <button
                key={t}
                className={`theme-swatch ${theme === t ? 'active' : ''}`}
                style={{ background: themeColors[t] }}
                onClick={() => setTheme(t)}
                title={t}
                aria-label={`${t} theme`}
              />
            ))}
          </div>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Mode</span>
            <span className="settings-row-desc">Toggle dark/light mode</span>
          </div>
          <button
            className="mode-toggle"
            onClick={toggleMode}
            aria-label={`Switch to ${mode === 'dark' ? 'light' : 'dark'} mode`}
          >
            <span className={`mode-option ${mode === 'dark' ? 'active' : ''}`}>Dark</span>
            <span className={`mode-option ${mode === 'light' ? 'active' : ''}`}>Light</span>
          </button>
        </div>
      </GlassPanel>

      {/* Downloads */}
      <GlassPanel className="settings-section" variant="subtle">
        <h2 className="settings-section-title">Downloads</h2>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Save Location</span>
            <span className="settings-row-desc settings-path">{downloadPath || 'Not set'}</span>
          </div>
          <Button size="sm" variant="default" onClick={handleChangePath}>
            Browse
          </Button>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Max Simultaneous Downloads</span>
            <span className="settings-row-desc">1 to 50</span>
          </div>
          <input
            type="number"
            className="settings-number-input"
            value={maxDownloads}
            onChange={e => handleMaxDownloads(e.target.value)}
            min={1}
            max={50}
          />
        </div>
      </GlassPanel>

      {/* Ad Blocker */}
      <GlassPanel className="settings-section" variant="subtle">
        <h2 className="settings-section-title">Ad Blocker</h2>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Enable Ad Blocker</span>
            <span className="settings-row-desc">{adBlocker.blocked || 0} requests blocked</span>
          </div>
          <button
            className={`toggle-switch ${adBlocker.enabled ? 'on' : ''}`}
            onClick={handleToggleAdBlocker}
            aria-label="Toggle ad blocker"
          >
            <span className="toggle-knob" />
          </button>
        </div>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Update Block List</span>
            <span className="settings-row-desc">Refresh EasyList rules</span>
          </div>
          <Button size="sm" variant="default" onClick={handleUpdateBlockList}>
            Update
          </Button>
        </div>
      </GlassPanel>

      {/* About */}
      <GlassPanel className="settings-section" variant="subtle">
        <h2 className="settings-section-title">About</h2>

        <div className="settings-row">
          <div className="settings-row-info">
            <span className="settings-row-label">Version</span>
            <span className="settings-row-desc">{version || '...'}</span>
          </div>
          <Button size="sm" variant="default" onClick={handleCheckUpdates}>
            Check for Updates
          </Button>
        </div>
      </GlassPanel>
    </div>
  )
}
