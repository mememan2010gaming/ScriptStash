const Store = require('electron-store')
const crypto = require('crypto')

// Generate a machine-specific encryption key for local storage security
// This is NOT a secret - it's just to prevent casual file reading
const getMachineKey = () => {
  const machineId =
    process.env.SCRIPTSTASH_ENCRYPTION_KEY ||
    `scriptstash-${require('os').hostname()}-${require('os').userInfo().username}`
  return crypto.createHash('sha256').update(machineId).digest('hex').slice(0, 32)
}

const store = new Store({
  name: 'scriptstash-config',
  encryptionKey: getMachineKey(),
  schema: {
    cookies: {
      type: 'object',
      properties: {
        _t: { type: 'string' },
        _forum_session: { type: 'string' },
      },
    },
    downloadPath: {
      type: 'string',
      default: '',
    },
    libraryPath: {
      type: 'string',
      default: '',
    },
    downloadHistory: {
      type: 'array',
      default: [],
    },
    settings: {
      type: 'object',
      default: {
        autoDownload: false,
        showNotifications: true,
        maxSimultaneousDownloads: 10,
        developerMode: false,
        checkForUpdates: true,
      },
    },
  },
})

module.exports = store
