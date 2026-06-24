const axios = require('axios')
const store = require('../store/config')

const BASE_URL = 'https://discuss.eroscripts.com'

class AuthService {
  constructor() {
    this.cookies = null
  }

  /**
   * Get stored cookies
   */
  getCookies() {
    if (!this.cookies) {
      this.cookies = store.get('cookies', {})
    }
    return this.cookies
  }

  /**
   * Save cookies to persistent storage
   */
  async saveCookies(cookies) {
    this.cookies = cookies
    store.set('cookies', cookies)
  }

  /**
   * Clear stored session
   */
  async clearSession() {
    this.cookies = null
    this._csrfToken = null
    store.delete('cookies')
  }

  /**
   * Get HTTP headers with authentication cookies
   */
  getAuthHeaders() {
    const cookies = this.getCookies()
    const cookieString = Object.entries(cookies)
      .map(([key, value]) => `${key}=${value}`)
      .join('; ')

    return {
      Cookie: cookieString,
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      Accept: 'application/json',
      Referer: `${BASE_URL}/`,
    }
  }

  /**
   * Validate current session by checking /session/current.json
   */
  async validateSession() {
    const cookies = this.getCookies()

    if (!cookies || !cookies._t) {
      return false
    }

    try {
      const response = await axios.get(`${BASE_URL}/session/current.json`, {
        headers: this.getAuthHeaders(),
        timeout: 10000,
      })

      const data = response.data

      if (data && data.current_user && data.current_user.id) {
        // Convert avatar template to full URL
        let avatarUrl = data.current_user.avatar_template || ''
        if (avatarUrl) {
          avatarUrl = avatarUrl.replace('{size}', '90')
          if (!avatarUrl.startsWith('http')) {
            avatarUrl = `${BASE_URL}${avatarUrl}`
          }
        }
        return {
          isValid: true,
          user: {
            id: data.current_user.id,
            username: data.current_user.username,
            name: data.current_user.name,
            avatar: avatarUrl,
          },
        }
      }

      return false
    } catch (error) {
      console.error('Session validation error:', error.message)

      // 403 means invalid session
      if (error.response && error.response.status === 403) {
        await this.clearSession()
      }

      return false
    }
  }

  /**
   * Fetch and cache the Discourse CSRF token required for POST/PUT/DELETE requests.
   * The token is stable for the lifetime of a session; clear it on logout.
   */
  async getCsrfToken() {
    if (this._csrfToken) return this._csrfToken
    const response = await axios.get(`${BASE_URL}/session/csrf.json`, {
      headers: this.getAuthHeaders(),
      timeout: 10000,
    })
    this._csrfToken = response.data.csrf
    return this._csrfToken
  }

  clearCsrfToken() {
    this._csrfToken = null
  }

  /**
   * Check if user has valid cookies stored
   */
  hasStoredCredentials() {
    const cookies = this.getCookies()
    return cookies && cookies._t
  }
}

module.exports = new AuthService()
