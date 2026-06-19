const { app, BrowserWindow, ipcMain, shell, session } = require('electron')
const { createMainWindow, createLoginWindow, getMainWindow, getLoginWindow } = require('./window')
const { setupTopicsHandlers } = require('./ipc/topics.handler')
const { setupAuthHandlers } = require('./ipc/auth.handler')
const { setupDownloadHandlers } = require('./ipc/download.handler')
const { setupAdBlockerHandlers } = require('./ipc/adblocker.handler')
const { setupNotificationsHandlers } = require('./ipc/notifications.handler')
const authService = require('./services/auth.service')
const adBlockerService = require('./services/adblocker.service')
const updateService = require('./services/update.service')
const downloadService = require('./services/download.service')
const notificationsService = require('./services/notifications.service')
const store = require('./store/config')
const fs = require('fs')
const path = require('path')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (require('electron-squirrel-startup')) {
  app.quit()
}

// Keep a global reference of the window object

let mainWindow = null
// eslint-disable-next-line no-unused-vars
let loginWindow = null

async function initialize() {
  // Set up IPC handlers
  setupTopicsHandlers()
  setupAuthHandlers()
  setupDownloadHandlers()
  setupAdBlockerHandlers()
  setupNotificationsHandlers()

  // Initialize adblocker (async now with EasyList download)
  await adBlockerService.initialize()

  // Check if user is logged in
  const isLoggedIn = await authService.validateSession()

  if (isLoggedIn) {
    mainWindow = createMainWindow()
    notificationsService.start(mainWindow)
    // Initialize the auto-updater after the main window exists (no-op in dev /
    // on unsupported platforms). It downloads silently and notifies the renderer.
    updateService.init()
    downloadService.updateYtDlp().catch(() => {})
  } else {
    loginWindow = createLoginWindow()
  }
}

app.whenReady().then(initialize)

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  // On macOS, re-create a window when dock icon is clicked
  if (BrowserWindow.getAllWindows().length === 0) {
    initialize()
  }
})

// Handle external links
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url)
  return true
})

// Handle login detected from the login shell webview
ipcMain.on('login-detected', async () => {
  // Small delay to ensure cookies are committed to the session
  await new Promise(resolve => setTimeout(resolve, 600))
  const ses = session.fromPartition('persist:scriptstash')
  const cookies = await ses.cookies.get({ domain: 'discuss.eroscripts.com' })
  const authCookies = {}
  cookies.forEach(cookie => {
    if (cookie.name === '_t' || cookie.name === '_forum_session') {
      authCookies[cookie.name] = cookie.value
    }
  })
  if (!authCookies._t) return
  await authService.saveCookies(authCookies)
  const loginWin = getLoginWindow()
  if (loginWin && !loginWin.isDestroyed()) loginWin.close()
  mainWindow = createMainWindow()
  notificationsService.start(mainWindow)
  updateService.init()
  downloadService.updateYtDlp().catch(() => {})
})

ipcMain.on('login-window-close', () => {
  const loginWin = getLoginWindow()
  if (loginWin && !loginWin.isDestroyed()) loginWin.close()
})

// Handle logout - switch from main to login window
ipcMain.on('logout', async () => {
  await authService.clearSession()
  await session.fromPartition('persist:scriptstash').clearStorageData()
  const mainWin = getMainWindow()
  if (mainWin) {
    mainWin.close()
  }
  loginWindow = createLoginWindow()
})

// Window control handlers
ipcMain.on('window-minimize', event => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.minimize()
})

ipcMain.on('window-maximize', event => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) {
    if (win.isMaximized()) {
      win.unmaximize()
    } else {
      win.maximize()
    }
  }
})

ipcMain.on('window-close', event => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) win.close()
})

// Settings handlers
ipcMain.handle('get-settings', async () => {
  const data = store.get('settings', {
    autoDownload: false,
    notifications: false,
    maxSimultaneousDownloads: 10,
    devMode: false,
    autoCheckUpdates: true,
    adBlocker: false,
  })
  return { success: true, data }
})

ipcMain.handle('save-settings', async (event, settings) => {
  const currentSettings = store.get('settings', {})
  const updatedSettings = { ...currentSettings, ...settings }
  store.set('settings', updatedSettings)
  return updatedSettings
})

// Update check handlers
ipcMain.handle('check-for-updates', async () => {
  return await updateService.checkForUpdates()
})

ipcMain.handle('get-update-status', () => {
  return updateService.getStatus()
})

ipcMain.handle('install-update', () => {
  return updateService.installUpdate()
})

ipcMain.handle('get-changelog', () => {
  try {
    // Works in both dev and packaged (Electron patches fs to read from asars)
    const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')
    const text = fs.readFileSync(changelogPath, 'utf8')
    return { success: true, data: text }
  } catch {
    return { success: false, data: null }
  }
})

ipcMain.handle('get-app-version', () => {
  return { success: true, data: app.getVersion() }
})

ipcMain.handle('open-devtools', event => {
  const win = BrowserWindow.fromWebContents(event.sender)
  win?.webContents.openDevTools()
})

ipcMain.handle('clear-cache', async event => {
  const win = BrowserWindow.fromWebContents(event.sender)
  if (win) await win.webContents.session.clearCache()
  return { success: true }
})
