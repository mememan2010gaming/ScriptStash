'use strict'

const { AppPage } = require('./AppPage')

class TopicDetailPage extends AppPage {
  title() {
    return this.page.locator('h1, h2').first()
  }

  async getTitle() {
    return this.title().textContent()
  }

  // ─── Video / funscript sections ──────────────────────────────────────────────

  videoSection() {
    return this.page
      .locator('[class*="video"], [class*="Video"]')
      .or(this.page.getByText(/video/i).locator('..'))
      .first()
  }

  funscriptSection() {
    return this.page
      .locator('[class*="funscript"], [class*="Funscript"], [class*="script"]')
      .or(this.page.getByText(/funscript/i).locator('..'))
      .first()
  }

  downloadButtons() {
    return this.page
      .getByRole('button', { name: /download/i })
      .or(this.page.locator('[class*="download"]').filter({ hasText: /download/i }))
  }

  async clickFirstDownload() {
    await this.downloadButtons().first().click()
  }

  // ─── Posts ───────────────────────────────────────────────────────────────────

  posts() {
    return this.page
      .locator('[class*="post"], [class*="Post"], [class*="reply"]')
      .filter({ hasText: /./ })
  }

  async postCount() {
    return this.posts().count()
  }

  // ─── Tags ────────────────────────────────────────────────────────────────────

  tags() {
    return this.page
      .locator('[class*="tag"], [class*="Tag"], [class*="badge"]')
      .or(this.page.getByRole('list').filter({ hasText: /#\w+/ }))
  }

  // ─── Stats ───────────────────────────────────────────────────────────────────

  async getViewCount() {
    const el = this.page
      .locator('[class*="view"], [class*="stat"]')
      .filter({ hasText: /\d/ })
      .first()
    return el.textContent()
  }
}

module.exports = { TopicDetailPage }
