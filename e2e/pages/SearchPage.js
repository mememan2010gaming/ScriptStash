'use strict'

const { AppPage } = require('./AppPage')

class SearchPage extends AppPage {
  searchInput() {
    return this.page
      .getByRole('searchbox')
      .or(this.page.getByPlaceholder(/Search scripts/i))
      .first()
  }

  async search(query) {
    const input = this.searchInput()
    await input.fill(query)
    await input.press('Enter')
    await this.page.waitForTimeout(500)
  }

  async clearSearch() {
    await this.searchInput().fill('')
    await this.searchInput().press('Enter')
  }

  results() {
    return this.page.locator('[class*="result"], [class*="card"], article').filter({ hasText: /./ })
  }

  async resultCount() {
    return this.results().count()
  }

  async getResultTitle(index = 0) {
    return this.results().nth(index).locator('h2, h3, [class*="title"]').first().textContent()
  }

  async clickResult(index = 0) {
    await this.results().nth(index).click()
  }

  emptyState() {
    return this.page
      .getByText(/no results/i)
      .or(this.page.getByText(/nothing found/i))
      .or(this.page.getByText(/try different/i))
      .first()
  }

  loadingSpinner() {
    return this.page.locator('[class*="spinner"], [class*="loading"], [class*="skeleton"]')
  }
}

module.exports = { SearchPage }
