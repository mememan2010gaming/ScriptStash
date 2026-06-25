'use strict';

const { AppPage } = require('./AppPage');

class SettingsPage extends AppPage {
  // ─── Sections ────────────────────────────────────────────────────────────────

  section(name) {
    return this.page.locator('[class*="section"], [class*="group"], [class*="panel"]')
      .filter({ hasText: name })
      .first();
  }

  // ─── Download path ───────────────────────────────────────────────────────────

  downloadPathDisplay() {
    return this.page.locator('input[readonly], [class*="path"]')
      .or(this.page.getByText(/C:\\|\/home\//))
      .first();
  }

  changePathButton() {
    return this.page.getByRole('button', { name: /change|browse|folder/i }).first();
  }

  // ─── Max downloads ────────────────────────────────────────────────────────────

  maxDownloadsInput() {
    return this.page.getByRole('spinbutton')
      .or(this.page.locator('input[type="number"]'))
      .first();
  }

  async setMaxDownloads(value) {
    const input = this.maxDownloadsInput();
    await input.fill(String(value));
    await input.press('Tab');
  }

  // ─── Toggles ─────────────────────────────────────────────────────────────────

  toggle(label) {
    return this.page.locator('[role="switch"], input[type="checkbox"]')
      .and(this.page.locator(`[aria-label*="${label}" i], [id*="${label}" i]`))
      .or(
        this.page.getByText(label, { exact: false }).locator('..').locator('[role="switch"], input[type="checkbox"]')
      )
      .first();
  }

  async getToggleState(label) {
    const t = this.toggle(label);
    const checked = await t.getAttribute('aria-checked') ?? await t.isChecked();
    return checked === 'true' || checked === true;
  }

  async clickToggle(label) {
    await this.toggle(label).click();
    await this.page.waitForTimeout(200);
  }

  // ─── Theme ───────────────────────────────────────────────────────────────────

  themeOptions() {
    return this.page.locator('[class*="theme"], [class*="Theme"]').filter({ hasText: /./ });
  }

  async selectTheme(name) {
    await this.page.locator('[class*="theme"]').filter({ hasText: name }).first().click();
  }

  darkModeToggle() {
    return this.page.getByRole('button', { name: /dark|light|mode/i })
      .or(this.page.locator('[class*="mode"], [class*="Mode"]'))
      .first();
  }

  // ─── Version / update ────────────────────────────────────────────────────────

  versionDisplay() {
    return this.page.getByText(/v?\d+\.\d+\.\d+/).first();
  }

  checkUpdatesButton() {
    return this.page.getByRole('button', { name: /check.*update|update.*check/i }).first();
  }

  // ─── yt-dlp ──────────────────────────────────────────────────────────────────

  ytdlpVersionDisplay() {
    return this.page.getByText(/yt-dlp/i).locator('..').locator('[class*="version"], code, span').first();
  }

  installYtdlpButton() {
    return this.page.getByRole('button', { name: /install.*yt-dlp|yt-dlp.*install/i }).first();
  }

  // ─── Ad blocker ───────────────────────────────────────────────────────────────

  adBlockerStatus() {
    return this.page.getByText(/ad.?block/i).locator('..').first();
  }

  updateBlockListButton() {
    return this.page.getByRole('button', { name: /update.*list|block.*list/i }).first();
  }

  // ─── Density ───────────────────────────────────────────────────────────────────

  // Returns all 3 density picker cards (glass-hover buttons containing the density labels)
  densityCards() {
    return this.page.locator('[class*="glass-hover"]').filter({ hasText: /mosaic|list|compact/i });
  }

  // Returns the card for a specific density ('mosaic', 'list', or 'compact')
  densityCard(mode) {
    return this.page.locator('[class*="glass-hover"]').filter({ hasText: new RegExp(`^${mode}$`, 'i') });
  }

  // Clicks the density card for the given mode and waits for the UI to update
  async selectDensity(mode) {
    await this.densityCard(mode).click();
    await this.page.waitForTimeout(400);
  }

  // Reads the current density from localStorage
  async getStoredDensity() {
    return this.page.evaluate(() => localStorage.getItem('ss_density'));
  }

  // Sets the density in localStorage directly (useful to set state before a page reload)
  async setStoredDensity(mode) {
    await this.page.evaluate((m) => localStorage.setItem('ss_density', m), mode);
  }
}

module.exports = { SettingsPage };
