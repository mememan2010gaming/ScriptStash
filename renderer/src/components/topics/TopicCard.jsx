import Badge from '../common/Badge'
import { formatDate, formatCount } from '../../utils/formatters'
import './TopicCard.css'

export default function TopicCard({ topic, onClick }) {
  const thumbnail = topic.image_url || topic.thumbnail

  return (
    <article
      className="topic-card"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick()}
    >
      {thumbnail && (
        <div className="topic-card-thumb">
          <img src={thumbnail} alt="" loading="lazy" />
        </div>
      )}
      <div className="topic-card-body">
        <h3 className="topic-card-title">{topic.title || topic.fancy_title}</h3>

        <div className="topic-card-meta">
          {topic.tags && topic.tags.length > 0 && (
            <div className="topic-card-tags">
              {topic.tags.slice(0, 3).map(tag => {
                const name = typeof tag === 'string' ? tag : tag.name || tag.slug || String(tag)
                return (
                  <Badge key={name} variant="default" size="sm">
                    {name}
                  </Badge>
                )
              })}
              {topic.tags.length > 3 && (
                <Badge variant="default" size="sm">
                  +{topic.tags.length - 3}
                </Badge>
              )}
            </div>
          )}
        </div>

        <div className="topic-card-footer">
          <span className="topic-card-author">{topic.author?.username || 'Unknown'}</span>
          <span className="topic-card-dot">·</span>
          <span className="topic-card-date">
            {formatDate(topic.createdAt || topic.lastPostedAt)}
          </span>
          <span className="topic-card-stats">
            <span title="Views">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                <circle cx="12" cy="12" r="3" />
              </svg>
              {formatCount(topic.views)}
            </span>
            <span title="Likes">
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
              </svg>
              {formatCount(topic.likeCount)}
            </span>
          </span>
        </div>
      </div>
    </article>
  )
}
