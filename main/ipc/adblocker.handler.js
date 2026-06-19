const { ipcMain } = require('electron')
const adBlockerService = require('../services/adblocker.service')

function setupAdBlockerHandlers() {
  /**
   * Get adblocker status
   */
  ipcMain.handle('get-adblocker-status', async () => {
    return {
      success: true,
      data: {
        enabled: adBlockerService.isEnabled(),
        blockedCount: adBlockerService.getBlockedCount(),
      },
    }
  })

  /**
   * Set adblocker enabled/disabled
   */
  ipcMain.handle('set-adblocker-enabled', async (event, { enabled }) => {
    const result = adBlockerService.setEnabled(enabled)
    return { success: true, data: result }
  })

  /**
   * Reset blocked count
   */
  ipcMain.handle('reset-adblocker-count', async () => {
    adBlockerService.resetBlockedCount()
    return { success: true }
  })

  /**
   * Force update EasyList
   */
  ipcMain.handle('update-adblocker-list', async () => {
    const result = await adBlockerService.forceUpdate()
    return result
  })
}

module.exports = { setupAdBlockerHandlers }
