const path = require('path')
const { ipcMain } = require('electron')
const axios = require('axios')
const { downloadVideoToTemp } = require('../services/stream.service')
const authService = require('../services/auth.service')

function setupPlayerHandlers() {
  ipcMain.handle('player:download-video', async (event, videoUrl) => {
    try {
      const filePath = await downloadVideoToTemp(videoUrl, (percent, eta) => {
        event.sender.send('player:video-progress', percent, eta)
      })
      return { success: true, data: path.basename(filePath) }
    } catch (error) {
      console.error('[player] Video download failed:', error.message)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('player:fetch-funscript', async (_event, url) => {
    try {
      const headers = authService.getAuthHeaders()
      const response = await axios.get(url, {
        headers,
        timeout: 15000,
        maxRedirects: 5,
        responseType: 'text',
      })
      return { success: true, data: response.data }
    } catch (error) {
      const status = error.response?.status
      console.error('[player] Funscript fetch failed:', error.message)
      return { success: false, error: status ? `HTTP ${status}` : error.message }
    }
  })
}

module.exports = { setupPlayerHandlers }
