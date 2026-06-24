const { ipcMain, BrowserWindow, shell, dialog } = require('electron')
const fs = require('fs')
const path = require('path')
const downloadService = require('../services/download.service')
const store = require('../store/config')
const { getMainWindow } = require('../window')

const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v'])

// In-memory library scan cache (cleared when library path changes)
let libraryCache = null

function buildHeatmap(actions, buckets = 40) {
  if (!actions || actions.length < 2) return null
  const filtered = actions.filter(a => typeof a.at === 'number' && a.at >= 0)
  if (filtered.length < 2) return null
  const maxAt = filtered[filtered.length - 1].at
  if (!maxAt) return null
  const sums = new Array(buckets).fill(0)
  const counts = new Array(buckets).fill(0)
  for (const a of filtered) {
    const i = Math.min(Math.floor((a.at / maxAt) * buckets), buckets - 1)
    sums[i] += a.pos ?? 0
    counts[i]++
  }
  return sums.map((s, i) => (counts[i] ? Math.round(s / counts[i]) : 0))
}

async function walkDir(dir, onPair) {
  let entries
  try {
    entries = await fs.promises.readdir(dir, { withFileTypes: true })
  } catch {
    return
  }

  const byBasename = {}
  const subdirs = []

  for (const e of entries) {
    if (e.isDirectory()) {
      subdirs.push(path.join(dir, e.name))
      continue
    }
    const ext = path.extname(e.name).toLowerCase()
    const base = path.basename(e.name, ext)
    if (!byBasename[base]) byBasename[base] = {}
    if (VIDEO_EXTS.has(ext)) byBasename[base].video = path.join(dir, e.name)
    if (ext === '.funscript') byBasename[base].funscript = path.join(dir, e.name)
  }

  for (const [base, files] of Object.entries(byBasename)) {
    if (!files.video && !files.funscript) continue
    let heatmap = null
    if (files.funscript) {
      try {
        const stat = await fs.promises.stat(files.funscript)
        if (stat.size < 5 * 1024 * 1024) {
          const text = await fs.promises.readFile(files.funscript, 'utf8')
          const parsed = JSON.parse(text)
          if (Array.isArray(parsed.actions)) {
            heatmap = buildHeatmap(parsed.actions.sort((a, b) => a.at - b.at))
          }
        }
      } catch {}
    }
    await onPair({
      title: base,
      video: files.video || null,
      funscript: files.funscript || null,
      dir,
      heatmap,
    })
  }

  for (const subdir of subdirs) {
    await walkDir(subdir, onPair)
  }
}

function getLibraryRoot() {
  return store.get('libraryPath') || downloadService.getDownloadPath()
}

function runBackgroundScan(sender) {
  const root = getLibraryRoot()
  const pairs = []
  ;(async () => {
    try {
      await walkDir(root, async pair => {
        pairs.push(pair)
        if (!sender.isDestroyed()) sender.send('library:scan-progress', { count: pairs.length })
      })
      pairs.sort((a, b) => a.title.localeCompare(b.title))
      libraryCache = pairs
      if (!sender.isDestroyed()) sender.send('library:scan-complete', { pairs })
    } catch {}
  })()
}

function setupDownloadHandlers() {
  /**
   * Download a file
   */
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

  ipcMain.handle('download-paired', async (event, { videoUrl, funscriptUrl, topicTitle }) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender) || getMainWindow()
      const downloadId = `paired-${Date.now()}`
      await downloadService.downloadPaired(videoUrl, funscriptUrl, topicTitle, window, downloadId)
      return { success: true }
    } catch (error) {
      console.error('Error in paired download:', error.message)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('mega:get-folder-files', async (event, { url }) => {
    try {
      const { File: MegaFile } = require('megajs')
      const root = MegaFile.fromURL(url)
      await root.loadAttributes()

      if (!root.children) {
        return { success: true, data: { isSingleFile: true, filename: root.name, size: root.size } }
      }

      const flatten = n =>
        n.children
          ? n.children.flatMap(c => flatten(c))
          : [{ name: n.name, size: n.size, nodeId: n.nodeId }]
      const files = flatten(root)

      if (files.length <= 1) {
        const f = files[0] || {}
        return {
          success: true,
          data: { isSingleFile: true, filename: f.name, size: f.size, nodeId: f.nodeId },
        }
      }

      return {
        success: true,
        data: { isSingleFile: false, folderName: root.name, files },
      }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Get download directory path
   */
  ipcMain.handle('get-download-path', () => {
    return { success: true, data: downloadService.getDownloadPath() }
  })

  /**
   * Set download directory path
   */
  ipcMain.handle('set-download-path', async (event, { path }) => {
    if (path) {
      downloadService.setDownloadPath(path)
      return { success: true, data: path }
    }

    // Open folder picker dialog
    const window = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(window, {
      properties: ['openDirectory'],
      title: 'Select Download Folder',
    })

    if (!result.canceled && result.filePaths.length > 0) {
      const selectedPath = result.filePaths[0]
      downloadService.setDownloadPath(selectedPath)
      return { success: true, data: selectedPath }
    }

    return { success: false, error: 'No folder selected' }
  })

  /**
   * Open folder in file explorer
   */
  ipcMain.handle('open-folder', async (event, { path }) => {
    try {
      await shell.openPath(path || downloadService.getDownloadPath())
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Get download history
   */
  ipcMain.handle('get-download-history', () => {
    const history = downloadService
      .getHistory()
      .filter(entry => !entry.path || fs.existsSync(entry.path))
    return { success: true, data: history }
  })

  /**
   * Clear download history
   */
  ipcMain.handle('clear-download-history', () => {
    downloadService.clearHistory()
    return { success: true }
  })

  /**
   * Verify URL is accessible
   */
  ipcMain.handle('verify-url', async (event, { url }) => {
    try {
      const result = await downloadService.verifyUrl(url)
      return { success: true, data: result }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Get yt-dlp binary version
   */
  ipcMain.handle('get-ytdlp-version', async () => {
    try {
      const version = await downloadService.getYtDlpVersion()
      return { success: true, data: version }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Download latest yt-dlp binary from GitHub
   */
  ipcMain.handle('update-ytdlp', async () => {
    try {
      const version = await downloadService.updateYtDlp()
      return { success: true, data: version }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Get max simultaneous downloads setting
   */
  ipcMain.handle('get-max-downloads', () => {
    return { success: true, data: downloadService.getMaxSimultaneousDownloads() }
  })

  /**
   * Set max simultaneous downloads
   */
  ipcMain.handle('set-max-downloads', (event, { max }) => {
    try {
      downloadService.setMaxSimultaneousDownloads(max)
      return { success: true, data: max }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Get/set the library scan root directory (separate from download path)
   */
  ipcMain.handle('get-library-path', () => {
    return { success: true, data: getLibraryRoot() }
  })

  ipcMain.handle('set-library-path', async (event, { path: newPath } = {}) => {
    if (newPath) {
      store.set('libraryPath', newPath)
      libraryCache = null
      return { success: true, data: newPath }
    }
    const win = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(win, {
      properties: ['openDirectory'],
      title: 'Select Script Library Folder',
    })
    if (result.canceled || !result.filePaths.length) return { success: false }
    const selected = result.filePaths[0]
    store.set('libraryPath', selected)
    libraryCache = null
    return { success: true, data: selected }
  })

  /**
   * Recursively scan library directory for video+funscript pairs.
   * Returns cached data immediately if available, always starts a background rescan.
   * Sends library:scan-progress { count } events during scan.
   * Sends library:scan-complete { pairs } when background scan finishes.
   */
  ipcMain.handle('scan-library', async (event, { forceRescan = false } = {}) => {
    if (forceRescan) libraryCache = null

    if (libraryCache) {
      // Return cache instantly, refresh in background
      setImmediate(() => runBackgroundScan(event.sender))
      return { success: true, data: libraryCache, fromCache: true }
    }

    // No cache: run inline (progress events still fire, handler awaits result)
    const root = getLibraryRoot()
    const pairs = []
    try {
      await walkDir(root, async pair => {
        pairs.push(pair)
        if (!event.sender.isDestroyed()) {
          event.sender.send('library:scan-progress', { count: pairs.length })
        }
      })
      pairs.sort((a, b) => a.title.localeCompare(b.title))
      libraryCache = pairs
      return { success: true, data: pairs }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  /**
   * Open a file picker and return the selected path
   */
  ipcMain.handle('pick-local-file', async (event, { filters }) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    const result = await dialog.showOpenDialog(window, {
      properties: ['openFile'],
      filters: filters || [],
    })
    if (result.canceled || !result.filePaths.length) return { success: false }
    return { success: true, data: result.filePaths[0] }
  })
}

module.exports = { setupDownloadHandlers }
