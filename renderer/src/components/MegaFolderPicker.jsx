import { useState } from 'react'
import Button from './common/Button'

function formatBytes(bytes) {
  if (!bytes) return '—'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}

export default function MegaFolderPicker({ folderName, files, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(() => new Set(files.map(f => f.nodeId)))

  const allSelected = selected.size === files.length
  const noneSelected = selected.size === 0

  const toggleAll = () => {
    if (allSelected) {
      setSelected(new Set())
    } else {
      setSelected(new Set(files.map(f => f.nodeId)))
    }
  }

  const toggle = nodeId => {
    setSelected(prev => {
      const next = new Set(prev)
      if (next.has(nodeId)) next.delete(nodeId)
      else next.add(nodeId)
      return next
    })
  }

  const handleConfirm = () => {
    onConfirm(files.filter(f => selected.has(f.nodeId)))
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
      }}
      onClick={e => {
        if (e.target === e.currentTarget) onCancel()
      }}
    >
      <div
        style={{
          background: 'var(--surface-1)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius-md)',
          width: 480,
          maxWidth: '90vw',
          maxHeight: '70vh',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>MEGA Folder</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {folderName}
            </div>
          </div>
          <button
            onClick={onCancel}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--text-muted)',
              cursor: 'pointer',
              fontSize: 18,
              lineHeight: 1,
              padding: '2px 6px',
            }}
          >
            ×
          </button>
        </div>

        {/* Select all toggle */}
        <div
          style={{
            padding: '10px 20px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <input
            type="checkbox"
            id="mega-select-all"
            checked={allSelected}
            ref={el => {
              if (el) el.indeterminate = !allSelected && !noneSelected
            }}
            onChange={toggleAll}
            style={{ cursor: 'pointer' }}
          />
          <label
            htmlFor="mega-select-all"
            style={{ fontSize: 12, color: 'var(--text-muted)', cursor: 'pointer' }}
          >
            {allSelected ? 'Deselect all' : 'Select all'} ({files.length} files)
          </label>
        </div>

        {/* File list */}
        <div style={{ overflowY: 'auto', flex: 1 }}>
          {files.map(file => (
            <label
              key={file.nodeId}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '9px 20px',
                cursor: 'pointer',
                borderBottom: '1px solid var(--border-faint, var(--border))',
              }}
            >
              <input
                type="checkbox"
                checked={selected.has(file.nodeId)}
                onChange={() => toggle(file.nodeId)}
                style={{ cursor: 'pointer', flexShrink: 0 }}
              />
              <span
                style={{
                  flex: 1,
                  fontSize: 13,
                  color: 'var(--text)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
                title={file.name}
              >
                {file.name}
              </span>
              <span style={{ fontSize: 11, color: 'var(--text-muted)', flexShrink: 0 }}>
                {formatBytes(file.size)}
              </span>
            </label>
          ))}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '14px 20px',
            borderTop: '1px solid var(--border)',
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
          }}
        >
          <Button variant="secondary" size="sm" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" disabled={noneSelected} onClick={handleConfirm}>
            Download
            {selected.size > 0 ? ` ${selected.size} file${selected.size > 1 ? 's' : ''}` : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
