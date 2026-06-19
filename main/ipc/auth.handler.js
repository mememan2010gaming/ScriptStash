const { ipcMain, BrowserWindow } = require('electron')
const authService = require('../services/auth.service')
const { createLoginWindow } = require('../window')

function setupAuthHandlers() {
  /**
   * Validate current session
   */
  ipcMain.handle('validate-session', async () => {
    try {
      const result = await authService.validateSession()
      return { success: true, data: result }
    } catch (error) {
      console.error('Error validating session:', error.message)
      return { success: false, error: error.message }
    }
  })

  /**
   * Show login window
   */
  ipcMain.handle('show-login', async () => {
    // Close all windows and show login
    BrowserWindow.getAllWindows().forEach(win => win.close())
    createLoginWindow()
    return { success: true }
  })

  /**
   * Get current user info
   */
  ipcMain.handle('get-current-user', async () => {
    try {
      const result = await authService.validateSession()
      if (result && result.isValid) {
        return { success: true, data: result.user }
      }
      return { success: false, error: 'Not logged in' }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })
}

module.exports = { setupAuthHandlers }
