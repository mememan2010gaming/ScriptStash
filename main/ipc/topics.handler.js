const { ipcMain } = require('electron')
const apiService = require('../services/api.service')

function setupTopicsHandlers() {
  /**
   * Get paginated list of free topics
   */
  ipcMain.handle('get-topics', async (event, { page = 0, sort = 'latest' }) => {
    try {
      const result = await apiService.getTopics(page, sort)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error fetching topics:', error.message)
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      }
    }
  })

  /**
   * Get paginated list of paid topics
   */
  ipcMain.handle('get-paid-topics', async (event, { page = 0, sort = 'latest' }) => {
    try {
      const result = await apiService.getPaidTopics(page, sort)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error fetching paid topics:', error.message)
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      }
    }
  })

  /**
   * Parse and navigate to topic from URL
   */
  ipcMain.handle('parse-topic-url', async (event, { url }) => {
    try {
      const parsed = apiService.parseTopicUrl(url)
      if (!parsed) {
        return { success: false, error: 'Invalid topic URL' }
      }
      return { success: true, data: parsed }
    } catch (error) {
      console.error('Error parsing topic URL:', error.message)
      return { success: false, error: error.message }
    }
  })

  /**
   * Get detailed information about a topic
   */
  ipcMain.handle('get-topic-details', async (event, { topicId }) => {
    try {
      const result = await apiService.getTopicDetails(topicId)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error fetching topic details:', error.message)
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      }
    }
  })

  /**
   * Get user profile data (includes muted tags)
   */
  ipcMain.handle('get-user-profile', async (event, { username }) => {
    try {
      const result = await apiService.getUserProfile(username)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error fetching user profile:', error.message)
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      }
    }
  })

  /**
   * Update user's muted tags on EroScripts
   */
  ipcMain.handle('update-muted-tags', async (event, { username, mutedTags }) => {
    try {
      await apiService.updateMutedTags(username, mutedTags)
      return { success: true }
    } catch (error) {
      console.error('Error updating muted tags:', error.message)
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      }
    }
  })

  /**
   * Search tags for autocomplete
   */
  ipcMain.handle('search-tags', async (event, { query }) => {
    try {
      const result = await apiService.searchTags(query)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error searching tags:', error.message)
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      }
    }
  })

  /**
   * Get topics filtered by tag
   */
  ipcMain.handle('get-topics-by-tag', async (event, { tag, page = 0 }) => {
    try {
      const result = await apiService.getTopicsByTag(tag, page)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error fetching topics by tag:', error.message)
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      }
    }
  })

  /**
   * Get new topics
   */
  ipcMain.handle('get-new-topics', async event => {
    try {
      const result = await apiService.getNewTopics()
      return { success: true, data: result }
    } catch (error) {
      console.error('Error fetching new topics:', error.message)
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      }
    }
  })

  /**
   * Dismiss new topics
   */
  ipcMain.handle('dismiss-new-topics', async event => {
    try {
      await apiService.dismissNewTopics()
      return { success: true }
    } catch (error) {
      console.error('Error dismissing new topics:', error.message)
      return {
        success: false,
        error: error.message,
        status: error.response?.status,
      }
    }
  })

  ipcMain.handle('search-topics', async (event, query, page = 0) => {
    try {
      const result = await apiService.searchTopics(query, page)
      return { success: true, ...result }
    } catch (error) {
      console.error('Error searching topics:', error.message)
      return { success: false, error: error.message }
    }
  })

  ipcMain.handle('create-post', async (event, { topicId, raw }) => {
    try {
      const result = await apiService.createPost(topicId, raw)
      return { success: true, data: result }
    } catch (error) {
      console.error('Error creating post:', error.message)
      return { success: false, error: error.message }
    }
  })
}

module.exports = { setupTopicsHandlers }
