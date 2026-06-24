import { useState, useEffect, useCallback } from 'react'
import Icon from '../design-system/components/Icon'
import Skeleton from '../design-system/components/Skeleton'

function parseFunscript(text) {
  const file = JSON.parse(text)
  if (!Array.isArray(file.actions)) throw new Error('no actions array')
  return {
    actions: file.actions
      .filter(a => typeof a.at === 'number' && a.at >= 0)
      .map(a => ({ at: Math.round(a.at), pos: Math.max(0, Math.min(99, Math.round(a.pos ?? 0))) }))
      .sort((a, b) => a.at - b.at),
  }
}

function PairCard({ pair, onOpen }) {
  const hasVideo = !!pair.video
  const hasScript = !!pair.funscript

  return (
    <button
      onClick={() => onOpen(pair)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: 16,
        border: '1px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.04)',
        cursor: 'pointer',
        gap: 8,
        transition: 'border-color 0.15s, background 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--glass-border-bright)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--glass-border)'
        e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
      }}
    >
      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', wordBreak: 'break-word' }}>
        {pair.title}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 99,
            background: hasVideo ? 'rgba(108,142,255,0.15)' : 'rgba(255,255,255,0.05)',
            color: hasVideo ? '#6c8eff' : 'var(--text-faint)',
            border: `1px solid ${hasVideo ? 'rgba(108,142,255,0.3)' : 'var(--glass-border)'}`,
          }}
        >
          {hasVideo ? '▶ Video' : 'No video'}
        </span>
        <span
          style={{
            fontSize: 10.5,
            fontWeight: 700,
            padding: '2px 8px',
            borderRadius: 99,
            background: hasScript ? 'rgba(59,224,160,0.12)' : 'rgba(255,255,255,0.05)',
            color: hasScript ? 'var(--green)' : 'var(--text-faint)',
            border: `1px solid ${hasScript ? 'rgba(59,224,160,0.25)' : 'var(--glass-border)'}`,
          }}
        >
          {hasScript ? '✓ Script' : 'No script'}
        </span>
      </div>
    </button>
  )
}

export default function LibraryView({ navigateTo }) {
  const [pairs, setPairs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name')

  const reload = useCallback(() => {
    setLoading(true)
    window.electronAPI
      ?.scanLibrary?.()
      .then(r => {
        if (r?.success) setPairs(r.data || [])
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const filtered = pairs
    .filter(p => p.title.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => {
      if (sort === 'name') return a.title.localeCompare(b.title)
      const hasBothA = a.video && a.funscript ? 0 : 1
      const hasBothB = b.video && b.funscript ? 0 : 1
      return hasBothA - hasBothB || a.title.localeCompare(b.title)
    })

  const openLocalPair = async pair => {
    let videoSrc = null
    let actions = []

    if (pair.video) {
      videoSrc = `localfile://${pair.video.replace(/\\/g, '/')}`
    }
    if (pair.funscript) {
      try {
        const text = await window.electronAPI?.readLocalFile?.(pair.funscript)
        if (text) actions = parseFunscript(text).actions
      } catch {}
    }

    navigateTo('player', {
      topic: null,
      localFile: { videoSrc, actions, title: pair.title },
    })
  }

  const handlePickFile = async type => {
    const isVideo = type === 'video'
    const filters = isVideo
      ? [{ name: 'Video Files', extensions: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'm4v'] }]
      : [{ name: 'Funscript', extensions: ['funscript'] }]

    const res = await window.electronAPI?.pickLocalFile?.(filters)
    if (!res?.success) return

    const filePath = res.data
    const basename = filePath.slice(
      Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\')) + 1,
      filePath.lastIndexOf('.')
    )
    const dir = filePath.slice(0, Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\')))

    // Auto-find companion: funscript → try .mp4 first (player handles not-found gracefully)
    const companionPath = isVideo
      ? `${dir}/${basename}.funscript`
      : `${dir}/${basename}.mp4`

    const videoFilePath = isVideo ? filePath : companionPath
    const scriptFilePath = isVideo ? companionPath : filePath

    let videoSrc = null
    let actions = []

    if (videoFilePath) {
      videoSrc = `localfile://${videoFilePath.replace(/\\/g, '/')}`
    }
    if (scriptFilePath) {
      try {
        const text = await window.electronAPI?.readLocalFile?.(scriptFilePath)
        if (text) actions = parseFunscript(text).actions
      } catch {}
    }

    navigateTo('player', {
      topic: null,
      localFile: { videoSrc, actions, title: basename },
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '22px 28px 0',
          flexShrink: 0,
        }}
      >
        <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-faint)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 6 }}>
          Local library
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 }}>
          <h1 style={{ fontSize: 28, fontWeight: 700, color: 'var(--text)', margin: 0 }}>Script Player</h1>
          <button
            onClick={reload}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-faint)', cursor: 'pointer', padding: 6 }}
            title="Refresh library"
          >
            <Icon name="arrowUp" size={16} />
          </button>
        </div>

        {/* Open local file buttons */}
        <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
          <button
            onClick={() => handlePickFile('video')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'rgba(108,142,255,0.1)',
              color: '#6c8eff',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            <Icon name="play" size={14} /> Open video file
          </button>
          <button
            onClick={() => handlePickFile('funscript')}
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              background: 'rgba(59,224,160,0.1)',
              color: 'var(--green)',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
            }}
          >
            <Icon name="file" size={14} /> Open funscript
          </button>
        </div>

        {/* Search + sort */}
        <div style={{ display: 'flex', gap: 9, marginBottom: 18 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search library…"
            className="glass"
            style={{
              flex: 1,
              padding: '10px 14px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              color: 'var(--text)',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
          />
          <select
            value={sort}
            onChange={e => setSort(e.target.value)}
            className="glass"
            style={{
              padding: '10px 12px',
              borderRadius: 12,
              border: '1px solid var(--glass-border)',
              color: 'var(--text)',
              fontSize: 13,
              fontFamily: 'inherit',
              background: 'var(--glass)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="name">Name</option>
            <option value="paired">Paired first</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 28px 28px' }}>
        {loading ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} height={90} radius={16} />)}
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ textAlign: 'center', color: 'var(--text-faint)', padding: '60px 0', fontSize: 14 }}>
            {search ? `No results for "${search}"` : 'No scripts found in your download folder.'}
            {!search && (
              <div style={{ marginTop: 8, fontSize: 12.5 }}>
                Download scripts from the catalogue to see them here.
              </div>
            )}
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {filtered.map((pair, i) => (
              <PairCard key={`${pair.dir}-${pair.title}-${i}`} pair={pair} onOpen={openLocalPair} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
