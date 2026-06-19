const { ipcMain } = require('electron')
const notificationsService = require('../services/notifications.service')

function setupNotificationsHandlers() {
  ipcMain.handle('get-notifications', async () => {
    try {
      return { success: true, data: notificationsService.getNotifications() }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('mark-notifications-read', async () => {
    try {
      await notificationsService.markRead()
      return { success: true }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

module.exports = { setupNotificationsHandlers }
