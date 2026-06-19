# MEGA Download Support Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add native MEGA download support using `megajs`, including a file picker modal for multi-file folder links.

**Architecture:** A new `downloadFromMega` service method handles both single-file and folder-child downloads using `megajs` streams. A new `mega:get-folder-files` IPC handler fetches folder contents before download; when it returns multiple files, the renderer shows a `MegaFolderPicker` modal before queuing. Each selected file becomes an independent queue entry.

**Tech Stack:** `megajs` (MEGA client-side decryption), Electron IPC, React (JSX + inline styles + CSS variables)

## Global Constraints

- All new main-process code is CommonJS (`require`/`module.exports`) — no ESM syntax
- Progress events must use the exact shape: `{ downloadId, filename, url, progress, bytesReceived, totalBytes }`
- All download paths must be sanitized via `this.sanitizeFilename()`
- Partial files must be deleted on error (match existing `downloadDirect` behavior)
- Bump `package.json` patch version after every commit
- No Claude-Session URLs in commit messages

---

## File Map

| File | Change |
|---|---|
| `package.json` | Add `megajs` dependency, bump version |
| `main/services/download.service.js` | Add `downloadFromMega`, update `verifyUrl`, `executeDownload`, `downloadFile`, `processQueue` |
| `main/ipc/download.handler.js` | Add `mega:get-folder-files` handler, update `download-file` to pass `nodeId` |
| `main/preload.js` | Expose `getMegaFolderFiles`, update `downloadFile` signature |
| `renderer/src/contexts/DownloadContext.jsx` | Update `downloadFile` to accept `nodeId` |
| `renderer/src/views/TopicDetail.jsx` | Update `handleDownload` for MEGA detection + folder picker state |
| `renderer/src/components/MegaFolderPicker.jsx` | New component |
| `__tests__/mega.test.js` | New test file |

---

## Task 1: Install megajs

**Files:**
- Modify: `package.json`

**Interfaces:**
- Produces: `megajs` available via `require('megajs')` in main process

- [ ] **Step 1: Install the package**

```bash
npm install megajs
```

Expected output: package added to `node_modules`, `package.json` dependencies updated with `megajs`.

- [ ] **Step 2: Verify it loads**

```bash
node -e "const { File } = require('megajs'); console.log('megajs ok:', typeof File)"
```

Expected: `megajs ok: function`

If you see `ERR_REQUIRE_ESM`, install the last CJS version instead:
```bash
npm install megajs@1
```

- [ ] **Step 3: Bump version and commit**

In `package.json`, increment the patch version (e.g. `2.4.4` → `2.4.5`).

```bash
git add package.json package-lock.json
git commit -m "chore: add megajs dependency"
```

---

## Task 2: `downloadFromMega` + `nodeId` threading

**Files:**
- Modify: `main/services/download.service.js:107-126` (`downloadFile`)
- Modify: `main/services/download.service.js:66-84` (`processQueue`)
- Modify: `main/services/download.service.js:131-167` (`executeDownload`)
- Create test: `__tests__/mega.test.js`

**Interfaces:**
- Consumes: `megajs` `File.fromURL`, `file.loadAttributes()`, `file.download()` (ReadableStream)
- Produces:
  - `downloadFromMega(url, filename, window, downloadId, nodeId?)` — returns `{ filename, path, url, downloadId }`
  - `downloadFile(url, filename, window, nodeId?)` — `nodeId` threaded to queue and `executeDownload`
  - `executeDownload(url, filename, window, downloadId, nodeId?)` — routes `'mega'` type to `downloadFromMega`

- [ ] **Step 1: Write the failing tests**

Create `__tests__/mega.test.js`:

```javascript
const path = require('path')

// Mock electron before requiring the service
jest.mock('electron', () => ({
  app: { getPath: () => '/tmp/downloads' },
  ipcMain: { handle: jest.fn() },
}))

jest.mock('../main/store/config', () => ({
  get: jest.fn(key => {
    if (key === 'downloadPath') return '/tmp/downloads'
    if (key === 'settings') return {}
    return null
  }),
  set: jest.fn(),
}))

const mockDownload = jest.fn()
const mockLoadAttributes = jest.fn()
const mockFromURL = jest.fn()

jest.mock('megajs', () => ({
  File: { fromURL: (...args) => mockFromURL(...args) },
}))

const fs = require('fs')
jest.mock('fs', () => ({
  ...jest.requireActual('fs'),
  createWriteStream: jest.fn(),
  existsSync: jest.fn(() => false),
  unlinkSync: jest.fn(),
}))

const { EventEmitter } = require('events')

describe('downloadFromMega', () => {
  let service
  let mockWindow

  beforeEach(() => {
    jest.resetModules()
    jest.clearAllMocks()

    mockWindow = {
      isDestroyed: jest.fn(() => false),
      webContents: { send: jest.fn() },
    }

    // Re-require after resetModules so mocks apply
    const DownloadService = require('../main/services/download.service')
    service = DownloadService
    service.downloadPath = '/tmp/downloads'
  })

  test('downloads a single MEGA file and fires progress events', async () => {
    const fakeStream = new EventEmitter()
    fakeStream.pipe = jest.fn(writer => {
      setImmediate(() => {
        fakeStream.emit('data', Buffer.alloc(512))
        fakeStream.emit('data', Buffer.alloc(512))
        writer.emit('finish')
      })
      return writer
    })

    const mockWriter = new EventEmitter()
    fs.createWriteStream.mockReturnValue(mockWriter)

    const fakeNode = {
      name: 'video.mp4',
      size: 1024,
      nodeId: null,
      children: null,
      download: jest.fn(() => fakeStream),
    }
    mockFromURL.mockReturnValue({
      loadAttributes: jest.fn().mockResolvedValue(undefined),
      ...fakeNode,
    })

    const result = await service.downloadFromMega(
      'https://mega.nz/file/abc123#key',
      'video.mp4',
      mockWindow,
      'test-id-1'
    )

    expect(result.filename).toBe('video.mp4')
    expect(mockWindow.webContents.send).toHaveBeenCalledWith(
      'download-progress',
      expect.objectContaining({ downloadId: 'test-id-1', totalBytes: 1024 })
    )
    expect(mockWindow.webContents.send).toHaveBeenCalledWith(
      'download-complete',
      expect.objectContaining({ downloadId: 'test-id-1' })
    )
  })

  test('resolves correct child node when nodeId is provided', async () => {
    const childStream = new EventEmitter()
    childStream.pipe = jest.fn(writer => {
      setImmediate(() => writer.emit('finish'))
      return writer
    })

    const mockWriter = new EventEmitter()
    fs.createWriteStream.mockReturnValue(mockWriter)

    const childNode = {
      name: 'file2.mp4',
      size: 2048,
      nodeId: 'node-456',
      children: null,
      download: jest.fn(() => childStream),
    }
    const rootNode = {
      name: 'MyFolder',
      size: 0,
      nodeId: 'root-123',
      children: [childNode],
      download: jest.fn(),
      loadAttributes: jest.fn().mockResolvedValue(undefined),
    }
    mockFromURL.mockReturnValue(rootNode)

    const result = await service.downloadFromMega(
      'https://mega.nz/folder/abc123#key',
      'folder',
      mockWindow,
      'test-id-2',
      'node-456'
    )

    expect(childNode.download).toHaveBeenCalled()
    expect(result.filename).toBe('file2.mp4')
  })

  test('cleans up partial file on error', async () => {
    const badStream = new EventEmitter()
    badStream.pipe = jest.fn(writer => {
      setImmediate(() => badStream.emit('error', new Error('MEGA decryption failed')))
      return writer
    })

    const mockWriter = new EventEmitter()
    fs.createWriteStream.mockReturnValue(mockWriter)
    fs.existsSync.mockReturnValue(true)

    mockFromURL.mockReturnValue({
      name: 'file.mp4',
      size: 1024,
      nodeId: null,
      children: null,
      download: jest.fn(() => badStream),
      loadAttributes: jest.fn().mockResolvedValue(undefined),
    })

    await expect(
      service.downloadFromMega('https://mega.nz/file/abc#key', 'file.mp4', mockWindow, 'test-id-3')
    ).rejects.toThrow('MEGA decryption failed')

    expect(fs.unlinkSync).toHaveBeenCalledWith(path.join('/tmp/downloads', 'file.mp4'))
  })
})
```

- [ ] **Step 2: Run tests to verify they fail**

```bash
npx jest __tests__/mega.test.js --no-coverage
```

Expected: FAIL — `service.downloadFromMega is not a function`

- [ ] **Step 3: Add `downloadFromMega` to the service**

In `main/services/download.service.js`, add `require('megajs')` at the top alongside the other requires:

```javascript
const { File: MegaFile } = require('megajs')
```

Add this method to the `DownloadService` class, after `downloadFromBunkr`:

```javascript
async downloadFromMega(url, filename, window, downloadId, nodeId = null) {
  this.sendLog(window, 'download', `Starting MEGA download: ${url}`)

  const root = MegaFile.fromURL(url)
  await root.loadAttributes()

  // Resolve target node (root for file links, a child for folder links)
  let node = root
  if (nodeId) {
    const flatten = n => [n, ...(n.children || []).flatMap(c => flatten(c))]
    node = flatten(root).find(n => n.nodeId === nodeId)
    if (!node) throw new Error(`MEGA: file node ${nodeId} not found in folder`)
  }

  const realFilename = this.sanitizeFilename(node.name || filename)
  const filePath = path.join(this.downloadPath, realFilename)
  const totalBytes = node.size || 0
  const trackingUrl = nodeId ? `${url}#node-${nodeId}` : url

  if (this.activeDownloads.has(trackingUrl)) {
    return { error: 'File is already being downloaded' }
  }

  this.activeDownloads.set(trackingUrl, downloadId)

  try {
    const stream = node.download()
    const writer = fs.createWriteStream(filePath)
    let receivedBytes = 0

    await new Promise((resolve, reject) => {
      stream.on('data', chunk => {
        receivedBytes += chunk.length
        const progress = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0
        if (window && !window.isDestroyed()) {
          window.webContents.send('download-progress', {
            downloadId,
            filename: realFilename,
            url: trackingUrl,
            progress,
            bytesReceived: receivedBytes,
            totalBytes,
          })
        }
      })
      stream.on('error', reject)
      stream.pipe(writer)
      writer.on('finish', resolve)
      writer.on('error', reject)
    })

    const result = { filename: realFilename, path: filePath, url: trackingUrl, downloadId }

    this.addToHistory({
      url: trackingUrl,
      filename: realFilename,
      path: filePath,
      date: new Date().toISOString(),
    })

    if (window && !window.isDestroyed()) {
      window.webContents.send('download-complete', result)
    }

    this.sendLog(window, 'download', `MEGA download completed: ${realFilename}`)
    return result
  } catch (error) {
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
    this.sendLog(window, 'error', `MEGA download failed: ${error.message}`)
    throw error
  } finally {
    this.activeDownloads.delete(trackingUrl)
  }
}
```

- [ ] **Step 4: Add `nodeId` to `downloadFile`, `processQueue`, and `executeDownload`**

In `downloadFile` (line ~107), add `nodeId = null` parameter and thread it:

```javascript
async downloadFile(url, filename, window, nodeId = null) {
  const downloadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

  const maxDownloads = this.getMaxSimultaneousDownloads()
  if (this.activeDownloads.size >= maxDownloads) {
    this.downloadQueue.push({ url, filename, downloadId, nodeId })
    window?.webContents.send('download-queued', {
      url,
      filename,
      downloadId,
      queuePosition: this.downloadQueue.length,
    })
    return { queued: true, downloadId }
  }

  return await this.executeDownload(url, filename, window, downloadId, nodeId)
}
```

In `processQueue` (line ~66), pass `nodeId` from the queued entry:

```javascript
this.executeDownload(
  queuedDownload.url,
  queuedDownload.filename,
  window,
  queuedDownload.downloadId,
  queuedDownload.nodeId || null
).catch(error => {
  console.error('Download error in queue:', error.message)
})
```

In `executeDownload` (line ~131), add `nodeId = null` parameter and the `'mega'` case:

```javascript
async executeDownload(url, filename, window, downloadId, nodeId = null) {
  const urlType = this.detectUrlType(url)

  try {
    let result
    if (urlType === 'video') {
      // ... existing video block unchanged ...
    } else if (urlType === 'pixeldrain') {
      result = await this.downloadFromPixeldrain(url, filename, window, downloadId)
    } else if (urlType === 'gofile') {
      result = await this.downloadFromGofile(url, filename, window, downloadId)
    } else if (urlType === 'bunkr') {
      result = await this.downloadFromBunkr(url, filename, window, downloadId)
    } else if (urlType === 'mega') {
      result = await this.downloadFromMega(url, filename, window, downloadId, nodeId)
    } else {
      result = await this.downloadDirect(url, filename, window, downloadId)
    }
    return result
  } catch (error) {
    // ... existing catch block unchanged ...
  }
}
```

- [ ] **Step 5: Run tests**

```bash
npx jest __tests__/mega.test.js --no-coverage
```

Expected: all 3 tests PASS

- [ ] **Step 6: Bump version and commit**

Increment patch version in `package.json`.

```bash
git add main/services/download.service.js package.json __tests__/mega.test.js
git commit -m "feat: add downloadFromMega with nodeId threading"
```

---

## Task 3: `verifyUrl` + `mega:get-folder-files` IPC + preload

**Files:**
- Modify: `main/services/download.service.js:381` (`verifyUrl` mega case)
- Modify: `main/ipc/download.handler.js` (add handler + update `download-file`)
- Modify: `main/preload.js` (expose `getMegaFolderFiles`, update `downloadFile`)

**Interfaces:**
- Consumes: `MegaFile.fromURL(url).loadAttributes()`, `node.children` (array or null)
- Produces:
  - `verifyUrl` for mega: `{ valid: true, filename?, size? }` | `{ valid: true, isMegaFolder: true, files: [{name, size, nodeId}] }` | `{ valid: false, error }`
  - IPC `mega:get-folder-files({ url })` → `{ success, data: { isSingleFile, folderName?, files?, filename?, nodeId? } }`
  - `window.electronAPI.getMegaFolderFiles(url)` in renderer

- [ ] **Step 1: Replace the mega stub in `verifyUrl`**

Find this block in `main/services/download.service.js` (~line 500):

```javascript
} else if (urlType === 'mega') {
  // MEGA requires browser/special handling
  return { valid: false, needsBrowser: true }
}
```

Replace it with:

```javascript
} else if (urlType === 'mega') {
  try {
    const root = MegaFile.fromURL(url)
    await root.loadAttributes()

    if (!root.children) {
      // Single file link
      return { valid: true, filename: root.name, size: root.size }
    }

    // Folder link — flatten all leaf nodes
    const flatten = n =>
      n.children ? n.children.flatMap(c => flatten(c)) : [{ name: n.name, size: n.size, nodeId: n.nodeId }]
    const files = flatten(root)

    if (files.length === 0) return { valid: false, error: 'Empty folder' }
    if (files.length === 1) {
      return { valid: true, filename: files[0].name, size: files[0].size, nodeId: files[0].nodeId }
    }
    return { valid: true, isMegaFolder: true, folderName: root.name, files }
  } catch (error) {
    console.error('MEGA verify error:', error.message)
    return { valid: false, error: error.message }
  }
}
```

- [ ] **Step 2: Add `mega:get-folder-files` handler to `download.handler.js`**

Add this handler inside `setupDownloadHandlers()`, after the `verify-url` handler:

```javascript
ipcMain.handle('mega:get-folder-files', async (event, { url }) => {
  try {
    const { File: MegaFile } = require('megajs')
    const root = MegaFile.fromURL(url)
    await root.loadAttributes()

    if (!root.children) {
      return { success: true, data: { isSingleFile: true, filename: root.name, size: root.size } }
    }

    const flatten = n =>
      n.children ? n.children.flatMap(c => flatten(c)) : [{ name: n.name, size: n.size, nodeId: n.nodeId }]
    const files = flatten(root)

    if (files.length <= 1) {
      const f = files[0] || {}
      return { success: true, data: { isSingleFile: true, filename: f.name, size: f.size, nodeId: f.nodeId } }
    }

    return {
      success: true,
      data: { isSingleFile: false, folderName: root.name, files },
    }
  } catch (error) {
    return { success: false, error: error.message }
  }
})
```

Also update the `download-file` handler to pass `nodeId`:

```javascript
ipcMain.handle('download-file', async (event, { url, filename, nodeId = null }) => {
  try {
    const window = BrowserWindow.fromWebContents(event.sender) || getMainWindow()
    const result = await downloadService.downloadFile(url, filename, window, nodeId)
    return { success: true, data: result }
  } catch (error) {
    console.error('Error downloading file:', error.message)
    return { success: false, error: error.message }
  }
})
```

- [ ] **Step 3: Expose in preload**

In `main/preload.js`, update the `downloadFile` line and add `getMegaFolderFiles`:

```javascript
// Downloads
downloadFile: (url, filename, nodeId = null) =>
  ipcRenderer.invoke('download-file', { url, filename, nodeId }),
getMegaFolderFiles: url => ipcRenderer.invoke('mega:get-folder-files', { url }),
```

- [ ] **Step 4: Bump version and commit**

Increment patch version in `package.json`.

```bash
git add main/services/download.service.js main/ipc/download.handler.js main/preload.js package.json
git commit -m "feat: MEGA verifyUrl, get-folder-files IPC, preload exposure"
```

---

## Task 4: `MegaFolderPicker` component

**Files:**
- Create: `renderer/src/components/MegaFolderPicker.jsx`

**Interfaces:**
- Consumes: nothing from other tasks (pure UI)
- Produces: `<MegaFolderPicker url folderName files onConfirm onCancel />`
  - `files`: `[{ name: string, size: number, nodeId: string }]`
  - `onConfirm(selected: [{name, size, nodeId}])`: called with user's selection
  - `onCancel()`: called when dismissed

- [ ] **Step 1: Create the component**

Create `renderer/src/components/MegaFolderPicker.jsx`:

```jsx
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
      onClick={e => { if (e.target === e.currentTarget) onCancel() }}
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
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
              MEGA Folder
            </div>
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
            ref={el => { if (el) el.indeterminate = !allSelected && !noneSelected }}
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
          <Button
            variant="primary"
            size="sm"
            disabled={noneSelected}
            onClick={handleConfirm}
          >
            Download {selected.size > 0 ? `${selected.size} file${selected.size > 1 ? 's' : ''}` : ''}
          </Button>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Bump version and commit**

Increment patch version in `package.json`.

```bash
git add renderer/src/components/MegaFolderPicker.jsx package.json
git commit -m "feat: add MegaFolderPicker component"
```

---

## Task 5: Wire MEGA detection into `TopicDetail` + `DownloadContext`

**Files:**
- Modify: `renderer/src/contexts/DownloadContext.jsx:79-85` (`downloadFile` callback)
- Modify: `renderer/src/views/TopicDetail.jsx:270-278` (`handleDownload`, add folder picker state)

**Interfaces:**
- Consumes:
  - `window.electronAPI.getMegaFolderFiles(url)` → `{ success, data: { isSingleFile, folderName?, files?, filename?, nodeId? } }`
  - `window.electronAPI.downloadFile(url, filename, nodeId?)` (updated preload from Task 3)
  - `<MegaFolderPicker>` (from Task 4)
- Produces: end-to-end working MEGA download flow

- [ ] **Step 1: Update `DownloadContext.jsx` `downloadFile`**

In `renderer/src/contexts/DownloadContext.jsx`, update the `downloadFile` callback (~line 79):

```javascript
const downloadFile = useCallback(
  async (url, filename, nodeId = null) => {
    if (!api) return { success: false, error: 'API not available' }
    return api.downloadFile(url, filename, nodeId)
  },
  [api]
)
```

- [ ] **Step 2: Update `TopicDetail.jsx` `handleDownload` and add picker state**

In `renderer/src/views/TopicDetail.jsx`, inside `RightPanel`:

Add the import at the top of the file:

```javascript
import MegaFolderPicker from '../components/MegaFolderPicker'
```

Add state for the picker after the existing `useState` calls in `RightPanel`:

```javascript
const [megaFolder, setMegaFolder] = useState(null) // { url, folderName, files }
```

Replace `handleDownload` (~line 270) with an async version:

```javascript
const handleDownload = async (url, filename) => {
  setFailed(prev => {
    const n = { ...prev }
    delete n[url]
    return n
  })

  if (url.toLowerCase().includes('mega.nz')) {
    const result = await window.electronAPI?.getMegaFolderFiles?.(url)
    if (result?.success) {
      const data = result.data
      if (!data.isSingleFile) {
        setMegaFolder({ url, folderName: data.folderName, files: data.files })
        return
      }
      // Single file or single-item folder — download directly
      const fname = data.filename || filename
      downloadFile(url, fname, data.nodeId || null)
      addToast(`Downloading: ${fname}`, 'info')
      return
    }
    // If getMegaFolderFiles failed, fall through to normal download
  }

  downloadFile(url, filename)
  addToast(`Downloading: ${filename}`, 'info')
}
```

Add the picker modal to the JSX returned by `RightPanel`, just before the closing `</div>`:

```jsx
{megaFolder && (
  <MegaFolderPicker
    folderName={megaFolder.folderName}
    files={megaFolder.files}
    onConfirm={selected => {
      setMegaFolder(null)
      selected.forEach(file => {
        downloadFile(megaFolder.url, file.name, file.nodeId)
        addToast(`Downloading: ${file.name}`, 'info')
      })
    }}
    onCancel={() => setMegaFolder(null)}
  />
)}
```

- [ ] **Step 3: Run the app and test manually**

```bash
npm run dev
```

Test scenarios:
1. Paste a public `mega.nz/file/...` URL into a topic — should download directly with progress
2. Paste a public `mega.nz/folder/...` URL with multiple files — folder picker modal should open, selected files should queue and download
3. Cancel the picker — no download should start
4. A non-MEGA download — behavior unchanged

- [ ] **Step 4: Run the full test suite**

```bash
npm test
```

Expected: all tests pass (including the 3 new MEGA tests from Task 2).

- [ ] **Step 5: Bump version and commit**

Increment patch version in `package.json`.

```bash
git add renderer/src/contexts/DownloadContext.jsx renderer/src/views/TopicDetail.jsx package.json
git commit -m "feat: wire MEGA folder picker into TopicDetail and DownloadContext"
```
