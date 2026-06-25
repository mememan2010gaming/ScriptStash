'use strict'

const { AppPage } = require('./AppPage')

class DownloadsPage extends AppPage {
  // ─── Active downloads ────────────────────────────────────────────────────────

  activeItems() {
    return this.page
      .locator('[class*="active"], [class*="Active"]')
      .filter({ hasText: /\d+%|\bkB\b|\bMB\b|downloading/i })
  }

  progressBar(index = 0) {
    return this.page
      .locator('[role="progressbar"], [class*="progress"], [class*="Progress"]')
      .nth(index)
  }

  async progressValue(index = 0) {
    const bar = this.progressBar(index)
    const val =
      (await bar.getAttribute('aria-valuenow')) ??
      (await bar.getAttribute('value')) ??
      (await bar.evaluate(el => {
        const style = el.style.width || el.style.transform || ''
        const match = style.match(/(\d+(\.\d+)?)/)
        return match ? match[1] : null
      }))
    return val ? parseFloat(val) : null
  }

  // ─── History ─────────────────────────────────────────────────────────────────

  historyItems() {
    return this.page
      .locator('[class*="history"], [class*="completed"], [class*="item"]')
      .filter({ hasText: /.funscript|.mp4|download/i })
  }

  async historyCount() {
    return this.historyItems().count()
  }

  async clearHistoryButton() {
    return this.page
      .getByRole('button', { name: /clear/i })
      .or(this.page.getByRole('button', { name: /history/i }))
      .first()
  }

  async clickClearHistory() {
    const btn = await this.clearHistoryButton()
    await btn.click()
  }

  // ─── Cancel / remove ─────────────────────────────────────────────────────────

  async cancelDownload(index = 0) {
    const item = this.activeItems().nth(index)
    await item
      .getByRole('button', { name: /cancel|stop|remove/i })
      .first()
      .click()
  }

  // ─── Empty state ─────────────────────────────────────────────────────────────

  emptyState() {
    return this.page
      .getByText(/no downloads/i)
      .or(this.page.getByText(/nothing here/i))
      .or(this.page.getByText(/queue is empty/i))
      .first()
  }
}

module.exports = { DownloadsPage }
