'use strict'

/** Base page object — navigation helpers shared by all views. */
class AppPage {
  constructor(page) {
    this.page = page
  }

  // ─── Sidebar nav ────────────────────────────────────────────────────────────

  // The full sidebar is the <aside> which includes both the <nav> items AND
  // the Settings button that sits outside the <nav>.
  // Use 'aside' tag selector — [role="complementary"] doesn't match <aside>'s implicit ARIA role.
  sidebar() {
    return this.page.locator('aside').first()
  }

  async navigateTo(label) {
    const sidebar = this.sidebar()
    const link = sidebar
      .getByRole('button', { name: label, exact: false })
      .or(sidebar.getByText(label, { exact: false }))
      .first()
    await link.click()
    await this.page.waitForTimeout(300)
  }

  // The topics list is split into "Free Scripts" and "Paid Scripts" in the UI.
  async goToTopics() {
    await this.navigateTo('Free Scripts')
  }

  async goToSearch() {
    await this.navigateTo('Search')
  }

  async goToDownloads() {
    await this.navigateTo('Downloads')
  }

  async goToSettings() {
    await this.navigateTo('Settings')
  }

  async goToNotifications() {
    await this.navigateTo('Notifications')
  }

  // ─── Titlebar ───────────────────────────────────────────────────────────────

  // The custom titlebar has no class containing "titlebar"; target its Minimize button instead.
  minimizeBtn() {
    return this.page.getByRole('button', { name: /minimiz/i }).first()
  }

  maximizeBtn() {
    return this.page.getByRole('button', { name: /maximiz/i }).first()
  }

  async minimize() {
    await this.minimizeBtn().click()
  }

  async maximize() {
    await this.maximizeBtn().click()
  }

  // ─── Toast notifications ────────────────────────────────────────────────────

  async waitForToast(textOrRegex, options = {}) {
    const toast = this.page
      .getByRole('status')
      .or(this.page.locator('[class*="toast"], [class*="Toast"]'))
      .filter({ hasText: textOrRegex })
    await toast.first().waitFor({ state: 'visible', timeout: options.timeout ?? 8_000 })
    return toast.first()
  }

  // ─── Generic helpers ────────────────────────────────────────────────────────

  async waitForView(selector, timeout = 15_000) {
    await this.page.waitForSelector(selector, { state: 'visible', timeout })
  }

  async getPageTitle() {
    const h1 = this.page.locator('h1').first()
    return h1.textContent()
  }

  async back() {
    await this.page.getByRole('button', { name: /back/i }).first().click()
  }
}

module.exports = { AppPage }
