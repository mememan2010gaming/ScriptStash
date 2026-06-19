import { useState, useEffect, useRef, useCallback } from 'react'
import { animate, stagger } from 'animejs'
import Icon from '../design-system/components/Icon'
import Skeleton from '../design-system/components/Skeleton'

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

function useLiquidGlass() {
  const ref = useRef(null)
  const onMouseMove = e => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    el.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`)
    el.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`)
  }
  return { ref, onMouseMove }
}

function ResultCard({ topic, navigateTo }) {
  const liquid = useLiquidGlass()
  const [hover, setHover] = useState(false)
  const hue = topic.hue ?? topic.id % 360
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
        transition: 'transform var(--t), border-color var(--t)',
      }}
    >
      <div
        style={{
          height: 130,
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
            background: 'linear-gradient(to top, rgba(10,7,10,0.75) 0%, transparent 55%)',
          }}
        />
      </div>
      <div style={{ padding: '12px 14px 14px', flex: 1 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1.4,
            letterSpacing: '-0.01em',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          {topic.title}
        </div>
        <div style={{ display: 'flex', flexWrap: 'nowrap', gap: 5, overflow: 'hidden' }}>
          {(topic.tags || []).slice(0, 2).map((t, i) => {
            const label = typeof t === 'string' ? t : (t?.name ?? '')
            if (!label) return null
            return (
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
                  background: 'var(--toggle-off)',
                  color: 'var(--text-muted)',
                  border: '1px solid var(--glass-border)',
                }}
              >
                {label}
              </span>
            )
          })}
        </div>
      </div>
    </button>
  )
}

function ResultSkeleton() {
  return (
    <div className="glass" style={{ borderRadius: 20, overflow: 'hidden' }}>
      <Skeleton height={110} radius={0} />
      <div style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Skeleton height={14} />
        <Skeleton height={14} width="70%" />
        <div style={{ display: 'flex', gap: 5 }}>
          <Skeleton height={18} width={55} radius={99} />
          <Skeleton height={18} width={44} radius={99} />
        </div>
      </div>
    </div>
  )
}

export default function SearchView({ navigateTo }) {
  const [q, setQ] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [trendingTags, setTrendingTags] = useState([])
  const [suggestions, setSuggestions] = useState([])
  const [showDropdown, setShowDropdown] = useState(false)
  const gridRef = useRef(null)
  const inputRef = useRef(null)
  const wrapRef = useRef(null)
  const suggestTimer = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
    window.electronAPI
      ?.searchTags?.('')
      .then(r => {
        if (r?.success) setTrendingTags((r.data || []).slice(0, 12).map(t => t.name))
      })
      .catch(() => {})
  }, [])

  // Close dropdown on outside click
  useEffect(() => {
    const handler = e => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) setShowDropdown(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const run = useCallback(async query => {
    if (!query.trim()) {
      setResults(null)
      return
    }
    setShowDropdown(false)
    setLoading(true)
    const r = await window.electronAPI?.searchTopics?.(query)
    const topics = r?.success ? r.data?.topics || r.topics || [] : []
    setResults(topics)
    setLoading(false)
    setTimeout(() => {
      if (!gridRef.current || reduceMotion) return
      const cards = gridRef.current.querySelectorAll('[data-card]')
      if (cards.length)
        animate([...cards], {
          opacity: [0, 1],
          translateY: [22, 0],
          delay: stagger(42),
          duration: 520,
          ease: 'outExpo',
        })
    }, 40)
  }, [])

  const handleChange = e => {
    const val = e.target.value
    setQ(val)
    clearTimeout(suggestTimer.current)
    if (!val.trim()) {
      setSuggestions([])
      setShowDropdown(false)
      return
    }
    suggestTimer.current = setTimeout(async () => {
      const r = await window.electronAPI?.searchTags?.(val.trim()).catch(() => null)
      if (r?.success && r.data?.length) {
        setSuggestions(r.data.slice(0, 8).map(t => t.name))
        setShowDropdown(true)
      } else {
        setShowDropdown(false)
      }
    }, 250)
  }

  const pickSuggestion = tag => {
    setQ(tag)
    setSuggestions([])
    setShowDropdown(false)
    run(tag)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div
        style={{
          padding: '28px 36px 22px',
          flexShrink: 0,
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
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
          Find anything
        </div>
        <h1
          className="display"
          style={{
            fontSize: 30,
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1.05,
            marginBottom: 18,
          }}
        >
          Search
        </h1>

        <div ref={wrapRef} style={{ position: 'relative' }}>
          <form
            onSubmit={e => {
              e.preventDefault()
              run(q)
            }}
          >
            <span
              style={{
                position: 'absolute',
                left: 18,
                top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--accent-2)',
                pointerEvents: 'none',
                zIndex: 1,
              }}
            >
              <Icon name="search" size={19} />
            </span>
            <input
              ref={inputRef}
              value={q}
              onChange={handleChange}
              onFocus={() => {
                if (suggestions.length) setShowDropdown(true)
              }}
              placeholder="Search scripts, authors, tags…"
              className="glass"
              style={{
                width: '100%',
                padding: '16px 18px 16px 50px',
                borderRadius: showDropdown ? '16px 16px 0 0' : 16,
                color: 'var(--text)',
                fontSize: 15.5,
                fontFamily: 'inherit',
                outline: 'none',
                border: '1px solid var(--glass-border)',
                transition: 'border-color var(--t), border-radius var(--t)',
              }}
              onFocus={e => {
                e.target.style.borderColor = 'var(--accent)'
                if (suggestions.length) setShowDropdown(true)
              }}
              onBlur={e => {
                e.target.style.borderColor = showDropdown ? 'var(--accent)' : 'var(--glass-border)'
              }}
            />
          </form>

          {/* Autocomplete dropdown */}
          {showDropdown && suggestions.length > 0 && (
            <div
              className="glass"
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                zIndex: 100,
                borderRadius: '0 0 16px 16px',
                border: '1px solid var(--accent)',
                borderTop: '1px solid var(--glass-border)',
                overflow: 'hidden',
              }}
            >
              {suggestions.map((s, i) => (
                <button
                  key={s}
                  onMouseDown={e => {
                    e.preventDefault()
                    pickSuggestion(s)
                  }}
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '11px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    borderBottom:
                      i < suggestions.length - 1 ? '1px solid var(--glass-border)' : 'none',
                    color: 'var(--text)',
                    fontSize: 14,
                    fontFamily: 'inherit',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--glass-strong)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <span
                    style={{ color: 'var(--text-faint)', display: 'grid', placeItems: 'center' }}
                  >
                    <Icon name="search" size={14} />
                  </span>
                  <span style={{ fontWeight: 600 }}>{s}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Trending tag chips */}
        {!results && (
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 14,
              flexWrap: 'wrap',
              alignItems: 'center',
            }}
          >
            {trendingTags.length === 0
              ? Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} height={30} width={60 + (i % 3) * 15} radius={99} />
                ))
              : trendingTags.map(s => (
                  <button
                    key={s}
                    onClick={() => {
                      setQ(s)
                      run(s)
                    }}
                    className="glass glass-hover"
                    style={{
                      padding: '6px 13px',
                      borderRadius: 99,
                      cursor: 'pointer',
                      fontSize: 12.5,
                      fontWeight: 600,
                      color: 'var(--text-muted)',
                    }}
                  >
                    {s}
                  </button>
                ))}
          </div>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '10px 30px 32px' }}>
        {loading ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))',
              gap: 18,
              paddingTop: 14,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <ResultSkeleton key={i} />
            ))}
          </div>
        ) : results === null ? (
          <div
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
              <Icon name="sparkle" size={30} />
            </div>
            <div>
              <div
                className="display"
                style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)' }}
              >
                Start typing to search
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-faint)', marginTop: 5 }}>
                Or pick a trending tag above.
              </div>
            </div>
          </div>
        ) : results.length === 0 ? (
          <div
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
              <Icon name="search" size={30} />
            </div>
            <div>
              <div
                className="display"
                style={{ fontSize: 19, fontWeight: 700, color: 'var(--text)' }}
              >
                No results for "{q}"
              </div>
              <div style={{ fontSize: 13.5, color: 'var(--text-faint)', marginTop: 5 }}>
                Try a broader term.
              </div>
            </div>
          </div>
        ) : (
          <div
            ref={gridRef}
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(248px, 1fr))',
              gap: 18,
              paddingTop: 14,
            }}
          >
            {results.map(t => (
              <div key={t.id} data-card>
                <ResultCard topic={t} navigateTo={navigateTo} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
