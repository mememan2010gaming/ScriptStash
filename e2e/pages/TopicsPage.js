'use strict';

const { AppPage } = require('./AppPage');

class TopicsPage extends AppPage {
  // ─── Topic cards ────────────────────────────────────────────────────────────

  // Topic cards: wrapped in <div data-card> in TopicsView and SearchView
  cards() {
    return this.page.locator('[data-card]');
  }

  card(index = 0) { return this.cards().nth(index); }

  async cardCount() { return this.cards().count(); }

  // Click the button inside the data-card wrapper
  async clickCard(index = 0) { await this.card(index).locator('button').click(); }

  async getCardTitle(index = 0) {
    return this.card(index).locator('h2, h3, [class*="title"]').first().textContent();
  }

  // ─── Tabs ────────────────────────────────────────────────────────────────────

  tabs() { return this.page.getByRole('tab').or(this.page.locator('[class*="tab"], [class*="Tab"]')); }

  async clickTab(name) {
    await this.page.getByRole('tab', { name, exact: false })
      .or(this.page.locator('[class*="tab"]').filter({ hasText: name }))
      .first()
      .click();
  }

  async getActiveTab() {
    const tab = this.page.locator('[aria-selected="true"], [class*="active"][class*="tab"]').first();
    return tab.textContent();
  }

  // ─── Sort / filter controls ──────────────────────────────────────────────────

  async openSortMenu() {
    const sort = this.page.getByRole('combobox', { name: /sort/i })
      .or(this.page.locator('select'))
      .or(this.page.getByRole('button', { name: /sort/i }))
      .first();
    await sort.click();
  }

  // ─── Inline search ───────────────────────────────────────────────────────────

  searchInput() { return this.page.getByPlaceholder(/search/i).first(); }

  async typeInSearch(text) {
    await this.searchInput().fill(text);
    await this.page.waitForTimeout(400);
  }

  // ─── Loading / empty states ──────────────────────────────────────────────────

  skeleton() {
    return this.page.locator('[class*="skeleton"], [class*="Skeleton"], [class*="loading"]');
  }

  emptyState() {
    return this.page.locator('[class*="empty"], [class*="Empty"]')
      .or(this.page.getByText(/no scripts found/i))
      .or(this.page.getByText(/nothing found/i));
  }
}

module.exports = { TopicsPage };
