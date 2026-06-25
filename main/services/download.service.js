const { app } = require('electron')
const axios = require('axios')
const fs = require('fs')
const path = require('path')
const store = require('../store/config')
const authService = require('./auth.service')
const YTDlpWrap = require('yt-dlp-wrap').default
const { File: MegaFile } = require('megajs')

// Extensions that are served as direct file downloads (not streaming pages)
const DIRECT_FILE_EXTENSIONS = new Set([
  '.funscript',
  '.zip',
  '.rar',
  '.7z',
  '.gz',
  '.tar',
  '.mp4',
  '.mkv',
  '.avi',
  '.webm',
  '.mov',
  '.m4v',
  '.flv',
  '.ts',
  '.csv',
  '.json',
  '.txt',
  '.npy',
])

// Initialize yt-dlp
let ytDlp = null
try {
  ytDlp = new YTDlpWrap()
} catch (error) {
  console.log('yt-dlp not available, will download on first use')
}

class DownloadService {
  constructor() {
    this.activeDownloads = new Map()
    this.downloadQueue = []
    this.downloadPath = store.get('downloadPath') || app.getPath('downloads')
  }

  /**
   * Get max simultaneous downloads from settings
   */
  getMaxSimultaneousDownloads() {
    const settings = store.get('settings') || {}
    return settings.maxSimultaneousDownloads || 10
  }

  /**
   * Set max simultaneous downloads
   */
  setMaxSimultaneousDownloads(max) {
    const settings = store.get('settings') || {}
    settings.maxSimultaneousDownloads = Math.max(1, Math.min(50, max)) // Clamp between 1-50
    store.set('settings', settings)
  }

  /**
   * Process download queue
   */
  async processQueue(window) {
    const maxDownloads = this.getMaxSimultaneousDownloads()

    // Start queued downloads if we have capacity
    while (this.activeDownloads.size < maxDownloads && this.downloadQueue.length > 0) {
      const queuedDownload = this.downloadQueue.shift()
      if (queuedDownload) {
        // Don't await — executeDownload's finally block calls processQueue when done
        this.executeDownload(
          queuedDownload.url,
          queuedDownload.filename,
          window,
          queuedDownload.downloadId,
          queuedDownload.nodeId || null
        ).catch(error => {
          console.error('Download error in queue:', error.message)
        })
      }
    }
  }

  /**
   * Get download directory path
   */
  getDownloadPath() {
    return this.downloadPath
  }

  /**
   * Set download directory path
   */
  setDownloadPath(newPath) {
    this.downloadPath = newPath
    store.set('downloadPath', newPath)
  }

  /**
   * Download a file with progress tracking (with queue support)
   * @param {string} url - File URL
   * @param {string} filename - Destination filename
   * @param {BrowserWindow} window - Window to send progress updates
   */
  async downloadFile(url, filename, window, nodeId = null) {
    const downloadId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Check if we're at max capacity
    const maxDownloads = this.getMaxSimultaneousDownloads()
    if (this.activeDownloads.size >= maxDownloads) {
      // Add to queue
      this.downloadQueue.push({ url, filename, downloadId, nodeId })
      window?.webContents.send('download-queued', {
        url,
        filename,
        downloadId,
        queuePosition: this.downloadQueue.length,
      })
      return { queued: true, downloadId }
    }

    // Start download immediately
    return await this.executeDownload(url, filename, window, downloadId, nodeId)
  }

  /**
   * Execute download (internal method)
   */
  async executeDownload(url, filename, window, downloadId, nodeId = null) {
    // Detect URL type and route to appropriate handler
    const urlType = this.detectUrlType(url)

    try {
      let result
      if (urlType === 'video') {
        try {
          result = await this.downloadVideo(url, filename, window, downloadId)
        } catch (ytErr) {
          const msg = ytErr.message || ''
          const unsupported =
            msg.includes('Unsupported URL') ||
            msg.includes('Unable to extract') ||
            msg.includes('no suitable') ||
            msg.includes('is not a valid URL')
          if (unsupported) {
            this.sendLog(
              window,
              'download',
              `yt-dlp could not handle this URL — trying direct download`
            )
            result = await this.downloadDirect(url, filename, window, downloadId)
          } else {
            throw ytErr
          }
        }
      } else if (urlType === 'pixeldrain') {
        result = await this.downloadFromPixeldrain(url, filename, window, downloadId)
      } else if (urlType === 'gofile') {
        result = await this.downloadFromGofile(url, filename, window, downloadId)
      } else if (urlType === 'bunkr') {
        result = await this.downloadFromBunkr(url, filename, window, downloadId)
      } else if (urlType === 'mega') {
        result = await this.downloadFromMega(url, filename, window, downloadId, nodeId)
      } else {
        // Default: direct download
        result = await this.downloadDirect(url, filename, window, downloadId)
      }
      return result
    } catch (error) {
      if (window && !window.isDestroyed()) {
        window.webContents.send('download-error', {
          url,
          downloadId,
          error: this._cleanErrorMessage(error.message),
        })
      }
      throw error
    } finally {
      this.activeDownloads.delete(url)
      await this.processQueue(window)
    }
  }

  _cleanErrorMessage(msg) {
    if (!msg) return 'Download failed'
    if (msg.includes('410') || msg.includes('Gone'))
      return 'yt-dlp failed (HTTP 410) — try updating yt-dlp in Settings → Downloads'
    if (msg.includes('403') || msg.includes('Forbidden'))
      return 'Access denied (private or age-restricted)'
    if (msg.includes('404') || msg.includes('Not Found')) return 'Video not found'
    if (msg.includes('429') || msg.includes('Too Many')) return 'Rate limited — try again later'
    if (msg.includes('Unsupported URL') || msg.includes('is not a valid URL'))
      return 'Site not supported by downloader'
    if (msg.includes('Unable to extract')) return 'Could not extract video info'
    if (msg.includes('removed') || msg.includes('deleted')) return 'Video has been removed'
    if (msg.includes('not available in your country') || msg.includes('geo'))
      return 'Video not available in your region'
    if (msg.includes('age') || msg.includes('sign in')) return 'Age-restricted — sign in required'
    return msg
      .replace(/^yt-dlp:\s*/i, '')
      .split('\n')[0]
      .slice(0, 120)
  }

  async getYtDlpVersion() {
    try {
      if (!ytDlp) return null
      const v = await ytDlp.execPromise(['--version'])
      return v.trim()
    } catch {
      return null
    }
  }

  async updateYtDlp() {
    await YTDlpWrap.downloadFromGithub()
    ytDlp = new YTDlpWrap()
    return this.getYtDlpVersion()
  }

  /**
   * Detect the type of URL to determine download method.
   *
   * Strategy: file hosts with custom logic are handled explicitly; URLs whose
   * path ends with a known file extension go direct; everything else is sent to
   * yt-dlp, which supports 1000+ sites dynamically. If yt-dlp rejects the URL
   * ("Unsupported URL"), executeDownload falls back to a direct download.
   */
  detectUrlType(url) {
    const lower = url.toLowerCase()

    // File hosts that need custom handling
    if (lower.includes('pixeldrain.com')) return 'pixeldrain'
    if (lower.includes('gofile.io')) return 'gofile'
    if (lower.includes('bunkr.') || lower.includes('bunkrr.')) return 'bunkr'
    if (lower.includes('mega.nz')) return 'mega'

    // URL path ends with a known downloadable extension → serve directly
    try {
      const segments = new URL(url).pathname.split('/')
      const last = segments[segments.length - 1] || ''
      const dotIdx = last.lastIndexOf('.')
      if (dotIdx > 0 && DIRECT_FILE_EXTENSIONS.has(last.slice(dotIdx).toLowerCase())) {
        return 'direct'
      }
    } catch {}

    // Anything else (video pages, social media, etc.) → try yt-dlp first
    return 'video'
  }

  /**
   * Download video using yt-dlp
   */
  async downloadVideo(url, filename, window, downloadId) {
    const sanitizedFilename = this.sanitizeFilename(filename || 'video.mp4')
    // Each video gets its own subfolder: <dlpath>/<title>/<title>.ext
    const outputTemplate = path.join(this.downloadPath, '%(title)s', '%(title)s.%(ext)s')

    if (this.activeDownloads.has(url)) {
      return { error: 'File is already being downloaded' }
    }

    try {
      this.activeDownloads.set(url, downloadId)

      if (!ytDlp) {
        try {
          ytDlp = new YTDlpWrap()
        } catch {
          console.log('Initializing yt-dlp, downloading from GitHub...')
          await YTDlpWrap.downloadFromGithub()
          ytDlp = new YTDlpWrap()
        }
      }

      if (!ytDlp) {
        throw new Error('yt-dlp is not available. Please restart the application.')
      }

      const args = [
        url,
        '-o',
        outputTemplate,
        '--no-playlist',
        '--no-mtime',
        '--newline',
        '--progress',
        '-N',
        '4',
        '--throttled-rate',
        '100K',
      ]

      // Log flags before running
      this.sendLog(window, 'yt-dlp', `Running: yt-dlp ${args.join(' ')}`)

      const execEmitter = ytDlp.exec(args)
      const ytDlpProcess = execEmitter.ytDlpProcess
      let lastProgress = -1
      let capturedPath = null

      const handleLine = line => {
        const trimmed = line.trim()
        if (!trimmed) return
        this.sendLog(window, 'yt-dlp', trimmed)
        // Capture the actual output file path
        const destMatch = trimmed.match(/\[download\] Destination:\s*(.+)/)
        if (destMatch) capturedPath = destMatch[1].trim()
        const mergeMatch = trimmed.match(/\[Merger\] Merging formats into "(.+)"/)
        if (mergeMatch) capturedPath = mergeMatch[1].trim()
        // Parse progress — yt-dlp may write this to stdout or stderr depending on version
        const progressMatch = trimmed.match(/\[download\]\s+(\d+\.?\d*)%/)
        if (progressMatch) {
          const progress = Math.round(parseFloat(progressMatch[1]))
          if (progress > lastProgress) {
            lastProgress = progress
            if (window && !window.isDestroyed()) {
              window.webContents.send('download-progress', {
                downloadId,
                filename: sanitizedFilename,
                url,
                progress,
                bytesReceived: 0,
                totalBytes: 0,
              })
            }
          }
        }
      }

      ytDlpProcess.stdout.on('data', data => {
        for (const line of data.toString().split('\n')) handleLine(line)
      })
      ytDlpProcess.stderr.on('data', data => {
        for (const line of data.toString().split('\n')) handleLine(line)
      })

      await new Promise((resolve, reject) => {
        execEmitter.on('close', resolve)
        execEmitter.on('error', reject)
      })

      this.sendLog(window, 'download', 'yt-dlp download completed successfully')

      const finalFilename = capturedPath ? path.basename(capturedPath) : sanitizedFilename
      const finalPath = capturedPath || this.downloadPath

      let fileSize = 0
      try {
        if (finalPath && fs.existsSync(finalPath)) fileSize = fs.statSync(finalPath).size
      } catch {}

      this.addToHistory({
        filename: finalFilename,
        url,
        path: finalPath,
        size: fileSize,
        completedAt: new Date().toISOString(),
      })

      if (window && !window.isDestroyed()) {
        window.webContents.send('download-complete', {
          url,
          filename: finalFilename,
          downloadId,
          path: finalPath,
          size: fileSize,
        })
      }

      return { success: true, downloadId }
    } catch (error) {
      this.activeDownloads.delete(url)
      throw error
    }
  }

  /**
   * Verify if a URL is accessible and valid
   */
  async verifyUrl(url) {
    try {
      const urlType = this.detectUrlType(url)

      if (urlType === 'pixeldrain') {
        // Verify Pixeldrain URL - supports both /u/ (file) and /l/ (list) formats
        const fileMatch = url.match(/pixeldrain\.com\/u\/([a-zA-Z0-9_-]+)/)
        const listMatch = url.match(/pixeldrain\.com\/l\/([a-zA-Z0-9_-]+)/)

        if (listMatch) {
          // List/folder format - yt-dlp can download these
          try {
            const listId = listMatch[1]
            const response = await axios.get(`https://pixeldrain.com/api/list/${listId}`, {
              timeout: 10000,
              validateStatus: status => status < 500,
            })

            if (response.status === 200 && response.data && response.data.success !== false) {
              // List exists and is accessible - yt-dlp can handle it
              return {
                valid: true,
                isPixeldrainList: true,
                fileCount: response.data.files?.length || 0,
              }
            } else if (response.status === 404) {
              return { valid: false, error: 'List not found' }
            } else {
              return { valid: false, error: 'List unavailable' }
            }
          } catch (error) {
            console.error('Pixeldrain list verification error:', error.message)
            return { valid: false, error: 'Cannot verify list' }
          }
        } else if (fileMatch) {
          // Single file format
          const fileId = fileMatch[1]
          try {
            // Use GET on info endpoint, HEAD doesn't work
            const response = await axios.get(`https://pixeldrain.com/api/file/${fileId}/info`, {
              timeout: 10000,
              validateStatus: status => status < 500,
            })

            if (response.status === 200 && response.data) {
              // Check if file exists and is accessible
              return { valid: true, fileInfo: response.data }
            } else if (response.status === 404) {
              return { valid: false, error: 'File not found' }
            } else {
              return { valid: false, error: 'File unavailable' }
            }
          } catch (error) {
            console.error('Pixeldrain verification error:', error.message)
            return { valid: false, error: 'Cannot verify link' }
          }
        } else {
          return { valid: false, error: 'Invalid Pixeldrain URL format' }
        }
      } else if (urlType === 'bunkr') {
        // Verify Bunkr URL with HEAD request
        try {
          const response = await axios.head(url, {
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: status => status < 500,
          })
          return { valid: response.status === 200 }
        } catch (error) {
          console.error('Bunkr verification error:', error.message)
          // Try GET if HEAD fails
          try {
            const getResponse = await axios.get(url, {
              timeout: 10000,
              maxRedirects: 5,
              maxContentLength: 1024, // Only fetch headers
              validateStatus: status => status < 500,
            })
            return { valid: getResponse.status === 200 }
          } catch (getError) {
            return { valid: false, error: 'File not accessible' }
          }
        }
      } else if (urlType === 'gofile') {
        // Verify Gofile content exists
        try {
          // Extract Gofile ID from URL
          const gofileMatch = url.match(/gofile\.io\/d\/([a-zA-Z0-9]+)/)
          if (!gofileMatch) {
            return { valid: false, needsBrowser: true, error: 'Invalid Gofile URL' }
          }

          // Try to fetch the page to check if content exists
          const response = await axios.get(url, {
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: status => status < 500,
          })

          const htmlContent = response.data

          // Check for "does not exist" or error messages
          if (
            htmlContent.includes('This content does not exist') ||
            htmlContent.includes('content not found') ||
            htmlContent.includes('has been deleted')
          ) {
            return { valid: false, error: 'Content does not exist' }
          }

          // Gofile requires browser interaction for download
          return { valid: false, needsBrowser: true }
        } catch (error) {
          console.error('Gofile verification error:', error.message)
          return { valid: false, error: 'Cannot verify link' }
        }
      } else if (urlType === 'video') {
        // yt-dlp handles this — assume valid if yt-dlp is present (probing every URL is too slow)
        return { valid: ytDlp !== null }
      } else if (urlType === 'mega') {
        try {
          const root = MegaFile.fromURL(url)
          await root.loadAttributes()

          if (!root.children) {
            return { valid: true, filename: root.name, size: root.size }
          }

          const flatten = n =>
            n.children
              ? n.children.flatMap(c => flatten(c))
              : [{ name: n.name, size: n.size, nodeId: n.nodeId }]
          const files = flatten(root)

          if (files.length === 0) return { valid: false, error: 'Empty folder' }
          if (files.length === 1) {
            return {
              valid: true,
              filename: files[0].name,
              size: files[0].size,
              nodeId: files[0].nodeId,
            }
          }
          return { valid: true, isMegaFolder: true, folderName: root.name, files }
        } catch (error) {
          console.error('MEGA verify error:', error.message)
          return { valid: false, error: error.message }
        }
      } else {
        // Direct links - try HEAD, fallback to GET
        try {
          const headers = authService.getAuthHeaders()
          const response = await axios.head(url, {
            headers,
            timeout: 10000,
            maxRedirects: 5,
            validateStatus: status => status < 500,
          })
          return { valid: response.status === 200 }
        } catch (error) {
          // HEAD might not be supported, try GET
          try {
            const headers = authService.getAuthHeaders()
            const getResponse = await axios.get(url, {
              headers,
              timeout: 10000,
              maxRedirects: 5,
              maxContentLength: 1024,
              validateStatus: status => status < 500,
            })
            return { valid: getResponse.status === 200 }
          } catch (getError) {
            console.error('URL verification error:', getError.message)
            return { valid: false, error: 'URL not accessible' }
          }
        }
      }
    } catch (error) {
      console.error('Verification error:', error.message)
      return { valid: false, error: error.message }
    }
  }

  /**
   * Download from Pixeldrain
   */
  async downloadFromPixeldrain(url, filename, window, downloadId) {
    try {
      this.sendLog(window, 'download', `Starting Pixeldrain download: ${url}`)

      // Check for list format - use yt-dlp for these
      const listMatch = url.match(/pixeldrain\.com\/l\/([a-zA-Z0-9_-]+)/)
      if (listMatch) {
        this.sendLog(
          window,
          'download',
          'Detected Pixeldrain list - using yt-dlp for batch download'
        )
        try {
          return await this.downloadVideo(url, filename, window, downloadId)
        } catch (ytDlpError) {
          // Check if it's a 403 error (rate limiting)
          if (ytDlpError.message.includes('403') || ytDlpError.message.includes('Forbidden')) {
            this.sendLog(
              window,
              'error',
              'Pixeldrain is blocking the download - likely rate limited. Try opening in browser.'
            )
            throw new Error(
              'Pixeldrain rate limit detected. Please open the link in your browser to download, or wait a few minutes and try again.'
            )
          }
          // If yt-dlp fails for other reasons, try to download individual files from the list
          this.sendLog(window, 'error', `yt-dlp failed for Pixeldrain list: ${ytDlpError.message}`)
          return await this.downloadPixeldrainList(listMatch[1], filename, window, downloadId)
        }
      }

      // Extract file ID from URL (e.g., https://pixeldrain.com/u/abc123)
      const match = url.match(/pixeldrain\.com\/u\/([a-zA-Z0-9_-]+)/)
      if (!match) {
        throw new Error('Invalid Pixeldrain URL format')
      }

      const fileId = match[1]
      const downloadUrl = `https://pixeldrain.com/api/file/${fileId}`

      // Get file info first
      const infoUrl = `https://pixeldrain.com/api/file/${fileId}/info`
      this.sendLog(window, 'download', `Fetching file info from: ${infoUrl}`)

      const infoResponse = await axios.get(infoUrl)
      const realFilename = infoResponse.data.name || filename || 'download'

      this.sendLog(
        window,
        'download',
        `Downloading: ${realFilename} (${infoResponse.data.size || 'unknown'} bytes)`
      )

      // Pass original URL for tracking
      return await this.downloadDirect(downloadUrl, realFilename, window, downloadId, url)
    } catch (error) {
      // Check if it's a 403 error (rate limiting)
      if (
        error.message.includes('403') ||
        error.message.includes('Forbidden') ||
        error.response?.status === 403
      ) {
        this.sendLog(window, 'error', 'Pixeldrain is blocking the download - likely rate limited')
        throw new Error(
          'Pixeldrain rate limit detected. Please open the link in your browser to download, or wait a few minutes and try again.'
        )
      }
      this.sendLog(window, 'error', `Pixeldrain download failed: ${error.message}`)
      throw new Error(`Pixeldrain download failed: ${error.message}`)
    }
  }

  /**
   * Download files from a Pixeldrain list
   */
  async downloadPixeldrainList(listId, folderName, window, downloadId) {
    try {
      this.sendLog(window, 'download', `Fetching Pixeldrain list: ${listId}`)

      const response = await axios.get(`https://pixeldrain.com/api/list/${listId}`)
      const listData = response.data

      if (!listData || !listData.files || listData.files.length === 0) {
        throw new Error('Pixeldrain list is empty or not accessible')
      }

      this.sendLog(window, 'download', `Found ${listData.files.length} files in list`)

      // Download each file in the list
      for (let i = 0; i < listData.files.length; i++) {
        const file = listData.files[i]
        const fileUrl = `https://pixeldrain.com/api/file/${file.id}`
        const fileName = file.name || `file_${i + 1}`

        this.sendLog(
          window,
          'download',
          `Downloading file ${i + 1}/${listData.files.length}: ${fileName}`
        )

        await this.downloadDirect(fileUrl, fileName, window, `${downloadId}_${i}`)
      }

      this.sendLog(
        window,
        'download',
        `Completed all ${listData.files.length} files from Pixeldrain list`
      )

      return {
        success: true,
        downloadId,
        fileCount: listData.files.length,
      }
    } catch (error) {
      this.sendLog(window, 'error', `Failed to download Pixeldrain list: ${error.message}`)
      throw error
    }
  }

  /**
   * Download from Gofile
   */
  async downloadFromGofile(url) {
    // Gofile requires getting the direct link first
    // This is a simplified version - full implementation would need token handling
    const match = url.match(/gofile\.io\/d\/([^/?#]+)/i)
    if (!match) {
      throw new Error('Invalid Gofile URL - please use direct file links')
    }

    // For now, show error message that Gofile requires manual download
    throw new Error('Gofile downloads require opening the link in browser due to their protection')
  }

  /**
   * Download from Bunkr
   */
  async downloadFromBunkr(url, filename, window, downloadId) {
    try {
      // Bunkr direct file links work with standard download
      // Extract filename from URL if not provided
      if (!filename) {
        const urlPath = new URL(url).pathname
        filename = path.basename(urlPath)
      }

      return await this.downloadDirect(url, filename, window, downloadId)
    } catch (error) {
      throw new Error(`Bunkr download failed: ${error.message}`)
    }
  }

  /**
   * Download video + funscript as a paired set.
   * Video downloads first; funscript is then saved with the same basename into the same folder.
   */
  async downloadPaired(videoUrl, funscriptUrl, topicTitle, window, downloadId) {
    // 1. Download video (uses subfolder template, captures resolved path)
    await this.downloadFile(videoUrl, topicTitle, window, downloadId)
    if (!funscriptUrl) return { success: true }

    // Find the folder that yt-dlp created for this title
    const safeTitle = this.sanitizeFilename(topicTitle)
    const videoDir = path.join(this.downloadPath, safeTitle)
    const exists = fs.existsSync(videoDir) && fs.statSync(videoDir).isDirectory()
    const destDir = exists ? videoDir : this.downloadPath

    // Find the video file to determine exact basename yt-dlp used
    let baseTitle = safeTitle
    if (exists) {
      const files = fs.readdirSync(videoDir).filter(f => {
        const ext = path.extname(f).toLowerCase()
        return ['.mp4', '.webm', '.mkv', '.avi', '.mov'].includes(ext)
      })
      if (files.length === 1) baseTitle = path.basename(files[0], path.extname(files[0]))
    }

    const funscriptFilename = `${baseTitle}.funscript`
    const fsDownloadId = `${downloadId}-fs`

    await this.downloadDirect(funscriptUrl, funscriptFilename, window, fsDownloadId, null, destDir)
    return { success: true }
  }

  /**
   * Direct HTTP download
   * @param {string} url - The download URL (may be API URL)
   * @param {string} filename - The filename to save as
   * @param {BrowserWindow} window - Window for progress updates
   * @param {string} downloadId - Unique download ID
   * @param {string} originalUrl - Original URL for tracking (optional, defaults to url)
   * @param {string} destDir - Override output directory (optional)
   */
  async downloadDirect(url, filename, window, downloadId, originalUrl = null, destDir = null) {
    // Use original URL for tracking if provided
    const trackingUrl = originalUrl || url

    // Sanitize filename
    const sanitizedFilename = this.sanitizeFilename(filename)
    const outputDir = destDir || this.downloadPath
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })
    const filePath = path.join(outputDir, sanitizedFilename)

    // Check if already downloading
    if (this.activeDownloads.has(trackingUrl)) {
      return { error: 'File is already being downloaded' }
    }

    try {
      this.activeDownloads.set(trackingUrl, downloadId)

      const headers = authService.getAuthHeaders()

      const response = await axios({
        method: 'GET',
        url,
        headers,
        responseType: 'stream',
        timeout: 300000, // 5 minute timeout
      })

      const totalBytes = parseInt(response.headers['content-length'], 10) || 0
      let receivedBytes = 0

      const writer = fs.createWriteStream(filePath)

      response.data.on('data', chunk => {
        receivedBytes += chunk.length

        const progress = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0

        if (window && !window.isDestroyed()) {
          window.webContents.send('download-progress', {
            downloadId,
            filename: sanitizedFilename,
            url: trackingUrl,
            progress,
            bytesReceived: receivedBytes,
            totalBytes,
          })
        }
      })

      response.data.pipe(writer)

      return new Promise((resolve, reject) => {
        writer.on('finish', () => {
          this.activeDownloads.delete(trackingUrl)

          // Add to download history
          this.addToHistory({
            filename: sanitizedFilename,
            url: trackingUrl,
            path: filePath,
            size: receivedBytes,
            completedAt: new Date().toISOString(),
          })

          if (window && !window.isDestroyed()) {
            window.webContents.send('download-complete', {
              downloadId,
              filename: sanitizedFilename,
              url: trackingUrl,
              path: filePath,
              size: receivedBytes,
            })
          }

          resolve({
            success: true,
            downloadId,
            filename: sanitizedFilename,
            path: filePath,
            size: receivedBytes,
          })
        })

        writer.on('error', error => {
          this.activeDownloads.delete(trackingUrl)

          // Clean up partial file
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
          }

          if (window && !window.isDestroyed()) {
            window.webContents.send('download-error', {
              downloadId,
              filename: sanitizedFilename,
              url: trackingUrl,
              error: error.message,
            })
          }

          reject(error)
        })
      })
    } catch (error) {
      this.activeDownloads.delete(trackingUrl)

      if (window && !window.isDestroyed()) {
        window.webContents.send('download-error', {
          downloadId,
          filename: sanitizedFilename,
          url: trackingUrl,
          error: error.message,
        })
      }

      throw error
    }
  }

  /**
   * Cancel an active download
   */
  cancelDownload(url) {
    // Implementation would require storing abort controllers
    this.activeDownloads.delete(url)
  }

  /**
   * Sanitize filename for filesystem
   */
  async downloadFromMega(url, filename, window, downloadId, nodeId = null) {
    this.sendLog(window, 'download', `Starting MEGA download: ${url}`)

    const root = MegaFile.fromURL(url)
    await root.loadAttributes()

    // Resolve target node (root for file links, a child for folder links)
    let node = root
    if (nodeId) {
      const flatten = n => [n, ...(n.children || []).flatMap(c => flatten(c))]
      node = flatten(root).find(n => n.nodeId === nodeId)
      if (!node) throw new Error(`MEGA: file node ${nodeId} not found in folder`)
    }

    const realFilename = this.sanitizeFilename(node.name || filename)
    const filePath = path.join(this.downloadPath, realFilename)
    const totalBytes = node.size || 0
    const trackingUrl = nodeId ? `${url}#node-${nodeId}` : url

    if (this.activeDownloads.has(trackingUrl)) {
      return { error: 'File is already being downloaded' }
    }

    this.activeDownloads.set(trackingUrl, downloadId)

    try {
      const stream = node.download()
      const writer = fs.createWriteStream(filePath)
      let receivedBytes = 0

      await new Promise((resolve, reject) => {
        stream.on('data', chunk => {
          receivedBytes += chunk.length
          const progress = totalBytes > 0 ? Math.round((receivedBytes / totalBytes) * 100) : 0
          if (window && !window.isDestroyed()) {
            window.webContents.send('download-progress', {
              downloadId,
              filename: realFilename,
              url: trackingUrl,
              progress,
              bytesReceived: receivedBytes,
              totalBytes,
            })
          }
        })
        stream.on('error', reject)
        stream.pipe(writer)
        writer.on('finish', resolve)
        writer.on('error', reject)
      })

      const result = { filename: realFilename, path: filePath, url: trackingUrl, downloadId }

      this.addToHistory({
        url: trackingUrl,
        filename: realFilename,
        path: filePath,
        date: new Date().toISOString(),
      })

      if (window && !window.isDestroyed()) {
        window.webContents.send('download-complete', result)
      }

      this.sendLog(window, 'download', `MEGA download completed: ${realFilename}`)
      return result
    } catch (error) {
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath)
      this.sendLog(window, 'error', `MEGA download failed: ${error.message}`)
      throw error
    } finally {
      this.activeDownloads.delete(trackingUrl)
    }
  }

  sanitizeFilename(filename) {
    return filename
      .replace(/[<>:"/\\|?*]/g, '_')
      .replace(/\s+/g, ' ')
      .trim()
      .substring(0, 200)
  }

  /**
   * Get download history
   */
  getHistory() {
    return store.get('downloadHistory', [])
  }

  /**
   * Add item to download history
   */
  addToHistory(item) {
    const history = this.getHistory()
    history.unshift(item)

    // Keep only last 100 items
    if (history.length > 100) {
      history.splice(100)
    }

    store.set('downloadHistory', history)
  }

  /**
   * Clear download history
   */
  clearHistory() {
    store.set('downloadHistory', [])
  }

  /**
   * Send log message to renderer
   */
  sendLog(window, type, message) {
    console.log(`[download:${type}] ${message}`)
    if (window && !window.isDestroyed()) {
      window.webContents.send('download-log', {
        type,
        message,
        timestamp: new Date().toISOString(),
      })
    }
  }

  /**
   * Check if file was already downloaded
   */
  isDownloaded(filename) {
    const filePath = path.join(this.downloadPath, this.sanitizeFilename(filename))
    return fs.existsSync(filePath)
  }
}

module.exports = new DownloadService()
