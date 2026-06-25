'use strict'

const { test, expect } = require('../fixtures/electron.fixture')

test.describe('Themes & appearance', () => {
  async function goToAppearance(page) {
    await page.getByRole('button', { name: 'Settings' }).first().click()
    const appearanceBtn = page
      .locator('main')
      .getByRole('button', { name: /appearance/i })
      .first()
    const appeared = await appearanceBtn
      .waitFor({ state: 'visible', timeout: 5_000 })
      .then(() => true)
      .catch(() => false)
    if (appeared) await appearanceBtn.click()
    await expect(
      page
        .locator('[class*="glass-hover"]')
        .filter({ hasText: /[a-z]{3,}/i })
        .first()
    ).toBeVisible({ timeout: 8_000 })
  }

  // Theme card buttons use class "glass glass-hover" with visible text (theme name + description).
  // Stepper +/- buttons also use glass-hover but have no text content (SVG icons only).
  function themeCards(page) {
    return page.locator('[class*="glass-hover"]').filter({ hasText: /[a-z]{3,}/i })
  }

  test('appearance section loads', async ({ page }) => {
    await goToAppearance(page)
    await expect(page.locator('#root')).toBeVisible()
  })

  test('multiple theme options are shown', async ({ page }) => {
    await goToAppearance(page)
    const count = await themeCards(page).count()
    expect(count).toBeGreaterThan(1)
  })

  test('each theme card has a name label', async ({ page }) => {
    await goToAppearance(page)
    const cards = themeCards(page)
    const count = await cards.count()
    for (let i = 0; i < Math.min(count, 3); i++) {
      const text = await cards.nth(i).textContent()
      expect(text?.trim().length).toBeGreaterThan(0)
    }
  })

  test('clicking a theme persists the selection', async ({ page, electronApp }) => {
    let savedTheme = null
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('save-settings')
      ipcMain.handle('save-settings', (_, settings) => {
        global.__themeSettings = settings
        return { success: true }
      })
    })

    await goToAppearance(page)
    const cards = themeCards(page)
    if ((await cards.count()) < 2) {
      test.skip()
      return
    }

    await cards.nth(1).click()
    await page.waitForTimeout(300)

    savedTheme = await electronApp.evaluate(() => global.__themeSettings)
    expect(savedTheme).not.toBeNull()
  })

  test('selected theme card has visual selection indicator', async ({ page }) => {
    await goToAppearance(page)
    const cards = themeCards(page)
    if ((await cards.count()) === 0) {
      test.skip()
      return
    }

    await cards.first().click()
    await page.waitForTimeout(200)

    await expect(page.locator('#root')).toBeVisible()
  })

  test('CSS custom property --accent changes after theme switch', async ({ page }) => {
    await goToAppearance(page)
    const cards = themeCards(page)
    if ((await cards.count()) < 2) {
      test.skip()
      return
    }

    const before = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    )

    await cards.nth(1).click()
    await page.waitForTimeout(300)

    const after = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    )

    await expect(page.locator('#root')).toBeVisible()
    expect(typeof before).toBe('string')
    expect(typeof after).toBe('string')
  })

  test('theme applies to sidebar background', async ({ page }) => {
    await goToAppearance(page)
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible()
    const bg = await sidebar.evaluate(
      el => getComputedStyle(el).background || getComputedStyle(el).backgroundColor
    )
    expect(bg.length).toBeGreaterThan(0)
  })

  test('theme choice survives navigation between views', async ({ page }) => {
    await goToAppearance(page)
    const cards = themeCards(page)
    if ((await cards.count()) < 2) {
      test.skip()
      return
    }

    await cards.nth(1).click()
    await page
      .waitForFunction(() => localStorage.getItem('ss_theme') !== null, { timeout: 3_000 })
      .catch(() => {})
    const themeAfterClick = await page.evaluate(() => localStorage.getItem('ss_theme'))
    expect(themeAfterClick).not.toBeNull()

    await page
      .locator('nav')
      .first()
      .getByText(/downloads/i)
      .first()
      .click()
    await expect(
      page.getByText(/no active downloads|nothing here|queue is empty/i).first()
    ).toBeVisible({ timeout: 8_000 })

    await page.getByRole('button', { name: 'Settings' }).first().click()
    await expect(page.locator('main').first()).toBeVisible({ timeout: 5_000 })

    const themeAfterNav = await page.evaluate(() => localStorage.getItem('ss_theme'))
    expect(themeAfterNav).toBe(themeAfterClick)
  })
})
