/**
 * ScriptStash v2.0 - Main Application
 */

// Default extreme tags that can be added to blacklist
const EXTREME_TAGS = [
  'animated-bestiality',
  'furry',
  'futanari',
  'loli',
  'necrophilia',
  'rape',
  'shota',
  'tentacle',
]

// State management
const state = {
  currentPage: 0,
  currentView: 'topics', // 'topics', 'detail', or 'downloads'
  currentTopic: null,
  currentUser: null, // Current logged in user info
  currentCategory: 'all', // 'all', 'new', or 'tag'
  currentFilterTag: null, // Tag being filtered by
  topics: [],
  newTopics: [],
  topTags: [],
  hasMore: true,
  isLoading: false,
  isPrefetching: false,
  activeDownloads: new Map(),
  queuedDownloads: new Map(),
  downloadHistory: [],
  selectedTag: null,
  scrollThreshold: 1500, // Start loading 1500px before bottom
  verifiedUrls: new Map(), // Cache of verified URLs
  logs: [], // Developer mode logs
  developerMode: false,
  blacklistedTags: [], // Tags to filter out from feed
  settings: {
    theme: 'ocean',
    mode: 'dark',
    usePostTitle: true,
    inAppBrowser: true,
    performanceMode: false,
    logVerbosity: 'light',
  },
}

// DOM Elements
const elements = {
  // Views
  topicsView: document.getElementById('topicsView'),
  topicDetailView: document.getElementById('topicDetailView'),
  downloadsView: document.getElementById('downloadsView'),

  // Topics
  topicsGrid: document.getElementById('topicsGrid'),
  loadingIndicator: document.getElementById('loadingIndicator'),
  endIndicator: document.getElementById('endIndicator'),
  refreshBtn: document.getElementById('refreshBtn'),

  // Detail
  backBtn: document.getElementById('backBtn'),
  detailTitle: document.getElementById('detailTitle'),
  detailContent: document.getElementById('detailContent'),

  // Tags
  tagsList: document.getElementById('tagsList'),

  // Downloads - New View
  downloadsLink: document.getElementById('downloadsLink'),
  downloadsBadge: document.getElementById('downloadsBadge'),
  activeDownloadsList: document.getElementById('activeDownloadsList'),
  downloadHistoryList: document.getElementById('downloadHistoryList'),

  // Downloads - Old Drawer (for backwards compatibility)
  downloadDrawer: document.getElementById('downloadDrawer'),
  drawerToggle: document.getElementById('drawerToggle'),
  downloadCount: document.getElementById('downloadCount'),
  activeDownloads: document.getElementById('activeDownloads'),
  historyList: document.getElementById('historyList'),
  clearHistoryBtn: document.getElementById('clearHistoryBtn'),

  // Settings
  settingsBtn: document.getElementById('settingsBtn'),
  settingsModal: document.getElementById('settingsModal'),
  closeSettingsBtn: document.getElementById('closeSettingsBtn'),
  downloadPathInput: document.getElementById('downloadPathInput'),
  browsePathBtn: document.getElementById('browsePathBtn'),
  maxDownloadsInput: document.getElementById('maxDownloadsInput'),
  saveMaxDownloadsBtn: document.getElementById('saveMaxDownloadsBtn'),
  logoutBtn: document.getElementById('logoutBtn'),
  developerModeToggle: document.getElementById('developerModeToggle'),
  viewLogsBtn: document.getElementById('viewLogsBtn'),
  logViewerModal: document.getElementById('logViewerModal'),
  closeLogViewerBtn: document.getElementById('closeLogViewerBtn'),
  logContent: document.getElementById('logContent'),
  clearLogsBtn: document.getElementById('clearLogsBtn'),

  // New settings elements
  modeOptions: document.querySelectorAll('.mode-option'),
  themeOptions: document.querySelectorAll('.theme-option'),
  usePostTitleToggle: document.getElementById('usePostTitleToggle'),
  inAppBrowserToggle: document.getElementById('inAppBrowserToggle'),
  adBlockerToggle: document.getElementById('adBlockerToggle'),
  adBlockerCount: document.getElementById('adBlockerCount'),
  updateAdBlockerBtn: document.getElementById('updateAdBlockerBtn'),
  performanceModeToggle: document.getElementById('performanceModeToggle'),
  logVerbositySelect: document.getElementById('logVerbositySelect'),
  devModeOptions: document.getElementById('devModeOptions'),
  logFilterSelect: document.getElementById('logFilterSelect'),

  // Blacklist/Content Filtering
  blacklistTagsContainer: document.getElementById('blacklistTagsContainer'),
  newBlacklistTagInput: document.getElementById('newBlacklistTagInput'),
  addBlacklistTagBtn: document.getElementById('addBlacklistTagBtn'),
  addExtremeTagsBtn: document.getElementById('addExtremeTagsBtn'),
  blacklistTagAutocomplete: document.getElementById('blacklistTagAutocomplete'),

  // Tag search & filtering
  tagSearchInput: document.getElementById('tagSearchInput'),
  tagSearchResults: document.getElementById('tagSearchResults'),
  activeTagFilter: document.getElementById('activeTagFilter'),
  activeTagName: document.getElementById('activeTagName'),
  clearTagFilter: document.getElementById('clearTagFilter'),

  // Categories/Views
  newScriptsLink: document.getElementById('newScriptsLink'),
  newScriptsBadge: document.getElementById('newScriptsBadge'),
  dismissNewBtn: document.getElementById('dismissNewBtn'),
  viewTitle: document.getElementById('viewTitle'),
  sidebarLinks: document.querySelectorAll('.sidebar-link'),

  // Tag Context Menu
  tagContextMenu: document.getElementById('tagContextMenu'),

  // Browser modal
  browserModal: document.getElementById('browserModal'),
  browserUrlInput: document.getElementById('browserUrlInput'),
  browserWebview: document.getElementById('browserWebview'),
  browserOpenExternalBtn: document.getElementById('browserOpenExternalBtn'),
  closeBrowserBtn: document.getElementById('closeBrowserBtn'),
  browserBackBtn: document.getElementById('browserBackBtn'),
  browserForwardBtn: document.getElementById('browserForwardBtn'),
  browserRefreshBtn: document.getElementById('browserRefreshBtn'),
  browserProgressBar: document.getElementById('browserProgressBar'),

  // Toast container
  toastContainer: document.getElementById('toastContainer'),

  // User
  userAvatar: document.getElementById('userAvatar'),
  userName: document.getElementById('userName'),

  // Search
  searchInput: document.getElementById('searchInput'),
}

// Initialize the application
async function init() {
  addLog('info', 'ScriptStash initializing...')
  setupWindowControls()
  setupEventListeners()
  setupDownloadListeners()
  setupKeyboardShortcuts()
  setupLogListeners()
  await loadAllSettings()
  await loadBlacklistedTags()
  await loadCurrentUser()
  await loadDownloadPath()
  await loadMaxDownloads()
  await loadDownloadHistory()
  await loadAppVersion()
  updateCategoryUI() // Initialize category UI state
  themeEditor.init() // Initialize custom theme editor
  await loadTopics()
  await loadNewTopicsCount() // Load new topics count for badge
  addLog('info', 'Application initialized successfully')
}

// Setup window control buttons
function setupWindowControls() {
  const minimizeBtn = document.getElementById('minimizeBtn')
  const maximizeBtn = document.getElementById('maximizeBtn')
  const closeBtn = document.getElementById('closeBtn')
  const maximizeIcon = document.getElementById('maximizeIcon')

  minimizeBtn?.addEventListener('click', () => {
    window.electronAPI.minimizeWindow()
  })

  maximizeBtn?.addEventListener('click', () => {
    window.electronAPI.maximizeWindow()
  })

  closeBtn?.addEventListener('click', () => {
    window.electronAPI.closeWindow()
  })

  // Update maximize button icon when window state changes
  window.electronAPI.onMaximizeChange?.(isMaximized => {
    if (maximizeIcon) {
      if (isMaximized) {
        // Show restore icon (two overlapping squares)
        maximizeIcon.innerHTML = `
          <rect width="7" height="7" x="4" y="1" fill="none" stroke="currentColor" stroke-width="1"/>
          <rect width="7" height="7" x="1" y="4" fill="var(--bg-tertiary)" stroke="currentColor" stroke-width="1"/>
        `
      } else {
        // Show maximize icon (single square)
        maximizeIcon.innerHTML = `
          <rect width="9" height="9" x="1.5" y="1.5" fill="none" stroke="currentColor" stroke-width="1"/>
        `
      }
    }
  })
}

// Load current user info and avatar
async function loadCurrentUser() {
  try {
    addLog('verbose', 'Fetching current user info...')
    const result = await window.electronAPI.validateSession()
    if (result.success && result.data && result.data.isValid) {
      state.currentUser = result.data.user
      elements.userAvatar.src = state.currentUser.avatar || ''
      elements.userName.textContent = state.currentUser.username || ''
      addLog('info', `Logged in as: ${state.currentUser.username}`)
    }
  } catch (error) {
    addLog('error', `Failed to load user info: ${error.message}`)
  }
}

// Event Listeners Setup
function setupEventListeners() {
  // Refresh
  elements.refreshBtn.addEventListener('click', () => resetAndLoadTopics())

  // Navigation
  elements.backBtn.addEventListener('click', showTopicsView)

  // Infinite scroll
  elements.contentArea = document.querySelector('.content-area')
  elements.contentArea.addEventListener('scroll', debounce(handleScroll, 50))

  // Download drawer
  elements.drawerToggle?.addEventListener('click', toggleDownloadDrawer)
  elements.clearHistoryBtn.addEventListener('click', clearDownloadHistory)

  // Downloads view link
  elements.downloadsLink?.addEventListener('click', e => {
    e.preventDefault()
    showDownloadsView()
  })

  // User dropdown
  const userInfo = document.getElementById('userInfo')
  const userDropdown = document.getElementById('userDropdown')

  userInfo?.addEventListener('click', e => {
    e.stopPropagation()
    userDropdown.classList.toggle('hidden')
    userInfo.classList.toggle('active')
  })

  // Close dropdown when clicking outside
  document.addEventListener('click', e => {
    if (!userInfo?.contains(e.target)) {
      userDropdown?.classList.add('hidden')
      userInfo?.classList.remove('active')
    }
  })

  // Settings
  elements.settingsBtn.addEventListener('click', showSettingsModal)
  elements.closeSettingsBtn.addEventListener('click', hideSettingsModal)
  elements.settingsModal
    .querySelector('.modal-backdrop')
    .addEventListener('click', hideSettingsModal)
  elements.browsePathBtn.addEventListener('click', browseDownloadPath)
  elements.saveMaxDownloadsBtn.addEventListener('click', saveMaxDownloads)
  elements.logoutBtn.addEventListener('click', logout)

  // Update checks
  const checkUpdatesNowBtn = document.getElementById('checkUpdatesNowBtn')
  const checkForUpdatesToggle = document.getElementById('checkForUpdatesToggle')
  checkUpdatesNowBtn?.addEventListener('click', checkForUpdatesNow)
  checkForUpdatesToggle?.addEventListener('change', e =>
    saveSetting('checkForUpdates', e.target.checked)
  )

  elements.developerModeToggle.addEventListener('change', toggleDeveloperMode)
  elements.viewLogsBtn.addEventListener('click', showLogViewer)
  elements.closeLogViewerBtn.addEventListener('click', hideLogViewer)
  elements.logViewerModal.querySelector('.modal-backdrop').addEventListener('click', hideLogViewer)
  elements.clearLogsBtn.addEventListener('click', clearLogs)

  // Theme & Mode controls
  elements.modeOptions.forEach(btn => {
    btn.addEventListener('click', () => setMode(btn.dataset.mode))
  })

  elements.themeOptions.forEach(option => {
    option.addEventListener('click', () => setTheme(option.dataset.theme))
  })

  // New settings toggles
  elements.usePostTitleToggle.addEventListener('change', e =>
    saveSetting('usePostTitle', e.target.checked)
  )
  elements.inAppBrowserToggle.addEventListener('change', e =>
    saveSetting('inAppBrowser', e.target.checked)
  )
  elements.adBlockerToggle?.addEventListener('change', async e => {
    await window.electronAPI.setAdBlockerEnabled(e.target.checked)
    addLog('info', `Ad blocker ${e.target.checked ? 'enabled' : 'disabled'}`)
  })
  elements.updateAdBlockerBtn?.addEventListener('click', async e => {
    const btn = e.target
    const originalText = btn.textContent
    btn.disabled = true
    btn.textContent = 'Updating...'

    try {
      const result = await window.electronAPI.updateAdBlockerList()
      if (result.success) {
        addLog('info', 'Ad blocker filter list updated successfully')
        btn.textContent = 'Updated!'
        setTimeout(() => {
          btn.textContent = originalText
          btn.disabled = false
        }, 2000)
      } else {
        addLog('error', 'Failed to update filter list: ' + (result.error || 'Unknown error'))
        btn.textContent = 'Update Failed'
        setTimeout(() => {
          btn.textContent = originalText
          btn.disabled = false
        }, 2000)
      }
    } catch (error) {
      addLog('error', 'Error updating filter list: ' + error.message)
      btn.textContent = 'Error'
      setTimeout(() => {
        btn.textContent = originalText
        btn.disabled = false
      }, 2000)
    }
  })
  elements.performanceModeToggle.addEventListener('change', e => {
    saveSetting('performanceMode', e.target.checked)
    applyPerformanceMode(e.target.checked)
  })
  elements.logVerbositySelect.addEventListener('change', e =>
    saveSetting('logVerbosity', e.target.value)
  )
  elements.logFilterSelect.addEventListener('change', filterLogs)

  // Browser modal
  elements.closeBrowserBtn.addEventListener('click', closeBrowser)
  elements.browserModal.querySelector('.modal-backdrop').addEventListener('click', closeBrowser)
  elements.browserOpenExternalBtn.addEventListener('click', () => {
    window.electronAPI.openExternal(elements.browserUrlInput.value)
    closeBrowser()
  })
  elements.browserBackBtn.addEventListener('click', () => {
    if (elements.browserWebview.canGoBack()) {
      elements.browserWebview.goBack()
    }
  })
  elements.browserForwardBtn.addEventListener('click', () => {
    if (elements.browserWebview.canGoForward()) {
      elements.browserWebview.goForward()
    }
  })
  elements.browserRefreshBtn.addEventListener('click', () => {
    elements.browserWebview.reload()
  })

  // Webview events for progress bar
  elements.browserWebview.addEventListener('did-start-loading', () => {
    elements.browserProgressBar.classList.add('loading')
    elements.browserProgressBar.style.width = '0%'
  })
  elements.browserWebview.addEventListener('did-stop-loading', () => {
    elements.browserProgressBar.classList.remove('loading')
    elements.browserProgressBar.style.width = '100%'
    setTimeout(() => {
      elements.browserProgressBar.style.width = '0%'
    }, 300)
  })
  elements.browserWebview.addEventListener('did-navigate', e => {
    elements.browserUrlInput.value = e.url
  })
  elements.browserWebview.addEventListener('did-navigate-in-page', e => {
    elements.browserUrlInput.value = e.url
  })

  // Blacklist/Content Filtering
  elements.addBlacklistTagBtn.addEventListener('click', addBlacklistTag)
  elements.newBlacklistTagInput.addEventListener('keypress', e => {
    if (e.key === 'Enter') addBlacklistTag()
  })
  elements.newBlacklistTagInput.addEventListener(
    'input',
    debounce(handleBlacklistAutocomplete, 300)
  )
  elements.addExtremeTagsBtn.addEventListener('click', addExtremeTags)

  // Close blacklist autocomplete when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.autocomplete-container')) {
      elements.blacklistTagAutocomplete?.classList.add('hidden')
    }
  })

  // Tag search in sidebar
  elements.tagSearchInput?.addEventListener('input', debounce(handleTagSearch, 300))
  elements.tagSearchInput?.addEventListener('focus', () => {
    if (elements.tagSearchInput.value.trim()) {
      handleTagSearch()
    }
  })
  elements.clearTagFilter?.addEventListener('click', clearTagFilter)

  // Close tag search results when clicking outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.tag-search-container')) {
      elements.tagSearchResults?.classList.add('hidden')
    }
  })

  // Category/view switching (skip downloads link - it has its own handler)
  elements.sidebarLinks?.forEach(link => {
    // Skip downloads link - handled separately
    if (link.id === 'downloadsLink') return

    link.addEventListener('click', e => {
      e.preventDefault()
      const category = link.dataset.category
      if (category) {
        switchCategory(category)
      }
    })
  })

  // Dismiss new topics
  elements.dismissNewBtn?.addEventListener('click', dismissNewTopics)

  // Search (basic filter for now) - also handles URL paste
  elements.searchInput.addEventListener('input', debounce(handleSearchInput, 300))

  // Tag context menu (right click)
  document.addEventListener('contextmenu', e => {
    const tagEl = e.target.closest('.topic-tag[data-tag]')
    if (tagEl) {
      e.preventDefault()
      showTagContextMenu(e.clientX, e.clientY, tagEl.dataset.tag)
    }
  })

  // Close context menu on click outside
  document.addEventListener('click', e => {
    if (!e.target.closest('.context-menu')) {
      hideTagContextMenu()
    }
  })

  // Context menu item handlers
  elements.tagContextMenu?.addEventListener('click', e => {
    const item = e.target.closest('.context-menu-item')
    if (!item) return

    const action = item.dataset.action
    const tag = elements.tagContextMenu.dataset.currentTag

    if (action === 'search' && tag) {
      filterByTag(tag)
    } else if (action === 'blacklist' && tag) {
      blacklistTagFromMenu(tag)
    }

    hideTagContextMenu()
  })

  // Global link click handler - intercept all link clicks in the app
  document.addEventListener('click', e => {
    // Find the closest anchor tag
    const link = e.target.closest('a')
    if (!link) return

    const href = link.getAttribute('href')
    if (!href) return

    // Skip if it's a download button or has specific data attributes
    if (link.classList.contains('download-btn') || link.dataset.url) return

    // Skip if it's an internal navigation link (starts with #)
    if (href.startsWith('#')) return

    // Skip if it's a relative path that's not a full URL
    if (!href.startsWith('http://') && !href.startsWith('https://')) return

    // Prevent default link behavior
    e.preventDefault()

    // Use in-app browser or system default based on settings
    if (state.settings.inAppBrowser) {
      openInAppBrowser(href)
    } else {
      window.electronAPI.openExternal(href)
    }
  })
}

// Setup keyboard shortcuts and mouse button handlers
function setupKeyboardShortcuts() {
  // Keyboard shortcuts
  document.addEventListener('keydown', e => {
    // ESC key - close modals or go back
    if (e.key === 'Escape') {
      // First check if browser modal is open
      if (!elements.browserModal.classList.contains('hidden')) {
        closeBrowser()
        return
      }
      // Check if settings modal is open
      if (!elements.settingsModal.classList.contains('hidden')) {
        hideSettingsModal()
        return
      }
      // Check if log viewer is open
      if (!elements.logViewerModal.classList.contains('hidden')) {
        hideLogViewer()
        return
      }
      // If in topic detail view, go back to topics list
      if (!elements.topicDetailView.classList.contains('hidden')) {
        showTopicsView()
        return
      }
    }

    // Backspace - go back (when not in input field)
    if (e.key === 'Backspace' && !isInputFocused()) {
      if (!elements.topicDetailView.classList.contains('hidden')) {
        e.preventDefault()
        showTopicsView()
      }
    }
  })

  // Mouse button 4/5 (back/forward) - works on mice with extra buttons
  document.addEventListener('mouseup', e => {
    // Button 3 = Mouse4 (back), Button 4 = Mouse5 (forward)
    if (e.button === 3) {
      // Mouse back button
      e.preventDefault()
      if (!elements.browserModal.classList.contains('hidden')) {
        // If browser is open, go back in browser
        if (elements.browserWebview.canGoBack()) {
          elements.browserWebview.goBack()
        }
      } else if (!elements.topicDetailView.classList.contains('hidden')) {
        // If in topic view, go back to list
        showTopicsView()
      }
    } else if (e.button === 4) {
      // Mouse forward button
      e.preventDefault()
      if (!elements.browserModal.classList.contains('hidden')) {
        // If browser is open, go forward in browser
        if (elements.browserWebview.canGoForward()) {
          elements.browserWebview.goForward()
        }
      }
    }
  })
}

// Helper to check if an input element is focused
function isInputFocused() {
  const activeElement = document.activeElement
  return (
    activeElement &&
    (activeElement.tagName === 'INPUT' ||
      activeElement.tagName === 'TEXTAREA' ||
      activeElement.isContentEditable)
  )
}
// Download event listeners from main process
function setupDownloadListeners() {
  window.electronAPI.onDownloadProgress(data => {
    addLog('verbose', `Download progress: ${data.filename} - ${data.progress}%`)
    updateDownloadProgress(data)
  })

  window.electronAPI.onDownloadComplete(data => {
    addLog('verbose', `Download complete event received: ${data.filename}`)
    completeDownload(data)
  })

  window.electronAPI.onDownloadError(data => {
    handleDownloadError(data)
  })
  window.electronAPI.onDownloadQueued(data => {
    handleDownloadQueued(data)
  })
}

// Load topics from API based on current category
async function loadTopics(append = true) {
  if (state.isLoading || state.isPrefetching) return
  if (!state.hasMore && append) return

  state.isLoading = true
  showLoading()

  const categoryLabel =
    state.currentCategory === 'tag' ? `tag:${state.currentFilterTag}` : state.currentCategory
  addLog('verbose', `Loading ${categoryLabel} topics page ${state.currentPage}...`)

  try {
    let result

    // Choose API call based on category
    switch (state.currentCategory) {
      case 'new':
        result = await window.electronAPI.getNewTopics()
        break
      case 'tag':
        result = await window.electronAPI.getTopicsByTag(state.currentFilterTag, state.currentPage)
        break
      case 'paid':
        result = await window.electronAPI.getPaidTopics(state.currentPage)
        break
      default: // 'all'
        result = await window.electronAPI.getTopics(state.currentPage)
        break
    }

    if (result.success) {
      const data = result.data
      const topicsArray = data.topics || []
      addLog(
        'info',
        `Loaded ${topicsArray.length} topics from ${categoryLabel} page ${state.currentPage}`
      )

      // Filter out blacklisted topics
      const filteredTopics = filterBlacklistedTopics(topicsArray)
      const filteredCount = topicsArray.length - filteredTopics.length
      if (filteredCount > 0) {
        addLog('verbose', `Filtered out ${filteredCount} blacklisted topics`)
      }

      if (append) {
        state.topics = [...state.topics, ...filteredTopics]
      } else {
        state.topics = filteredTopics
      }

      // 'new' category doesn't support pagination
      state.hasMore = state.currentCategory === 'new' ? false : data.hasMore || false
      state.topTags = data.topTags || state.topTags

      renderTopics(append)
      renderTags()

      // Show/hide end indicator
      if (!state.hasMore) {
        elements.endIndicator.classList.remove('hidden')
      } else {
        elements.endIndicator.classList.add('hidden')
      }

      // Prefetch next page if we have more (only for paginated categories)
      if (state.hasMore && state.currentCategory !== 'new') {
        prefetchNextPage()
      }
    } else {
      showError('Failed to load topics: ' + result.error)

      // Handle session expiry
      if (result.status === 403) {
        window.electronAPI.showLogin()
      }
    }
  } catch (error) {
    showError('Network error: ' + error.message)
  } finally {
    state.isLoading = false
    hideLoading()
  }
}

// Prefetch next page in the background
async function prefetchNextPage() {
  if (state.isPrefetching || !state.hasMore) return
  // Only prefetch for categories that support pagination
  if (state.currentCategory === 'new') return

  state.isPrefetching = true

  try {
    // Prefetch the next 2 pages silently for smoother scrolling
    if (state.currentCategory === 'tag' && state.currentFilterTag) {
      await Promise.all([
        window.electronAPI.getTopicsByTag(state.currentFilterTag, state.currentPage + 1),
        window.electronAPI.getTopicsByTag(state.currentFilterTag, state.currentPage + 2),
      ])
    } else if (state.currentCategory === 'paid') {
      await Promise.all([
        window.electronAPI.getPaidTopics(state.currentPage + 1),
        window.electronAPI.getPaidTopics(state.currentPage + 2),
      ])
    } else {
      await Promise.all([
        window.electronAPI.getTopics(state.currentPage + 1),
        window.electronAPI.getTopics(state.currentPage + 2),
      ])
    }
  } catch (error) {
    console.log('Prefetch failed:', error)
  } finally {
    state.isPrefetching = false
  }
}

// Reset and load from beginning
async function resetAndLoadTopics() {
  state.currentPage = 0
  state.topics = []
  state.hasMore = true
  elements.endIndicator.classList.add('hidden')
  elements.topicsGrid.scrollIntoView({ behavior: 'smooth' })
  await loadTopics(false)
}

// Handle scroll for infinite loading
function handleScroll() {
  if (state.currentView !== 'topics') return
  if (!state.hasMore || state.isLoading) return

  const scrollArea = elements.contentArea
  const scrollTop = scrollArea.scrollTop
  const scrollHeight = scrollArea.scrollHeight
  const clientHeight = scrollArea.clientHeight

  // Check if we're near the bottom
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight

  if (distanceFromBottom < state.scrollThreshold) {
    loadMoreTopics()
  }
}

// Load more topics (next page)
async function loadMoreTopics() {
  if (state.isLoading || !state.hasMore) return

  state.currentPage++
  await loadTopics(true)
}

// Render topics grid
function renderTopics(append = false) {
  const filteredTopics = filterTopicsBySearch(state.topics)

  if (filteredTopics.length === 0) {
    elements.topicsGrid.innerHTML = `
      <div class="empty-state">
        <p>No scripts found</p>
      </div>
    `
    return
  }

  const topicsHtml = filteredTopics.map(topic => createTopicCard(topic)).join('')

  if (append && elements.topicsGrid.querySelector('.topic-card')) {
    // Append new cards
    elements.topicsGrid.insertAdjacentHTML('beforeend', topicsHtml)
  } else {
    // Replace all cards
    elements.topicsGrid.innerHTML = topicsHtml
  }

  // Add click handlers to new cards
  elements.topicsGrid.querySelectorAll('.topic-card').forEach(card => {
    if (!card.dataset.hasListener) {
      card.dataset.hasListener = 'true'
      card.addEventListener('click', () => {
        const topicId = parseInt(card.dataset.topicId)
        loadTopicDetail(topicId)
      })
    }
  })
}

// Create topic card HTML
function createTopicCard(topic) {
  // Check if thumbnail is a GIF - don't use lazy loading for GIFs to ensure they animate
  const isGif = topic.thumbnail && topic.thumbnail.toLowerCase().endsWith('.gif')
  const loadingAttr = isGif ? '' : 'loading="lazy"'

  const thumbnailHtml = topic.thumbnail
    ? `<img src="${escapeHtml(topic.thumbnail)}" alt="" ${loadingAttr}>`
    : `<div class="topic-thumbnail-placeholder">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
       </div>`

  const authorHtml = topic.author
    ? `<div class="topic-author">
        <img src="${escapeHtml(topic.author.avatar)}" alt="">
        <span>${escapeHtml(topic.author.username)}</span>
       </div>`
    : ''

  const tagsHtml = topic.tags
    .slice(0, 5)
    .map(tag => {
      let tagClass = 'topic-tag'
      if (tag === 'vr') tagClass += ' vr'
      else if (tag === 'non-vr') tagClass += ' non-vr'
      else if (tag.includes('hentai')) tagClass += ' hentai'
      else if (tag.startsWith('len-')) tagClass += ' len'
      return `<span class="${tagClass}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`
    })
    .join('')

  return `
    <article class="topic-card" data-topic-id="${topic.id}">
      <div class="topic-thumbnail">
        ${thumbnailHtml}
      </div>
      <div class="topic-info">
        <h3 class="topic-title">${topic.fancyTitle || escapeHtml(topic.title)}</h3>
        <div class="topic-meta">
          ${authorHtml}
          <span class="topic-date">${formatRelativeDate(topic.createdAt)}</span>
        </div>
        <div class="topic-stats">
          <span class="topic-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
              <circle cx="12" cy="12" r="3"></circle>
            </svg>
            ${formatNumber(topic.views)}
          </span>
          <span class="topic-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"></path>
            </svg>
            ${topic.postsCount}
          </span>
          <span class="topic-stat">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
            </svg>
            ${topic.likeCount}
          </span>
        </div>
        <div class="topic-tags">
          ${tagsHtml}
        </div>
      </div>
    </article>
  `
}

// Load topic detail
async function loadTopicDetail(topicId) {
  showLoading()
  addLog('info', `Loading topic details: ${topicId}`)

  try {
    const result = await window.electronAPI.getTopicDetails(topicId)

    if (result.success) {
      state.currentTopic = result.data
      addLog(
        'verbose',
        `Topic "${result.data.title}" - ${result.data.downloads?.funscripts?.length || 0} scripts, ${result.data.downloads?.videos?.length || 0} videos`
      )
      renderTopicDetail()
      showDetailView()
    } else {
      addLog('error', `Failed to load topic ${topicId}: ${result.error}`)
      showError('Failed to load topic: ' + result.error)
    }
  } catch (error) {
    addLog('error', `Network error loading topic ${topicId}: ${error.message}`)
    showError('Network error: ' + error.message)
  } finally {
    hideLoading()
  }
}

// Render topic detail view
function renderTopicDetail() {
  const topic = state.currentTopic
  elements.detailTitle.textContent = topic.title

  const heroHtml = topic.imageUrl
    ? `<div class="detail-hero"><img src="${escapeHtml(topic.imageUrl)}" alt=""></div>`
    : ''

  const tagsHtml = topic.tags.map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join('')

  const metaHtml = `
    <div class="detail-meta">
      <div class="detail-meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
          <circle cx="12" cy="12" r="3"></circle>
        </svg>
        ${formatNumber(topic.views)} views
      </div>
      <div class="detail-meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
        </svg>
        ${topic.likeCount} likes
      </div>
      <div class="detail-meta-item">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
        ${formatDate(topic.createdAt)}
      </div>
    </div>
  `

  const downloadsHtml = renderDownloads(topic.downloads)

  const mainPostHtml = topic.mainPost
    ? `<div class="detail-section">
        <h3 class="detail-section-title">Description</h3>
        <div class="post-content">${sanitizeHtml(topic.mainPost.cooked)}</div>
       </div>`
    : ''

  const commentsHtml =
    topic.comments.length > 0
      ? `<div class="comments-section">
        <h3 class="comments-title">Comments (${topic.comments.length})</h3>
        ${topic.comments.map(comment => createCommentHtml(comment)).join('')}
       </div>`
      : ''

  elements.detailContent.innerHTML = `
    ${heroHtml}
    ${metaHtml}
    <div class="detail-tags">${tagsHtml}</div>
    ${downloadsHtml}
    ${mainPostHtml}
    ${commentsHtml}
  `

  // Add download button handlers
  elements.detailContent.querySelectorAll('.download-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const url = btn.dataset.url
      const filename = btn.dataset.filename
      if (btn.dataset.external === 'true') {
        openInAppBrowser(url)
      } else {
        startDownload(url, filename, btn)
      }
    })
  })
}

// Render downloads section
function renderDownloads(downloads) {
  if (!downloads || (downloads.funscripts.length === 0 && downloads.videos.length === 0)) {
    return ''
  }

  let html = `
    <div class="downloads-section">
      <div class="downloads-title">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
        Downloads
      </div>
  `

  // Funscripts
  if (downloads.funscripts.length > 0) {
    html += downloads.funscripts
      .map(
        file => `
      <div class="download-item">
        <div class="download-info">
          <div class="download-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
              <polyline points="14 2 14 8 20 8"></polyline>
            </svg>
          </div>
          <div>
            <div class="download-name">${escapeHtml(file.filename)}</div>
            ${file.title ? `<div class="download-size">${escapeHtml(file.title)}</div>` : ''}
            ${file.fromReply ? '<span class="reply-badge">From Reply</span>' : ''}
          </div>
        </div>
        <button class="download-btn" data-url="${escapeHtml(file.url)}" data-filename="${escapeHtml(file.filename)}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
          Download
        </button>
      </div>
    `
      )
      .join('')
  }

  // Videos - always show both download and browse options
  if (downloads.videos.length > 0) {
    html += '<div class="videos-section">'
    html += downloads.videos
      .map(video => {
        // Generate filename from URL and service
        const filename = `${video.service}_${Date.now()}.mp4`

        return `
        <div class="video-item" data-url="${escapeHtml(video.url)}">
          <div class="download-info">
            <div class="download-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="23 7 16 12 23 17 23 7"></polygon>
                <rect x="1" y="5" width="15" height="14" rx="2" ry="2"></rect>
              </svg>
            </div>
            <div>
              <div class="download-name">${escapeHtml(video.title || 'Video')}</div>
              <span class="video-service">${escapeHtml(video.service)}</span>
              ${video.fromReply ? '<span class="video-verification verified">✓ From Reply</span>' : '<span class="video-verification" data-url="' + escapeHtml(video.url) + '">Checking...</span>'}
            </div>
          </div>
          <div class="video-actions">
            <button class="download-btn download-video-btn" data-url="${escapeHtml(video.url)}" data-filename="${filename}" style="display: ${video.fromReply ? 'inline-flex' : 'none'};">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Download
            </button>
            <button class="download-btn external-link-btn" data-url="${escapeHtml(video.url)}" data-external="true">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
                <polyline points="15 3 21 3 21 9"></polyline>
                <line x1="10" y1="14" x2="21" y2="3"></line>
              </svg>
              Browse
            </button>
          </div>
        </div>
      `
      })
      .join('')
    html += '</div>'

    // Verify URLs after rendering (only non-reply videos need verification)
    const videosToVerify = downloads.videos.filter(v => !v.fromReply)
    if (videosToVerify.length > 0) {
      setTimeout(() => verifyVideoUrls(videosToVerify), 100)
    }
  }

  html += '</div>'
  return html
}

// Create comment HTML
function createCommentHtml(comment) {
  return `
    <div class="comment">
      <div class="comment-header">
        <img class="comment-avatar" src="${escapeHtml(comment.avatar)}" alt="">
        <div>
          <div class="comment-author">${escapeHtml(comment.username)}</div>
          <div class="comment-date">${formatRelativeDate(comment.createdAt)}</div>
        </div>
      </div>
      <div class="comment-content">${sanitizeHtml(comment.cooked)}</div>
    </div>
  `
}

// Render tags in sidebar
function renderTags() {
  elements.tagsList.innerHTML = state.topTags
    .slice(0, 20)
    .map(
      tag =>
        `<span class="tag ${state.selectedTag === tag ? 'active' : ''}" data-tag="${escapeHtml(tag)}">${escapeHtml(tag)}</span>`
    )
    .join('')

  elements.tagsList.querySelectorAll('.tag').forEach(tagEl => {
    tagEl.addEventListener('click', () => {
      const tag = tagEl.dataset.tag
      state.selectedTag = state.selectedTag === tag ? null : tag
      renderTags()
      resetAndLoadTopics()
    })
  })
}

// Download functions
async function startDownload(url, filename, button) {
  if (state.activeDownloads.has(url)) return

  addLog('info', `Starting download: ${filename}`)
  addLog('verbose', `Download URL: ${url}`)

  button.classList.add('downloading')
  button.innerHTML = `
    <svg class="spinner-small" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="10" stroke="currentColor" stroke-width="2" fill="none" stroke-dasharray="60" stroke-dashoffset="0">
        <animate attributeName="stroke-dashoffset" values="0;-120" dur="1s" repeatCount="indefinite"/>
      </circle>
    </svg>
    Downloading...
  `

  state.activeDownloads.set(url, { filename, button, progress: 0 })
  updateDownloadCount()
  // Removed showDownloadDrawer() - downloads are now in sidebar view

  renderActiveDownloads()

  // If downloads view is open, update it too
  if (state.currentView === 'downloads') {
    renderActiveDownloadsList()
  }

  try {
    await window.electronAPI.downloadFile(url, filename)
  } catch (error) {
    addLog('error', `Download failed for ${filename}: ${error.message}`)
    handleDownloadError({ url, filename, error: error.message })
  }
}

function updateDownloadProgress(data) {
  const download = state.activeDownloads.get(data.url)
  if (download) {
    download.progress = data.progress
    download.bytesReceived = data.bytesReceived
    download.totalBytes = data.totalBytes
    renderActiveDownloads()

    // Also update the main downloads view if it's visible
    if (state.currentView === 'downloads') {
      renderActiveDownloadsList()
    }
  } else {
    addLog('verbose', `Progress event for unknown download URL: ${data.url}`)
  }
}

function completeDownload(data) {
  const download = state.activeDownloads.get(data.url)
  if (download && download.button) {
    addLog('info', `Download complete: ${download.filename}`)
    download.button.classList.remove('downloading')
    download.button.classList.add('completed')
    download.button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <polyline points="20 6 9 17 4 12"></polyline>
      </svg>
      Downloaded
    `
  } else {
    addLog('verbose', `Complete event for unknown download URL: ${data.url}`)
  }

  state.activeDownloads.delete(data.url)
  updateDownloadCount()
  renderActiveDownloads()
  loadDownloadHistory()
}

function handleDownloadError(data) {
  addLog('error', `Download error: ${data.error} for ${data.filename}`)
  const download = state.activeDownloads.get(data.url)
  if (download && download.button) {
    download.button.classList.remove('downloading')
    download.button.classList.add('error')
    download.button.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
        <polyline points="7 10 12 15 17 10"></polyline>
        <line x1="12" y1="15" x2="12" y2="3"></line>
      </svg>
      Retry
    `
    // Re-enable button for retry
    download.button.disabled = false
  }

  state.activeDownloads.delete(data.url)
  updateDownloadCount()
  renderActiveDownloads()

  console.error('Download error:', data.error)
  showError(`Download failed: ${data.error || 'Unknown error'}. You can retry or open in browser.`)
}

function handleDownloadQueued(data) {
  state.queuedDownloads.set(data.url, data)
  showInfo(`Download queued (position ${data.queuePosition}): ${data.filename}`)
}

// Verify video URLs
async function verifyVideoUrls(videos) {
  const verificationPromises = videos.map(async video => {
    const url = video.url

    // Check cache first
    if (state.verifiedUrls.has(url)) {
      updateVideoVerification(url, state.verifiedUrls.get(url))
      return
    }

    try {
      // Set a timeout for the verification
      const timeoutPromise = new Promise((_resolve, reject) =>
        setTimeout(() => reject(new Error('Verification timeout')), 15000)
      )

      const verifyPromise = window.electronAPI.verifyUrl(url)

      const result = await Promise.race([verifyPromise, timeoutPromise])
      const verification = result.success
        ? result.data
        : { valid: false, error: result.error || 'Verification failed' }

      // Cache result
      state.verifiedUrls.set(url, verification)
      updateVideoVerification(url, verification)
    } catch (error) {
      console.error('Error verifying URL:', url, error.message)
      const verification = { valid: false, error: 'Verification timeout or failed' }
      state.verifiedUrls.set(url, verification)
      updateVideoVerification(url, verification)
    }
  })

  // Wait for all verifications to complete (or timeout)
  await Promise.allSettled(verificationPromises)
}

function updateVideoVerification(url, verification) {
  const videoItem = document.querySelector(`.video-item[data-url="${CSS.escape(url)}"]`)
  if (!videoItem) return

  const verificationEl = videoItem.querySelector('.video-verification')
  const downloadBtn = videoItem.querySelector('.download-video-btn')

  if (!verificationEl || !downloadBtn) return

  if (verification.valid) {
    // Special message for Pixeldrain lists
    if (verification.isPixeldrainList) {
      const fileCount = verification.fileCount || 0
      verificationEl.textContent = `✓ List (${fileCount} files)`
      verificationEl.title = 'Pixeldrain list - all files will be downloaded'
    } else {
      verificationEl.textContent = '✓ Available'
    }
    verificationEl.className = 'video-verification verified'
    downloadBtn.style.display = 'inline-flex'
  } else if (verification.needsBrowser) {
    verificationEl.textContent = '🌐 Browser Only'
    verificationEl.className = 'video-verification browser-only'
    downloadBtn.style.display = 'none'
  } else {
    verificationEl.textContent = '⚠ ' + (verification.error || 'Unavailable')
    verificationEl.className = 'video-verification unavailable'
    verificationEl.title = verification.error || 'Link cannot be accessed'
    downloadBtn.style.display = 'none'
  }
}

function renderActiveDownloads() {
  if (state.activeDownloads.size === 0) {
    if (elements.activeDownloads) {
      elements.activeDownloads.innerHTML =
        '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No active downloads</p>'
    }
    return
  }

  const html = Array.from(state.activeDownloads.entries())
    .map(
      ([url, download]) => `
    <div class="download-progress-item">
      <div class="progress-info">
        <div class="progress-filename">${escapeHtml(download.filename)}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${download.progress}%"></div>
        </div>
        <div class="progress-text">${download.progress}% - ${formatBytes(download.bytesReceived || 0)} / ${formatBytes(download.totalBytes || 0)}</div>
      </div>
    </div>
  `
    )
    .join('')

  // Update old drawer if it exists
  if (elements.activeDownloads) {
    elements.activeDownloads.innerHTML = html
  }
}

// Render active downloads in the main downloads view
function renderActiveDownloadsList() {
  if (!elements.activeDownloadsList) return

  if (state.activeDownloads.size === 0) {
    elements.activeDownloadsList.innerHTML = '<div class="empty-state">No active downloads</div>'
    return
  }

  elements.activeDownloadsList.innerHTML = Array.from(state.activeDownloads.entries())
    .map(
      ([url, download]) => `
    <div class="download-item-card">
      <div class="download-item-icon">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
          <polyline points="7 10 12 15 17 10"></polyline>
          <line x1="12" y1="15" x2="12" y2="3"></line>
        </svg>
      </div>
      <div class="download-item-info">
        <div class="download-item-name">${escapeHtml(download.filename)}</div>
        <div class="progress-bar">
          <div class="progress-fill" style="width: ${download.progress}%"></div>
        </div>
        <div class="download-item-meta">
          ${download.progress}% • ${formatBytes(download.bytesReceived || 0)} / ${formatBytes(download.totalBytes || 0)}
        </div>
      </div>
    </div>
  `
    )
    .join('')
}

async function loadDownloadHistory() {
  const result = await window.electronAPI.getDownloadHistory()
  if (result.success) {
    state.downloadHistory = result.data
    renderDownloadHistory()
  }
}

function renderDownloadHistory() {
  const historyHtml =
    state.downloadHistory.length === 0
      ? '<p style="color: var(--text-muted); text-align: center; padding: 20px;">No download history</p>'
      : state.downloadHistory
          .slice(0, 50)
          .map(
            item => `
        <div class="history-item">
          <div class="history-item-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20 6 9 17 4 12"></polyline>
            </svg>
          </div>
          <div class="history-item-info">
            <div class="history-item-name">${escapeHtml(item.filename)}</div>
            <div class="history-item-meta">${formatRelativeDate(item.completedAt)} • ${formatBytes(item.size || 0)}</div>
          </div>
        </div>
      `
          )
          .join('')

  // Update old drawer if it exists
  if (elements.historyList) {
    elements.historyList.innerHTML = historyHtml
  }

  // Update new downloads view if it exists
  if (elements.downloadHistoryList) {
    elements.downloadHistoryList.innerHTML = historyHtml
  }
}

async function clearDownloadHistory() {
  await window.electronAPI.clearDownloadHistory()
  state.downloadHistory = []
  renderDownloadHistory()
}

function updateDownloadCount() {
  const count = state.activeDownloads.size

  // Update drawer badge (old)
  if (elements.downloadCount) {
    elements.downloadCount.textContent = count
    elements.downloadCount.classList.toggle('hidden', count === 0)
  }

  // Update sidebar badge (new)
  if (elements.downloadsBadge) {
    elements.downloadsBadge.textContent = count
    elements.downloadsBadge.classList.toggle('hidden', count === 0)
  }
}

// View management
function showTopicsView() {
  state.currentView = 'topics'
  elements.topicsView.classList.remove('hidden')
  elements.topicDetailView.classList.add('hidden')
  if (elements.downloadsView) {
    elements.downloadsView.classList.add('hidden')
  }

  // Remove active from downloads link
  if (elements.downloadsLink) {
    elements.downloadsLink.classList.remove('active')
  }
}

function showDetailView() {
  state.currentView = 'detail'
  elements.topicsView.classList.add('hidden')
  elements.topicDetailView.classList.remove('hidden')
  if (elements.downloadsView) {
    elements.downloadsView.classList.add('hidden')
  }

  // Ensure downloads link is not highlighted while in detail view
  if (elements.downloadsLink) {
    elements.downloadsLink.classList.remove('active')
  }
}

function showDownloadsView() {
  state.currentView = 'downloads'
  elements.topicsView.classList.add('hidden')
  elements.topicDetailView.classList.add('hidden')
  if (elements.downloadsView) {
    elements.downloadsView.classList.remove('hidden')
  }

  // Update sidebar active state
  document.querySelectorAll('.sidebar-link').forEach(link => {
    link.classList.remove('active')
  })
  if (elements.downloadsLink) {
    elements.downloadsLink.classList.add('active')
  }

  // Render downloads
  renderActiveDownloadsList()
  loadDownloadHistory()
}

function showLoading() {
  elements.loadingIndicator.classList.remove('hidden')
}

function hideLoading() {
  elements.loadingIndicator.classList.add('hidden')
}

function toggleDownloadDrawer() {
  elements.downloadDrawer.classList.toggle('collapsed')
}

// Settings functions
function showSettingsModal() {
  elements.settingsModal.classList.remove('hidden')
}

function hideSettingsModal() {
  elements.settingsModal.classList.add('hidden')
}

async function loadDownloadPath() {
  const result = await window.electronAPI.getDownloadPath()
  if (result.success) {
    elements.downloadPathInput.value = result.data
  }
}

async function browseDownloadPath() {
  const result = await window.electronAPI.setDownloadPath(null)
  if (result.success) {
    elements.downloadPathInput.value = result.data
  }
}

async function loadMaxDownloads() {
  const result = await window.electronAPI.getMaxDownloads()
  if (result.success) {
    elements.maxDownloadsInput.value = result.data
  }
}

async function saveMaxDownloads() {
  const max = parseInt(elements.maxDownloadsInput.value, 10)
  if (isNaN(max) || max < 1 || max > 50) {
    alert('Please enter a number between 1 and 50')
    return
  }

  const result = await window.electronAPI.setMaxDownloads(max)
  if (result.success) {
    alert(`Max simultaneous downloads set to ${max}`)
  } else {
    alert('Failed to save setting')
  }
}

async function logout() {
  if (confirm('Are you sure you want to logout?')) {
    window.electronAPI.logout()
  }
}

// Update check functions
async function checkForUpdatesNow() {
  const btn = document.getElementById('checkUpdatesNowBtn')
  const originalText = btn.textContent
  btn.disabled = true
  btn.textContent = 'Checking...'

  try {
    await window.electronAPI.checkForUpdates()
  } finally {
    btn.textContent = originalText
    btn.disabled = false
  }
}

async function loadAppVersion() {
  try {
    const version = await window.electronAPI.getAppVersion()
    const versionElement = document.getElementById('currentVersion')
    if (versionElement) {
      versionElement.textContent = version
    }
  } catch (error) {
    addLog('error', 'Failed to load app version: ' + error.message)
  }
}

// Handle search input - detects URLs or filters topics
async function handleSearchInput() {
  const value = elements.searchInput.value.trim()

  // Check if it's a topic URL
  if (value.includes('discuss.eroscripts.com/t/') || value.includes('eroscripts.com/t/')) {
    try {
      addLog('verbose', `Detected topic URL: ${value}`)
      const result = await window.electronAPI.parseTopicUrl(value)

      if (result.success && result.data.topicId) {
        // Clear the search input
        elements.searchInput.value = ''

        // Navigate directly to the topic
        showToast('Loading topic...', 'info')
        addLog('info', `Navigating to topic ID: ${result.data.topicId}`)

        await loadTopicDetail(result.data.topicId)
        return
      }
    } catch (error) {
      addLog('error', `Failed to parse URL: ${error.message}`)
    }
  }

  // Otherwise, do normal search filter
  filterTopics()
}

// Filter functions
function filterTopics() {
  resetAndLoadTopics()
}

function filterTopicsBySearch(topics) {
  const search = elements.searchInput.value.toLowerCase().trim()
  let filtered = topics

  if (search) {
    filtered = filtered.filter(
      topic =>
        topic.title.toLowerCase().includes(search) ||
        (topic.excerpt && topic.excerpt.toLowerCase().includes(search))
    )
  }

  if (state.selectedTag) {
    filtered = filtered.filter(topic => topic.tags.includes(state.selectedTag))
  }

  return filtered
}

// Utility functions
function escapeHtml(text) {
  if (!text) return ''
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

function sanitizeHtml(html) {
  if (!html) return ''
  // Basic sanitization - in production use DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/on\w+='[^']*'/gi, '')
}

function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatRelativeDate(dateString) {
  const date = new Date(dateString)
  const now = new Date()
  const diffMs = now - date
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHour = Math.floor(diffMin / 60)
  const diffDay = Math.floor(diffHour / 24)

  if (diffDay > 30) return formatDate(dateString)
  if (diffDay > 0) return `${diffDay}d ago`
  if (diffHour > 0) return `${diffHour}h ago`
  if (diffMin > 0) return `${diffMin}m ago`
  return 'Just now'
}

function formatNumber(num) {
  if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M'
  if (num >= 1000) return (num / 1000).toFixed(1) + 'K'
  return num.toString()
}

function formatBytes(bytes) {
  if (bytes === 0) return '0 B'
  const k = 1024
  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

function showError(message) {
  console.error(message)
  showToast(message, 'error', 6000)
  addLog('error', message)
}

function showInfo(message) {
  console.info(message)
  showToast(message, 'info')
  addLog('info', message)
}

// Developer Mode & Logging
function setupLogListeners() {
  window.electronAPI.onDownloadLog(logData => {
    addLog(logData.type, logData.message, logData.timestamp)
  })
}

async function loadAllSettings() {
  const settings = await window.electronAPI.invoke('get-settings')

  // Developer mode
  state.developerMode = settings.developerMode || false
  elements.developerModeToggle.checked = state.developerMode
  updateDeveloperModeUI()

  // Theme and mode
  state.settings.theme = settings.theme || 'ocean'
  state.settings.mode = settings.mode || 'dark'
  applyTheme(state.settings.theme, state.settings.mode)
  updateThemeUI()

  // Download settings
  state.settings.usePostTitle = settings.usePostTitle !== false
  elements.usePostTitleToggle.checked = state.settings.usePostTitle

  // Browsing settings
  state.settings.inAppBrowser = settings.inAppBrowser !== false
  elements.inAppBrowserToggle.checked = state.settings.inAppBrowser

  // Update check settings
  const checkForUpdatesToggle = document.getElementById('checkForUpdatesToggle')
  if (checkForUpdatesToggle) {
    checkForUpdatesToggle.checked = settings.checkForUpdates !== false
  }

  // Load adblocker status
  try {
    const adBlockerResult = await window.electronAPI.getAdBlockerStatus()
    if (adBlockerResult.success && elements.adBlockerToggle) {
      elements.adBlockerToggle.checked = adBlockerResult.data.enabled
      if (adBlockerResult.data.blockedCount > 0 && elements.adBlockerCount) {
        elements.adBlockerCount.textContent = `(${adBlockerResult.data.blockedCount} blocked)`
      }
    }
  } catch (e) {
    console.log('Could not load adblocker status')
  }

  state.settings.performanceMode = settings.performanceMode || false
  elements.performanceModeToggle.checked = state.settings.performanceMode
  applyPerformanceMode(state.settings.performanceMode)

  // Log verbosity
  state.settings.logVerbosity = settings.logVerbosity || 'light'
  elements.logVerbositySelect.value = state.settings.logVerbosity
}

async function saveSetting(key, value) {
  state.settings[key] = value
  const settings = await window.electronAPI.invoke('get-settings')
  settings[key] = value
  await window.electronAPI.invoke('save-settings', settings)
  addLog('info', `Setting changed: ${key} = ${value}`)
}

function setMode(mode) {
  state.settings.mode = mode
  applyTheme(state.settings.theme, mode)
  updateThemeUI()
  saveSetting('mode', mode)
}

function setTheme(theme) {
  state.settings.theme = theme
  applyTheme(theme, state.settings.mode)
  updateThemeUI()
  saveSetting('theme', theme)

  // Apply or remove custom theme CSS
  if (theme === 'custom') {
    themeEditor.loadSavedTheme()
  } else {
    // Remove custom style when switching away
    const customStyle = document.getElementById('custom-theme-style')
    if (customStyle) customStyle.remove()
  }
}

function applyTheme(theme, mode) {
  document.documentElement.setAttribute('data-theme', theme)
  document.documentElement.setAttribute('data-mode', mode)
}

function updateThemeUI() {
  // Update mode buttons
  elements.modeOptions.forEach(btn => {
    btn.classList.toggle('active', btn.dataset.mode === state.settings.mode)
  })

  // Update theme options
  elements.themeOptions.forEach(option => {
    option.classList.toggle('active', option.dataset.theme === state.settings.theme)
  })

  // Show/hide edit custom theme button
  const editBtn = document.getElementById('editCustomThemeBtn')
  if (editBtn) {
    editBtn.classList.toggle('hidden', state.settings.theme !== 'custom')
  }
}

// ============================================
// Custom Theme Editor
// ============================================

const themeEditor = {
  modal: null,
  codeEditor: null,
  syntaxHighlight: null,
  lineNumbers: null,
  previewBox: null,
  isModified: false,

  // Default custom theme CSS
  defaultCSS: `/* Custom Theme - Edit these CSS variables */
/* The theme will automatically apply to the app */

:root {
  /* Primary Colors */
  --primary: #3b82f6;
  --primary-hover: #2563eb;
  --primary-light: rgba(59, 130, 246, 0.1);

  /* Accent Colors */
  --accent: #06b6d4;
  --accent-hover: #0891b2;

  /* Background Colors */
  --bg-primary: #0a0f1a;
  --bg-secondary: #111827;
  --bg-tertiary: #1f2937;
  --bg-elevated: #263043;
  --bg-hover: rgba(59, 130, 246, 0.08);
  --bg-active: rgba(59, 130, 246, 0.15);

  /* Surface Colors */
  --surface: #1a2332;
  --surface-hover: #243044;
  --surface-border: #2d3f5a;

  /* Text Colors */
  --text-primary: #f8fafc;
  --text-secondary: #94a3b8;
  --text-tertiary: #64748b;
  --text-muted: #475569;

  /* Border Colors */
  --border-color: #1e3a5f;
  --border-light: #2d4a6f;

  /* Status Colors */
  --success: #10b981;
  --warning: #f59e0b;
  --error: #ef4444;
  --info: #3b82f6;

  /* Shadows */
  --shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --shadow-md: 0 4px 12px rgba(0, 0, 0, 0.5);
  --shadow-lg: 0 10px 40px rgba(0, 0, 0, 0.6);
  --shadow-glow: 0 0 20px rgba(59, 130, 246, 0.15);

  /* Gradients */
  --gradient-primary: linear-gradient(135deg, #3b82f6, #06b6d4);
  --gradient-surface: linear-gradient(180deg, #1a2332, #0a0f1a);
}`,

  init() {
    this.modal = document.getElementById('themeEditorModal')
    this.codeEditor = document.getElementById('themeCodeEditor')
    this.syntaxHighlight = document.getElementById('syntaxHighlight')
    this.lineNumbers = document.getElementById('lineNumbers')
    this.previewBox = document.querySelector('.theme-preview-box')

    if (!this.modal || !this.codeEditor) return

    this.setupEventListeners()
    this.loadSavedTheme()
  },

  setupEventListeners() {
    // Open editor button
    const editBtn = document.getElementById('editCustomThemeBtn')
    editBtn?.addEventListener('click', () => this.open())

    // Close button
    const closeBtn = document.getElementById('closeThemeEditorBtn')
    closeBtn?.addEventListener('click', () => this.close())

    // Backdrop click
    this.modal.querySelector('.modal-backdrop')?.addEventListener('click', () => this.close())

    // Save button
    const saveBtn = document.getElementById('saveThemeBtn')
    saveBtn?.addEventListener('click', () => this.save())

    // Reset button
    const resetBtn = document.getElementById('resetThemeBtn')
    resetBtn?.addEventListener('click', () => this.reset())

    // Code editor events
    this.codeEditor.addEventListener('input', () => this.onCodeChange())
    this.codeEditor.addEventListener('scroll', () => this.syncScroll())
    this.codeEditor.addEventListener('keydown', e => this.handleKeyDown(e))

    // Quick color pickers
    const colorPickers = [
      'quickPrimaryColor',
      'quickAccentColor',
      'quickBgColor',
      'quickSurfaceColor',
      'quickTextColor',
    ]
    colorPickers.forEach(id => {
      const picker = document.getElementById(id)
      picker?.addEventListener('input', e => this.onQuickColorChange(id, e.target.value))
    })
  },

  open() {
    this.modal.classList.remove('hidden')
    this.updateLineNumbers()
    this.updateSyntaxHighlight()
    this.updatePreview()
    this.syncQuickColors()
  },

  close() {
    if (this.isModified) {
      if (!confirm('You have unsaved changes. Are you sure you want to close?')) {
        return
      }
    }
    this.modal.classList.add('hidden')
  },

  onCodeChange() {
    this.isModified = true
    this.updateStatus('Modified')
    this.updateLineNumbers()
    this.updateSyntaxHighlight()
    this.applyLivePreview()
  },

  updateLineNumbers() {
    const lines = this.codeEditor.value.split('\n')
    this.lineNumbers.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('')
  },

  updateSyntaxHighlight() {
    const code = this.codeEditor.value
    this.syntaxHighlight.innerHTML = this.highlightCSS(code) + '\n'
  },

  highlightCSS(code) {
    // Escape HTML
    let html = code.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

    // Comments
    html = html.replace(/(\/\*[\s\S]*?\*\/)/g, '<span class="css-comment">$1</span>')

    // Property values (colors, numbers, etc)
    html = html.replace(/(:)\s*([^;{}]+)(;)/g, (match, colon, value, semi) => {
      // Check for color values
      let highlightedValue = value
      // Hex colors
      highlightedValue = highlightedValue.replace(
        /(#[0-9a-fA-F]{3,8})/g,
        '<span class="css-color">$1</span>'
      )
      // rgb/rgba/hsl values
      highlightedValue = highlightedValue.replace(
        /(rgba?\([^)]+\))/g,
        '<span class="css-color">$1</span>'
      )
      // Numbers with units
      highlightedValue = highlightedValue.replace(
        /(\d+(?:\.\d+)?(?:px|em|rem|%|deg|s|ms)?)/g,
        '<span class="css-number">$1</span>'
      )
      // Keywords
      highlightedValue = highlightedValue.replace(
        /\b(linear-gradient|radial-gradient|none|inherit|initial|transparent)\b/g,
        '<span class="css-keyword">$1</span>'
      )

      return `<span class="css-punctuation">${colon}</span> ${highlightedValue}<span class="css-punctuation">${semi}</span>`
    })

    // Selectors and pseudo-selectors
    html = html.replace(/(:root|\[data-[^\]]+\])/g, '<span class="css-selector">$1</span>')

    // Property names
    html = html.replace(/(--[\w-]+)(\s*:)/g, '<span class="css-property">$1</span>$2')

    // Braces
    html = html.replace(/([{}])/g, '<span class="css-punctuation">$1</span>')

    return html
  },

  syncScroll() {
    this.syntaxHighlight.scrollTop = this.codeEditor.scrollTop
    this.syntaxHighlight.scrollLeft = this.codeEditor.scrollLeft
    this.lineNumbers.scrollTop = this.codeEditor.scrollTop
  },

  handleKeyDown(e) {
    // Tab support
    if (e.key === 'Tab') {
      e.preventDefault()
      const start = this.codeEditor.selectionStart
      const end = this.codeEditor.selectionEnd
      const value = this.codeEditor.value

      this.codeEditor.value = value.substring(0, start) + '  ' + value.substring(end)
      this.codeEditor.selectionStart = this.codeEditor.selectionEnd = start + 2
      this.onCodeChange()
    }
  },

  onQuickColorChange(pickerId, color) {
    const varMap = {
      quickPrimaryColor: '--primary',
      quickAccentColor: '--accent',
      quickBgColor: '--bg-primary',
      quickSurfaceColor: '--surface',
      quickTextColor: '--text-primary',
    }

    const cssVar = varMap[pickerId]
    if (!cssVar) return

    // Update the CSS in the editor
    let code = this.codeEditor.value
    const regex = new RegExp(`(${cssVar}\\s*:\\s*)([^;]+)(;)`)

    if (regex.test(code)) {
      code = code.replace(regex, `$1${color}$3`)
    } else {
      // Add the variable if it doesn't exist
      code = code.replace(/(:root\s*\{)/, `$1\n  ${cssVar}: ${color};`)
    }

    this.codeEditor.value = code
    this.onCodeChange()
  },

  syncQuickColors() {
    const code = this.codeEditor.value
    const varMap = {
      quickPrimaryColor: '--primary',
      quickAccentColor: '--accent',
      quickBgColor: '--bg-primary',
      quickSurfaceColor: '--surface',
      quickTextColor: '--text-primary',
    }

    Object.entries(varMap).forEach(([pickerId, cssVar]) => {
      const picker = document.getElementById(pickerId)
      if (!picker) return

      const regex = new RegExp(`${cssVar}\\s*:\\s*([^;]+);`)
      const match = code.match(regex)
      if (match) {
        const value = match[1].trim()
        // Only set if it's a valid hex color
        if (/^#[0-9a-fA-F]{6}$/.test(value)) {
          picker.value = value
        }
      }
    })
  },

  applyLivePreview() {
    // Apply CSS to the preview box
    const code = this.codeEditor.value
    this.updatePreview()

    // Also apply to the document for live preview
    this.applyCustomCSS(code, true)
  },

  updatePreview() {
    if (!this.previewBox) return

    const code = this.codeEditor.value
    const vars = this.parseCSS(code)

    const previewHeader = this.previewBox.querySelector('.preview-header')
    const previewCard = this.previewBox.querySelector('.preview-card')
    const previewTitle = this.previewBox.querySelector('.preview-title')
    const previewText = this.previewBox.querySelector('.preview-text')
    const previewBtn = this.previewBox.querySelector('.preview-btn')

    if (previewHeader) {
      previewHeader.style.background = vars['--bg-secondary'] || '#111827'
      previewHeader.style.color = vars['--text-primary'] || '#f8fafc'
    }

    if (previewCard) {
      previewCard.style.background = vars['--surface'] || '#1a2332'
      previewCard.style.borderColor = vars['--border-color'] || '#1e3a5f'
    }

    if (previewTitle) {
      previewTitle.style.color = vars['--text-primary'] || '#f8fafc'
    }

    if (previewText) {
      previewText.style.color = vars['--text-secondary'] || '#94a3b8'
    }

    if (previewBtn) {
      previewBtn.style.background = vars['--primary'] || '#3b82f6'
      previewBtn.style.color = '#fff'
    }
  },

  parseCSS(code) {
    const vars = {}
    const regex = /(--[\w-]+)\s*:\s*([^;]+);/g
    let match

    while ((match = regex.exec(code)) !== null) {
      vars[match[1]] = match[2].trim()
    }

    return vars
  },

  applyCustomCSS(code, isPreview = false) {
    // Remove existing custom style
    let styleEl = document.getElementById('custom-theme-style')
    if (styleEl) {
      styleEl.remove()
    }

    if (!code) return

    // Parse and create CSS targeting the custom theme
    const vars = this.parseCSS(code)
    let css = '[data-theme="custom"] {\n'
    Object.entries(vars).forEach(([prop, value]) => {
      css += `  ${prop}: ${value};\n`
    })
    css += '}'

    // Create and inject style element
    styleEl = document.createElement('style')
    styleEl.id = 'custom-theme-style'
    styleEl.textContent = css
    document.head.appendChild(styleEl)
  },

  save() {
    const code = this.codeEditor.value

    // Save to settings
    window.electronAPI.invoke('save-settings', { customThemeCSS: code })

    // Apply the theme
    this.applyCustomCSS(code)

    this.isModified = false
    this.updateStatus('Saved')

    addLog('info', 'Custom theme saved')
  },

  reset() {
    if (!confirm('Reset to default theme? Your changes will be lost.')) {
      return
    }

    this.codeEditor.value = this.defaultCSS
    this.onCodeChange()
    this.syncQuickColors()
  },

  updateStatus(status) {
    const statusEl = document.getElementById('editorStatus')
    if (statusEl) {
      statusEl.textContent = status
      statusEl.className = status === 'Saved' ? 'status-saved' : 'status-modified'
    }
  },

  async loadSavedTheme() {
    try {
      const settings = await window.electronAPI.invoke('get-settings')
      const savedCSS = settings?.customThemeCSS || this.defaultCSS
      this.codeEditor.value = savedCSS

      // If custom theme is selected, apply it
      if (settings?.theme === 'custom') {
        this.applyCustomCSS(savedCSS)
      }

      this.updateLineNumbers()
      this.updateSyntaxHighlight()
      this.isModified = false
    } catch (err) {
      console.error('Failed to load custom theme:', err)
      this.codeEditor.value = this.defaultCSS
    }
  },
}

function applyPerformanceMode(enabled) {
  document.body.classList.toggle('performance-mode', enabled)
  if (enabled) {
    // Replace all GIFs with static images when performance mode is enabled
    document.querySelectorAll('img[src$=".gif"]').forEach(img => {
      img.dataset.originalSrc = img.src
      // Can't convert to static, but can prevent animation by replacing with canvas
    })
  }
}

async function toggleDeveloperMode(event) {
  state.developerMode = event.target.checked
  await window.electronAPI.invoke('save-settings', { developerMode: state.developerMode })
  updateDeveloperModeUI()

  if (state.developerMode) {
    addLog('info', 'Developer mode enabled')
  }
}

function updateDeveloperModeUI() {
  elements.viewLogsBtn.style.display = state.developerMode ? 'flex' : 'none'
  elements.devModeOptions.classList.toggle('hidden', !state.developerMode)
}

function shouldLog(type) {
  const verbosity = state.settings.logVerbosity
  const priorities = {
    minimal: ['error'],
    light: ['error', 'download', 'info'],
    normal: ['error', 'download', 'info', 'yt-dlp', 'verbose'],
    verbose: ['error', 'download', 'info', 'yt-dlp', 'verbose', 'debug'],
    all: ['error', 'download', 'info', 'yt-dlp', 'verbose', 'debug', 'trace'],
  }
  return priorities[verbosity]?.includes(type) || type === 'error'
}

function addLog(type, message, timestamp = new Date().toISOString()) {
  // Always log errors, otherwise respect developer mode and verbosity
  if (type !== 'error' && !state.developerMode) return
  if (!shouldLog(type)) return

  const log = { type, message, timestamp }
  state.logs.push(log)

  // Keep only last 1000 logs
  if (state.logs.length > 1000) {
    state.logs.shift()
  }

  // Auto-scroll if log viewer is open and scrolled to bottom
  if (!elements.logViewerModal.classList.contains('hidden')) {
    const currentFilter = elements.logFilterSelect.value
    if (currentFilter === 'all' || currentFilter === type) {
      const logContent = elements.logContent
      const isScrolledToBottom =
        logContent.scrollHeight - logContent.clientHeight <= logContent.scrollTop + 50

      appendLogToViewer(log)

      if (isScrolledToBottom) {
        logContent.scrollTop = logContent.scrollHeight
      }
    }
  }
}

function appendLogToViewer(log) {
  const logEntry = document.createElement('div')
  logEntry.className = `log-entry ${log.type}`
  logEntry.dataset.type = log.type

  const timestamp = new Date(log.timestamp).toLocaleTimeString()

  logEntry.innerHTML = `
    <span class="log-timestamp">[${timestamp}]</span>
    <span class="log-type">${log.type.toUpperCase()}</span>
    <div class="log-message">${escapeHtml(log.message)}</div>
  `

  elements.logContent.appendChild(logEntry)
}

function showLogViewer() {
  elements.logViewerModal.classList.remove('hidden')
  renderLogs()
  elements.logContent.scrollTop = elements.logContent.scrollHeight
}

function hideLogViewer() {
  elements.logViewerModal.classList.add('hidden')
}

function renderLogs() {
  const filter = elements.logFilterSelect.value
  elements.logContent.innerHTML = ''

  state.logs
    .filter(log => filter === 'all' || log.type === filter)
    .forEach(log => appendLogToViewer(log))
}

function filterLogs() {
  renderLogs()
  elements.logContent.scrollTop = elements.logContent.scrollHeight
}

function clearLogs() {
  state.logs = []
  elements.logContent.innerHTML = ''
  addLog('info', 'Logs cleared')
}

// In-App Browser
function openInAppBrowser(url) {
  if (!state.settings.inAppBrowser) {
    window.electronAPI.openExternal(url)
    return
  }

  elements.browserUrlInput.value = url
  elements.browserWebview.src = url
  elements.browserModal.classList.remove('hidden')
  addLog('info', `Opening in-app browser: ${url}`)
}

function closeBrowser() {
  elements.browserModal.classList.add('hidden')
  elements.browserWebview.src = 'about:blank'
}

// ========================
// Blacklist/Tag Management
// ========================

// Filter topics that have blacklisted tags
function filterBlacklistedTopics(topics) {
  if (state.blacklistedTags.length === 0) return topics

  return topics.filter(topic => {
    const topicTags = topic.tags || []
    return !topicTags.some(tag => state.blacklistedTags.includes(tag.toLowerCase()))
  })
}

// Load blacklisted tags from localStorage
async function loadBlacklistedTags() {
  try {
    const stored = localStorage.getItem('blacklistedTags')
    if (stored) {
      state.blacklistedTags = JSON.parse(stored)
    } else {
      // Start with empty blacklist - user can add extreme tags via button
      state.blacklistedTags = []
    }
    renderBlacklistedTags()
    addLog('verbose', `Loaded ${state.blacklistedTags.length} blacklisted tags`)
  } catch (error) {
    addLog('error', `Failed to load blacklisted tags: ${error.message}`)
    state.blacklistedTags = []
  }
}

// Save blacklisted tags to localStorage
function saveBlacklistedTags() {
  localStorage.setItem('blacklistedTags', JSON.stringify(state.blacklistedTags))
}

// Render blacklisted tags in settings UI
function renderBlacklistedTags() {
  if (!elements.blacklistTagsContainer) return

  if (state.blacklistedTags.length === 0) {
    elements.blacklistTagsContainer.innerHTML =
      '<span class="text-muted">No blacklisted tags</span>'
    return
  }

  elements.blacklistTagsContainer.innerHTML = state.blacklistedTags
    .map(
      tag => `
    <span class="blacklist-tag">
      ${escapeHtml(tag)}
      <button class="blacklist-tag-remove" data-tag="${escapeHtml(tag)}" title="Remove">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </span>
  `
    )
    .join('')

  // Add click listeners for remove buttons
  elements.blacklistTagsContainer.querySelectorAll('.blacklist-tag-remove').forEach(btn => {
    btn.addEventListener('click', () => removeBlacklistTag(btn.dataset.tag))
  })
}

// Add a tag to blacklist
function addBlacklistTag() {
  const input = elements.newBlacklistTagInput
  const tag = input.value.trim().toLowerCase()

  if (!tag) return

  if (state.blacklistedTags.includes(tag)) {
    showToast('Tag already blacklisted', 'warning')
    return
  }

  state.blacklistedTags.push(tag)
  saveBlacklistedTags()
  renderBlacklistedTags()
  input.value = ''
  addLog('info', `Added "${tag}" to blacklist`)
  showToast(`Blacklisted: ${tag}`, 'success')

  // Re-filter current topics
  refilterCurrentTopics()
}

// Remove a tag from blacklist
function removeBlacklistTag(tag) {
  state.blacklistedTags = state.blacklistedTags.filter(t => t !== tag)
  saveBlacklistedTags()
  renderBlacklistedTags()
  addLog('info', `Removed "${tag}" from blacklist`)
  showToast(`Removed: ${tag}`, 'info')
}

// Add all extreme tags to blacklist
function addExtremeTags() {
  let addedCount = 0
  EXTREME_TAGS.forEach(tag => {
    if (!state.blacklistedTags.includes(tag)) {
      state.blacklistedTags.push(tag)
      addedCount++
    }
  })

  if (addedCount > 0) {
    saveBlacklistedTags()
    renderBlacklistedTags()
    addLog('info', `Added ${addedCount} extreme tags to blacklist`)
    showToast(`Added ${addedCount} extreme content tags`, 'success')
    refilterCurrentTopics()
  } else {
    showToast('All extreme tags already blacklisted', 'info')
  }
}

// Re-filter currently displayed topics after blacklist change
function refilterCurrentTopics() {
  if (state.topics.length > 0) {
    state.topics = filterBlacklistedTopics(state.topics)
    renderTopics(false)
  }
}

// Show tag context menu at position
function showTagContextMenu(x, y, tag) {
  if (!elements.tagContextMenu) return

  elements.tagContextMenu.dataset.currentTag = tag
  elements.tagContextMenu.classList.remove('hidden')

  // Position the menu
  const menuWidth = elements.tagContextMenu.offsetWidth
  const menuHeight = elements.tagContextMenu.offsetHeight
  const windowWidth = window.innerWidth
  const windowHeight = window.innerHeight

  // Adjust position if menu would go off screen
  let posX = x
  let posY = y

  if (x + menuWidth > windowWidth) {
    posX = windowWidth - menuWidth - 10
  }
  if (y + menuHeight > windowHeight) {
    posY = windowHeight - menuHeight - 10
  }

  elements.tagContextMenu.style.left = `${posX}px`
  elements.tagContextMenu.style.top = `${posY}px`
}

// Hide tag context menu
function hideTagContextMenu() {
  if (elements.tagContextMenu) {
    elements.tagContextMenu.classList.add('hidden')
    delete elements.tagContextMenu.dataset.currentTag
  }
}

// Blacklist a tag from context menu
function blacklistTagFromMenu(tag) {
  if (!tag || state.blacklistedTags.includes(tag)) {
    showToast(`"${tag}" is already blacklisted`, 'info')
    return
  }

  state.blacklistedTags.push(tag)
  saveBlacklistedTags()
  renderBlacklistedTags()
  addLog('info', `Added "${tag}" to blacklist`)
  showToast(`Blacklisted: ${tag}`, 'success')
  refilterCurrentTopics()
}

// Handle tag autocomplete for blacklist input
async function handleBlacklistAutocomplete() {
  const query = elements.newBlacklistTagInput.value.trim()

  if (query.length < 2) {
    elements.blacklistTagAutocomplete?.classList.add('hidden')
    return
  }

  try {
    const result = await window.electronAPI.searchTags(query)

    if (result.success && result.data && result.data.length > 0) {
      // Filter out already blacklisted tags
      const availableTags = result.data.filter(tag => !state.blacklistedTags.includes(tag.name))

      if (availableTags.length === 0) {
        elements.blacklistTagAutocomplete?.classList.add('hidden')
        return
      }

      elements.blacklistTagAutocomplete.innerHTML = availableTags
        .slice(0, 10)
        .map(
          tag => `
        <div class="autocomplete-item" data-tag="${escapeHtml(tag.name)}">
          <span class="autocomplete-tag-name">${escapeHtml(tag.name)}</span>
          <span class="autocomplete-tag-count">${tag.count || ''}</span>
        </div>
      `
        )
        .join('')

      // Add click handlers
      elements.blacklistTagAutocomplete.querySelectorAll('.autocomplete-item').forEach(item => {
        item.addEventListener('click', () => {
          const tag = item.dataset.tag
          elements.newBlacklistTagInput.value = tag
          elements.blacklistTagAutocomplete.classList.add('hidden')
          addBlacklistTag()
        })
      })

      elements.blacklistTagAutocomplete.classList.remove('hidden')
    } else {
      elements.blacklistTagAutocomplete?.classList.add('hidden')
    }
  } catch (error) {
    addLog('error', `Tag search error: ${error.message}`)
    elements.blacklistTagAutocomplete?.classList.add('hidden')
  }
}

// Handle tag search in sidebar
async function handleTagSearch() {
  const query = elements.tagSearchInput.value.trim()

  if (query.length < 2) {
    elements.tagSearchResults?.classList.add('hidden')
    return
  }

  try {
    const result = await window.electronAPI.searchTags(query)

    if (result.success && result.data && result.data.length > 0) {
      elements.tagSearchResults.innerHTML = result.data
        .slice(0, 15)
        .map(
          tag => `
        <div class="tag-search-result" data-tag="${escapeHtml(tag.name)}">
          <span class="tag-result-name">${escapeHtml(tag.name)}</span>
          <span class="tag-result-count">${tag.count || ''}</span>
        </div>
      `
        )
        .join('')

      // Add click handlers
      elements.tagSearchResults.querySelectorAll('.tag-search-result').forEach(item => {
        item.addEventListener('click', () => {
          const tag = item.dataset.tag
          filterByTag(tag)
          elements.tagSearchInput.value = ''
          elements.tagSearchResults.classList.add('hidden')
        })
      })

      elements.tagSearchResults.classList.remove('hidden')
    } else {
      elements.tagSearchResults.innerHTML = '<div class="tag-search-empty">No tags found</div>'
      elements.tagSearchResults.classList.remove('hidden')
    }
  } catch (error) {
    addLog('error', `Tag search error: ${error.message}`)
    elements.tagSearchResults?.classList.add('hidden')
  }
}

// Filter topics by a specific tag
async function filterByTag(tag) {
  state.currentCategory = 'tag'
  state.currentFilterTag = tag

  // Update UI
  updateCategoryUI()

  // Reset and load topics for this tag
  state.currentPage = 0
  state.topics = []
  state.hasMore = true
  elements.endIndicator.classList.add('hidden')

  await loadTopics(false)
}

// Switch between categories (all, new, tag)
async function switchCategory(category) {
  // If coming from downloads view, just show topics (don't reload if same category)
  if (state.currentView === 'downloads') {
    showTopicsView()
    if (category === state.currentCategory) {
      return // Already have the right data loaded
    }
  }

  // Skip if already on this category in topics view
  if (category === state.currentCategory && category !== 'tag' && state.currentView === 'topics')
    return

  state.currentCategory = category

  if (category !== 'tag') {
    state.currentFilterTag = null
  }

  // Update UI immediately for responsiveness
  updateCategoryUI()
  showTopicsView()

  // Reset and load topics
  state.currentPage = 0
  state.topics = []
  state.hasMore = true
  elements.endIndicator.classList.add('hidden')

  await loadTopics(false)
}

// Update category UI elements
function updateCategoryUI() {
  // Update sidebar links - match by category
  elements.sidebarLinks?.forEach(link => {
    // Skip downloads link (it's handled separately)
    if (link.id === 'downloadsLink') return
    link.classList.toggle('active', link.dataset.category === state.currentCategory)
  })

  // Update view title
  if (elements.viewTitle) {
    switch (state.currentCategory) {
      case 'all':
        elements.viewTitle.textContent = 'Free Scripts'
        break
      case 'paid':
        elements.viewTitle.textContent = 'Paid Scripts'
        break
      case 'new':
        elements.viewTitle.textContent = 'New Scripts'
        break
      case 'tag':
        elements.viewTitle.textContent = `Tag: ${state.currentFilterTag}`
        break
    }
  }

  // Show/hide dismiss button
  if (elements.dismissNewBtn) {
    elements.dismissNewBtn.classList.toggle('hidden', state.currentCategory !== 'new')
  }

  // Show/hide active tag filter
  if (elements.activeTagFilter) {
    elements.activeTagFilter.classList.toggle('hidden', state.currentCategory !== 'tag')
    if (state.currentCategory === 'tag' && elements.activeTagName) {
      elements.activeTagName.textContent = state.currentFilterTag
    }
  }
}

// Clear tag filter and return to all
async function clearTagFilter() {
  await switchCategory('all')
}

// Dismiss new topics
async function dismissNewTopics() {
  try {
    addLog('verbose', 'Dismissing new topics...')
    const result = await window.electronAPI.dismissNewTopics()

    if (result.success) {
      addLog('info', 'New topics dismissed')
      showToast('New topics dismissed', 'success')

      // Reset badge
      if (elements.newScriptsBadge) {
        elements.newScriptsBadge.textContent = '0'
        elements.newScriptsBadge.classList.add('hidden')
      }

      // If currently viewing new topics, switch back to all
      if (state.currentCategory === 'new') {
        await switchCategory('all')
      }
    } else {
      showToast('Failed to dismiss new topics', 'error')
    }
  } catch (error) {
    addLog('error', `Failed to dismiss new topics: ${error.message}`)
    showToast('Error dismissing new topics', 'error')
  }
}

// Load new topics count for badge
async function loadNewTopicsCount() {
  try {
    const result = await window.electronAPI.getNewTopics()

    if (result.success && result.data) {
      const count = result.data.topics ? result.data.topics.length : 0

      if (elements.newScriptsBadge) {
        elements.newScriptsBadge.textContent = count > 99 ? '99+' : count.toString()
        elements.newScriptsBadge.classList.toggle('hidden', count === 0)
      }

      addLog('verbose', `New topics count: ${count}`)
    }
  } catch (error) {
    addLog('error', `Failed to load new topics count: ${error.message}`)
  }
}

// Toast notifications
function showToast(message, type = 'info', duration = 4000) {
  const toast = document.createElement('div')
  toast.className = `toast ${type}`

  const icons = {
    success:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"></polyline></svg>',
    error:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="15" y1="9" x2="9" y2="15"></line><line x1="9" y1="9" x2="15" y2="15"></line></svg>',
    warning:
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>',
    info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>',
  }

  toast.innerHTML = `
    <div class="toast-icon">${icons[type] || icons.info}</div>
    <div class="toast-message">${escapeHtml(message)}</div>
    <button class="toast-close">&times;</button>
  `

  const closeBtn = toast.querySelector('.toast-close')
  closeBtn.addEventListener('click', () => removeToast(toast))

  elements.toastContainer.appendChild(toast)

  // Trigger animation
  requestAnimationFrame(() => toast.classList.add('show'))

  // Auto remove
  setTimeout(() => removeToast(toast), duration)
}

function removeToast(toast) {
  toast.classList.remove('show')
  setTimeout(() => toast.remove(), 300)
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', init)
