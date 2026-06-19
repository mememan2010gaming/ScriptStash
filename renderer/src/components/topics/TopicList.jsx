import { useState, useEffect, useCallback, useRef } from 'react'
import TopicCard from './TopicCard'
import Skeleton from '../common/Skeleton'
import './TopicList.css'

export default function TopicList({ category, navigateTo }) {
  const [topics, setTopics] = useState([])
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const listRef = useRef(null)
  const loadingRef = useRef(false)
  const api = window.electronAPI

  const fetchTopics = useCallback(
    async (pageNum, append = false) => {
      if (loadingRef.current) return
      loadingRef.current = true
      setLoading(true)
      setError(null)

      try {
        const method = category === 'paid' ? 'getPaidTopics' : 'getTopics'
        const result = await api[method](pageNum)

        if (result?.success && result.data?.topics) {
          setTopics(prev => (append ? [...prev, ...result.data.topics] : result.data.topics))
          setHasMore(!!result.data.hasMore)
        }
      } catch (err) {
        setError(err.message || 'Failed to load topics')
      } finally {
        setLoading(false)
        loadingRef.current = false
      }
    },
    [api, category]
  )

  // Reset and fetch when category changes
  useEffect(() => {
    setTopics([])
    setPage(0)
    setHasMore(true)
    fetchTopics(0)
  }, [category, fetchTopics])

  // Infinite scroll
  const handleScroll = useCallback(() => {
    if (!listRef.current || loading || !hasMore) return
    const { scrollTop, scrollHeight, clientHeight } = listRef.current
    if (scrollHeight - scrollTop - clientHeight < 300) {
      const nextPage = page + 1
      setPage(nextPage)
      fetchTopics(nextPage, true)
    }
  }, [loading, hasMore, page, fetchTopics])

  const handleTopicClick = useCallback(
    topicId => {
      navigateTo('detail', { topicId })
    },
    [navigateTo]
  )

  return (
    <div className="topic-list" ref={listRef} onScroll={handleScroll}>
      <div className="topic-list-header">
        <h1 className="topic-list-title">
          {category === 'paid' ? 'Paid Scripts' : 'Free Scripts'}
        </h1>
        <span className="topic-list-count">{topics.length} scripts</span>
      </div>

      {error && (
        <div className="topic-list-error">
          <span>{error}</span>
          <button onClick={() => fetchTopics(0)}>Retry</button>
        </div>
      )}

      <div className="topic-grid">
        {topics.map(topic => (
          <TopicCard key={topic.id} topic={topic} onClick={() => handleTopicClick(topic.id)} />
        ))}
        {loading &&
          Array.from({ length: 6 }).map((_, i) => (
            <div className="topic-card-skeleton" key={`sk-${i}`}>
              <Skeleton width="100%" height="140px" radius="lg" />
              <div
                style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}
              >
                <Skeleton width="80%" height="16px" />
                <Skeleton width="60%" height="12px" />
                <Skeleton width="40%" height="12px" />
              </div>
            </div>
          ))}
      </div>

      {!loading && !hasMore && topics.length > 0 && (
        <div className="topic-list-end">No more scripts to load</div>
      )}
    </div>
  )
}
