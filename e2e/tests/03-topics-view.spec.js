'use strict'

const { test, expect } = require('../fixtures/electron.fixture')
const { TopicsPage } = require('../pages/TopicsPage')

test.describe('Topics view', () => {
  let topics

  test.beforeEach(async ({ page }) => {
    topics = new TopicsPage(page)
    // Navigate through Search first so TopicsView always remounts with clean state.
    // Without this, navigating to "Free Scripts" when already on that category is a no-op
    // (React keeps the component alive via the `key={currentCategory}` prop), so any
    // search/filter state from the previous test would persist.
    await topics.goToSearch()
    await topics.goToTopics()
    // Clear any filter left by a previous test, then wait for cards to be visible.
    const filterInput = page.getByPlaceholder(/Filter or search/i).first()
    if ((await filterInput.count()) > 0) await filterInput.fill('')
    await page.locator('[data-card]').first().waitFor({ state: 'visible', timeout: 12_000 })
  })

  test('topics view loads without error', async ({ page }) => {
    const root = page.locator('#root')
    await expect(root).toBeVisible()
  })

  test('topic cards are rendered', async ({ page }) => {
    const cards = page.locator('[data-card]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('mock topic titles appear in cards', async ({ page }) => {
    await expect(page.getByText(/Amazing PMV Script/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('Latest and Top sort tabs are visible', async ({ page }) => {
    const latestTab = page.getByText(/^latest$/i).first()
    const topTab = page.getByText(/^top$/i).first()
    await expect(latestTab).toBeVisible({ timeout: 10_000 })
    await expect(topTab).toBeVisible({ timeout: 10_000 })
  })

  test('navigating to Paid Scripts via sidebar updates view title', async ({ page }) => {
    const nav = page.locator('nav').first()
    await nav
      .getByText(/paid scripts/i)
      .first()
      .click()
    await expect(page.getByText(/paid scripts/i).first()).toBeVisible({ timeout: 8_000 })
    await expect(page.locator('#root')).toBeVisible()
  })

  test('view count is displayed on topic cards', async ({ page }) => {
    const viewStat = page.getByText(/5[,.]?000|5000/).or(page.getByText(/\d{3,}/))
    const count = await viewStat.count()
    expect(count).toBeGreaterThan(0)
  })

  test('like count is displayed on topic cards', async ({ page }) => {
    const likeStat = page.getByText(/120/)
    const count = await likeStat.count()
    expect(count).toBeGreaterThan(0)
  })

  test('clicking a topic card navigates to detail view', async ({ page }) => {
    const cards = page.locator('[data-card]')
    const count = await cards.count()
    if (count === 0) {
      test.skip(true, 'No topic cards rendered')
      return
    }
    await cards.first().locator('button').click()
    const back = page.getByRole('button', { name: /back/i })
    await expect(back).toBeVisible({ timeout: 10_000 })
  })

  test('inline search filters topic cards', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Filter|search/i).first()
    if ((await searchInput.count()) === 0) {
      test.skip(true, 'No inline search input found')
      return
    }
    const before = await page.locator('[data-card]').count()
    await searchInput.fill('PMV')
    await expect(page.getByText(/Amazing PMV Script/i).first()).toBeVisible({ timeout: 5_000 })
    const after = await page.locator('[data-card]').count()
    expect(after).toBeLessThanOrEqual(before)
  })

  test('searching for non-existent term shows empty or filtered state', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Filter|search/i).first()
    if ((await searchInput.count()) === 0) {
      test.skip(true, 'No inline search input found')
      return
    }
    await searchInput.fill('zzzzznonexistent999')
    const emptyMsg = page.getByText(/no scripts found|nothing found|no results/i)
    await Promise.race([
      emptyMsg.first().waitFor({ state: 'visible', timeout: 8_000 }),
      page.waitForFunction(() => document.querySelectorAll('[data-card]').length === 0, {
        timeout: 8_000,
      }),
    ]).catch(() => {})
    const cards = page.locator('[data-card]')
    const cardCount = await cards.count()
    const hasEmpty = (await emptyMsg.count()) > 0
    expect(cardCount === 0 || hasEmpty).toBe(true)
  })

  test('loading skeleton is shown (and replaced) on initial load', async ({ page }) => {
    await page
      .waitForSelector('[class*="skeleton"], [class*="Skeleton"]', {
        state: 'hidden',
        timeout: 8_000,
      })
      .catch(() => {})
    const skeleton = page.locator('[class*="skeleton"], [class*="Skeleton"]')
    const skeletonCount = await skeleton.count()
    expect(skeletonCount).toBe(0)
  })

  test('tags are shown on topic cards', async ({ page }) => {
    // Collect span text contents inside visible card buttons only (avoid hidden topics views)
    const texts = await page
      .locator('[data-card]')
      .filter({ visible: true })
      .locator('button span')
      .allTextContents()
    const found = texts.some(t => /^(free|pmv|pov|blowjob)$/i.test(t.trim()))
    expect(found).toBe(true)
  })
})
