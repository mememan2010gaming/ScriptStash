const { ipcMain, BrowserWindow, shell, dialog } = require('electron')
const downloadService = require('../services/download.service')
const { getMainWindow } = require('../window')

function setupDownloadHandlers() {
  /**
   * Download a file
   */
  ipcMain.handle('download-file', async (event, { url, filename }) => {
    try {
      const window = BrowserWindow.fromWebContents(event.sender) || getMainWindow()
      const result = await downloadService.downloadFile(url, filename, window)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error downloading file:', error.message)
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
}

module.exports = { setupDownloadHandlers }
