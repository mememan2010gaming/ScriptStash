const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('loginAPI', {
  closeWindow: () => ipcRenderer.send('login-window-close'),
  loginDetected: () => ipcRenderer.send('login-detected'),
})
