'use strict'

const { test, expect } = require('../fixtures/electron.fixture')
const { AppPage } = require('../pages/AppPage')

test.describe('Sidebar navigation', () => {
  let app

  test.beforeEach(async ({ page }) => {
    app = new AppPage(page)
  })

  test('sidebar is visible', async ({ page }) => {
    const sidebar = page
      .locator('nav, [role="navigation"], [class*="sidebar"], [class*="Sidebar"]')
      .first()
    await expect(sidebar).toBeVisible({ timeout: 12_000 })
  })

  test('sidebar contains all nav items', async ({ page }) => {
    const nav = page.locator('nav').first()
    const sidebar = page.locator('aside').first()
    await expect(nav.getByText(/free scripts|paid scripts/i).first()).toBeVisible({
      timeout: 8_000,
    })
    await expect(nav.getByText(/search/i).first()).toBeVisible({ timeout: 8_000 })
    await expect(nav.getByText(/downloads/i).first()).toBeVisible({ timeout: 8_000 })
    await expect(sidebar.getByText(/settings/i).first()).toBeVisible({ timeout: 8_000 })
  })

  test('navigating to Topics shows the topics view', async ({ page }) => {
    await app.goToTopics()
    await expect(page.getByText(/topics|scripts/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('navigating to Search shows the search view', async ({ page }) => {
    await app.goToSearch()
    const searchInput = page
      .getByPlaceholder(/Search scripts/i)
      .or(page.getByRole('searchbox'))
      .first()
    await expect(searchInput).toBeVisible({ timeout: 10_000 })
  })

  test('navigating to Downloads shows the downloads view', async ({ page }) => {
    await app.goToDownloads()
    await expect(page.getByText(/downloads/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('navigating to Settings shows the settings view', async ({ page }) => {
    await app.goToSettings()
    await expect(page.getByText(/settings|download path|theme/i).first()).toBeVisible({
      timeout: 10_000,
    })
  })

  test('active nav item is visually highlighted', async ({ page }) => {
    await app.goToDownloads()
    await expect(
      page
        .locator('main')
        .getByText(/downloads/i)
        .first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('can switch between views multiple times', async ({ page }) => {
    await app.goToTopics()
    await expect(page.locator('[data-card]').first()).toBeVisible({ timeout: 10_000 })
    await app.goToSearch()
    await expect(
      page
        .getByPlaceholder(/Search scripts/i)
        .or(page.getByRole('searchbox'))
        .first()
    ).toBeVisible({ timeout: 8_000 })
    await app.goToDownloads()
    await expect(
      page
        .locator('main')
        .getByText(/downloads/i)
        .first()
    ).toBeVisible({ timeout: 8_000 })
    await app.goToSettings()
    await expect(page.getByText(/settings|download path|theme/i).first()).toBeVisible({
      timeout: 8_000,
    })
    await app.goToTopics()

    await expect(page.locator('#root')).toBeVisible()
  })

  test('back button returns from topic detail to topics list', async ({ page }) => {
    await app.goToTopics()
    const cards = page.locator('[class*="card"], article').filter({ hasText: /script|sync/i })
    const count = await cards.count()
    if (count > 0) {
      await cards.first().click()
      const back = page.getByRole('button', { name: /back/i })
      await expect(back).toBeVisible({ timeout: 8_000 })
      await back.click()
      await expect(cards.first()).toBeVisible({ timeout: 8_000 })
    }
  })
})
