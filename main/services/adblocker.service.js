const { session, net } = require('electron')
const path = require('path')
const fs = require('fs')
const store = require('../store/config')

const EASYLIST_URL = 'https://easylist.to/easylist/easylist.txt'
const CACHE_FILE = path.join(require('electron').app.getPath('userData'), 'easylist-cache.txt')
const CACHE_DURATION = 24 * 60 * 60 * 1000 // 24 hours

class AdBlockerService {
  constructor() {
    this.enabled = store.get('settings.adBlockerEnabled', true)
    this.blockedCount = 0
    this.sessionFilter = null
    this.blockList = new Set()
    this.blockPatterns = []
    this.lastUpdate = 0
  }

  /**
   * Download and parse EasyList
   */
  async updateEasyList() {
    try {
      // Check if we have a recent cache
      if (fs.existsSync(CACHE_FILE)) {
        const stats = fs.statSync(CACHE_FILE)
        const age = Date.now() - stats.mtimeMs

        if (age < CACHE_DURATION) {
          console.log('[AdBlocker] Using cached EasyList')
          return this.loadCachedList()
        }
      }

      console.log('[AdBlocker] Downloading EasyList...')

      return new Promise((resolve, reject) => {
        const request = net.request(EASYLIST_URL)
        let data = ''

        request.on('response', response => {
          if (response.statusCode !== 200) {
            // Fallback to cache if download fails
            if (fs.existsSync(CACHE_FILE)) {
              console.log('[AdBlocker] Download failed, using cache')
              return resolve(this.loadCachedList())
            }
            return reject(new Error(`HTTP ${response.statusCode}`))
          }

          response.on('data', chunk => {
            data += chunk.toString()
          })

          response.on('end', () => {
            try {
              // Save to cache
              fs.writeFileSync(CACHE_FILE, data, 'utf8')
              console.log('[AdBlocker] EasyList downloaded and cached')
              this.parseEasyList(data)
              resolve()
            } catch (error) {
              reject(error)
            }
          })
        })

        request.on('error', error => {
          console.error('[AdBlocker] Download error:', error)
          // Fallback to cache
          if (fs.existsSync(CACHE_FILE)) {
            console.log('[AdBlocker] Using cached list after error')
            resolve(this.loadCachedList())
          } else {
            reject(error)
          }
        })

        request.end()
      })
    } catch (error) {
      console.error('[AdBlocker] Update error:', error)
      // Try to load from cache
      if (fs.existsSync(CACHE_FILE)) {
        return this.loadCachedList()
      }
      throw error
    }
  }

  /**
   * Load cached EasyList
   */
  loadCachedList() {
    try {
      const data = fs.readFileSync(CACHE_FILE, 'utf8')
      this.parseEasyList(data)
      return Promise.resolve()
    } catch (error) {
      console.error('[AdBlocker] Cache load error:', error)
      throw error
    }
  }

  /**
   * Parse EasyList format (Adblock Plus syntax)
   */
  parseEasyList(data) {
    this.blockList.clear()
    this.blockPatterns = []

    const lines = data.split('\n')
    let ruleCount = 0

    for (const line of lines) {
      const trimmed = line.trim()

      // Skip comments, empty lines, and element hiding rules
      if (
        !trimmed ||
        trimmed.startsWith('!') ||
        trimmed.startsWith('[') ||
        trimmed.includes('##') ||
        trimmed.includes('#@#')
      ) {
        continue
      }

      // Skip whitelist rules for now
      if (trimmed.startsWith('@@')) {
        continue
      }

      try {
        // Simple domain blocking (||domain.com^)
        const domainMatch = trimmed.match(/^\|\|([a-z0-9.-]+)\^?/)
        if (domainMatch) {
          this.blockList.add(domainMatch[1].toLowerCase())
          ruleCount++
          continue
        }

        // Path-based blocking (/path/*)
        if (trimmed.includes('*') || trimmed.includes('/')) {
          // Convert Adblock Plus syntax to regex
          const pattern = trimmed
            .replace(/\|/g, '') // Remove anchors for simplicity
            .replace(/\^/g, '[/?&=]') // Separator
            .replace(/\*/g, '.*') // Wildcard
            .replace(/\./g, '\\.') // Escape dots
            .replace(/\?/g, '\\?') // Escape question marks

          try {
            this.blockPatterns.push(new RegExp(pattern, 'i'))
            ruleCount++
          } catch (e) {
            // Invalid regex, skip
          }
        }
      } catch (error) {
        // Skip invalid rules
        continue
      }
    }

    this.lastUpdate = Date.now()
    console.log(
      `[AdBlocker] Loaded ${ruleCount} rules (${this.blockList.size} domains, ${this.blockPatterns.length} patterns)`
    )
  }

  /**
   * Check if a URL should be blocked
   */
  shouldBlock(url) {
    if (!this.enabled) return false

    try {
      const urlLower = url.toLowerCase()
      const urlObj = new URL(url)
      const hostname = urlObj.hostname.toLowerCase()

      // Check domain blocklist
      if (this.blockList.has(hostname)) {
        return true
      }

      // Check parent domains (e.g., ads.example.com -> example.com)
      const parts = hostname.split('.')
      for (let i = 1; i < parts.length - 1; i++) {
        const parentDomain = parts.slice(i).join('.')
        if (this.blockList.has(parentDomain)) {
          return true
        }
      }

      // Check patterns (limit to avoid performance issues)
      for (let i = 0; i < Math.min(this.blockPatterns.length, 5000); i++) {
        if (this.blockPatterns[i].test(urlLower)) {
          return true
        }
      }

      return false
    } catch (error) {
      console.error('[AdBlocker] Check error:', error)
      return false
    }
  }

  /**
   * Initialize ad blocking for the webview session
   */
  async initialize() {
    try {
      // Update EasyList if needed
      if (!this.lastUpdate || Date.now() - this.lastUpdate > CACHE_DURATION) {
        await this.updateEasyList()
      }

      // Get the session used by webviews (default session)
      const ses = session.defaultSession

      // Remove any existing filter
      if (this.sessionFilter) {
        try {
          ses.webRequest.onBeforeRequest(null)
        } catch (e) {
          // Ignore if already removed
        }
      }

      // Set up request interception
      ses.webRequest.onBeforeRequest({ urls: ['*://*/*'] }, (details, callback) => {
        if (this.shouldBlock(details.url)) {
          this.blockedCount++
          if (this.blockedCount % 100 === 0) {
            console.log(`[AdBlocker] Blocked ${this.blockedCount} requests`)
          }
          callback({ cancel: true })
        } else {
          callback({})
        }
      })

      this.sessionFilter = true
      console.log('[AdBlocker] Initialized with EasyList')

      return { success: true }
    } catch (error) {
      console.error('[AdBlocker] Initialization error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Enable or disable ad blocking
   */
  setEnabled(enabled) {
    this.enabled = enabled
    store.set('settings.adBlockerEnabled', enabled)

    if (enabled) {
      // Re-initialize to apply blocking
      this.initialize().catch(err => {
        console.error('[AdBlocker] Re-initialization error:', err)
      })
    } else {
      // Remove the filter when disabled
      try {
        const ses = session.defaultSession
        ses.webRequest.onBeforeRequest(null)
        this.sessionFilter = null
        console.log('[AdBlocker] Disabled')
      } catch (error) {
        console.error('[AdBlocker] Disable error:', error)
      }
    }

    return { success: true, enabled }
  }

  /**
   * Check if ad blocking is enabled
   */
  isEnabled() {
    return this.enabled
  }

  /**
   * Get blocked count
   */
  getBlockedCount() {
    return this.blockedCount
  }

  /**
   * Reset blocked count
   */
  resetBlockedCount() {
    this.blockedCount = 0
  }

  /**
   * Force update EasyList
   */
  async forceUpdate() {
    try {
      // Delete cache to force fresh download
      if (fs.existsSync(CACHE_FILE)) {
        fs.unlinkSync(CACHE_FILE)
      }
      await this.updateEasyList()
      await this.initialize()
      return { success: true }
    } catch (error) {
      console.error('[AdBlocker] Force update error:', error)
      return { success: false, error: error.message }
    }
  }
}

module.exports = new AdBlockerService()
