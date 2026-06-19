import { useState, useEffect } from 'react'
import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import Skeleton from '../common/Skeleton'
import { formatDate } from '../../utils/formatters'
import { sanitizeUrl } from '../../utils/sanitize'
import './TopicDetail.css'

export default function TopicDetail({ topicId, navigateTo }) {
  const [topic, setTopic] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [downloading, setDownloading] = useState({})
  const api = window.electronAPI

  useEffect(() => {
    if (!topicId) return
    setLoading(true)
    setError(null)

    api
      .getTopicDetails(topicId)
      .then(result => {
        if (result?.success) {
          setTopic(result.data)
        } else {
          setError(result?.error || 'Failed to load topic')
        }
      })
      .catch(err => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [topicId, api])

  const handleDownload = async (url, filename) => {
    const safeUrl = sanitizeUrl(url)
    if (!safeUrl) return
    setDownloading(prev => ({ ...prev, [url]: true }))
    try {
      await api.downloadFile(safeUrl, filename)
    } finally {
      setDownloading(prev => ({ ...prev, [url]: false }))
    }
  }

  const handleOpenExternal = url => {
    const safeUrl = sanitizeUrl(url)
    if (safeUrl) api.openExternal(safeUrl)
  }

  if (loading) {
    return (
      <div className="topic-detail">
        <Skeleton width="70%" height="32px" />
        <div style={{ display: 'flex', gap: '8px', marginTop: '12px' }}>
          <Skeleton width="80px" height="20px" radius="full" />
          <Skeleton width="80px" height="20px" radius="full" />
        </div>
        <Skeleton width="100%" height="200px" className="mt-4" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="topic-detail">
        <div className="topic-detail-error">
          <span>{error}</span>
          <Button
            variant="default"
            size="sm"
            onClick={() => {
              setLoading(true)
              api
                .getTopicDetails(topicId)
                .then(r => {
                  if (r?.success) setTopic(r.data)
                  else setError(r?.error)
                })
                .catch(e => setError(e.message))
                .finally(() => setLoading(false))
            }}
          >
            Retry
          </Button>
        </div>
      </div>
    )
  }

  if (!topic) return null

  return (
    <div className="topic-detail">
      {/* Header */}
      <div className="topic-detail-header">
        <h1 className="topic-detail-title">{topic.title}</h1>
        <div className="topic-detail-meta">
          <span className="topic-detail-author">by {topic.mainPost?.username || 'Unknown'}</span>
          <span className="topic-detail-date">{formatDate(topic.createdAt)}</span>
          {topic.views && <span>{topic.views} views</span>}
          {topic.likeCount > 0 && <span>{topic.likeCount} likes</span>}
        </div>
        {topic.tags && topic.tags.length > 0 && (
          <div className="topic-detail-tags">
            {topic.tags.map(tag => {
              const name = typeof tag === 'string' ? tag : tag.name || tag.slug || String(tag)
              return (
                <Badge key={name} variant="primary" size="sm">
                  {name}
                </Badge>
              )
            })}
          </div>
        )}
      </div>

      {/* Downloads */}
      {topic.downloads &&
        (topic.downloads.funscripts?.length > 0 || topic.downloads.videos?.length > 0) && (
          <GlassPanel className="topic-downloads" variant="subtle">
            <h3 className="topic-downloads-title">Downloads</h3>

            {topic.downloads.funscripts?.length > 0 && (
              <div className="download-section">
                <h4 className="download-section-title">Funscripts</h4>
                {topic.downloads.funscripts.map((dl, idx) => (
                  <div key={idx} className="download-item">
                    <div className="download-info">
                      <span className="download-name">{dl.filename || 'Download'}</span>
                      {dl.fromReply && (
                        <Badge variant="default" size="sm">
                          Reply
                        </Badge>
                      )}
                    </div>
                    <div className="download-actions">
                      <Button
                        size="sm"
                        variant="primary"
                        loading={downloading[dl.url]}
                        onClick={e => {
                          e.stopPropagation()
                          handleDownload(dl.url, dl.filename)
                        }}
                        icon={
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
                        }
                      >
                        Download
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {topic.downloads.videos?.length > 0 && (
              <div className="download-section">
                <h4 className="download-section-title">Videos</h4>
                {topic.downloads.videos.map((dl, idx) => (
                  <div key={idx} className="download-item">
                    <div className="download-info">
                      <span className="download-name">{dl.title || dl.service || 'Video'}</span>
                      {dl.service && (
                        <Badge variant="default" size="sm">
                          {dl.service}
                        </Badge>
                      )}
                      {dl.fromReply && (
                        <Badge variant="default" size="sm">
                          Reply
                        </Badge>
                      )}
                    </div>
                    <div className="download-actions">
                      {dl.downloadable && (
                        <Button
                          size="sm"
                          variant="primary"
                          loading={downloading[dl.url]}
                          onClick={e => {
                            e.stopPropagation()
                            handleDownload(dl.url, dl.title || 'video')
                          }}
                          icon={
                            <svg
                              width="14"
                              height="14"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                            >
                              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                              <polyline points="7 10 12 15 17 10" />
                              <line x1="12" y1="15" x2="12" y2="3" />
                            </svg>
                          }
                        >
                          Download
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={e => {
                          e.stopPropagation()
                          handleOpenExternal(dl.url)
                        }}
                        icon={
                          <svg
                            width="14"
                            height="14"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                          >
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                            <polyline points="15 3 21 3 21 9" />
                            <line x1="10" y1="14" x2="21" y2="3" />
                          </svg>
                        }
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </GlassPanel>
        )}

      {/* Posts */}
      <div className="topic-detail-posts">
        {topic.posts &&
          topic.posts.map((post, idx) => (
            <GlassPanel key={idx} className="topic-post" variant="subtle">
              <div className="post-header">
                <span className="post-author">{post.username}</span>
                <span className="post-date">{formatDate(post.createdAt)}</span>
              </div>
              <div className="post-content" dangerouslySetInnerHTML={{ __html: post.cooked }} />
            </GlassPanel>
          ))}
      </div>
    </div>
  )
}
