const { ipcMain } = require('electron')
const axios = require('axios')
const { getStreamUrl } = require('../services/stream.service')
const authService = require('../services/auth.service')

function setupPlayerHandlers() {
  ipcMain.handle('player:get-stream-url', async (_event, videoUrl) => {
    try {
      const url = await getStreamUrl(videoUrl)
      return { success: true, data: url }
    } catch (error) {
      console.error('[stream] Failed to get stream URL:', error.message)
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
      console.error('[stream] Failed to fetch funscript:', error.message)
      return { success: false, error: status ? `HTTP ${status}` : error.message }
    }
  })
}

module.exports = { setupPlayerHandlers }
