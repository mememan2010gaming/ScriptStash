import { useState, useEffect } from 'react'
import { useDownloads } from '../../context/DownloadContext'
import GlassPanel from '../common/GlassPanel'
import Button from '../common/Button'
import Badge from '../common/Badge'
import ProgressBar from '../common/ProgressBar'
import { formatFileSize, formatDate } from '../../utils/formatters'
import './DownloadsView.css'

export default function DownloadsView() {
  const { active, queued, history, errors, clearHistory, clearErrors } = useDownloads()
  const [downloadPath, setDownloadPath] = useState('')
  const [tab, setTab] = useState('active')
  const api = window.electronAPI

  useEffect(() => {
    api.getDownloadPath().then(r => {
      if (r?.success) setDownloadPath(r.data)
    })
  }, [api])

  const handleChangePath = async () => {
    const result = await api.invoke('set-download-path', {})
    if (result?.success) setDownloadPath(result.data)
  }

  const handleOpenFolder = () => {
    if (downloadPath) api.openFolder(downloadPath)
  }

  const activeItems = [...active, ...queued]
  const tabCounts = {
    active: activeItems.length,
    history: history.length,
    errors: errors.length,
  }

  return (
    <div className="downloads-view">
      <div className="downloads-header">
        <h1 className="downloads-title">Downloads</h1>
        <div className="downloads-path" title={downloadPath}>
          <span className="downloads-path-label">Saving to:</span>
          <span className="downloads-path-value">{downloadPath || '...'}</span>
          <Button size="sm" variant="ghost" onClick={handleChangePath}>
            Change
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={handleOpenFolder}
            icon={
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            }
          />
        </div>
      </div>

      {/* Tab bar */}
      <div className="downloads-tabs">
        {['active', 'history', 'errors'].map(t => (
          <button
            key={t}
            className={`downloads-tab ${tab === t ? 'active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t.charAt(0).toUpperCase() + t.slice(1)}
            {tabCounts[t] > 0 && (
              <Badge variant={t === 'errors' ? 'error' : 'default'} size="sm">
                {tabCounts[t]}
              </Badge>
            )}
          </button>
        ))}
      </div>

      {/* Active downloads */}
      {tab === 'active' && (
        <div className="downloads-list">
          {activeItems.length === 0 && <div className="downloads-empty">No active downloads</div>}
          {active.map(dl => (
            <GlassPanel key={dl.url} className="download-row" variant="subtle" padding>
              <div className="download-row-info">
                <span className="download-row-name">{dl.filename || 'Downloading...'}</span>
                <span className="download-row-detail">
                  {dl.bytesReceived
                    ? `${formatFileSize(dl.bytesReceived)} / ${formatFileSize(dl.totalBytes)}`
                    : 'Starting...'}
                </span>
              </div>
              <ProgressBar
                value={dl.progress || 0}
                max={100}
                size="sm"
                variant="primary"
                showPercent
              />
            </GlassPanel>
          ))}
          {queued.map(dl => (
            <GlassPanel key={dl.url} className="download-row" variant="subtle" padding>
              <div className="download-row-info">
                <span className="download-row-name">{dl.filename || 'Queued'}</span>
                <Badge variant="default" size="sm">
                  Queued #{dl.queuePosition}
                </Badge>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}

      {/* History */}
      {tab === 'history' && (
        <div className="downloads-list">
          {history.length > 0 && (
            <div className="downloads-list-actions">
              <Button size="sm" variant="ghost" onClick={clearHistory}>
                Clear History
              </Button>
            </div>
          )}
          {history.length === 0 && <div className="downloads-empty">No download history</div>}
          {history.map((dl, i) => (
            <GlassPanel
              key={`${dl.url}-${i}`}
              className="download-row"
              variant="subtle"
              padding
              hover
            >
              <div className="download-row-info">
                <span className="download-row-name">{dl.filename}</span>
                <span className="download-row-detail">
                  {dl.size ? formatFileSize(dl.size) : ''} · {formatDate(dl.completedAt)}
                </span>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => api.openFolder(dl.path)}
                icon={
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                  </svg>
                }
              />
            </GlassPanel>
          ))}
        </div>
      )}

      {/* Errors */}
      {tab === 'errors' && (
        <div className="downloads-list">
          {errors.length > 0 && (
            <div className="downloads-list-actions">
              <Button size="sm" variant="ghost" onClick={clearErrors}>
                Clear Errors
              </Button>
            </div>
          )}
          {errors.length === 0 && <div className="downloads-empty">No errors</div>}
          {errors.map((dl, i) => (
            <GlassPanel
              key={`${dl.url}-${i}`}
              className="download-row download-row--error"
              variant="subtle"
              padding
            >
              <div className="download-row-info">
                <span className="download-row-name">{dl.filename || dl.url}</span>
                <span className="download-row-error">{dl.error}</span>
              </div>
            </GlassPanel>
          ))}
        </div>
      )}
    </div>
  )
}
