/**
 * Format bytes into human-readable file size
 */
export function formatFileSize(bytes) {
  if (bytes === 0) return '0 B'
  if (!bytes || bytes < 0) return 'Unknown'
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = (bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)
  return `${size} ${units[i]}`
}

/**
 * Format seconds into HH:MM:SS or MM:SS
 */
export function formatDuration(seconds) {
  if (!seconds || seconds < 0) return '0:00'
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }
  return `${m}:${String(s).padStart(2, '0')}`
}

/**
 * Format a date string into a relative or absolute time display
 */
export function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffSec < 60) return 'just now'
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHour < 24) return `${diffHour}h ago`
  if (diffDay < 7) return `${diffDay}d ago`
  if (diffDay < 365) {
    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  }
  return date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
}

/**
 * Format a number with compact notation (1.2K, 3.5M, etc.)
 */
export function formatCount(num) {
  if (!num && num !== 0) return '0'
  if (num < 1000) return String(num)
  if (num < 1000000) return `${(num / 1000).toFixed(1).replace(/\.0$/, '')}K`
  return `${(num / 1000000).toFixed(1).replace(/\.0$/, '')}M`
}
