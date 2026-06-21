const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
  // Topics
  getTopics: (page, sort) => ipcRenderer.invoke('get-topics', { page, sort }),
  getPaidTopics: (page, sort) => ipcRenderer.invoke('get-paid-topics', { page, sort }),
  parseTopicUrl: url => ipcRenderer.invoke('parse-topic-url', { url }),
  getTopicDetails: topicId => ipcRenderer.invoke('get-topic-details', { topicId }),
  createPost: (topicId, raw) => ipcRenderer.invoke('create-post', { topicId, raw }),
  getUserProfile: username => ipcRenderer.invoke('get-user-profile', { username }),
  updateMutedTags: (username, mutedTags) =>
    ipcRenderer.invoke('update-muted-tags', { username, mutedTags }),
  searchTags: query => ipcRenderer.invoke('search-tags', { query }),
  searchTopics: (query, page) => ipcRenderer.invoke('search-topics', query, page),
  getTopicsByTag: (tag, page) => ipcRenderer.invoke('get-topics-by-tag', { tag, page }),
  getNewTopics: () => ipcRenderer.invoke('get-new-topics'),
  dismissNewTopics: () => ipcRenderer.invoke('dismiss-new-topics'),

  // Auth
  validateSession: () => ipcRenderer.invoke('validate-session'),
  showLogin: () => ipcRenderer.invoke('show-login'),
  logout: () => ipcRenderer.send('logout'),
  loginSuccess: () => ipcRenderer.send('login-success'),

  // Downloads
  downloadFile: (url, filename, nodeId = null) =>
    ipcRenderer.invoke('download-file', { url, filename, nodeId }),
  getMegaFolderFiles: url => ipcRenderer.invoke('mega:get-folder-files', { url }),
  openExternal: url => ipcRenderer.invoke('open-external', url),
  getDownloadPath: () => ipcRenderer.invoke('get-download-path'),
  setDownloadPath: path => ipcRenderer.invoke('set-download-path', { path }),
  openFolder: path => ipcRenderer.invoke('open-folder', { path }),
  getDownloadHistory: () => ipcRenderer.invoke('get-download-history'),
  clearDownloadHistory: () => ipcRenderer.invoke('clear-download-history'),
  verifyUrl: url => ipcRenderer.invoke('verify-url', { url }),
  getMaxDownloads: () => ipcRenderer.invoke('get-max-downloads'),
  setMaxDownloads: max => ipcRenderer.invoke('set-max-downloads', { max }),
  getYtDlpVersion: () => ipcRenderer.invoke('get-ytdlp-version'),
  updateYtDlp: () => ipcRenderer.invoke('update-ytdlp'),

  // Player
  getStreamUrl: url => ipcRenderer.invoke('player:get-stream-url', url),

  // Settings
  invoke: (channel, data) => ipcRenderer.invoke(channel, data),
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: settings => ipcRenderer.invoke('save-settings', settings),
  getVersion: () => ipcRenderer.invoke('get-app-version'),
  openDevTools: () => ipcRenderer.invoke('open-devtools'),
  clearCache: () => ipcRenderer.invoke('clear-cache'),

  // Updates
  checkForUpdates: () => ipcRenderer.invoke('check-for-updates'),
  getUpdateStatus: () => ipcRenderer.invoke('get-update-status'),
  installUpdate: () => ipcRenderer.invoke('install-update'),
  getAppVersion: () => ipcRenderer.invoke('get-app-version'),
  getChangelog: () => ipcRenderer.invoke('get-changelog'),
  onUpdateAvailable: callback => {
    ipcRenderer.on('update-available', (event, data) => callback(data))
  },
  onUpdateReady: callback => {
    ipcRenderer.on('update-ready', (event, data) => callback(data))
  },

  // AdBlocker
  getAdBlockerStatus: () => ipcRenderer.invoke('get-adblocker-status'),
  setAdBlockerEnabled: enabled => ipcRenderer.invoke('set-adblocker-enabled', { enabled }),
  resetAdBlockerCount: () => ipcRenderer.invoke('reset-adblocker-count'),
  updateAdBlockerList: () => ipcRenderer.invoke('update-adblocker-list'),

  // Listeners
  onDownloadProgress: callback => {
    ipcRenderer.on('download-progress', (event, data) => callback(data))
  },
  onDownloadComplete: callback => {
    ipcRenderer.on('download-complete', (event, data) => callback(data))
  },
  onDownloadError: callback => {
    ipcRenderer.on('download-error', (event, data) => callback(data))
  },
  onDownloadQueued: callback => {
    ipcRenderer.on('download-queued', (event, data) => callback(data))
  },
  onDownloadLog: callback => {
    ipcRenderer.on('download-log', (event, data) => callback(data))
  },
  onLoginComplete: callback => {
    ipcRenderer.on('login-complete', () => callback())
  },

  // Notifications
  getNotifications: () => ipcRenderer.invoke('get-notifications'),
  markNotificationsRead: () => ipcRenderer.invoke('mark-notifications-read'),
  onNotificationsUpdated: callback => {
    ipcRenderer.on('notifications-updated', (_event, data) => callback(data))
  },
  removeNotificationsListener: () => {
    ipcRenderer.removeAllListeners('notifications-updated')
  },

  // Remove listeners
  removeAllListeners: channel => {
    ipcRenderer.removeAllListeners(channel)
  },

  // Window controls
  minimizeWindow: () => ipcRenderer.send('window-minimize'),
  maximizeWindow: () => ipcRenderer.send('window-maximize'),
  closeWindow: () => ipcRenderer.send('window-close'),
  onMaximizeChange: callback => {
    ipcRenderer.on('window-maximized', (event, isMaximized) => callback(isMaximized))
  },
})
