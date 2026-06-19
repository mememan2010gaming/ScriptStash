import { useEffect, useState } from 'react'
import { useDownloads } from '../../context/DownloadContext'
import './Sidebar.css'

const NAV_ITEMS = [
  {
    id: 'free',
    view: 'topics',
    category: 'free',
    label: 'Free Scripts',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 12v10H4V12" />
        <path d="M2 7h20v5H2z" />
        <path d="M12 22V7" />
        <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z" />
        <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z" />
      </svg>
    ),
  },
  {
    id: 'paid',
    view: 'topics',
    category: 'paid',
    label: 'Paid Scripts',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="1" x2="12" y2="23" />
        <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
      </svg>
    ),
  },
  {
    id: 'downloads',
    view: 'downloads',
    label: 'Downloads',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
        <polyline points="7 10 12 15 17 10" />
        <line x1="12" y1="15" x2="12" y2="3" />
      </svg>
    ),
  },
  {
    id: 'search',
    view: 'search',
    label: 'Search',
    icon: (
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="11" cy="11" r="8" />
        <line x1="21" y1="21" x2="16.65" y2="16.65" />
      </svg>
    ),
  },
]

const SETTINGS_ITEM = {
  id: 'settings',
  view: 'settings',
  label: 'Settings',
  icon: (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-1.42 3.42 2 2 0 0 1-1.42-.58l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-3.42-1.42 2 2 0 0 1 .58-1.42l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 1.42-3.42 2 2 0 0 1 1.42.58l.06.06A1.65 1.65 0 0 0 9 4.6h.09A1.65 1.65 0 0 0 10 3.09V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 3.42 1.42 2 2 0 0 1-.58 1.42l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
}

export default function Sidebar({ currentView, currentCategory, navigateTo, collapsed, onToggle }) {
  const { activeCount } = useDownloads()
  const [user, setUser] = useState(null)

  useEffect(() => {
    const api = window.electronAPI
    if (api?.validateSession) {
      api.validateSession().then(result => {
        if (result?.success && result.data?.isValid) setUser(result.data.user)
      })
    }
  }, [])

  const isActive = item => {
    if (item.view === 'topics') {
      return currentView === 'topics' && currentCategory === item.category
    }
    return currentView === item.view
  }

  const handleNav = item => {
    const opts = {}
    if (item.category) opts.category = item.category
    navigateTo(item.view, opts)
  }

  return (
    <aside className={`sidebar ${collapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-inner">
        {/* User area */}
        <div className="sidebar-user" title={user?.username || 'Not logged in'}>
          {user?.avatar ? (
            <img className="sidebar-avatar" src={user.avatar} alt="" referrerPolicy="no-referrer" />
          ) : (
            <div className="sidebar-avatar sidebar-avatar-placeholder">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
          )}
          {!collapsed && (
            <div className="sidebar-user-info">
              <span className="sidebar-username">{user?.username || 'Guest'}</span>
              <span className="sidebar-status">{user ? 'Connected' : 'Not logged in'}</span>
            </div>
          )}
        </div>

        {/* Toggle button */}
        <button
          className="sidebar-toggle"
          onClick={onToggle}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {collapsed ? (
              <polyline points="9 18 15 12 9 6" />
            ) : (
              <polyline points="15 18 9 12 15 6" />
            )}
          </svg>
        </button>

        {/* Nav items */}
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(item => (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive(item) ? 'active' : ''}`}
              onClick={() => handleNav(item)}
              title={collapsed ? item.label : undefined}
            >
              <span className="sidebar-nav-icon">{item.icon}</span>
              {!collapsed && <span className="sidebar-nav-label">{item.label}</span>}
              {item.id === 'downloads' && activeCount > 0 && (
                <span className="sidebar-badge">{activeCount}</span>
              )}
            </button>
          ))}
        </nav>

        {/* Bottom settings */}
        <div className="sidebar-bottom">
          <button
            className={`sidebar-nav-item ${currentView === 'settings' ? 'active' : ''}`}
            onClick={() => navigateTo('settings')}
            title={collapsed ? 'Settings' : undefined}
          >
            <span className="sidebar-nav-icon">{SETTINGS_ITEM.icon}</span>
            {!collapsed && <span className="sidebar-nav-label">Settings</span>}
          </button>
        </div>
      </div>
    </aside>
  )
}
