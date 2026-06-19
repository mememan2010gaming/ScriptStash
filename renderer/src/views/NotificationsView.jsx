import { useState } from 'react'
import Icon from '../design-system/components/Icon'
import { useNotifications } from '../contexts/NotificationsContext'

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'likes', label: 'Likes' },
  { id: 'replies', label: 'Replies' },
  { id: 'mentions', label: 'Mentions' },
]

const LIKE_TYPES = new Set([5, 19])
const REPLY_TYPES = new Set([2, 3])
const MENTION_TYPES = new Set([1])

const LETTER_COLORS = [
  '#ef4444',
  '#f97316',
  '#eab308',
  '#22c55e',
  '#06b6d4',
  '#3b82f6',
  '#8b5cf6',
  '#ec4899',
]

function userColor(username) {
  let hash = 0
  for (let i = 0; i < (username?.length ?? 0); i++)
    hash = username.charCodeAt(i) + ((hash << 5) - hash)
  return LETTER_COLORS[Math.abs(hash) % LETTER_COLORS.length]
}

function matchesFilter(n, filter) {
  if (filter === 'all') return true
  if (filter === 'likes') return LIKE_TYPES.has(n.notification_type)
  if (filter === 'replies') return REPLY_TYPES.has(n.notification_type)
  if (filter === 'mentions') return MENTION_TYPES.has(n.notification_type)
  return true
}

function notifLabel(n) {
  const username = n.data?.display_username ?? 'Someone'
  const title = n.data?.topic_title ?? 'a topic'
  const count = n.data?.count
  const badge = n.data?.badge_name
  switch (n.notification_type) {
    case 1:
      return `${username} mentioned you`
    case 2:
      return `${username} replied to your post`
    case 3:
      return `${username} quoted you`
    case 5:
      return `${username} liked your post`
    case 9:
      return `New post in "${title}"`
    case 11:
      return `${username} linked your post`
    case 12:
      return badge ? `You earned "${badge}"` : 'You earned a badge'
    case 19:
      return count ? `${count} people liked your post` : 'Multiple likes on your post'
    default:
      return `Activity in "${title}"`
  }
}

function typeConfig(notifType) {
  if (LIKE_TYPES.has(notifType))
    return {
      icon: 'heart',
      color: '#ff4d79',
      bg: 'rgba(255,77,121,0.18)',
      border: 'rgba(255,77,121,0.5)',
    }
  if (REPLY_TYPES.has(notifType))
    return {
      icon: 'chat',
      color: '#60a5fa',
      bg: 'rgba(96,165,250,0.18)',
      border: 'rgba(96,165,250,0.5)',
    }
  if (MENTION_TYPES.has(notifType))
    return {
      icon: 'sparkle',
      color: '#a78bfa',
      bg: 'rgba(167,139,250,0.18)',
      border: 'rgba(167,139,250,0.5)',
    }
  if (notifType === 12)
    return {
      icon: 'sparkle',
      color: '#fbbf24',
      bg: 'rgba(251,191,36,0.18)',
      border: 'rgba(251,191,36,0.5)',
    }
  return {
    icon: 'bell',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.15)',
    border: 'rgba(148,163,184,0.4)',
  }
}

function buildAvatarUrl(n) {
  // Prefer the pre-resolved URL attached by notifications.service (avatar lookup)
  if (n.data?.avatarUrl) return n.data.avatarUrl
  // Discourse puts user_avatar_template at different levels depending on the type
  const tpl = n.user_avatar_template ?? n.data?.user_avatar_template
  if (!tpl) return null
  return tpl.startsWith('http')
    ? tpl.replace('{size}', '40')
    : 'https://discuss.eroscripts.com' + tpl.replace('{size}', '40')
}

function relativeTime(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime()
  const m = Math.floor(diff / 60000)
  if (m < 1) return 'just now'
  if (m < 60) return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24) return `${h}h ago`
  const d = Math.floor(h / 24)
  if (d < 7) return `${d}d ago`
  return new Date(dateStr).toLocaleDateString()
}

function NotifAvatar({ n }) {
  const [imgFailed, setImgFailed] = useState(false)
  const url = buildAvatarUrl(n)
  const username = n.data?.display_username ?? ''
  const letter = username[0]?.toUpperCase() ?? '?'
  const color = userColor(username)

  const showLetter = !url || imgFailed

  return (
    <div
      style={{
        width: 38,
        height: 38,
        borderRadius: 11,
        overflow: 'hidden',
        flexShrink: 0,
        display: 'grid',
        placeItems: 'center',
        background: showLetter ? color : 'var(--glass-strong)',
        fontSize: 15,
        fontWeight: 700,
        color: 'white',
      }}
    >
      {showLetter ? (
        letter
      ) : (
        <img
          src={url}
          alt=""
          referrerPolicy="no-referrer"
          onError={() => setImgFailed(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      )}
    </div>
  )
}

function NotifRow({ n, onClick }) {
  const tc = typeConfig(n.notification_type)
  const clickable = !!n.topic_id

  return (
    <div
      onClick={() => onClick(n)}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '11px 12px',
        borderRadius: 14,
        marginBottom: 2,
        cursor: clickable ? 'pointer' : 'default',
        background: n.read ? 'transparent' : 'var(--accent-soft)',
        borderLeft: n.read ? '2px solid transparent' : '2px solid var(--accent)',
        transition: 'background var(--t)',
      }}
      onMouseEnter={e => {
        if (clickable) e.currentTarget.style.background = 'var(--glass-strong)'
      }}
      onMouseLeave={e => {
        e.currentTarget.style.background = n.read ? 'transparent' : 'var(--accent-soft)'
      }}
    >
      {/* Avatar + type badge */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <NotifAvatar n={n} />
        <div
          style={{
            position: 'absolute',
            bottom: -5,
            right: -5,
            width: 22,
            height: 22,
            borderRadius: 7,
            background: tc.bg,
            border: `1.5px solid ${tc.border}`,
            display: 'grid',
            placeItems: 'center',
            color: tc.color,
            boxShadow: `0 2px 6px ${tc.bg}`,
          }}
        >
          <Icon
            name={tc.icon}
            size={13}
            stroke={2}
            fill={LIKE_TYPES.has(n.notification_type) ? tc.color : 'none'}
          />
        </div>
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 13.5,
            fontWeight: n.read ? 400 : 600,
            color: 'var(--text)',
            marginBottom: 3,
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {notifLabel(n)}
        </div>
        {n.data?.topic_title && (
          <div
            style={{
              fontSize: 12.5,
              color: 'var(--text-muted)',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {n.data.topic_title}
          </div>
        )}
      </div>

      {/* Time + unread dot */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
          {relativeTime(n.created_at)}
        </span>
        {!n.read && (
          <div
            style={{
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'var(--accent)',
              boxShadow: '0 0 6px var(--accent-glow)',
            }}
          />
        )}
      </div>
    </div>
  )
}

export default function NotificationsView({ navigateTo }) {
  const { notifications, unreadCount } = useNotifications() ?? { notifications: [], unreadCount: 0 }
  const [filter, setFilter] = useState('all')
  const [marking, setMarking] = useState(false)

  const filtered = notifications.filter(n => matchesFilter(n, filter))

  async function handleMarkRead() {
    setMarking(true)
    await window.electronAPI?.markNotificationsRead?.()
    setMarking(false)
  }

  function handleClick(n) {
    if (n.topic_id) {
      navigateTo('detail', { topicId: n.topic_id })
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div
        style={{
          padding: '18px 24px 14px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          flexShrink: 0,
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="display" style={{ fontSize: 20, fontWeight: 700 }}>
            Notifications
          </span>
          {unreadCount > 0 && (
            <span
              className="num"
              style={{
                background: 'var(--accent)',
                color: 'var(--on-accent)',
                borderRadius: 99,
                padding: '2px 9px',
                fontSize: 12,
                fontWeight: 700,
                boxShadow: '0 0 10px var(--accent-glow)',
              }}
            >
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkRead}
            disabled={marking}
            className="glass glass-hover"
            style={{
              padding: '6px 14px',
              borderRadius: 10,
              fontSize: 13,
              fontWeight: 500,
              color: 'var(--text-muted)',
              cursor: marking ? 'default' : 'pointer',
              opacity: marking ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Filter tabs */}
      <div
        style={{
          display: 'flex',
          gap: 4,
          padding: '10px 20px',
          flexShrink: 0,
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        {FILTERS.map(f => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            style={{
              padding: '5px 14px',
              borderRadius: 9,
              fontSize: 13,
              fontWeight: filter === f.id ? 700 : 500,
              background: filter === f.id ? 'var(--accent-soft)' : 'transparent',
              color: filter === f.id ? 'var(--text)' : 'var(--text-muted)',
              border: filter === f.id ? '1px solid rgba(255,77,121,0.3)' : '1px solid transparent',
              cursor: 'pointer',
              transition: 'all var(--t)',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* List */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 12px' }}>
        {filtered.length === 0 ? (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%',
              gap: 12,
              color: 'var(--text-faint)',
            }}
          >
            <Icon name="bell" size={32} stroke={1.4} />
            <span style={{ fontSize: 14 }}>No notifications</span>
          </div>
        ) : (
          filtered.map(n => <NotifRow key={n.id} n={n} onClick={handleClick} />)
        )}
      </div>
    </div>
  )
}
