import { useEffect, useRef, useState } from 'react'
import { animate } from 'animejs'
import { useDownloads } from '../contexts/DownloadContext'
import { useNotifications } from '../contexts/NotificationsContext'
import Icon from '../design-system/components/Icon'

const NAV = [
  { id: 'free', view: 'topics', category: 'free', label: 'Free Scripts', icon: 'gift' },
  { id: 'paid', view: 'topics', category: 'paid', label: 'Paid Scripts', icon: 'dollar' },
  { id: 'search', view: 'search', label: 'Search', icon: 'search' },
  { id: 'downloads', view: 'downloads', label: 'Downloads', icon: 'download' },
  { id: 'notifications', view: 'notifications', label: 'Notifications', icon: 'bell' },
  { id: 'library', view: 'library', label: 'Script Player', icon: 'play' },
]

const ITEM_H = 46
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches

export default function Sidebar({ currentView, currentCategory, navigateTo }) {
  const { activeCount } = useDownloads()
  const { unreadCount } = useNotifications() ?? { unreadCount: 0 }
  const [user, setUser] = useState(null)
  const indicatorRef = useRef(null)
  const navRef = useRef(null)
  const prevIndex = useRef(-1)

  useEffect(() => {
    window.electronAPI
      ?.validateSession?.()
      .then(r => {
        if (r?.success && r.data?.isValid) setUser(r.data.user)
      })
      .catch(() => {})
  }, [])

  const isActive = item =>
    item.view === 'topics'
      ? currentView === 'topics' && currentCategory === item.category
      : currentView === item.view

  const activeIndex = NAV.findIndex(isActive)

  useEffect(() => {
    const ind = indicatorRef.current
    if (!ind || !navRef.current) return
    const items = navRef.current.querySelectorAll('[data-nav]')
    if (activeIndex < 0) {
      ind.style.opacity = '0'
      return
    }
    const target = items[activeIndex]?.offsetTop ?? 0
    ind.style.opacity = '1'
    ind.style.transform = `translateY(${target}px)`
    if (prevIndex.current >= 0 && !reduceMotion) {
      animate(ind, { scaleY: [0.72, 1], duration: 460, ease: 'easeOutElastic(1, .7)' })
    }
    prevIndex.current = activeIndex
  }, [activeIndex])

  const navBtn = (item, active) => (
    <button
      key={item.id}
      data-nav
      onClick={() => navigateTo(item.view, item.category ? { category: item.category } : {})}
      style={{
        position: 'relative',
        zIndex: 1,
        width: '100%',
        height: ITEM_H,
        padding: '0 14px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        background: 'transparent',
        border: 'none',
        cursor: 'pointer',
        textAlign: 'left',
        borderRadius: 13,
        color: active ? 'var(--text)' : 'var(--text-muted)',
        fontSize: 14,
        fontWeight: active ? 700 : 500,
        transition: 'color var(--t)',
      }}
      onMouseEnter={e => {
        if (!active) e.currentTarget.style.color = 'var(--text)'
      }}
      onMouseLeave={e => {
        if (!active) e.currentTarget.style.color = 'var(--text-muted)'
      }}
    >
      <span
        style={{
          color: active ? 'var(--accent-2)' : 'inherit',
          display: 'grid',
          placeItems: 'center',
          transition: 'color var(--t)',
          flexShrink: 0,
        }}
      >
        <Icon name={item.icon} size={19} />
      </span>
      <span style={{ flex: 1 }}>{item.label}</span>
      {item.id === 'downloads' && activeCount > 0 && (
        <span
          className="num"
          style={{
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            borderRadius: 99,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700,
            boxShadow: '0 0 10px var(--accent-glow)',
          }}
        >
          {activeCount}
        </span>
      )}
      {item.id === 'notifications' && unreadCount > 0 && (
        <span
          className="num"
          style={{
            background: 'var(--accent)',
            color: 'var(--on-accent)',
            borderRadius: 99,
            padding: '2px 8px',
            fontSize: 11,
            fontWeight: 700,
            boxShadow: '0 0 10px var(--accent-glow)',
          }}
        >
          {unreadCount}
        </span>
      )}
    </button>
  )

  return (
    <aside
      style={{
        width: 'var(--sidebar-width)',
        flexShrink: 0,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 12,
        gap: 12,
        position: 'relative',
        zIndex: 2,
      }}
    >
      {/* User chip */}
      <div
        className="glass glass-sheen"
        style={{ padding: 13, display: 'flex', alignItems: 'center', gap: 11, borderRadius: 18 }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 13,
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
            <Icon name="user" size={18} />
          )}
        </div>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {user?.username || 'Guest'}
          </div>
          <div
            style={{
              fontSize: 11.5,
              color: 'var(--text-faint)',
              marginTop: 1,
            }}
          >
            {user ? 'Logged in' : 'Not logged in'}
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav
        ref={navRef}
        className="glass"
        style={{
          flex: 1,
          padding: 8,
          position: 'relative',
          borderRadius: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {/* Liquid active indicator */}
        <div
          ref={indicatorRef}
          style={{
            position: 'absolute',
            left: 8,
            right: 8,
            top: 0,
            height: ITEM_H,
            borderRadius: 13,
            zIndex: 0,
            background: 'var(--accent-soft)',
            border: '1px solid rgba(255,77,121,0.3)',
            boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.12), 0 4px 18px rgba(255,77,121,0.18)',
            transformOrigin: 'center',
            opacity: 0,
            transition: 'transform 460ms cubic-bezier(0.22,1,0.36,1)',
          }}
        />
        {NAV.map(item => navBtn(item, isActive(item)))}
      </nav>

      {/* Settings pinned */}
      <button
        onClick={() => navigateTo('settings')}
        className="glass glass-hover"
        style={{
          height: ITEM_H,
          padding: '0 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
          borderRadius: 16,
          cursor: 'pointer',
          color: currentView === 'settings' ? 'var(--text)' : 'var(--text-muted)',
          fontSize: 14,
          fontWeight: currentView === 'settings' ? 700 : 500,
          borderColor:
            currentView === 'settings' ? 'var(--glass-border-bright)' : 'var(--glass-border)',
        }}
      >
        <span
          style={{
            color: currentView === 'settings' ? 'var(--accent-2)' : 'inherit',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          <Icon name="settings" size={19} />
        </span>
        <span>Settings</span>
      </button>
    </aside>
  )
}
