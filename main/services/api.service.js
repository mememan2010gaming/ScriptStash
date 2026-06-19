const axios = require('axios')
const authService = require('./auth.service')

const BASE_URL = 'https://discuss.eroscripts.com'
const RateLimiter = require('./rate-limiter.service')
const ApiCache = require('./api-cache.service')

class ApiService {
  constructor() {
    this.rateLimiter = new RateLimiter({ maxTokens: 10, refillRate: 10, refillInterval: 10000 })
    this.cache = new ApiCache({ maxSize: 200 })
    this.maxRetries = 3
  }

  /**
   * Make authenticated API request with caching, rate limiting, and retry logic
   */
  async request(endpoint, options = {}) {
    const method = options.method || 'GET'

    // Check cache for GET requests (unless force refresh)
    if (method === 'GET' && !options.force) {
      const cached = this.cache.get(endpoint, options.params)
      if (cached) return cached
    }

    // Acquire rate limiter token
    await this.rateLimiter.acquire()

    const headers = authService.getAuthHeaders()
    let lastError = null

    // Retry logic with exponential backoff
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        const response = await axios({
          url: `${BASE_URL}${endpoint}`,
          method,
          headers: {
            ...headers,
            ...options.headers,
          },
          params: options.params,
          data: options.data,
          timeout: options.timeout || 15000,
        })

        // Cache successful GET responses
        if (method === 'GET') {
          this.cache.set(endpoint, options.params, response.data)
        }

        return response.data
      } catch (error) {
        lastError = error
        const status = error.response?.status

        // Don't retry client errors (except 429 rate limit)
        if (status && status >= 400 && status < 500 && status !== 429) {
          break
        }

        // For 429, wait longer
        if (status === 429) {
          const retryAfter = error.response?.headers?.['retry-after']
          const waitMs = retryAfter ? parseInt(retryAfter, 10) * 1000 : 5000
          await this._delay(Math.min(waitMs, 30000))
          continue
        }

        // Exponential backoff for 5xx and network errors
        if (attempt < this.maxRetries) {
          const delay = Math.min(1000 * Math.pow(2, attempt), 10000)
          console.warn(
            `API retry ${attempt + 1}/${this.maxRetries} for ${endpoint} after ${delay}ms`
          )
          await this._delay(delay)
        }
      }
    }

    // All retries exhausted
    const status = lastError?.response?.status
    const errorInfo = {
      message: lastError?.message || 'Request failed',
      status,
      endpoint,
      retryable: !status || status >= 500 || status === 429,
    }
    console.error(`API Error [${endpoint}]:`, errorInfo.message)
    const err = new Error(errorInfo.message)
    err.status = status
    err.endpoint = endpoint
    err.retryable = errorInfo.retryable
    throw err
  }

  _delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Get paginated list of topics from free-scripts category
   * @param {number} page - Page number (0-indexed)
   * @returns {Promise<Object>} Topics list with users data
   */
  async getTopics(page = 0, sort = 'latest') {
    const data = await this.request(`/c/scripts/free-scripts/14/l/${sort}.json`, {
      params: {
        filter: sort === 'new' ? 'new' : 'default',
        page,
      },
    })

    // Process and enhance topics data
    const users = this.createUsersMap(data.users || [])
    const topics = (data.topic_list?.topics || []).map(topic => this.enhanceTopic(topic, users))

    return {
      topics,
      users: data.users || [],
      perPage: data.topic_list?.per_page || 30,
      topTags: data.topic_list?.top_tags || [],
      hasMore: !!data.topic_list?.more_topics_url,
      page,
    }
  }

  /**
   * Get paginated list of topics from paid-scripts category
   * @param {number} page - Page number (0-indexed)
   * @returns {Promise<Object>} Topics list with users data
   */
  async getPaidTopics(page = 0, sort = 'latest') {
    const data = await this.request(`/c/scripts/paid-scripts/15/l/${sort}.json`, {
      params: {
        filter: sort === 'new' ? 'new' : 'default',
        page,
      },
    })

    // Process and enhance topics data
    const users = this.createUsersMap(data.users || [])
    const topics = (data.topic_list?.topics || []).map(topic => this.enhanceTopic(topic, users))

    return {
      topics,
      users: data.users || [],
      perPage: data.topic_list?.per_page || 30,
      topTags: data.topic_list?.top_tags || [],
      hasMore: !!data.topic_list?.more_topics_url,
      page,
      isPaid: true,
    }
  }

  /**
   * Get topic ID from URL slug
   * @param {string} slug - Topic slug from URL (e.g., "love-wolf-collection")
   * @param {number} topicId - Topic ID from URL
   * @returns {Promise<Object>} Topic details
   */
  async getTopicBySlug(slug, topicId) {
    // If we have an ID, use it directly
    if (topicId) {
      return this.getTopicDetails(topicId)
    }
    // Otherwise try with just the slug
    const data = await this.request(`/t/${slug}.json`)
    return this.getTopicDetails(data.id)
  }

  /**
   * Parse topic URL and extract ID/slug
   * @param {string} url - Full topic URL
   * @returns {Object|null} Parsed topic info or null if invalid
   */
  parseTopicUrl(url) {
    // Match patterns like:
    // https://discuss.eroscripts.com/t/topic-slug/12345
    // https://discuss.eroscripts.com/t/topic-slug/12345/2 (with post number)
    const match = url.match(/discuss\.eroscripts\.com\/t\/([^/]+)\/?(\d+)?/)
    if (match) {
      return {
        slug: match[1],
        id: match[2] ? parseInt(match[2], 10) : null,
      }
    }
    return null
  }

  /**
   * Get detailed information about a specific topic
   * @param {number} topicId - Topic ID
   * @returns {Promise<Object>} Full topic details with posts
   */
  async getTopicDetails(topicId) {
    const data = await this.request(`/t/${topicId}.json`)

    // Process posts and extract downloads
    const posts = (data.post_stream?.posts || []).map(post => this.enhancePost(post))
    const downloads = this.extractDownloads(posts)
    const opUserId = posts[0]?.userId || null
    downloads.rankedVideos = this.rankVideos(downloads.videos, opUserId)

    return {
      id: data.id,
      title: data.title,
      fancyTitle: data.fancy_title,
      slug: data.slug,
      imageUrl: data.image_url,
      thumbnails: data.thumbnails || [],
      tags: data.tags || [],
      tagsDescriptions: data.tags_descriptions || {},
      views: data.views,
      postsCount: data.posts_count,
      likeCount: data.like_count,
      createdAt: data.created_at,
      lastPostedAt: data.last_posted_at,
      categoryId: data.category_id,
      closed: data.closed,
      archived: data.archived,
      pinned: data.pinned,
      posts,
      downloads,
      mainPost: posts[0] || null,
      comments: posts.slice(1),
    }
  }

  /**
   * Create a map of users by ID for quick lookup
   */
  createUsersMap(users) {
    const map = {}
    users.forEach(user => {
      map[user.id] = user
    })
    return map
  }

  /**
   * Enhance topic with computed properties
   */
  enhanceTopic(topic, usersMap) {
    // Find the original poster
    const posterUserId = topic.posters?.[0]?.user_id
    const author = posterUserId ? usersMap[posterUserId] : null

    // Get best thumbnail
    const thumbnail = this.getBestThumbnail(topic.thumbnails, topic.image_url)

    return {
      id: topic.id,
      slug: topic.slug,
      title: topic.title,
      fancyTitle: topic.fancy_title,
      excerpt: topic.excerpt,
      imageUrl: topic.image_url,
      thumbnail,
      tags: (topic.tags || []).map(t => (typeof t === 'string' ? t : t?.name)).filter(Boolean),
      views: topic.views,
      postsCount: topic.posts_count,
      replyCount: topic.reply_count,
      likeCount: topic.like_count,
      createdAt: topic.created_at,
      lastPostedAt: topic.last_posted_at,
      bumpedAt: topic.bumped_at,
      pinned: topic.pinned,
      closed: topic.closed,
      archived: topic.archived,
      author: author
        ? {
            id: author.id,
            username: author.username,
            name: author.name,
            avatar: this.getAvatarUrl(author.avatar_template, 48),
          }
        : null,
    }
  }

  /**
   * Enhance post with processed data
   */
  enhancePost(post) {
    return {
      id: post.id,
      postNumber: post.post_number,
      username: post.username,
      userId: post.user_id,
      avatar: this.getAvatarUrl(post.avatar_template, 48),
      cooked: post.cooked,
      createdAt: post.created_at,
      reads: post.reads,
      linkCounts: post.link_counts || [],
      likeCount: this.getLikeCount(post.actions_summary),
    }
  }

  /**
   * Get like count from actions summary
   */
  getLikeCount(actionsSummary) {
    if (!actionsSummary) return 0
    const likeAction = actionsSummary.find(a => a.id === 2)
    return likeAction ? likeAction.count : 0
  }

  /**
   * Get best available thumbnail URL
   */
  getBestThumbnail(thumbnails, fallbackUrl) {
    if (thumbnails && thumbnails.length > 0) {
      // Sort by size and get largest
      const sorted = [...thumbnails].sort((a, b) => (b.max_width || 0) - (a.max_width || 0))
      return sorted[0].url
    }
    return fallbackUrl || null
  }

  /**
   * Convert avatar template to full URL
   */
  getAvatarUrl(template, size = 48) {
    if (!template) return null
    const url = template.replace('{size}', size.toString())
    return url.startsWith('http') ? url : `${BASE_URL}${url}`
  }

  /**
   * Extract all downloadable files from posts (including comments/replies)
   */
  extractDownloads(posts) {
    const funscripts = []
    const videos = []
    const images = []

    posts.forEach((post, index) => {
      const isReply = index > 0 // First post is OP, rest are replies

      // Extract from link_counts
      ;(post.linkCounts || []).forEach(link => {
        const url = link.url
        const title = link.title || ''

        if (
          (link.internal || url.includes('eroscripts-discourse.eroscripts.com')) &&
          url.endsWith('.funscript')
        ) {
          funscripts.push({
            url: url.startsWith('http') ? url : `${BASE_URL}${url}`,
            filename: this.getFilenameFromUrl(url),
            title,
            clicks: link.clicks,
            postNumber: post.postNumber,
            fromReply: isReply,
          })
        } else if (!link.internal && this.isVideoLink(url, title)) {
          videos.push({
            url,
            service: this.detectVideoService(url),
            title,
            clicks: link.clicks,
            postNumber: post.postNumber,
            postDate: post.createdAt,
            downloadable: this.isDownloadableInApp(url),
            fromReply: isReply,
          })
        }
      })

      // Extract additional funscripts from cooked HTML
      // Match full <a> tags to get both href and link text
      const linkRegex = /<a[^>]+href="([^"]+\.funscript)"[^>]*>([^<]+)<\/a>/gi
      let linkMatch
      while ((linkMatch = linkRegex.exec(post.cooked)) !== null) {
        const url = linkMatch[1]
        const linkText = linkMatch[2]
        const fullUrl = url.startsWith('http') ? url : `${BASE_URL}${url}`

        // Avoid duplicates
        if (!funscripts.find(f => f.url === fullUrl)) {
          // Use link text as filename if it looks like a filename (ends with .funscript)
          let filename
          if (linkText && linkText.trim().endsWith('.funscript')) {
            filename = linkText.trim()
          } else {
            filename = this.getFilenameFromUrl(url)
          }

          funscripts.push({
            url: fullUrl,
            filename,
            title: '',
            clicks: 0,
            postNumber: post.postNumber,
            fromReply: isReply,
          })
        }
      }

      // Extract video links from HTML (covers links missing from link_counts, all posts)
      const urlMatches = post.cooked.match(/href="([^"]+)"/gi) || []
      urlMatches.forEach(match => {
        const urlMatch = match.match(/href="([^"]+)"/i)
        if (!urlMatch) return
        const url = urlMatch[1]
        if (!url.startsWith('http')) return
        if (!this.isVideoLink(url, '')) return
        if (videos.find(v => v.url === url)) return
        videos.push({
          url,
          service: this.detectVideoService(url),
          title: this.extractTitleFromHTML(post.cooked, url) || url,
          clicks: 0,
          postNumber: post.postNumber,
          postDate: post.createdAt,
          downloadable: this.isDownloadableInApp(url),
          fromReply: isReply,
        })
      })
    })

    return { funscripts, videos, images }
  }

  /**
   * Try to extract a title/description near a URL in HTML
   */
  extractTitleFromHTML(html, url) {
    try {
      // Find the link in HTML and try to get surrounding text
      const urlIndex = html.indexOf(url)
      if (urlIndex === -1) return null

      // Get context around the URL
      const contextStart = Math.max(0, urlIndex - 100)
      const contextEnd = Math.min(html.length, urlIndex + url.length + 100)
      const context = html.substring(contextStart, contextEnd)

      // Try to extract link text
      const linkTextMatch = context.match(/>([^<]+)<\/a>/i)
      if (linkTextMatch && linkTextMatch[1].trim()) {
        return linkTextMatch[1].trim()
      }

      return null
    } catch {
      return null
    }
  }

  /**
   * Extract filename from URL
   */
  getFilenameFromUrl(url) {
    try {
      const parts = url.split('/')
      const filename = parts[parts.length - 1]
      return decodeURIComponent(filename.split('?')[0])
    } catch {
      return 'download.funscript'
    }
  }

  /**
   * Check if link is likely a video or downloadable media file
   */
  isVideoLink(url, title) {
    const lowerUrl = url.toLowerCase()

    // Direct video/media file by extension
    const pathNoQuery = lowerUrl.split('?')[0]
    const videoExts = [
      '.mp4',
      '.mkv',
      '.avi',
      '.webm',
      '.mov',
      '.m4v',
      '.flv',
      '.ts',
      '.wmv',
      '.mpg',
      '.mpeg',
    ]
    if (videoExts.some(ext => pathNoQuery.endsWith(ext))) return true

    // Known video/file hosting sites
    const videoHosts = [
      'mega.nz',
      'gofile.io',
      'drive.google.com',
      'mediafire.com',
      'pixeldrain.com',
      'bunkr.',
      'bunkrr.',
      'spankbang',
      'pornhub',
      'xvideos',
      'xnxx',
      'xhamster',
      'rule34video',
      'redgifs.com',
      'thisvid.com',
      'erome.com',
      'coomer.party',
      'kemono.party',
      'cyberdrop.me',
      'twitter.com/i/videos',
      'x.com',
      'fantia.jp',
      'iwara.tv',
      'iwara.ai',
      'eporner.com',
      'pmvhaven.com',
      'hqporner.com',
      'faptap.net',
      'hstream.moe',
      'noodlemagazine.com',
      'e621.net',
      'boosty.to',
      'bilibili.com',
      'vk.com',
      'pixiv.net',
      'subscribestar.',
      'fanbox.cc',
    ]
    if (videoHosts.some(host => lowerUrl.includes(host))) return true

    // Title contains a file size (e.g. "720p 1.2 GB")
    return /\d+(\.\d+)?\s*(GB|MB|gb|mb)/i.test(title)
  }

  /**
   * Check if URL can be downloaded directly in the app
   */
  isDownloadableInApp(url) {
    const lowerUrl = url.toLowerCase()

    // Direct media file URLs are always downloadable
    const pathNoQuery = lowerUrl.split('?')[0]
    const videoExts = ['.mp4', '.mkv', '.avi', '.webm', '.mov', '.m4v', '.flv', '.ts', '.wmv']
    if (videoExts.some(ext => pathNoQuery.endsWith(ext))) return true

    // Sites supported via yt-dlp or direct download
    const downloadableSites = [
      'pixeldrain.com',
      'bunkr.',
      'bunkrr.',
      'pornhub.com',
      'xvideos.com',
      'xnxx.com',
      'xhamster.com',
      'rule34video',
      'spankbang.com',
      'redgifs.com',
      'erome.com',
      'coomer.party',
      'kemono.party',
      'cyberdrop.me',
      'thisvid.com',
      'iwara.tv',
      'iwara.ai',
      'eporner.com',
      'hqporner.com',
      'noodlemagazine.com',
      'boosty.to',
      'bilibili.com',
      'vk.com',
      'pixiv.net',
      'subscribestar.',
      'fanbox.cc',
    ]
    return downloadableSites.some(site => lowerUrl.includes(site))
  }

  /**
   * Detect video hosting service from URL
   */
  detectVideoService(url) {
    const lowerUrl = url.toLowerCase()
    if (lowerUrl.includes('mega.nz')) return 'MEGA'
    if (lowerUrl.includes('gofile.io')) return 'Gofile'
    if (lowerUrl.includes('drive.google.com')) return 'Google Drive'
    if (lowerUrl.includes('mediafire.com')) return 'MediaFire'
    if (lowerUrl.includes('pixeldrain.com')) return 'Pixeldrain'
    if (lowerUrl.includes('bunkr')) return 'Bunkr'
    if (lowerUrl.includes('spankbang')) return 'SpankBang'
    if (lowerUrl.includes('pornhub')) return 'Pornhub'
    if (lowerUrl.includes('xvideos')) return 'XVideos'
    if (lowerUrl.includes('xnxx')) return 'XNXX'
    if (lowerUrl.includes('xhamster')) return 'xHamster'
    if (lowerUrl.includes('rule34video')) return 'Rule34Video'
    if (lowerUrl.includes('redgifs.com')) return 'RedGIFs'
    if (lowerUrl.includes('erome.com')) return 'Erome'
    if (lowerUrl.includes('coomer.party')) return 'Coomer'
    if (lowerUrl.includes('kemono.party')) return 'Kemono'
    if (lowerUrl.includes('cyberdrop.me')) return 'Cyberdrop'
    if (lowerUrl.includes('thisvid.com')) return 'ThisVid'
    if (lowerUrl.includes('fantia.jp')) return 'Fantia'
    if (lowerUrl.includes('twitter.com') || lowerUrl.includes('x.com')) return 'X (Twitter)'
    if (lowerUrl.includes('iwara.tv') || lowerUrl.includes('iwara.ai')) return 'Iwara'
    if (lowerUrl.includes('eporner.com')) return 'EPorner'
    if (lowerUrl.includes('pmvhaven.com')) return 'PMVHaven'
    if (lowerUrl.includes('hqporner.com')) return 'HQPorner'
    if (lowerUrl.includes('faptap.net')) return 'FapTap'
    if (lowerUrl.includes('hstream.moe')) return 'HStream'
    if (lowerUrl.includes('noodlemagazine.com')) return 'NoodleMagazine'
    if (lowerUrl.includes('e621.net')) return 'e621'
    if (lowerUrl.includes('boosty.to')) return 'Boosty'
    if (lowerUrl.includes('bilibili.com')) return 'Bilibili'
    if (lowerUrl.includes('vk.com')) return 'VK'
    if (lowerUrl.includes('pixiv.net')) return 'Pixiv'
    if (lowerUrl.includes('subscribestar.')) return 'SubscribeStar'
    if (lowerUrl.includes('fanbox.cc')) return 'Fanbox'
    return 'External'
  }

  /**
   * Get user profile data (includes muted_tags)
   * @param {string} username - Username to fetch
   */
  async getUserProfile(username) {
    const data = await this.request(`/u/${username}.json`)
    return {
      id: data.user?.id,
      username: data.user?.username,
      avatar: this.getAvatarUrl(data.user?.avatar_template, 90),
      mutedTags: data.user?.user_option?.muted_tags || [],
      trackedTags: data.user?.user_option?.tracked_tags || [],
      watchedTags: data.user?.user_option?.watched_tags || [],
    }
  }

  /**
   * Update user's muted tags on EroScripts
   * @param {string} username - Username
   * @param {string[]} mutedTags - Array of tags to mute
   */
  async updateMutedTags(username, mutedTags) {
    const headers = authService.getAuthHeaders()

    // Need to get CSRF token first
    const csrfResponse = await axios.get(`${BASE_URL}/session/csrf.json`, {
      headers,
      timeout: 10000,
    })

    const csrfToken = csrfResponse.data.csrf

    const response = await axios.put(
      `${BASE_URL}/u/${username}.json`,
      `muted_tags=${mutedTags.join('%2C')}&tracked_tags=&watched_tags=&watching_first_post_tags=`,
      {
        headers: {
          ...headers,
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRF-Token': csrfToken,
        },
        timeout: 15000,
      }
    )

    return response.data
  }

  /**
   * Search for tags with autocomplete
   * @param {string} query - Search query
   * @returns {Promise<Array>} Matching tags
   */
  async searchTags(query) {
    const data = await this.request('/tags/filter/search', {
      params: {
        q: query,
        limit: 100,
      },
    })

    return (data.results || []).map(tag => ({
      id: tag.id,
      name: tag.name,
      description: tag.description,
      count: tag.count,
    }))
  }

  /**
   * Get topics filtered by tag
   * @param {string} tag - Tag to filter by
   * @param {number} page - Page number
   * @returns {Promise<Object>} Topics list
   */
  async getTopicsByTag(tag, page = 0) {
    const data = await this.request(
      `/tags/c/scripts/free-scripts/14/${encodeURIComponent(tag)}/l/latest.json`,
      {
        params: {
          match_all_tags: true,
          page,
          tags: tag,
        },
      }
    )

    const users = this.createUsersMap(data.users || [])
    const topics = (data.topic_list?.topics || []).map(topic => this.enhanceTopic(topic, users))

    return {
      topics,
      users: data.users || [],
      perPage: data.topic_list?.per_page || 30,
      topTags: data.topic_list?.top_tags || [],
      hasMore: !!data.topic_list?.more_topics_url,
      page,
      tag,
    }
  }

  /**
   * Get new topics (unread/new to user)
   * @returns {Promise<Object>} New topics list
   */
  async getNewTopics() {
    const data = await this.request('/c/scripts/free-scripts/14/l/new.json', {
      params: {
        filter: 'new',
      },
    })

    const users = this.createUsersMap(data.users || [])
    const topics = (data.topic_list?.topics || []).map(topic => this.enhanceTopic(topic, users))

    return {
      topics,
      users: data.users || [],
      topTags: data.topic_list?.top_tags || [],
      count: topics.length,
    }
  }

  /**
   * Dismiss all new topics (mark as read)
   */
  async dismissNewTopics() {
    const headers = authService.getAuthHeaders()

    // Get CSRF token first
    const csrfResponse = await axios.get(`${BASE_URL}/session/csrf.json`, {
      headers,
      timeout: 10000,
    })

    const csrfToken = csrfResponse.data.csrf

    await axios.put(`${BASE_URL}/topics/reset-new`, null, {
      headers: {
        ...headers,
        'X-CSRF-Token': csrfToken,
      },
      timeout: 15000,
    })

    return { success: true }
  }

  /**
   * Rank video links by recency, OP authorship, and host reliability.
   * Returns array sorted best-first with isBest:true on index 0.
   */
  rankVideos(videos, opUserId = null) {
    if (!videos || videos.length === 0) return []

    const HOST_PRIORITY = {
      'pixeldrain.com': 5,
      'bunkr.': 4,
      'bunkrr.': 4,
      'gofile.io': 3,
      'mega.nz': 2,
    }

    const score = v => {
      let s = (v.postNumber || 0) * 2
      if (opUserId && v.userId === opUserId) s += 1000
      for (const [host, pts] of Object.entries(HOST_PRIORITY)) {
        if ((v.url || '').toLowerCase().includes(host)) {
          s += pts * 10
          break
        }
      }
      s += (v.clicks || 0) * 0.1
      return s
    }

    // De-duplicate by normalized URL
    const seen = new Set()
    const unique = videos.filter(v => {
      const key = (v.url || '')
        .replace(/^https?:\/\/(www\.)?/, '')
        .toLowerCase()
        .split('?')[0]
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })

    const sorted = [...unique].sort((a, b) => score(b) - score(a))
    return sorted.map((v, i) => ({ ...v, isBest: i === 0 }))
  }

  /**
   * Full-text topic search via Discourse /search.json endpoint
   */
  async searchTopics(query, page = 0) {
    const data = await this.request('/search.json', {
      params: { q: query, page: Math.max(1, page + 1), include_blurbs: true },
    })

    const users = this.createUsersMap(data.grouped_search_result?.users || [])
    const topics = (data.topics || []).map(topic => this.enhanceTopic(topic, users))

    return {
      topics,
      hasMore: data.grouped_search_result?.more_full_page_results ?? false,
    }
  }

  async createPost(topicId, raw) {
    return this.request('/posts.json', {
      method: 'POST',
      data: { topic_id: topicId, raw },
    })
  }
}

module.exports = new ApiService()
