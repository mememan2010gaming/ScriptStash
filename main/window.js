const { BrowserWindow } = require('electron')
const path = require('path')

let mainWindow = null
let loginWindow = null

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    backgroundColor: '#1a1a2e',
    title: 'ScriptStash',
    frame: false,
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js'),
      webviewTag: true,
    },
    show: false,
  })

  const isDev = process.argv.includes('--dev')

  if (isDev) {
    mainWindow.loadURL('http://localhost:3000')
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/dist/index.html'))
  }

  mainWindow.once('ready-to-show', () => {
    if (!process.argv.includes('--test-mode')) {
      mainWindow.maximize()
      mainWindow.show()
    }
  })

  mainWindow.on('closed', () => {
    mainWindow = null
  })

  // Send maximize/unmaximize state changes to renderer
  mainWindow.on('maximize', () => {
    mainWindow.webContents.send('window-maximized', true)
  })

  mainWindow.on('unmaximize', () => {
    mainWindow.webContents.send('window-maximized', false)
  })

  // Open dev tools in development
  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools()
  }

  return mainWindow
}

function createLoginWindow() {
  loginWindow = new BrowserWindow({
    width: 1000,
    height: 700,
    minWidth: 700,
    minHeight: 500,
    backgroundColor: '#0e0e1a',
    frame: false,
    icon: path.join(__dirname, '../assets/icon.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'login-preload.js'),
      webviewTag: true,
    },
    title: 'ScriptStash — Sign In',
    show: false,
  })

  loginWindow.loadFile(path.join(__dirname, 'login-shell.html'))

  loginWindow.once('ready-to-show', () => {
    loginWindow.show()
  })

  loginWindow.on('closed', () => {
    loginWindow = null
  })

  return loginWindow
}

function getMainWindow() {
  return mainWindow
}

function getLoginWindow() {
  return loginWindow
}

module.exports = {
  createMainWindow,
  createLoginWindow,
  getMainWindow,
  getLoginWindow,
}
