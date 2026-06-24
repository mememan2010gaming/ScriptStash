const axios = require('axios')
const authService = require('./auth.service')

const BASE_URL = 'https://discuss.eroscripts.com'
const POLL_INTERVAL = 3 * 60 * 1000

class NotificationsService {
  constructor() {
    this._notifications = []
    this._unreadCount = 0
    this._pollTimer = null
    this._mainWindow = null
    this._avatarCache = {} // username → resolved avatar URL string
    this._failedCache = new Set() // usernames confirmed to have no resolvable avatar
  }

  start(mainWindow) {
    this._mainWindow = mainWindow
    this._poll()
    this._pollTimer = setInterval(() => this._poll(), POLL_INTERVAL)
  }

  stop() {
    if (this._pollTimer) {
      clearInterval(this._pollTimer)
      this._pollTimer = null
    }
    this._mainWindow = null
  }

  getNotifications() {
    return { notifications: this._notifications, unreadCount: this._unreadCount }
  }

  async markRead() {
    const headers = authService.getAuthHeaders()
    const csrfToken = await authService.getCsrfToken()
    await axios.put(
      `${BASE_URL}/notifications/mark-read.json`,
      {},
      {
        headers: { ...headers, 'X-CSRF-Token': csrfToken },
      }
    )
    this._notifications = this._notifications.map(n => ({ ...n, read: true }))
    this._unreadCount = 0
    this._pushUpdate()
  }

  async _poll() {
    try {
      const headers = authService.getAuthHeaders()
      if (!headers.Cookie) return
      const response = await axios.get(`${BASE_URL}/notifications.json`, {
        headers,
        timeout: 10000,
      })
      const raw = response.data.notifications || []
      this._notifications = await this._enrichAvatars(raw, headers)
      this._unreadCount = this._notifications.filter(n => !n.read).length
      this._pushUpdate()
    } catch {
      // silent — network errors or not logged in
    }
  }

  async _enrichAvatars(notifications, headers) {
    // Collect usernames not yet cached (either success or confirmed-failure)
    const missing = [
      ...new Set(
        notifications
          .map(n => n.data?.display_username)
          .filter(u => u && !this._avatarCache[u] && !this._failedCache.has(u))
      ),
    ]

    const CHUNK = 5
    for (let i = 0; i < missing.length; i += CHUNK) {
      const chunk = missing.slice(i, i + CHUNK)
      await Promise.all(
        chunk.map(async username => {
          const url = await this._fetchAvatarUrl(username, headers)
          if (url) {
            this._avatarCache[username] = url
          } else {
            this._failedCache.add(username)
          }
        })
      )
    }

    return notifications.map(n => {
      const username = n.data?.display_username
      const avatarUrl = username ? this._avatarCache[username] : null
      if (!avatarUrl) return n
      return { ...n, data: { ...n.data, avatarUrl } }
    })
  }

  async _fetchAvatarUrl(username, headers) {
    // Try as-is, then lowercase (Discourse usernames are case-insensitive)
    const candidates =
      username === username.toLowerCase() ? [username] : [username, username.toLowerCase()]
    for (const u of candidates) {
      try {
        const res = await axios.get(`${BASE_URL}/u/${encodeURIComponent(u)}.json`, {
          headers,
          timeout: 5000,
        })
        const tpl = res.data?.user?.avatar_template
        if (tpl) {
          return tpl.startsWith('http')
            ? tpl.replace('{size}', '40')
            : `${BASE_URL}${tpl.replace('{size}', '40')}`
        }
      } catch {
        // try next candidate
      }
    }
    return null
  }

  _pushUpdate() {
    if (this._mainWindow && !this._mainWindow.isDestroyed()) {
      this._mainWindow.webContents.send('notifications-updated', {
        notifications: this._notifications,
        unreadCount: this._unreadCount,
      })
    }
  }
}

module.exports = new NotificationsService()
