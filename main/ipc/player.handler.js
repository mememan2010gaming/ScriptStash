const { ipcMain } = require('electron')
const { getStreamUrl } = require('../services/stream.service')

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
}

module.exports = { setupPlayerHandlers }
