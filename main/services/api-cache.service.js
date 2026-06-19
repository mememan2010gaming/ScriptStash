/**
 * LRU Cache with TTL for API responses.
 * Reduces redundant API calls and improves perceived performance.
 */
class ApiCache {
  constructor(options = {}) {
    this.maxSize = options.maxSize || 200
    this.defaultTTL = options.defaultTTL || 120000 // 2 min default
    this.cache = new Map() // Map preserves insertion order for LRU

    // Predefined TTLs by endpoint pattern
    this.ttlRules = {
      '/l/latest.json': 120000, // Topic lists: 2 min
      '/l/new.json': 60000, // New topics: 1 min
      '.json': 300000, // Topic details: 5 min (catch-all for /t/ID.json)
      tags: 600000, // Tag data: 10 min
      user: 1800000, // User profiles: 30 min
    }
  }

  /**
   * Generate a cache key from URL and params
   */
  _makeKey(url, params) {
    const paramStr = params ? JSON.stringify(params, Object.keys(params).sort()) : ''
    return `${url}|${paramStr}`
  }

  /**
   * Determine TTL for a given endpoint
   */
  _getTTL(url) {
    for (const [pattern, ttl] of Object.entries(this.ttlRules)) {
      if (url.includes(pattern)) return ttl
    }
    return this.defaultTTL
  }

  /**
   * Get a cached response. Returns null if not found or expired.
   */
  get(url, params) {
    const key = this._makeKey(url, params)
    const entry = this.cache.get(key)

    if (!entry) return null

    // Check TTL
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key)
      return null
    }

    // Move to end (most recently used) — delete and re-insert
    this.cache.delete(key)
    this.cache.set(key, entry)

    return entry.data
  }

  /**
   * Store a response in the cache
   */
  set(url, params, data) {
    const key = this._makeKey(url, params)
    const ttl = this._getTTL(url)

    // If at capacity, remove oldest entry (first in Map)
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value
      this.cache.delete(oldestKey)
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    })
  }

  /**
   * Invalidate a specific cache entry
   */
  invalidate(url, params) {
    const key = this._makeKey(url, params)
    this.cache.delete(key)
  }

  /**
   * Invalidate all entries matching a URL pattern
   */
  invalidatePattern(pattern) {
    for (const key of this.cache.keys()) {
      if (key.includes(pattern)) {
        this.cache.delete(key)
      }
    }
  }

  /**
   * Clear entire cache
   */
  clear() {
    this.cache.clear()
  }

  /**
   * Get cache statistics
   */
  getStats() {
    let expired = 0
    const now = Date.now()
    for (const entry of this.cache.values()) {
      if (now - entry.timestamp > entry.ttl) expired++
    }
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      expired,
      active: this.cache.size - expired,
    }
  }
}

module.exports = ApiCache
