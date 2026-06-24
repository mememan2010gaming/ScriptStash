import { useState, useEffect, useCallback, useRef } from 'react'
import Icon from '../design-system/components/Icon'

// Session-level cache so thumbnails survive sort/search changes without re-extracting
const thumbCache = new Map()

// Build a safe localfile:/// URL.
// Double-slash URLs (localfile://F:/path) make the URL parser treat "F" as the
// hostname. Triple-slash puts the full path in pathname where it belongs.
// encodeURIComponent handles spaces, brackets, apostrophes, etc.
function toLocalUrl(absPath) {
  const encoded = absPath
    .replace(/\\/g, '/')
    .split('/')
    .map(seg => encodeURIComponent(seg))
    .join('/')
    // Restore "F:" drive letter — encodeURIComponent turns "F:" into "F%3A"
    .replace(/^([A-Za-z])%3A\//, '$1:/')
  return `localfile:///${encoded}`
}

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

function extractThumbnail(src) {
  if (thumbCache.has(src)) return Promise.resolve(thumbCache.get(src))
  return new Promise(resolve => {
    const video = document.createElement('video')
    video.muted = true
    video.preload = 'metadata'
    video.playsInline = true

    const cleanup = () => {
      video.src = ''
      video.load()
    }
    const bail = () => {
      cleanup()
      thumbCache.set(src, null)
      resolve(null)
    }
    const timer = setTimeout(bail, 10000)

    video.addEventListener('loadedmetadata', () => {
      video.currentTime = Math.min(video.duration * 0.08, 12)
    })

    video.addEventListener('seeked', () => {
      clearTimeout(timer)
      try {
        const w = video.videoWidth
        const h = video.videoHeight
        if (!w || !h) {
          bail()
          return
        }
        const canvas = document.createElement('canvas')
        canvas.width = w
        canvas.height = h
        canvas.getContext('2d').drawImage(video, 0, 0)
        const url = canvas.toDataURL('image/jpeg', 0.72)
        thumbCache.set(src, url)
        cleanup()
        resolve(url)
      } catch {
        bail()
      }
    })

    video.addEventListener('error', () => {
      clearTimeout(timer)
      bail()
    })
    video.src = src
  })
}

function Heatmap({ data }) {
  if (!data || !data.length) return null
  const max = Math.max(...data, 1)
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'flex-end',
        gap: 1,
        height: 28,
        padding: '0 6px 4px',
      }}
    >
      {data.map((v, i) => (
        <div
          key={i}
          style={{
            flex: 1,
            height: `${Math.max(6, (v / max) * 100)}%`,
            borderRadius: 1.5,
            background: `hsl(${150 + (v / 100) * 50}, 65%, 58%)`,
            opacity: 0.85,
          }}
        />
      ))}
    </div>
  )
}

function PairCard({ pair, onOpen }) {
  const hasVideo = !!pair.video
  const hasScript = !!pair.funscript
  const videoSrc = hasVideo ? toLocalUrl(pair.video) : null

  const [thumb, setThumb] = useState(() => (videoSrc ? (thumbCache.get(videoSrc) ?? null) : null))
  const cardRef = useRef(null)

  useEffect(() => {
    if (!videoSrc || thumb !== null || thumbCache.has(videoSrc)) {
      if (thumbCache.has(videoSrc)) setThumb(thumbCache.get(videoSrc))
      return
    }

    let cancelled = false
    const obs = new IntersectionObserver(
      entries => {
        if (!entries[0].isIntersecting) return
        obs.disconnect()
        extractThumbnail(videoSrc).then(url => {
          if (!cancelled) setThumb(url)
        })
      },
      { rootMargin: '300px' }
    )
    if (cardRef.current) obs.observe(cardRef.current)
    return () => {
      cancelled = true
      obs.disconnect()
    }
  }, [videoSrc]) // eslint-disable-line

  // Derive a deterministic hue for the placeholder gradient
  const hue = pair.title.split('').reduce((acc, c) => acc + c.charCodeAt(0), 0) % 360

  return (
    <button
      ref={cardRef}
      onClick={() => onOpen(pair)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        textAlign: 'left',
        padding: 0,
        borderRadius: 16,
        border: '1px solid var(--glass-border)',
        background: 'rgba(255,255,255,0.04)',
        cursor: 'pointer',
        overflow: 'hidden',
        transition: 'border-color 0.15s, transform 0.15s',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = 'var(--glass-border-bright)'
        e.currentTarget.style.transform = 'translateY(-3px)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--glass-border)'
        e.currentTarget.style.transform = 'none'
      }}
    >
      {/* Thumbnail banner */}
      <div
        style={{
          height: 110,
          position: 'relative',
          overflow: 'hidden',
          flexShrink: 0,
          background: `linear-gradient(135deg, hsl(${hue},40%,18%), hsl(${(hue + 45) % 360},35%,12%))`,
        }}
      >
        {thumb && (
          <img
            src={thumb}
            alt=""
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        )}
        {/* Bottom fade for heatmap readability */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(8,5,10,0.80) 0%, transparent 55%)',
          }}
        />
        <Heatmap data={pair.heatmap} />
      </div>

      {/* Body */}
      <div style={{ padding: '10px 13px 11px', display: 'flex', flexDirection: 'column', gap: 7 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1.35,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            minHeight: 35,
          }}
        >
          {pair.title}
        </div>

        <div style={{ display: 'flex', gap: 5 }}>
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
      </div>
    </button>
  )
}

export default function LibraryView({ navigateTo }) {
  const [pairs, setPairs] = useState([])
  const [scanning, setScanning] = useState(true)
  const [scanCount, setScanCount] = useState(0)
  const [fromCache, setFromCache] = useState(false)
  const [search, setSearch] = useState('')
  const [sort, setSort] = useState('name')
  const [libraryPath, setLibraryPath] = useState('')
  const mountedRef = useRef(true)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      window.electronAPI?.offLibraryScan?.()
    }
  }, [])

  const startScan = useCallback((forceRescan = false) => {
    window.electronAPI?.offLibraryScan?.()
    if (!forceRescan) setScanning(true)
    setScanCount(0)

    window.electronAPI?.onLibraryScanProgress?.(({ count }) => {
      if (mountedRef.current) setScanCount(count)
    })

    window.electronAPI?.onLibraryScanComplete?.(({ pairs: fresh }) => {
      if (!mountedRef.current) return
      setPairs(fresh)
      setScanning(false)
      setScanCount(fresh.length)
    })

    window.electronAPI
      ?.scanLibrary?.({ forceRescan })
      .then(r => {
        if (!mountedRef.current) return
        if (r?.success && r.data) {
          setPairs(r.data)
          if (r.fromCache) {
            setFromCache(true)
            setScanning(false)
            setScanCount(r.data.length)
          } else {
            setScanning(false)
            setFromCache(false)
          }
        } else {
          setScanning(false)
        }
      })
      .catch(() => {
        if (mountedRef.current) setScanning(false)
      })
  }, [])

  useEffect(() => {
    window.electronAPI?.getLibraryPath?.().then(r => {
      if (r?.success) setLibraryPath(r.data)
    })
    startScan(false)
  }, [startScan])

  const handleChangePath = async () => {
    const r = await window.electronAPI?.setLibraryPath?.()
    if (r?.success) {
      setLibraryPath(r.data)
      setPairs([])
      thumbCache.clear()
      startScan(true)
    }
  }

  const handleForceRescan = () => {
    setPairs([])
    startScan(true)
  }

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
    if (pair.video) videoSrc = toLocalUrl(pair.video)
    if (pair.funscript) {
      try {
        const r = await window.electronAPI?.readLocalFile?.(pair.funscript)
        if (r?.success) actions = parseFunscript(r.data).actions
      } catch {}
    }
    navigateTo('player', { topic: null, localFile: { videoSrc, actions, title: pair.title } })
  }

  const handlePickFile = async type => {
    const isVideo = type === 'video'
    const filters = isVideo
      ? [{ name: 'Video Files', extensions: ['mp4', 'mkv', 'webm', 'avi', 'mov', 'm4v'] }]
      : [{ name: 'Funscript', extensions: ['funscript'] }]

    const res = await window.electronAPI?.pickLocalFile?.(filters)
    if (!res?.success) return

    const filePath = res.data
    const sep = filePath.includes('\\') ? '\\' : '/'
    const lastSep = Math.max(filePath.lastIndexOf('/'), filePath.lastIndexOf('\\'))
    const lastDot = filePath.lastIndexOf('.')
    const basename = filePath.slice(lastSep + 1, lastDot)
    const dir = filePath.slice(0, lastSep)
    const companionPath = isVideo
      ? `${dir}${sep}${basename}.funscript`
      : `${dir}${sep}${basename}.mp4`

    const videoFilePath = isVideo ? filePath : companionPath
    const scriptFilePath = isVideo ? companionPath : filePath

    let videoSrc = null
    let actions = []
    if (videoFilePath) videoSrc = toLocalUrl(videoFilePath)
    if (scriptFilePath) {
      try {
        const r = await window.electronAPI?.readLocalFile?.(scriptFilePath)
        if (r?.success) actions = parseFunscript(r.data).actions
      } catch {}
    }

    navigateTo('player', { topic: null, localFile: { videoSrc, actions, title: basename } })
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '20px 26px 0', flexShrink: 0 }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: 'var(--text-faint)',
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            marginBottom: 4,
          }}
        >
          Local library
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 14,
          }}
        >
          <h1 style={{ fontSize: 26, fontWeight: 700, color: 'var(--text)', margin: 0 }}>
            Script Player
          </h1>
          <button
            onClick={handleForceRescan}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-faint)',
              cursor: 'pointer',
              padding: 6,
              borderRadius: 8,
            }}
            title="Rescan library"
          >
            <Icon name="arrowUp" size={16} />
          </button>
        </div>

        {/* Library path */}
        <button
          onClick={handleChangePath}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            width: '100%',
            marginBottom: 14,
            padding: '8px 12px',
            borderRadius: 10,
            border: '1px solid var(--glass-border)',
            background: 'rgba(255,255,255,0.03)',
            cursor: 'pointer',
            textAlign: 'left',
          }}
        >
          <Icon name="folder" size={14} style={{ color: 'var(--text-faint)', flexShrink: 0 }} />
          <span
            style={{
              fontSize: 12,
              color: 'var(--text-faint)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              flex: 1,
              minWidth: 0,
            }}
          >
            {libraryPath || 'Loading…'}
          </span>
          <span style={{ fontSize: 11, color: 'var(--accent)', fontWeight: 700, flexShrink: 0 }}>
            Change
          </span>
        </button>

        {/* Scan progress bar */}
        {scanning && (
          <div style={{ marginBottom: 14 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 11.5,
                color: 'var(--text-faint)',
                marginBottom: 5,
              }}
            >
              <span>{fromCache ? 'Refreshing in background…' : 'Scanning library…'}</span>
              <span className="num">{scanCount} found</span>
            </div>
            <div
              style={{
                height: 3,
                borderRadius: 2,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '40%',
                  background: 'var(--accent)',
                  borderRadius: 2,
                  animation: 'shimmer 1.4s ease-in-out infinite',
                }}
              />
            </div>
          </div>
        )}

        {/* Open file buttons */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <button
            onClick={() => handlePickFile('video')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 11,
              border: '1px solid var(--glass-border)',
              background: 'rgba(108,142,255,0.1)',
              color: '#6c8eff',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Icon name="play" size={13} /> Open video
          </button>
          <button
            onClick={() => handlePickFile('funscript')}
            style={{
              flex: 1,
              padding: '9px 12px',
              borderRadius: 11,
              border: '1px solid var(--glass-border)',
              background: 'rgba(59,224,160,0.1)',
              color: 'var(--green)',
              fontWeight: 700,
              fontSize: 12.5,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 6,
            }}
          >
            <Icon name="file" size={13} /> Open funscript
          </button>
        </div>

        {/* Search + sort */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder={`Search ${pairs.length} scripts…`}
            className="glass"
            style={{
              flex: 1,
              padding: '9px 13px',
              borderRadius: 11,
              border: '1px solid var(--glass-border)',
              color: 'var(--text)',
              fontSize: 13.5,
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
              padding: '9px 11px',
              borderRadius: 11,
              border: '1px solid var(--glass-border)',
              color: 'var(--text)',
              fontSize: 12.5,
              fontFamily: 'inherit',
              background: 'var(--glass)',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="name">A–Z</option>
            <option value="paired">Paired first</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div style={{ flex: 1, overflow: 'auto', padding: '0 26px 26px' }}>
        {!scanning && filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              color: 'var(--text-faint)',
              padding: '60px 0',
              fontSize: 14,
            }}
          >
            {search ? `No results for "${search}"` : 'No scripts found in this folder.'}
            {!search && (
              <div style={{ marginTop: 8, fontSize: 12.5 }}>
                Download scripts from the catalogue, or change the library folder above.
              </div>
            )}
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))',
              gap: 10,
            }}
          >
            {filtered.map((pair, i) => (
              <PairCard key={`${pair.dir}-${pair.title}-${i}`} pair={pair} onOpen={openLocalPair} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
