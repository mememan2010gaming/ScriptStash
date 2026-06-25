const { app, BrowserWindow, ipcMain, shell, session, protocol, net } = require('electron')
const { pathToFileURL } = require('url')
const { createMainWindow, createLoginWindow, getMainWindow, getLoginWindow } = require('./window')
const { setupTopicsHandlers } = require('./ipc/topics.handler')
const { setupAuthHandlers } = require('./ipc/auth.handler')
const { setupDownloadHandlers } = require('./ipc/download.handler')
const { setupAdBlockerHandlers } = require('./ipc/adblocker.handler')
const { setupNotificationsHandlers } = require('./ipc/notifications.handler')
const { setupPlayerHandlers } = require('./ipc/player.handler')
const { cleanupTempFiles, getTempDir } = require('./services/stream.service')
const authService = require('./services/auth.service')
const adBlockerService = require('./services/adblocker.service')
const updateService = require('./services/update.service')
const downloadService = require('./services/download.service')
const notificationsService = require('./services/notifications.service')
const store = require('./store/config')
const fs = require('fs')
const path = require('path')

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
// Must be called before app is ready
protocol.registerSchemesAsPrivileged([
  { scheme: 'tempfile', privileges: { secure: true, supportFetchAPI: true, stream: true } },
  { scheme: 'localfile', privileges: { secure: true, supportFetchAPI: true, stream: true } },
])

if (require('electron-squirrel-startup')) {
  app.quit()
}

const isTestMode = process.argv.includes('--test-mode')

// In test mode apply headless Chromium switches before the app is ready.
// This lets the e2e suite run without a display (CI / local headless runs).
if (isTestMode) {
  app.commandLine.appendSwitch('headless')
  app.commandLine.appendSwitch('disable-gpu')
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
  setupPlayerHandlers()

  // Serve temp video files to the renderer via tempfile://local/<filename>
  protocol.handle('tempfile', request => {
    const filename = decodeURIComponent(new URL(request.url).pathname.slice(1))
    const filePath = require('path').join(getTempDir(), filename)
    return net.fetch(pathToFileURL(filePath).toString())
  })

  // Serve arbitrary local files to the renderer via localfile://<absolute-path>
  protocol.handle('localfile', request => {
    const raw = decodeURIComponent(new URL(request.url).pathname)
    // On Windows paths come in as /C:/foo/bar — strip the leading slash
    const filePath = process.platform === 'win32' ? raw.replace(/^\//, '') : raw
    return net.fetch(pathToFileURL(filePath).toString())
  })

  // IPC: read a local file as text (used by LibraryView to parse funscripts)
  ipcMain.handle('read-local-file', async (_event, { filePath }) => {
    try {
      const text = fs.readFileSync(filePath, 'utf8')
      return { success: true, data: text }
    } catch (error) {
      return { success: false, error: error.message }
    }
  })

  app.on('will-quit', () => {
    cleanupTempFiles()
  })

  // In test mode skip auth, adblocker init, update checks, and yt-dlp updates —
  // all IPC handlers are mocked by the fixture so none of these are needed.
  if (isTestMode) {
    mainWindow = createMainWindow()
    return
  }

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
