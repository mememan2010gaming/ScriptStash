import { useState, useEffect, useCallback, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useToast } from '../contexts/ToastContext'
import Icon from '../design-system/components/Icon'
import './Credits.css'

const SECTIONS = [
  { id: 'general', label: 'General' },
  { id: 'downloads', label: 'Downloads' },
  { id: 'appearance', label: 'Appearance' },
  { id: 'updates', label: 'Updates' },
  { id: 'developer', label: 'Developer', devOnly: true },
  { id: 'credits', label: 'Credits' },
]

const CONTRIBUTORS = [
  {
    username: 'mememan2010',
    role: 'Creator & Lead Developer',
    github: 'https://github.com/mememan2010gaming',
    avatar: 'https://avatars.githubusercontent.com/mememan2010gaming',
  },
]

function Toggle({ checked, onChange }) {
  return (
    <button
      onClick={() => onChange(!checked)}
      style={{
        width: 46,
        height: 26,
        borderRadius: 99,
        position: 'relative',
        cursor: 'pointer',
        border: '1px solid',
        padding: 0,
        flexShrink: 0,
        background: checked ? 'var(--accent-gradient)' : 'var(--toggle-off)',
        borderColor: checked ? 'transparent' : 'var(--glass-border)',
        boxShadow: checked
          ? '0 2px 12px var(--accent-glow), inset 0 1px 0 rgba(255,255,255,0.3)'
          : 'inset 0 1px 3px rgba(0,0,0,0.2)',
        transition: 'background var(--t), border-color var(--t)',
      }}
    >
      <span
        style={{
          position: 'absolute',
          top: 2,
          left: checked ? 22 : 2,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: 'var(--knob)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
          transition: 'left var(--t)',
        }}
      />
    </button>
  )
}

function SectionLabel({ children }) {
  return (
    <div
      style={{
        fontSize: 12,
        fontWeight: 500,
        color: 'var(--text-muted)',
        marginBottom: 12,
      }}
    >
      {children}
    </div>
  )
}

function SettingRow({ label, desc, control, last }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '15px 0',
        gap: 16,
        borderBottom: last ? 'none' : '1px solid var(--glass-border)',
      }}
    >
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--text)' }}>{label}</div>
        {desc && (
          <div style={{ fontSize: 12.5, color: 'var(--text-faint)', marginTop: 2 }}>{desc}</div>
        )}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  )
}

function Group({ children }) {
  return (
    <div className="glass" style={{ borderRadius: 18, padding: '2px 18px', marginBottom: 28 }}>
      {children}
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
        width: 130,
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

/** Minimal markdown renderer for the changelog (h2, h3, bullet lists, bold, inline code). */
function ChangelogRenderer({ markdown }) {
  const lines = markdown.split('\n')
  const nodes = []
  let listItems = []
  let key = 0

  const flushList = () => {
    if (!listItems.length) return
    nodes.push(
      <ul key={key++} style={{ margin: '6px 0 14px 18px', padding: 0 }}>
        {listItems.map((t, i) => (
          <li
            key={i}
            style={{ marginBottom: 4 }}
            dangerouslySetInnerHTML={{ __html: inlineHtml(t) }}
          />
        ))}
      </ul>
    )
    listItems = []
  }

  const inlineHtml = text =>
    text
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(
        /`(.+?)`/g,
        '<code style="background:var(--code-bg);padding:1px 5px;border-radius:4px;font-size:12px">$1</code>'
      )

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (line.startsWith('## ')) {
      flushList()
      nodes.push(
        <h2
          key={key++}
          style={{
            fontSize: 14,
            fontWeight: 800,
            margin: '20px 0 6px',
            color: 'var(--accent-2, var(--accent))',
          }}
        >
          {line.slice(3)}
        </h2>
      )
    } else if (line.startsWith('### ')) {
      flushList()
      nodes.push(
        <h3
          key={key++}
          style={{ fontSize: 13, fontWeight: 700, margin: '14px 0 4px', color: 'var(--text)' }}
        >
          {line.slice(4)}
        </h3>
      )
    } else if (/^[-*] /.test(line)) {
      listItems.push(line.slice(2))
    } else if (line === '' || line === '#') {
      flushList()
    } else if (!line.startsWith('# ')) {
      flushList()
      nodes.push(
        <p
          key={key++}
          style={{ margin: '4px 0', color: 'var(--text-faint)' }}
          dangerouslySetInnerHTML={{ __html: inlineHtml(line) }}
        />
      )
    }
  }
  flushList()
  return <div>{nodes}</div>
}

export default function SettingsView({ activeSection, onSectionChange }) {
  const [section, setSection] = useState(activeSection || 'appearance')
  const { theme, setTheme, themes } = useTheme()
  const { addToast } = useToast()
  const [settings, setSettings] = useState({})
  const [user, setUser] = useState(null)
  const [maxDl, setMaxDl] = useState(6)
  const [ytDlpVersion, setYtDlpVersion] = useState(null)
  const [updatingYtDlp, setUpdatingYtDlp] = useState(false)
  const [checking, setChecking] = useState(false)
  const [checkResult, setCheckResult] = useState(null) // {text, type: 'info'|'success'|'error'}
  const checkResultTimer = useRef(null)
  const [installing, setInstalling] = useState(false)
  const [appVersion, setAppVersion] = useState('')
  const [updateStatus, setUpdateStatus] = useState(null) // from get-update-status
  const [changelog, setChangelog] = useState('')

  // Sync controlled section from parent (e.g. toast navigation)
  useEffect(() => {
    if (activeSection) {
      setSection(activeSection)
    }
  }, [activeSection])

  const changeSection = useCallback(
    id => {
      setSection(id)
      onSectionChange?.(id)
    },
    [onSectionChange]
  )

  useEffect(() => {
    const api = window.electronAPI
    if (!api) return
    api
      .getSettings?.()
      .then(r => {
        if (r?.success && r.data) setSettings(r.data)
      })
      .catch(() => {})
    api
      .validateSession?.()
      .then(r => {
        if (r?.success && r.data?.isValid) setUser(r.data.user)
      })
      .catch(() => {})
    api
      .getYtDlpVersion?.()
      .then(r => {
        if (r?.success && r.data) setYtDlpVersion(r.data)
      })
      .catch(() => {})
    api
      .getMaxDownloads?.()
      .then(r => {
        if (r?.success && r.data) setMaxDl(r.data)
      })
      .catch(() => {})
    api
      .getVersion?.()
      .then(r => {
        if (r?.success && r.data) setAppVersion(r.data)
      })
      .catch(() => {})
    api
      .getUpdateStatus?.()
      .then(r => {
        if (r) setUpdateStatus(r)
      })
      .catch(() => {})
    api
      .getChangelog?.()
      .then(r => {
        if (r?.success && r.data) setChangelog(r.data)
      })
      .catch(() => {})

    // Keep update status fresh when the updater fires events
    const refreshStatus = () =>
      api
        .getUpdateStatus?.()
        .then(r => {
          if (r) setUpdateStatus(r)
        })
        .catch(() => {})
    if (api.onUpdateAvailable) api.onUpdateAvailable(refreshStatus)
    if (api.onUpdateReady) api.onUpdateReady(refreshStatus)

    return () => {
      if (api.removeAllListeners) {
        api.removeAllListeners('update-available')
        api.removeAllListeners('update-ready')
      }
    }
  }, [])

  const update = useCallback(
    async (k, v) => {
      const u = { ...settings, [k]: v }
      setSettings(u)
      if (k === 'devMode' && !v && section === 'developer') changeSection('general')
      await window.electronAPI?.saveSettings?.(u).catch(() => {})
    },
    [settings, section, changeSection]
  )

  const setMax = async n => {
    const c = Math.max(1, Math.min(50, n))
    setMaxDl(c)
    await window.electronAPI?.setMaxDownloads?.(c)
  }

  const handleCheckUpdate = async () => {
    setChecking(true)
    if (checkResultTimer.current) clearTimeout(checkResultTimer.current)
    try {
      const r = await window.electronAPI?.checkForUpdates?.()
      const status = await window.electronAPI?.getUpdateStatus?.()
      if (status) setUpdateStatus(status)

      let text, type
      if (r?.dev) {
        text = 'Running in dev mode — update check skipped.'
        type = 'info'
      } else if (r?.error) {
        text = "Couldn't reach the update server. Try again later."
        type = 'error'
      } else if (r?.checking) {
        text = "Checking… you'll be notified if a new version is found."
        type = 'info'
      } else if (r?.updateAvailable) {
        text = `v${r.latestVersion} is available!`
        type = 'success'
      } else {
        text = "You're on the latest version."
        type = 'success'
      }
      setCheckResult({ text, type })
      checkResultTimer.current = setTimeout(() => setCheckResult(null), 6000)
    } catch {
      setCheckResult({ text: "Couldn't check for updates.", type: 'error' })
      checkResultTimer.current = setTimeout(() => setCheckResult(null), 6000)
    }
    setChecking(false)
  }

  const handleInstall = async () => {
    setInstalling(true)
    await window.electronAPI?.installUpdate?.()
    // quitAndInstall will terminate the process; if it doesn't (e.g. not ready), revert
    setTimeout(() => setInstalling(false), 3000)
  }

  const handleUpdateYtDlp = async () => {
    setUpdatingYtDlp(true)
    try {
      const r = await window.electronAPI?.updateYtDlp?.()
      if (r?.success) {
        setYtDlpVersion(r.data)
        addToast(`yt-dlp updated to ${r.data}`, 'success')
      } else {
        addToast('yt-dlp update failed', 'error')
      }
    } catch {
      addToast('yt-dlp update failed', 'error')
    }
    setUpdatingYtDlp(false)
  }

  const handleLogout = () => {
    window.electronAPI?.logout?.()
    setUser(null)
    addToast('Logged out', 'info')
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Section nav */}
      <div
        style={{
          width: 188,
          flexShrink: 0,
          borderRight: '1px solid var(--glass-border)',
          padding: '26px 12px',
          display: 'flex',
          flexDirection: 'column',
          gap: 3,
        }}
      >
        <div
          style={{
            fontSize: 10.5,
            fontWeight: 800,
            color: 'var(--text-faint)',
            textTransform: 'uppercase',
            letterSpacing: '0.12em',
            padding: '0 12px 10px',
          }}
        >
          Settings
        </div>
        {SECTIONS.filter(s => !s.devOnly || !!settings.devMode).map(s => (
          <button
            key={s.id}
            onClick={() => changeSection(s.id)}
            className={section === s.id ? 'glass' : ''}
            style={{
              padding: '11px 14px',
              borderRadius: 12,
              cursor: 'pointer',
              textAlign: 'left',
              border:
                section === s.id ? '1px solid var(--glass-border-bright)' : '1px solid transparent',
              fontSize: 13.5,
              fontWeight: section === s.id ? 700 : 500,
              background: section === s.id ? 'var(--glass)' : 'transparent',
              color: section === s.id ? 'var(--text)' : 'var(--text-muted)',
              transition: 'color var(--t)',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '30px 34px' }}>
        {/* ---- Appearance ---- */}
        {section === 'appearance' && (
          <div className="fade-in">
            <SectionLabel>Theme</SectionLabel>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(190px, 1fr))',
                gap: 14,
              }}
            >
              {themes.map(t => (
                <button
                  key={t.id}
                  onClick={() => setTheme(t.id)}
                  className="glass glass-hover"
                  style={{
                    padding: 0,
                    borderRadius: 18,
                    overflow: 'hidden',
                    cursor: 'pointer',
                    textAlign: 'left',
                    borderColor: theme === t.id ? 'var(--accent)' : 'var(--glass-border)',
                    boxShadow:
                      theme === t.id
                        ? '0 0 0 1px var(--accent), 0 10px 30px var(--accent-glow)'
                        : 'var(--glass-shadow)',
                  }}
                >
                  <div
                    style={{
                      position: 'relative',
                      height: 84,
                      background: t.preview.bg,
                    }}
                  >
                    <span
                      style={{
                        position: 'absolute',
                        left: 12,
                        bottom: 12,
                        width: 26,
                        height: 26,
                        borderRadius: 9,
                        background: t.vars['--accent-gradient'],
                        boxShadow:
                          '0 2px 8px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.4)',
                      }}
                    />
                  </div>
                  <div style={{ padding: '12px 14px' }}>
                    <div
                      style={{
                        fontSize: 13.5,
                        fontWeight: 700,
                        color: 'var(--text)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 7,
                      }}
                    >
                      {t.label}
                      {theme === t.id && (
                        <Icon name="check" size={14} style={{ color: 'var(--accent-2)' }} />
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                      {t.desc}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ---- General ---- */}
        {section === 'general' && (
          <div className="fade-in">
            <SectionLabel>Account</SectionLabel>
            <div
              className="glass glass-sheen"
              style={{
                padding: 18,
                display: 'flex',
                alignItems: 'center',
                gap: 15,
                borderRadius: 18,
                marginBottom: 28,
              }}
            >
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 15,
                  overflow: 'hidden',
                  flexShrink: 0,
                  display: 'grid',
                  placeItems: 'center',
                  background: 'var(--glass-strong)',
                  border: '1px solid var(--glass-border-bright)',
                }}
              >
                {user?.avatar ? (
                  <img
                    src={user.avatar}
                    alt=""
                    referrerPolicy="no-referrer"
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <Icon name="user" size={22} />
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{user?.username || 'Guest'}</div>
                <div
                  style={{
                    fontSize: 12.5,
                    color: user ? 'var(--green)' : 'var(--text-faint)',
                    marginTop: 2,
                  }}
                >
                  {user ? 'Connected' : 'Not logged in'}
                </div>
              </div>
              {user && (
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '8px 15px',
                    borderRadius: 99,
                    cursor: 'pointer',
                    background: 'var(--glass-strong)',
                    border: '1px solid var(--glass-border-bright)',
                    color: 'var(--text)',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Logout
                </button>
              )}
            </div>

            <SectionLabel>Preferences</SectionLabel>
            <Group>
              <SettingRow
                label="Notifications"
                desc="Show download completion alerts"
                control={
                  <Toggle
                    checked={!!settings.notifications}
                    onChange={v => update('notifications', v)}
                  />
                }
              />
              <SettingRow
                label="Check for updates on startup"
                control={
                  <Toggle
                    checked={settings.autoCheckUpdates !== false}
                    onChange={v => update('autoCheckUpdates', v)}
                  />
                }
              />
              <SettingRow
                label="Ad blocker"
                desc="Block ads in embedded views"
                control={
                  <Toggle checked={!!settings.adBlocker} onChange={v => update('adBlocker', v)} />
                }
              />
              <SettingRow
                label="Developer mode"
                last
                control={
                  <Toggle checked={!!settings.devMode} onChange={v => update('devMode', v)} />
                }
              />
            </Group>
          </div>
        )}

        {/* ---- Downloads ---- */}
        {section === 'downloads' && (
          <div className="fade-in">
            <SectionLabel>Download Settings</SectionLabel>
            <Group>
              <SettingRow
                label="Max concurrent downloads"
                desc={`Currently ${maxDl}`}
                last
                control={
                  <Stepper
                    value={maxDl}
                    onInc={() => setMax(maxDl + 1)}
                    onDec={() => setMax(maxDl - 1)}
                  />
                }
              />
            </Group>

            <SectionLabel>yt-dlp</SectionLabel>
            <div
              className="glass"
              style={{
                padding: 22,
                borderRadius: 18,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 28,
              }}
            >
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>Video Downloader Engine</div>
                <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 3 }}>
                  {ytDlpVersion ? `yt-dlp ${ytDlpVersion}` : 'Loading version…'}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-faint)', marginTop: 4 }}>
                  Update if downloads from sites like PornHub or Spankbang fail.
                </div>
              </div>
              <button
                onClick={handleUpdateYtDlp}
                disabled={updatingYtDlp}
                style={{
                  padding: '10px 20px',
                  borderRadius: 99,
                  cursor: updatingYtDlp ? 'default' : 'pointer',
                  fontWeight: 700,
                  background: 'var(--accent-gradient)',
                  color: 'var(--on-accent)',
                  border: 'none',
                  boxShadow: '0 6px 22px var(--accent-glow)',
                  fontSize: 13.5,
                  opacity: updatingYtDlp ? 0.7 : 1,
                  flexShrink: 0,
                }}
              >
                {updatingYtDlp ? 'Updating…' : 'Update'}
              </button>
            </div>
          </div>
        )}

        {/* ---- Updates ---- */}
        {section === 'updates' && (
          <div className="fade-in">
            <SectionLabel>Version</SectionLabel>

            {/* Status card */}
            <div
              className="glass"
              style={{
                padding: 22,
                borderRadius: 18,
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 20,
                borderColor: updateStatus?.updateDownloaded
                  ? 'var(--accent)'
                  : 'var(--glass-border)',
                boxShadow: updateStatus?.updateDownloaded
                  ? '0 0 0 1px var(--accent), 0 10px 30px var(--accent-glow)'
                  : undefined,
              }}
            >
              <div>
                <div style={{ fontSize: 14.5, fontWeight: 700 }}>
                  ScriptStash {appVersion ? `v${appVersion}` : ''}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-faint)', marginTop: 3 }}>
                  {updateStatus?.updateDownloaded
                    ? `v${updateStatus.pendingVersion} ready to install`
                    : updateStatus?.updateAvailable
                      ? `v${updateStatus.pendingVersion} downloading…`
                      : "You're up to date"}
                </div>
                {checkResult && (
                  <div
                    style={{
                      fontSize: 12,
                      marginTop: 6,
                      color:
                        checkResult.type === 'error'
                          ? '#ff6b6b'
                          : checkResult.type === 'success'
                            ? 'var(--accent-2)'
                            : 'var(--text-faint)',
                    }}
                  >
                    {checkResult.text}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                {updateStatus?.updateDownloaded && (
                  <button
                    onClick={handleInstall}
                    disabled={installing}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 99,
                      cursor: installing ? 'default' : 'pointer',
                      fontWeight: 700,
                      background: 'var(--accent-gradient)',
                      color: 'var(--on-accent)',
                      border: 'none',
                      boxShadow: '0 6px 22px var(--accent-glow)',
                      fontSize: 13.5,
                      opacity: installing ? 0.7 : 1,
                    }}
                  >
                    {installing ? 'Restarting…' : 'Restart & Install'}
                  </button>
                )}
                {!updateStatus?.updateDownloaded && (
                  <button
                    onClick={handleCheckUpdate}
                    disabled={checking}
                    style={{
                      padding: '10px 20px',
                      borderRadius: 99,
                      cursor: checking ? 'default' : 'pointer',
                      fontWeight: 700,
                      background: 'var(--accent-gradient)',
                      color: 'var(--on-accent)',
                      border: 'none',
                      boxShadow: '0 6px 22px var(--accent-glow)',
                      fontSize: 13.5,
                      opacity: checking ? 0.7 : 1,
                    }}
                  >
                    {checking ? 'Checking…' : 'Check now'}
                  </button>
                )}
              </div>
            </div>

            {/* Changelog */}
            {changelog && (
              <>
                <SectionLabel>Changelog</SectionLabel>
                <div
                  className="glass"
                  style={{
                    padding: '18px 22px',
                    borderRadius: 18,
                    fontSize: 13,
                    lineHeight: 1.65,
                    color: 'var(--text)',
                    maxHeight: 380,
                    overflowY: 'auto',
                  }}
                >
                  <ChangelogRenderer markdown={changelog} />
                </div>
              </>
            )}
          </div>
        )}

        {/* ---- Developer ---- */}
        {section === 'developer' && (
          <div className="fade-in">
            <SectionLabel>Developer Tools</SectionLabel>
            <Group>
              <SettingRow
                label="DevTools"
                desc="Open Chromium developer tools"
                control={
                  <button
                    onClick={() => window.electronAPI?.openDevTools?.()}
                    style={{
                      padding: '8px 15px',
                      borderRadius: 99,
                      cursor: 'pointer',
                      background: 'var(--glass-strong)',
                      border: '1px solid var(--glass-border-bright)',
                      color: 'var(--text)',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Open
                  </button>
                }
              />
              <SettingRow
                label="Clear API cache"
                desc="Forces fresh data on next load"
                last
                control={
                  <button
                    onClick={() => {
                      window.electronAPI?.clearCache?.()
                      addToast('Cache cleared', 'success')
                    }}
                    style={{
                      padding: '8px 15px',
                      borderRadius: 99,
                      cursor: 'pointer',
                      background: 'var(--glass-strong)',
                      border: '1px solid var(--glass-border-bright)',
                      color: 'var(--text)',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Clear
                  </button>
                }
              />
            </Group>
          </div>
        )}

        {/* ---- Credits ---- */}
        {section === 'credits' && (
          <div className="credits fade-in">
            <div className="credits-hero">
              <img
                className="credits-logo"
                src={`${import.meta.env.BASE_URL}favicon.svg`}
                alt="ScriptStash"
              />
              <div className="credits-title">ScriptStash</div>
              <p className="credits-tagline">
                A native desktop browser and downloader for script communities.
              </p>
              {appVersion && <span className="credits-version">v{appVersion}</span>}
            </div>

            <SectionLabel>Contributors</SectionLabel>
            <div className="credits-people">
              {CONTRIBUTORS.map(c => (
                <a
                  key={c.username}
                  className="credits-person"
                  href={c.github}
                  target="_blank"
                  rel="noreferrer"
                >
                  <img className="credits-avatar" src={c.avatar} alt={c.username} />
                  <div className="credits-person-info">
                    <div className="credits-person-name">{c.username}</div>
                    <div className="credits-person-role">{c.role}</div>
                  </div>
                  <span className="credits-person-link">
                    <Icon name="external" size={17} />
                  </span>
                </a>
              ))}
            </div>

            <SectionLabel>Built with</SectionLabel>
            <div className="credits-chips">
              {[
                'Electron',
                'React',
                'Vite',
                'axios',
                'yt-dlp-wrap',
                'electron-store',
                'date-fns',
              ].map(name => (
                <span key={name} className="credits-chip">
                  <span className="credits-chip-name">{name}</span>
                  <span className="credits-chip-license">MIT</span>
                </span>
              ))}
            </div>

            <SectionLabel>Legal</SectionLabel>
            <div className="credits-legal">
              <div className="credits-legal-head">
                <Icon name="eye" size={15} />
                Disclaimer
              </div>
              <p>
                ScriptStash is an independent third-party application and is not affiliated with,
                endorsed by, or associated with EroScripts or Discourse. Use of this app is subject
                to the terms of service of the communities you access through it.
              </p>
              <p>
                ScriptStash does not host, store, or distribute any content. All content is fetched
                directly from third-party sources. You are solely responsible for ensuring that your
                use of this application complies with the laws of your country or jurisdiction. The
                developers of ScriptStash accept no liability for content accessed through this app.
              </p>
            </div>

            <div className="credits-footer">
              Made with <Icon name="heart" size={13} className="credits-heart" /> for the community
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
