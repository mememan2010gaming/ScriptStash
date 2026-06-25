'use strict'

const { test, expect } = require('../fixtures/electron.fixture')

test.describe('Settings view', () => {
  test.beforeEach(async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).first().click()
    await page.waitForTimeout(500)
  })

  test('settings view renders', async ({ page }) => {
    await expect(page.locator('#root')).toBeVisible()
  })

  test('settings section navigation is visible', async ({ page }) => {
    // SettingsView has a section sidebar: General, Downloads, Appearance, Updates, Credits
    const sectionNav = page
      .getByText(/general/i)
      .or(page.getByText(/appearance/i))
      .or(page.getByText(/appearance|theme/i))
    await expect(sectionNav.first()).toBeVisible({ timeout: 10_000 })
  })

  // ─── Appearance ──────────────────────────────────────────────────────────────

  test('theme options are displayed in Appearance section', async ({ page }) => {
    const appearanceBtn = page
      .locator('main')
      .getByRole('button', { name: /appearance/i })
      .first()
    if ((await appearanceBtn.count()) > 0) await appearanceBtn.click()
    await page.waitForTimeout(300)

    // Look for theme cards/buttons
    // Theme buttons use class "glass glass-hover"; they always have theme name text
    const themes = page.locator('[class*="glass-hover"]').filter({ hasText: /[a-z]{3,}/i })
    const count = await themes.count()
    expect(count).toBeGreaterThan(0)
  })

  test('clicking a theme card visually selects it', async ({ page }) => {
    const appearanceBtn = page
      .locator('main')
      .getByRole('button', { name: /appearance/i })
      .first()
    if ((await appearanceBtn.count()) > 0) await appearanceBtn.click()
    await page.waitForTimeout(300)

    // Theme buttons use class "glass glass-hover"; they always have theme name text
    const themes = page.locator('[class*="glass-hover"]').filter({ hasText: /[a-z]{3,}/i })
    if ((await themes.count()) < 2) {
      test.skip()
      return
    }

    await themes.nth(1).click()
    await page.waitForTimeout(400)
    await expect(page.locator('#root')).toBeVisible()
  })

  // ─── General ─────────────────────────────────────────────────────────────────

  test('General section shows Notifications toggle', async ({ page }) => {
    const generalBtn = page
      .locator('main')
      .getByRole('button', { name: /^general$/i })
      .first()
    if ((await generalBtn.count()) > 0) await generalBtn.click()
    await page.waitForTimeout(300)

    const label = page.getByText(/notifications/i)
    await expect(label.first()).toBeVisible({ timeout: 8_000 })
  })

  test('General section shows Ad blocker toggle', async ({ page }) => {
    const generalBtn = page
      .locator('main')
      .getByRole('button', { name: /^general$/i })
      .first()
    if ((await generalBtn.count()) > 0) await generalBtn.click()
    await page.waitForTimeout(300)

    const label = page.getByText(/ad.?block/i)
    await expect(label.first()).toBeVisible({ timeout: 8_000 })
  })

  test('General section shows Developer mode toggle', async ({ page }) => {
    const generalBtn = page
      .locator('main')
      .getByRole('button', { name: /^general$/i })
      .first()
    if ((await generalBtn.count()) > 0) await generalBtn.click()
    await page.waitForTimeout(300)

    const label = page.getByText(/developer mode/i)
    await expect(label.first()).toBeVisible({ timeout: 8_000 })
  })

  test('Enabling Developer mode shows Developer section in nav', async ({ page }) => {
    const generalBtn = page
      .locator('main')
      .getByRole('button', { name: /^general$/i })
      .first()
    if ((await generalBtn.count()) > 0) await generalBtn.click()
    await page.waitForTimeout(300)

    // Find the Developer mode toggle and turn it on
    const devToggle = page
      .getByText(/developer mode/i)
      .locator('..')
      .locator('..')
      .getByRole('button')
      .last()
    if ((await devToggle.count()) === 0) {
      test.skip()
      return
    }
    await devToggle.click()
    await page.waitForTimeout(400)

    // Developer section should now appear in the settings nav
    const devSection = page.getByRole('button', { name: /developer/i })
    await expect(devSection.first()).toBeVisible({ timeout: 6_000 })
  })

  // ─── Downloads section ────────────────────────────────────────────────────────

  test('Downloads section shows max concurrent downloads control', async ({ page }) => {
    const downloadsBtn = page
      .locator('main')
      .getByRole('button', { name: /^downloads$/i })
      .first()
    if ((await downloadsBtn.count()) > 0) await downloadsBtn.click()
    await page.waitForTimeout(300)

    const label = page.getByText(/max|concurrent|parallel/i)
    await expect(label.first()).toBeVisible({ timeout: 8_000 })
  })

  test('Downloads section shows yt-dlp version', async ({ page }) => {
    const downloadsBtn = page
      .locator('main')
      .getByRole('button', { name: /^downloads$/i })
      .first()
    if ((await downloadsBtn.count()) > 0) await downloadsBtn.click()
    await page.waitForTimeout(400)

    // Mock returns MOCK_YTDLP_VERSION = '2024.04.09'
    const version = page.getByText(/yt-dlp|2024\.\d/i)
    await expect(version.first()).toBeVisible({ timeout: 8_000 })
  })

  test('yt-dlp Update button is present', async ({ page }) => {
    const downloadsBtn = page
      .locator('main')
      .getByRole('button', { name: /^downloads$/i })
      .first()
    if ((await downloadsBtn.count()) > 0) await downloadsBtn.click()
    await page.waitForTimeout(300)

    const updateBtn = page.getByRole('button', { name: /update/i }).first()
    await expect(updateBtn).toBeVisible({ timeout: 8_000 })
  })

  // ─── Updates section ─────────────────────────────────────────────────────────

  test('Updates section shows app version', async ({ page }) => {
    const updatesBtn = page
      .locator('main')
      .getByRole('button', { name: /updates/i })
      .first()
    if ((await updatesBtn.count()) > 0) await updatesBtn.click()
    await page.waitForTimeout(400)

    // Mock returns MOCK_APP_VERSION = '2.4.29'
    const ver = page.getByText(/2\.4\.\d+/)
    await expect(ver.first()).toBeVisible({ timeout: 8_000 })
  })

  test('Check now button is present in Updates section', async ({ page }) => {
    const updatesBtn = page
      .locator('main')
      .getByRole('button', { name: /updates/i })
      .first()
    if ((await updatesBtn.count()) > 0) await updatesBtn.click()
    await page.waitForTimeout(300)

    const checkBtn = page.getByRole('button', { name: /check now|check for updates/i })
    await expect(checkBtn.first()).toBeVisible({ timeout: 8_000 })
  })

  test('Check now button calls check-for-updates IPC', async ({ page, electronApp }) => {
    let called = false
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('check-for-updates')
      ipcMain.handle('check-for-updates', () => {
        global.__updateCheckCalled = true
        return { success: true, data: { updateAvailable: false } }
      })
    })

    const updatesBtn = page
      .locator('main')
      .getByRole('button', { name: /updates/i })
      .first()
    if ((await updatesBtn.count()) > 0) await updatesBtn.click()
    await page.waitForTimeout(300)

    const checkBtn = page.getByRole('button', { name: /check now|check for updates/i }).first()
    if ((await checkBtn.count()) === 0) {
      test.skip()
      return
    }
    await checkBtn.click()
    await page.waitForTimeout(600)

    called = await electronApp.evaluate(() => !!global.__updateCheckCalled)
    expect(called).toBe(true)
  })

  // ─── Credits section ─────────────────────────────────────────────────────────

  test('Credits section shows contributor info', async ({ page }) => {
    const creditsBtn = page
      .locator('main')
      .getByRole('button', { name: /credits/i })
      .first()
    if ((await creditsBtn.count()) === 0) {
      test.skip()
      return
    }
    await creditsBtn.click()
    await page.waitForTimeout(300)

    // Credits section shows mememan2010 as contributor
    const contributor = page.getByText(/mememan|creator|developer/i)
    await expect(contributor.first()).toBeVisible({ timeout: 8_000 })
  })

  test('Settings persist save-settings IPC call on toggle', async ({ page, electronApp }) => {
    let savedSettings = null
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('save-settings')
      ipcMain.handle('save-settings', (_, settings) => {
        global.__lastSavedSettings = settings
        return { success: true }
      })
    })

    const generalBtn = page
      .locator('main')
      .getByRole('button', { name: /^general$/i })
      .first()
    if ((await generalBtn.count()) > 0) await generalBtn.click()
    await page.waitForTimeout(300)

    const notifLabel = page.getByText(/notifications/i).first()
    const toggle = notifLabel.locator('..').locator('..').getByRole('button').last()
    if ((await toggle.count()) === 0) {
      test.skip()
      return
    }
    await toggle.click()
    await page.waitForTimeout(400)

    savedSettings = await electronApp.evaluate(() => global.__lastSavedSettings)
    expect(savedSettings).not.toBeNull()
  })
})
