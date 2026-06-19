/**
 * Token Bucket Rate Limiter
 * Prevents overwhelming the EroScripts forum API with too many requests.
 */
class RateLimiter {
  constructor(options = {}) {
    this.maxTokens = options.maxTokens || 10
    this.refillRate = options.refillRate || 10 // tokens per interval
    this.refillInterval = options.refillInterval || 10000 // ms (10 seconds)
    this.tokens = this.maxTokens
    this.lastRefill = Date.now()
    this.queue = []
    this.refillTimer = null
    this._startRefillTimer()
  }

  _startRefillTimer() {
    this.refillTimer = setInterval(() => {
      this._refill()
      this._processQueue()
    }, 1000) // Check every second
    // Don't prevent app from exiting
    if (this.refillTimer.unref) this.refillTimer.unref()
  }

  _refill() {
    const now = Date.now()
    const elapsed = now - this.lastRefill
    const tokensToAdd = Math.floor((elapsed / this.refillInterval) * this.refillRate)
    if (tokensToAdd > 0) {
      this.tokens = Math.min(this.maxTokens, this.tokens + tokensToAdd)
      this.lastRefill = now
    }
  }

  _processQueue() {
    while (this.queue.length > 0 && this.tokens > 0) {
      this.tokens--
      const resolve = this.queue.shift()
      resolve()
    }
  }

  /**
   * Acquire a token. Returns a promise that resolves when a token is available.
   */
  acquire() {
    this._refill()
    if (this.tokens > 0) {
      this.tokens--
      return Promise.resolve()
    }
    return new Promise(resolve => {
      this.queue.push(resolve)
    })
  }

  /**
   * Get current status
   */
  getStatus() {
    return {
      availableTokens: this.tokens,
      queueLength: this.queue.length,
      maxTokens: this.maxTokens,
    }
  }

  /**
   * Destroy the limiter and clear timers
   */
  destroy() {
    if (this.refillTimer) {
      clearInterval(this.refillTimer)
      this.refillTimer = null
    }
    // Resolve all queued requests
    while (this.queue.length > 0) {
      const resolve = this.queue.shift()
      resolve()
    }
  }
}

module.exports = RateLimiter
