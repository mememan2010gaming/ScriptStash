import { useState, useEffect, useRef, useCallback } from 'react'
import { animate, stagger } from 'animejs'
import Icon from '../design-system/components/Icon'
import Skeleton from '../design-system/components/Skeleton'
import Segmented from '../design-system/components/Segmented'
import { useTheme } from '../contexts/ThemeContext'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

// Persists scroll positions across category/tab switches without prop-drilling
const scrollPositions = {}

function fmtNum(n) {
  if (!n) return null
  if (n >= 1000000) return `${(n / 1000000).toFixed(1).replace(/\.0$/, '')}m`
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, '')}k`
  return String(n)
}

function fmtRelDate(iso) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const s = Math.floor(diff / 1000)
  if (s < 60) return 'just now'
  const m = Math.floor(s / 60)
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 30) return `${d}d ago`
  const mo = Math.floor(d / 30)
  if (mo < 12) return `${mo}mo ago`
  return `${Math.floor(mo / 12)}y ago`
}

const TABS = [
  { id: 'latest', label: 'Latest' },
  { id: 'top', label: 'Top' },
]

function useLiquidGlass() {
  const ref = useRef(null)
  const onMove = useCallback(e => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
  }, [])
  return { ref, onMouseMove: onMove }
}

function TagPill({ label, style: extraStyle }) {
  return (
    <span
      style={{
        fontSize: 10,
        fontWeight: 700,
        padding: '2px 7px',
        borderRadius: 99,
        textTransform: 'uppercase',
        letterSpacing: '0.03em',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        background: 'var(--glass-active)',
        border: '1px solid var(--glass-border)',
        color: 'var(--text-muted)',
        ...extraStyle,
      }}
    >
      {label}
    </span>
  )
}

function StatRow({ topic, size = 13, gap = 14 }) {
  return (
    <div
      style={{
        display: 'flex',
        gap,
        fontSize: size,
        color: 'var(--text-faint)',
        alignItems: 'center',
      }}
    >
      {topic.views > 0 && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="eye" size={size} />
          <span className="num">{fmtNum(topic.views)}</span>
        </span>
      )}
      {topic.postsCount > 0 && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="chat" size={size} />
          <span className="num">{fmtNum(topic.postsCount)}</span>
        </span>
      )}
      {topic.likeCount > 0 && (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
          <Icon name="heart" size={size} />
          <span className="num">{fmtNum(topic.likeCount)}</span>
        </span>
      )}
    </div>
  )
}

function TopicCard({ topic, navigateTo }) {
  const liquid = useLiquidGlass()
  const [hover, setHover] = useState(false)
  const { density } = useTheme()
  const hue = topic.hue ?? topic.id % 360

  const tags = (topic.tags || [])
    .map(tag => (typeof tag === 'string' ? tag : (tag?.name ?? '')))
    .filter(Boolean)

  // ── Mosaic (tile grid) ──────────────────────────────────────────────────────
  if (density === 'mosaic') {
    return (
      <button
        {...liquid}
        onClick={() => navigateTo('detail', { topicId: topic.id })}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="glass glass-sheen"
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          textAlign: 'left',
          padding: 0,
          cursor: 'pointer',
          borderRadius: 20,
          overflow: 'hidden',
          transform: hover ? 'translateY(-4px)' : 'none',
          borderColor: hover ? 'var(--glass-border-bright)' : 'var(--glass-border)',
          boxShadow: hover
            ? 'var(--shadow-lg), 0 0 0 1px var(--glass-border)'
            : 'var(--glass-shadow)',
          transition: 'transform var(--t), border-color var(--t), box-shadow var(--t)',
        }}
      >
        <div
          style={{
            height: 148,
            position: 'relative',
            overflow: 'hidden',
            flexShrink: 0,
            background: `linear-gradient(135deg, hsl(${hue},45%,22%), hsl(${(hue + 50) % 360},40%,14%))`,
          }}
        >
          {topic.thumbnail && (
            <img
              src={topic.thumbnail}
              alt=""
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transform: hover ? 'scale(1.06)' : 'scale(1)',
                transition: 'transform var(--t-slow)',
              }}
            />
          )}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: 'linear-gradient(to top, rgba(10,7,10,0.85) 0%, transparent 55%)',
            }}
          />
          {tags.length > 0 && (
            <div
              style={{
                position: 'absolute',
                bottom: 9,
                left: 11,
                right: 11,
                display: 'flex',
                gap: 5,
                flexWrap: 'nowrap',
                overflow: 'hidden',
              }}
            >
              {tags.slice(0, 2).map(label => (
                <span
                  key={label}
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    padding: '3px 8px',
                    borderRadius: 99,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                    flex: '0 1 auto',
                    minWidth: 0,
                    maxWidth: 'calc(50% - 3px)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    background: 'rgba(0,0,0,0.55)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.16)',
                    color: 'rgba(255,255,255,0.9)',
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            padding: '14px 15px 15px',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 11,
          }}
        >
          <div
            style={{
              fontSize: 14.5,
              fontWeight: 700,
              lineHeight: 1.4,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              minHeight: 40,
            }}
          >
            {topic.title}
          </div>
          {topic.author && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              {topic.author.avatar && (
                <img
                  src={topic.author.avatar}
                  alt=""
                  referrerPolicy="no-referrer"
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '1px solid var(--glass-border)',
                  }}
                />
              )}
              <span
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {topic.author.username}
              </span>
            </div>
          )}
          {(topic.createdAt || topic.lastPostedAt) && (
            <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-faint)' }}>
              {topic.createdAt && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Icon name="calendar" size={11} />
                  {fmtRelDate(topic.createdAt)}
                </span>
              )}
              {topic.lastPostedAt && topic.lastPostedAt !== topic.createdAt && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <Icon name="clock" size={11} />
                  {fmtRelDate(topic.lastPostedAt)}
                </span>
              )}
            </div>
          )}
          <div
            style={{
              marginTop: 'auto',
              paddingTop: 3,
              borderTop: '1px solid var(--glass-border)',
            }}
          >
            <StatRow topic={topic} size={11.5} gap={14} />
          </div>
        </div>
      </button>
    )
  }

  // ── List (EroScripts-style wide row) ────────────────────────────────────────
  if (density === 'list') {
    return (
      <button
        {...liquid}
        onClick={() => navigateTo('detail', { topicId: topic.id })}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        className="glass glass-sheen"
        style={{
          display: 'flex',
          flexDirection: 'row',
          width: '100%',
          textAlign: 'left',
          padding: 0,
          cursor: 'pointer',
          borderRadius: 16,
          overflow: 'hidden',
          transform: hover ? 'translateY(-2px)' : 'none',
          borderColor: hover ? 'var(--glass-border-bright)' : 'var(--glass-border)',
          boxShadow: hover ? 'var(--shadow-lg)' : 'var(--glass-shadow)',
          transition: 'transform var(--t), border-color var(--t), box-shadow var(--t)',
        }}
      >
        {/* Thumbnail */}
        <div
          style={{
            width: 220,
            flexShrink: 0,
            position: 'relative',
            overflow: 'hidden',
            background: `linear-gradient(135deg, hsl(${hue},45%,22%), hsl(${(hue + 50) % 360},40%,14%))`,
          }}
        >
          {topic.thumbnail && (
            <img
              src={topic.thumbnail}
              alt=""
              loading="lazy"
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                display: 'block',
                transform: hover ? 'scale(1.04)' : 'scale(1)',
                transition: 'transform var(--t-slow)',
              }}
            />
          )}
        </div>

        {/* Content */}
        <div
          style={{
            flex: 1,
            minWidth: 0,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <div
            style={{
              fontSize: 15,
              fontWeight: 700,
              lineHeight: 1.4,
              color: 'var(--text)',
              letterSpacing: '-0.01em',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {topic.title}
          </div>

          {tags.length > 0 && (
            <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap' }}>
              {tags.slice(0, 4).map(label => (
                <TagPill key={label} label={label} />
              ))}
            </div>
          )}

          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
              }}
            >
              {topic.author && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {topic.author.avatar && (
                    <img
                      src={topic.author.avatar}
                      alt=""
                      referrerPolicy="no-referrer"
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: '50%',
                        objectFit: 'cover',
                        border: '1px solid var(--glass-border)',
                      }}
                    />
                  )}
                  <span
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {topic.author.username}
                  </span>
                </div>
              )}
              <StatRow topic={topic} size={12} gap={12} />
            </div>
            {(topic.createdAt || topic.lastPostedAt) && (
              <div style={{ display: 'flex', gap: 10, fontSize: 11, color: 'var(--text-faint)' }}>
                {topic.createdAt && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Icon name="calendar" size={11} />
                    {fmtRelDate(topic.createdAt)}
                  </span>
                )}
                {topic.lastPostedAt && topic.lastPostedAt !== topic.createdAt && (
                  <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <Icon name="clock" size={11} />
                    {fmtRelDate(topic.lastPostedAt)}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>
      </button>
    )
  }

  // ── Compact (small thumbnail + tight row) ───────────────────────────────────
  return (
    <button
      {...liquid}
      onClick={() => navigateTo('detail', { topicId: topic.id })}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      className="glass glass-sheen"
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
        textAlign: 'left',
        padding: 0,
        cursor: 'pointer',
        borderRadius: 12,
        overflow: 'hidden',
        transform: hover ? 'translateY(-1px)' : 'none',
        borderColor: hover ? 'var(--glass-border-bright)' : 'var(--glass-border)',
        boxShadow: hover ? 'var(--shadow-lg)' : 'none',
        transition: 'transform var(--t), border-color var(--t), box-shadow var(--t)',
      }}
    >
      {/* Small thumbnail */}
      <div
        style={{
          width: 96,
          height: 64,
          flexShrink: 0,
          position: 'relative',
          overflow: 'hidden',
          background: `linear-gradient(135deg, hsl(${hue},45%,22%), hsl(${(hue + 50) % 360},40%,14%))`,
        }}
      >
        {topic.thumbnail && (
          <img
            src={topic.thumbnail}
            alt=""
            loading="lazy"
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
              transform: hover ? 'scale(1.06)' : 'scale(1)',
              transition: 'transform var(--t-slow)',
            }}
          />
        )}
      </div>

      {/* Content */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          padding: '0 14px',
          display: 'flex',
          flexDirection: 'column',
          gap: 5,
        }}
      >
        <span
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            letterSpacing: '-0.01em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {topic.title}
        </span>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          {tags.slice(0, 2).map(label => (
            <TagPill key={label} label={label} />
          ))}
        </div>
        {(topic.createdAt || topic.lastPostedAt) && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              fontSize: 10.5,
              color: 'var(--text-faint)',
              flexWrap: 'wrap',
            }}
          >
            {topic.createdAt && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Icon name="calendar" size={10.5} />
                {fmtRelDate(topic.createdAt)}
              </span>
            )}
            {topic.lastPostedAt && topic.lastPostedAt !== topic.createdAt && (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <Icon name="clock" size={10.5} />
                {fmtRelDate(topic.lastPostedAt)}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ padding: '0 14px 0 0', flexShrink: 0 }}>
        <StatRow topic={topic} size={11.5} gap={10} />
      </div>
    </button>
  )
}

function CardSkeleton({ density }) {
  if (density === 'list') {
    return (
      <div
        className="glass"
        style={{ borderRadius: 16, overflow: 'hidden', display: 'flex', height: 110 }}
      >
        <Skeleton width={220} height="100%" radius={0} style={{ flexShrink: 0 }} />
        <div
          style={{
            flex: 1,
            padding: '16px 20px',
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          <Skeleton height={15} />
          <Skeleton height={15} width="70%" />
          <Skeleton height={12} width="45%" />
          <Skeleton height={12} width="30%" style={{ marginTop: 'auto' }} />
        </div>
      </div>
    )
  }
  if (density === 'compact') {
    return (
      <div
        className="glass"
        style={{ borderRadius: 12, overflow: 'hidden', display: 'flex', height: 64 }}
      >
        <Skeleton width={96} height={64} radius={0} style={{ flexShrink: 0 }} />
        <div
          style={{
            flex: 1,
            padding: '0 14px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 7,
          }}
        >
          <Skeleton height={13} width="75%" />
          <Skeleton height={11} width="40%" />
        </div>
        <div
          style={{
            padding: '0 14px 0 0',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Skeleton height={11} width={80} />
        </div>
      </div>
    )
  }
  return (
    <div className="glass" style={{ borderRadius: 20, overflow: 'hidden' }}>
      <Skeleton height={132} radius={0} />
      <div style={{ padding: 15, display: 'flex', flexDirection: 'column', gap: 10 }}>
        <Skeleton height={15} />
        <Skeleton height={15} width="65%" />
        <Skeleton height={12} width="40%" />
      </div>
    </div>
  )
}

function ViewHeader({ eyebrow, title, right, children }) {
  return (
    <div
      style={{
        padding: '28px 36px 22px',
        flexShrink: 0,
        borderBottom: '1px solid var(--glass-border)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <div>
          {eyebrow && (
            <div
              style={{
                fontSize: 11.5,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent-2)',
                marginBottom: 6,
              }}
            >
              {eyebrow}
            </div>
          )}
          <h1
            className="display"
            style={{ fontSize: 30, fontWeight: 700, color: 'var(--text)', lineHeight: 1.05 }}
          >
            {title}
          </h1>
        </div>
        {right}
      </div>
      {children}
    </div>
  )
}

function EmptyState({ icon, title, sub }) {
  return (
    <div
      className="fade-in"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '80px 0',
        gap: 14,
        textAlign: 'center',
      }}
    >
      <div
        className="glass"
        style={{
          width: 76,
          height: 76,
          borderRadius: 24,
          display: 'grid',
          placeItems: 'center',
          color: 'var(--accent-2)',
        }}
      >
        <Icon name={icon} size={30} />
      </div>
      <div>
        <div className="display" style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)' }}>
          {title}
        </div>
        {sub && (
          <div style={{ fontSize: 13.5, color: 'var(--text-faint)', marginTop: 5 }}>{sub}</div>
        )}
      </div>
    </div>
  )
}

export default function TopicsView({ category, navigateTo }) {
  const { density } = useTheme()
  const [topics, setTopics] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [tab, setTab] = useState('latest')
  const [search, setSearch] = useState('')
  const [apiQuery, setApiQuery] = useState('') // only set on Enter
  const [searchResults, setSearchResults] = useState(null)
  const [searchLoading, setSearchLoading] = useState(false)
  const [fetchError, setFetchError] = useState(null)
  const gridRef = useRef(null)
  const scrollRef = useRef(null)
  const sentinelRef = useRef(null)
  const seenPages = useRef(new Set())
  const prefetchCache = useRef({}) // key: `${sort}:${page}` → topics[]
  const scrollKey = `${category}:${tab}`
  const restoredScroll = useRef(false)

  const doFetch = useCallback(
    async (p, sort) => {
      const method = category === 'paid' ? 'getPaidTopics' : 'getTopics'
      const res = await window.electronAPI?.[method]?.(p, sort)
      if (!res?.success) throw new Error(res?.error || 'fetch failed')
      return res.data
    },
    [category]
  )

  // Silently prefetch next page, store data, and preload thumbnail images
  const prefetch = useCallback(
    (p, sort) => {
      const key = `${sort}:${p}`
      if (prefetchCache.current[key]) return
      prefetchCache.current[key] = 'pending'
      doFetch(p, sort)
        .then(data => {
          prefetchCache.current[key] = data
          // Preload thumbnail images so they're in browser cache when cards render
          ;(data?.topics || []).forEach(t => {
            if (t.thumbnail) {
              const img = new Image()
              img.src = t.thumbnail
            }
          })
        })
        .catch(() => {
          delete prefetchCache.current[key]
        })
    },
    [doFetch]
  )

  const fetchTopics = useCallback(
    async (p, reset, sort) => {
      reset ? setLoading(true) : setLoadingMore(true)
      try {
        setFetchError(null)
        const key = `${sort}:${p}`
        const cached = prefetchCache.current[key]
        const data = cached && cached !== 'pending' ? cached : await doFetch(p, sort)
        delete prefetchCache.current[key]

        const next = data?.topics || []
        setTopics(prev => (reset ? next : [...prev, ...next]))
        const more = data?.hasMore ?? false
        setHasMore(more)
        setPage(p)

        // Preload current-page thumbnails into browser cache
        next.forEach(t => {
          if (t.thumbnail) {
            const img = new Image()
            img.src = t.thumbnail
          }
        })

        // Kick off next-page prefetch immediately
        if (more) prefetch(p + 1, sort)
      } catch (e) {
        console.error('Failed to load topics:', e)
        setFetchError(e.message || 'Failed to load scripts')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [category, doFetch, prefetch]
  )

  // Save scroll position when leaving (unmount or key change)
  useEffect(() => {
    restoredScroll.current = false
    return () => {
      scrollPositions[scrollKey] = scrollRef.current?.scrollTop ?? 0
    }
  }, [scrollKey])

  // Restore scroll position after topics finish loading (container has content by then)
  useEffect(() => {
    if (loading || restoredScroll.current || !scrollRef.current) return
    restoredScroll.current = true
    const saved = scrollPositions[scrollKey]
    if (saved != null) scrollRef.current.scrollTop = saved
  }, [loading, scrollKey])

  useEffect(() => {
    seenPages.current.clear()
    prefetchCache.current = {}
    setTopics([])
    setPage(0)
    setHasMore(true)
    setSearch('')
    setApiQuery('')
    setSearchResults(null)
    fetchTopics(0, true, tab)
  }, [category, tab])

  // Parse negative tags from search string: (-foo) or -foo tokens
  const parseSearch = raw => {
    const negTags = []
    const cleaned = raw
      .replace(/\(-([^)]+)\)|-([^\s]+)/g, (_, a, b) => {
        negTags.push((a || b).toLowerCase())
        return ''
      })
      .replace(/\s+/g, ' ')
      .trim()
    return { query: cleaned, negTags }
  }

  const { query: cleanQuery, negTags } = parseSearch(search)

  // Clear API results when input is fully cleared
  useEffect(() => {
    if (!search.trim()) {
      setApiQuery('')
      setSearchResults(null)
    }
  }, [search])

  // Fire API search only when apiQuery changes (set by Enter key)
  useEffect(() => {
    if (!apiQuery) return
    setSearchLoading(true)
    window.electronAPI
      ?.searchTopics?.(apiQuery, 0)
      .then(res => {
        if (res?.success) setSearchResults(res.data?.topics || [])
      })
      .catch(() => {})
      .finally(() => setSearchLoading(false))
  }, [apiQuery])

  useEffect(() => {
    if (!sentinelRef.current) return
    const obs = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore && !search.trim())
          fetchTopics(page + 1, false, tab)
      },
      { rootMargin: '400px' }
    )
    obs.observe(sentinelRef.current)
    return () => obs.disconnect()
  }, [hasMore, loading, loadingMore, page, tab, fetchTopics, search])

  // Instant local filter against loaded topics (title match) while no API results yet
  const localFiltered = cleanQuery
    ? topics.filter(t => t.title.toLowerCase().includes(cleanQuery.toLowerCase()))
    : topics

  const baseList = searchResults ?? (cleanQuery ? localFiltered : topics)
  const filtered =
    negTags.length === 0
      ? baseList
      : baseList.filter(t => {
          const topicTags = (t.tags || []).map(tag =>
            (typeof tag === 'string' ? tag : (tag?.name ?? '')).toLowerCase()
          )
          return !negTags.some(neg => topicTags.includes(neg))
        })

  // Staggered entrance for new cards (transform-only, never gates visibility)
  useEffect(() => {
    if (loading || reduceMotion || !gridRef.current) return
    const fresh = [...gridRef.current.querySelectorAll('[data-card]')].filter(c => !c.dataset.seen)
    fresh.forEach(c => (c.dataset.seen = '1'))
    if (fresh.length) {
      animate(fresh, {
        opacity: [0, 1],
        translateY: [22, 0],
        delay: stagger(42),
        duration: 540,
        ease: 'outExpo',
      })
    }
  }, [topics.length, loading])

  const title = category === 'paid' ? 'Paid Scripts' : 'Free Scripts'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <ViewHeader title={title} right={<Segmented tabs={TABS} value={tab} onChange={setTab} />}>
        <div style={{ marginTop: 18, position: 'relative' }}>
          <span
            style={{
              position: 'absolute',
              left: 16,
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-faint)',
              pointerEvents: 'none',
            }}
          >
            <Icon name="search" size={16} />
          </span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && cleanQuery) setApiQuery(cleanQuery)
              if (e.key === 'Escape') {
                setSearch('')
                setApiQuery('')
                setSearchResults(null)
              }
            }}
            placeholder="Filter or search…"
            className="glass"
            style={{
              width: '100%',
              padding: '13px 16px 13px 44px',
              borderRadius: 14,
              color: 'var(--text)',
              fontSize: 14,
              fontFamily: 'inherit',
              outline: 'none',
              border: '1px solid var(--glass-border)',
            }}
            onFocus={e => (e.target.style.borderColor = 'var(--accent)')}
            onBlur={e => (e.target.style.borderColor = 'var(--glass-border)')}
          />
          {(cleanQuery || searchResults) && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                marginTop: 7,
              }}
            >
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  padding: '2px 8px',
                  borderRadius: 99,
                  background: searchResults ? 'var(--accent-soft)' : 'var(--glass-active)',
                  border: `1px solid ${searchResults ? 'rgba(255,77,121,0.3)' : 'var(--glass-border)'}`,
                  color: searchResults ? 'var(--accent-2)' : 'var(--text-muted)',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                }}
              >
                {searchResults ? 'API search' : 'Local filter · ↵ for full search'}
              </span>
              {searchResults && (
                <button
                  onClick={() => {
                    setSearch('')
                    setApiQuery('')
                    setSearchResults(null)
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-faint)',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontFamily: 'inherit',
                    padding: 0,
                  }}
                >
                  Clear
                </button>
              )}
            </div>
          )}
          {negTags.length > 0 && (
            <div
              style={{
                display: 'flex',
                gap: 5,
                flexWrap: 'wrap',
                marginTop: 8,
              }}
            >
              {negTags.map(tag => (
                <span
                  key={tag}
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    padding: '3px 9px',
                    borderRadius: 99,
                    background: 'rgba(255,93,108,0.15)',
                    border: '1px solid rgba(255,93,108,0.4)',
                    color: 'var(--red)',
                  }}
                >
                  –{tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </ViewHeader>

      <div ref={scrollRef} style={{ flex: 1, overflow: 'auto', padding: '6px 30px 32px' }}>
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns:
                density === 'mosaic' ? 'repeat(auto-fill, minmax(248px, 1fr))' : '1fr',
              gap: density === 'mosaic' ? 18 : density === 'list' ? 6 : 3,
              paddingTop: 24,
            }}
          >
            {Array.from({ length: density === 'mosaic' ? 9 : 12 }).map((_, i) => (
              <CardSkeleton key={i} density={density} />
            ))}
          </div>
        ) : fetchError ? (
          <EmptyState
            icon="search"
            title="Couldn't load scripts"
            sub={
              <span>
                {fetchError}{' '}
                <button
                  onClick={() => fetchTopics(0, true, tab)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--accent-2)',
                    cursor: 'pointer',
                    textDecoration: 'underline',
                    textUnderlineOffset: 3,
                    fontSize: 'inherit',
                    fontFamily: 'inherit',
                    padding: 0,
                  }}
                >
                  Try again
                </button>
              </span>
            }
          />
        ) : filtered.length === 0 && !searchLoading ? (
          <EmptyState
            icon="search"
            title={search ? `Nothing found for "${search}"` : 'No scripts found'}
            sub={search ? 'Try different keywords.' : 'Check back soon.'}
          />
        ) : (
          <div
            ref={gridRef}
            data-density={density}
            style={{
              display: 'grid',
              gridTemplateColumns:
                density === 'mosaic' ? 'repeat(auto-fill, minmax(248px, 1fr))' : '1fr',
              gap: density === 'mosaic' ? 18 : density === 'list' ? 6 : 3,
              paddingTop: 24,
            }}
          >
            {filtered.map(t => (
              <div key={t.id} data-card>
                <TopicCard topic={t} navigateTo={navigateTo} />
              </div>
            ))}
          </div>
        )}

        {loadingMore && (
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 9,
              padding: '24px 0',
              color: 'var(--text-faint)',
              fontSize: 13,
              alignItems: 'center',
            }}
          >
            <span
              style={{
                width: 16,
                height: 16,
                borderRadius: '50%',
                border: '2px solid rgba(255,255,255,0.18)',
                borderTopColor: 'var(--accent)',
                animation: 'spin 0.7s linear infinite',
                display: 'inline-block',
              }}
            />
            Loading more…
          </div>
        )}
        <div ref={sentinelRef} style={{ height: 1 }} />
      </div>
    </div>
  )
}
