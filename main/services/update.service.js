const { app, BrowserWindow, dialog, shell } = require('electron')
const https = require('https')
const store = require('../store/config')

const REPO_OWNER = 'mememan2010gaming'
const REPO_NAME = 'ScriptStash'
const CHECK_INTERVAL_MS = 60 * 60 * 1000 // 1 hour

/**
 * Self-contained updater.
 *
 * Platform strategy (Option A — each platform uses its native mechanism):
 *   - Windows x64  -> Electron's built-in autoUpdater via `update-electron-app`,
 *                     fed by the free update.electronjs.org service (Squirrel.Windows).
 *   - Linux        -> `electron-updater` (AppImage self-update from GitHub releases).
 *   - macOS / Win arm64 / unsupported -> no in-place auto-update (no code signing /
 *                     single-arch Squirrel feed limitation). They fall back to a manual
 *                     GitHub-release check that opens the download page.
 *
 * autoUpdater only works in a packaged build, so the whole thing is a no-op in dev.
 */
class UpdateService {
  constructor() {
    this.currentVersion = app.getVersion()
    this.repoOwner = REPO_OWNER
    this.repoName = REPO_NAME

    this.mode = 'none' // 'squirrel' | 'appimage' | 'none'
    this.winAutoUpdater = null // electron.autoUpdater (Windows)
    this.linuxUpdater = null // electron-updater autoUpdater (Linux)
    this.updateAvailable = false
    this.updateDownloaded = false
    this.pendingVersion = null
    this.releaseNotes = null
  }

  isUpdateCheckEnabled() {
    const settings = store.get('settings', {})
    return settings.checkForUpdates !== false // default on
  }

  /** True when this platform/arch supports silent in-place auto-update. */
  isAutoUpdateSupported() {
    if (process.platform === 'win32') {
      return process.arch === 'x64' // single-arch Squirrel feed; arm64 uses manual fallback
    }
    return process.platform === 'linux'
  }

  /**
   * Wire up the auto-updater. Call once after the main window exists.
   * Safe to call in any environment — no-ops in dev and on unsupported platforms.
   */
  init() {
    if (!app.isPackaged) {
      console.log('[updater] dev build — auto-update skipped')
      return
    }
    if (!this.isUpdateCheckEnabled()) {
      console.log('[updater] update check disabled in settings')
      return
    }

    console.log(
      `[updater] init — platform=${process.platform} arch=${process.arch} version=${this.currentVersion}`
    )

    try {
      if (process.platform === 'win32' && process.arch === 'x64') {
        this._initSquirrel()
      } else if (process.platform === 'linux') {
        this._initAppImage()
      } else {
        console.log('[updater] platform not supported for auto-update — manual check only')
      }
    } catch (error) {
      console.error('[updater] failed to initialize auto-updater:', error)
    }
  }

  /** Windows x64: built-in autoUpdater fed by update.electronjs.org. */
  _initSquirrel() {
    const { updateElectronApp, UpdateSourceType } = require('update-electron-app')
    const { autoUpdater } = require('electron')

    this.mode = 'squirrel'
    this.winAutoUpdater = autoUpdater

    console.log('[updater] mode=squirrel — registered with update.electronjs.org')

    autoUpdater.on('error', error => {
      console.error('[updater] Squirrel error:', error)
    })

    autoUpdater.on('checking-for-update', () => {
      console.log('[updater] Squirrel: checking for update…')
    })

    autoUpdater.on('update-not-available', () => {
      console.log('[updater] Squirrel: already up to date')
    })

    // Fire update-available as soon as a newer version is detected (Squirrel
    // starts downloading immediately, so this fires at the same time as download start).
    autoUpdater.on('update-available', () => {
      console.log('[updater] Squirrel: update available — fetching release notes')
      this._fetchLatestRelease()
        .then(release => {
          this._onUpdateAvailable(release?.tag_name || null, release?.body || null)
        })
        .catch(() => this._onUpdateAvailable(null, null))
    })

    updateElectronApp({
      updateSource: {
        type: UpdateSourceType.ElectronPublicUpdateService,
        repo: `${this.repoOwner}/${this.repoName}`,
      },
      updateInterval: '1 hour',
      notifyUser: true,
      onNotifyUser: info => {
        console.log(`[updater] Squirrel: update downloaded — ${info.releaseName}`)
        this._onUpdateReady(info.releaseName)
      },
    })
  }

  /** Linux: electron-updater AppImage self-update from GitHub releases. */
  _initAppImage() {
    const { autoUpdater } = require('electron-updater')

    this.mode = 'appimage'
    this.linuxUpdater = autoUpdater

    console.log('[updater] mode=appimage — checking GitHub releases')

    autoUpdater.autoDownload = true // silent background download
    autoUpdater.autoInstallOnAppQuit = true

    autoUpdater.on('checking-for-update', () => {
      console.log('[updater] AppImage: checking for update…')
    })

    autoUpdater.on('update-not-available', info => {
      console.log(`[updater] AppImage: already up to date (latest=${info.version})`)
    })

    autoUpdater.on('update-available', info => {
      console.log(`[updater] AppImage: update available — ${info.version}`)
      this._onUpdateAvailable(
        info.version || null,
        Array.isArray(info.releaseNotes)
          ? info.releaseNotes.map(n => n.note).join('\n')
          : info.releaseNotes || null
      )
    })

    autoUpdater.on('download-progress', p => {
      console.log(
        `[updater] AppImage: downloading ${Math.round(p.percent)}% (${Math.round(p.bytesPerSecond / 1024)} KB/s)`
      )
    })

    autoUpdater.on('update-downloaded', info => {
      console.log(`[updater] AppImage: update downloaded — ${info.version}`)
      this._onUpdateReady(info.version)
    })

    autoUpdater.on('error', error => {
      console.error('[updater] AppImage error:', error)
    })

    autoUpdater.checkForUpdates().catch(error => {
      console.error('[updater] AppImage initial check failed:', error)
    })

    setInterval(() => {
      console.log('[updater] AppImage: scheduled check')
      autoUpdater.checkForUpdates().catch(error => {
        console.error('[updater] AppImage scheduled check failed:', error)
      })
    }, CHECK_INTERVAL_MS)
  }

  /** An update was detected and is downloading in the background. */
  _onUpdateAvailable(version, notes) {
    console.log(`[updater] broadcasting update-available — pending=${version}`)
    this.updateAvailable = true
    this.pendingVersion = version || null
    this.releaseNotes = notes || null
    this._broadcast('update-available', {
      version: this.pendingVersion,
      currentVersion: this.currentVersion,
      releaseNotes: this.releaseNotes,
    })
  }

  /** Update finished downloading and is ready to install on restart. */
  _onUpdateReady(version) {
    console.log(`[updater] broadcasting update-ready — pending=${version}`)
    this.updateAvailable = true
    this.updateDownloaded = true
    this.pendingVersion = version || this.pendingVersion
    this._broadcast('update-ready', {
      version: this.pendingVersion,
      currentVersion: this.currentVersion,
      releaseNotes: this.releaseNotes,
    })
  }

  _broadcast(channel, payload) {
    BrowserWindow.getAllWindows().forEach(win => {
      if (!win.isDestroyed()) {
        win.webContents.send(channel, payload)
      }
    })
  }

  /**
   * Quit and install the downloaded update. Triggered by the renderer's
   * "Restart now" action. Returns false if nothing is staged.
   */
  installUpdate() {
    console.log(`[updater] installUpdate — downloaded=${this.updateDownloaded} mode=${this.mode}`)
    if (!this.updateDownloaded) {
      return false
    }
    if (this.mode === 'appimage' && this.linuxUpdater) {
      this.linuxUpdater.quitAndInstall()
      return true
    }
    if (this.mode === 'squirrel' && this.winAutoUpdater) {
      this.winAutoUpdater.quitAndInstall()
      return true
    }
    return false
  }

  /**
   * Status snapshot for the renderer (settings view, etc.).
   */
  getStatus() {
    return {
      currentVersion: this.currentVersion,
      autoUpdateSupported: this.isAutoUpdateSupported(),
      updateAvailable: this.updateAvailable,
      updateDownloaded: this.updateDownloaded,
      pendingVersion: this.pendingVersion,
      releaseNotes: this.releaseNotes,
      mode: this.mode,
    }
  }

  /**
   * Manual "Check for Updates" (settings button).
   * On auto-update platforms this kicks the active updater (a toast appears once
   * the download finishes). Elsewhere it falls back to the GitHub-release check.
   */
  async checkForUpdates() {
    if (!app.isPackaged) {
      console.log('[updater] checkForUpdates skipped (dev build)')
      return { updateAvailable: false, currentVersion: this.currentVersion, dev: true }
    }

    console.log(`[updater] manual check triggered — mode=${this.mode}`)

    if (this.mode === 'appimage' && this.linuxUpdater) {
      try {
        const result = await this.linuxUpdater.checkForUpdates()
        const latest = result?.updateInfo?.version
        return {
          checking: true,
          currentVersion: this.currentVersion,
          latestVersion: latest,
        }
      } catch (error) {
        console.error('Manual AppImage check failed:', error)
        return { error: error.message, currentVersion: this.currentVersion }
      }
    }

    if (this.mode === 'squirrel' && this.winAutoUpdater) {
      this.winAutoUpdater.checkForUpdates()
      return { checking: true, currentVersion: this.currentVersion }
    }

    // Fallback: platforms without in-place auto-update (macOS, Windows arm64).
    return this._manualGithubCheck()
  }

  /**
   * GitHub-release check for platforms we can't auto-update. Prompts the user
   * and opens the release page on confirm.
   */
  async _manualGithubCheck() {
    console.log('[updater] falling back to manual GitHub release check')
    try {
      const release = await this._fetchLatestRelease()
      if (!release) {
        await dialog.showMessageBox({
          type: 'info',
          title: 'No Releases Available',
          message: 'No releases have been published yet.',
          detail: `Current version: ${this.currentVersion}`,
          buttons: ['OK'],
        })
        return { updateAvailable: false, currentVersion: this.currentVersion }
      }

      const latestVersion = release.tag_name
      console.log(
        `[updater] GitHub latest=${latestVersion} current=${this.currentVersion} — ${this._compareVersions(latestVersion, this.currentVersion) > 0 ? 'update available' : 'up to date'}`
      )
      if (this._compareVersions(latestVersion, this.currentVersion) > 0) {
        const result = await dialog.showMessageBox({
          type: 'info',
          title: 'Update Available',
          message: `ScriptStash ${latestVersion} is now available!`,
          detail: `You are running ${this.currentVersion}.\n\nAutomatic updates aren't available on this platform — open the download page?`,
          buttons: ['Download', 'Later'],
          defaultId: 0,
          cancelId: 1,
        })
        if (result.response === 0) {
          await shell.openExternal(release.html_url)
        }
        return {
          updateAvailable: true,
          latestVersion,
          currentVersion: this.currentVersion,
          releaseUrl: release.html_url,
        }
      }

      await dialog.showMessageBox({
        type: 'info',
        title: 'No Updates Available',
        message: 'You are running the latest version of ScriptStash.',
        detail: `Current version: ${this.currentVersion}`,
        buttons: ['OK'],
      })
      return { updateAvailable: false, latestVersion, currentVersion: this.currentVersion }
    } catch (error) {
      console.error('Failed to check for updates:', error)
      await dialog.showMessageBox({
        type: 'error',
        title: 'Update Check Failed',
        message: 'Unable to check for updates',
        detail: error.message,
        buttons: ['OK'],
      })
      return { error: error.message, currentVersion: this.currentVersion }
    }
  }

  _fetchLatestRelease() {
    return new Promise((resolve, reject) => {
      const req = https.request(
        {
          hostname: 'api.github.com',
          path: `/repos/${this.repoOwner}/${this.repoName}/releases/latest`,
          method: 'GET',
          headers: {
            'User-Agent': 'ScriptStash-UpdateChecker',
            Accept: 'application/vnd.github.v3+json',
          },
        },
        res => {
          let data = ''
          res.on('data', chunk => {
            data += chunk
          })
          res.on('end', () => {
            if (res.statusCode === 200) {
              try {
                resolve(JSON.parse(data))
              } catch (error) {
                reject(new Error('Failed to parse release data'))
              }
            } else if (res.statusCode === 404) {
              resolve(null) // no releases yet
            } else {
              reject(new Error(`GitHub API returned status ${res.statusCode}`))
            }
          })
        }
      )
      req.on('error', reject)
      req.end()
    })
  }

  /** Compare semver-ish strings. Returns 1 if v1 > v2, -1 if v1 < v2, 0 if equal. */
  _compareVersions(v1, v2) {
    const a = v1.replace(/^v/, '').split('.').map(Number)
    const b = v2.replace(/^v/, '').split('.').map(Number)
    for (let i = 0; i < Math.max(a.length, b.length); i++) {
      const x = a[i] || 0
      const y = b[i] || 0
      if (x > y) return 1
      if (x < y) return -1
    }
    return 0
  }
}

module.exports = new UpdateService()
