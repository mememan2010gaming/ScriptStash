import { useState, useCallback } from 'react'
import './Header.css'

export default function Header({ currentView, searchQuery, navigateTo, goBack }) {
  const [query, setQuery] = useState(searchQuery || '')

  const handleSearch = useCallback(
    e => {
      e.preventDefault()
      if (query.trim()) {
        navigateTo('search', { query: query.trim() })
      }
    },
    [query, navigateTo]
  )

  const handleKeyDown = useCallback(e => {
    if (e.key === 'Escape') {
      setQuery('')
    }
  }, [])

  return (
    <header className="header">
      <div className="header-left">
        {currentView === 'detail' && (
          <button className="header-back-btn" onClick={goBack} aria-label="Go back">
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
              <line x1="19" y1="12" x2="5" y2="12" />
              <polyline points="12 19 5 12 12 5" />
            </svg>
          </button>
        )}
      </div>

      <form className="header-search" onSubmit={handleSearch}>
        <svg
          className="header-search-icon"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
        </svg>
        <input
          type="text"
          className="header-search-input"
          placeholder="Search scripts..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
        />
        {query && (
          <button
            type="button"
            className="header-search-clear"
            onClick={() => setQuery('')}
            aria-label="Clear search"
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        )}
      </form>

      <div className="header-right">{/* Placeholder for future action buttons */}</div>
    </header>
  )
}
