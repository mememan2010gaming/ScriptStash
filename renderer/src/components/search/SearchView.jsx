import { useState, useEffect, useCallback } from 'react'
import TopicCard from '../topics/TopicCard'
import Skeleton from '../common/Skeleton'
import Badge from '../common/Badge'
import './SearchView.css'

export default function SearchView({ query, navigateTo }) {
  const [results, setResults] = useState([])
  const [loading, setLoading] = useState(false)
  const [tags, setTags] = useState([])
  const [selectedTag, setSelectedTag] = useState(null)
  const [tagLoading, setTagLoading] = useState(false)
  const api = window.electronAPI

  // Search by tag name
  const searchTags = useCallback(
    async q => {
      if (!q || q.length < 2) {
        setTags([])
        return
      }
      setTagLoading(true)
      try {
        const result = await api.searchTags(q)
        if (result?.success) setTags(result.data?.tags || result.data || [])
      } finally {
        setTagLoading(false)
      }
    },
    [api]
  )

  // Fetch topics by tag
  const fetchByTag = useCallback(
    async tag => {
      setSelectedTag(tag)
      setLoading(true)
      try {
        const result = await api.getTopicsByTag(tag, 0)
        if (result?.success) setResults(result.data?.topics || [])
      } finally {
        setLoading(false)
      }
    },
    [api]
  )

  useEffect(() => {
    if (query) searchTags(query)
  }, [query, searchTags])

  return (
    <div className="search-view">
      <h1 className="search-title">Search</h1>

      {query && (
        <p className="search-query">
          Results for: <strong>{query}</strong>
        </p>
      )}

      {/* Tag suggestions */}
      {tags.length > 0 && (
        <div className="search-tags">
          <span className="search-tags-label">Tags:</span>
          {tags.map(tag => (
            <button
              key={tag.id || tag}
              className={`search-tag-btn ${selectedTag === (tag.name || tag) ? 'active' : ''}`}
              onClick={() => fetchByTag(tag.name || tag)}
            >
              <Badge variant={selectedTag === (tag.name || tag) ? 'primary' : 'default'} size="md">
                {tag.name || tag}
              </Badge>
            </button>
          ))}
        </div>
      )}

      {/* Results grid */}
      <div className="search-results">
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="topic-card-skeleton">
              <Skeleton width="100%" height="140px" radius="lg" />
              <div
                style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <Skeleton width="80%" height="16px" />
                <Skeleton width="60%" height="12px" />
              </div>
            </div>
          ))}
        {!loading &&
          results.map(topic => (
            <TopicCard
              key={topic.id}
              topic={topic}
              onClick={() => navigateTo('detail', { topicId: topic.id })}
            />
          ))}
        {!loading && results.length === 0 && selectedTag && (
          <div className="search-empty">No results found for tag "{selectedTag}"</div>
        )}
      </div>
    </div>
  )
}
