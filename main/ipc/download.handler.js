const { ipcMain, BrowserWindow, shell, dialog } = require('electron')
const downloadService = require('../services/download.service')
const { getMainWindow } = require('../window')

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
    const fs = require('fs')
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
   * Recursively scan download directory for video+funscript pairs
   */
  ipcMain.handle('scan-library', async () => {
    const fs = require('fs')
    const path = require('path')
    const VIDEO_EXTS = new Set(['.mp4', '.mkv', '.webm', '.avi', '.mov', '.m4v'])

    function walk(dir, pairs = []) {
      let entries
      try { entries = fs.readdirSync(dir, { withFileTypes: true }) } catch { return pairs }
      const byBasename = {}
      for (const e of entries) {
        if (e.isDirectory()) { walk(path.join(dir, e.name), pairs); continue }
        const ext = path.extname(e.name).toLowerCase()
        const base = path.basename(e.name, ext)
        if (!byBasename[base]) byBasename[base] = {}
        if (VIDEO_EXTS.has(ext)) byBasename[base].video = path.join(dir, e.name)
        if (ext === '.funscript') byBasename[base].funscript = path.join(dir, e.name)
      }
      for (const [base, files] of Object.entries(byBasename)) {
        if (files.video || files.funscript) {
          pairs.push({
            title: base,
            video: files.video || null,
            funscript: files.funscript || null,
            dir,
          })
        }
      }
      return pairs
    }

    try {
      const dlPath = downloadService.getDownloadPath()
      const pairs = walk(dlPath).sort((a, b) => a.title.localeCompare(b.title))
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
