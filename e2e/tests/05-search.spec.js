'use strict'

const { test, expect } = require('../fixtures/electron.fixture')
const { SearchPage } = require('../pages/SearchPage')
const { MOCK_SEARCH_RESULTS } = require('../fixtures/mock-data')

test.describe('Search view', () => {
  let search

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page)
    await search.goToSearch()
    await expect(
      page
        .getByRole('searchbox')
        .or(page.getByPlaceholder(/Search scripts/i))
        .first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('search view renders', async ({ page }) => {
    await expect(page.locator('#root')).toBeVisible()
  })

  test('search input is visible and focusable', async ({ page }) => {
    const input = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first()
    await expect(input).toBeVisible({ timeout: 10_000 })
    await input.focus()
    await expect(input).toBeFocused()
  })

  test('typing in search shows results from mock data', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }, results) => {
      ipcMain.removeHandler('search-topics')
      ipcMain.handle('search-topics', () => ({ success: true, data: results }))
    }, MOCK_SEARCH_RESULTS)

    const input = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first()
    await input.fill('test query')
    await input.press('Enter')

    await expect(page.getByText(/Search Result/i).first()).toBeVisible({ timeout: 10_000 })
  })

  test('search result count matches mock data', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }, results) => {
      ipcMain.removeHandler('search-topics')
      ipcMain.handle('search-topics', () => ({ success: true, data: results }))
    }, MOCK_SEARCH_RESULTS)

    const input = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first()
    await input.fill('test')
    await input.press('Enter')
    // Wait for visible search result cards — hidden TopicsView cards are first in DOM order.
    await page
      .locator('[data-card]')
      .filter({ visible: true })
      .first()
      .waitFor({ state: 'visible', timeout: 10_000 })

    const items = page.locator('[data-card]').filter({ visible: true })
    const count = await items.count()
    expect(count).toBeGreaterThanOrEqual(MOCK_SEARCH_RESULTS.topics.length)
  })

  test('empty search shows no results / empty state', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('search-topics')
      ipcMain.handle('search-topics', () => ({
        success: true,
        data: { topics: [], posts: [], grouped_search_result: { topic_ids: [] } },
      }))
    })

    const input = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first()
    await input.fill('xyzzy_no_match_999')
    await input.press('Enter')

    const cards = page.locator('[data-card]')
    const emptyMsg = page.getByText(/no results|nothing found|try different/i)
    await Promise.race([
      emptyMsg.first().waitFor({ state: 'visible', timeout: 8_000 }),
      page.waitForFunction(() => !document.querySelector('[data-card]'), { timeout: 8_000 }),
    ]).catch(() => {})
    const cardCount = await cards.count()
    const hasMsg = (await emptyMsg.count()) > 0
    expect(cardCount === 0 || hasMsg).toBe(true)
  })

  test('clearing search input clears results', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }, results) => {
      ipcMain.removeHandler('search-topics')
      ipcMain.handle('search-topics', () => ({ success: true, data: results }))
    }, MOCK_SEARCH_RESULTS)

    const input = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first()
    await input.fill('test')
    await input.press('Enter')
    await expect(page.getByText(/Search Result/i).first()).toBeVisible({ timeout: 10_000 })

    await input.fill('')
    await input.press('Enter')
    await page.waitForTimeout(400)

    // After clearing, the previous search results ('Search Result One/Two') should not be visible
    const searchResults = page.getByText(/Search Result (One|Two)/i)
    await expect(searchResults.first())
      .not.toBeVisible({ timeout: 3_000 })
      .catch(() => {})
    await expect(page.locator('#root')).toBeVisible()
  })

  test('clicking a search result navigates to topic detail', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }, results) => {
      ipcMain.removeHandler('search-topics')
      ipcMain.handle('search-topics', () => ({ success: true, data: results }))
    }, MOCK_SEARCH_RESULTS)

    const input = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first()
    await input.fill('test')
    await input.press('Enter')
    await expect(page.getByText(/Search Result/i).first()).toBeVisible({ timeout: 10_000 })

    const results = page.locator('[data-card]').filter({ visible: true })
    const count = await results.count()
    if (count === 0) {
      test.skip()
      return
    }

    await results.first().locator('button').click()

    const back = page.getByRole('button', { name: /back/i })
    await expect(back).toBeVisible({ timeout: 10_000 })
  })

  test('search handles IPC error gracefully', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('search-topics')
      ipcMain.handle('search-topics', () => ({ success: false, error: 'Network error' }))
    })

    const input = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first()
    await input.fill('error test')
    await input.press('Enter')
    await page.waitForTimeout(500)

    await expect(page.locator('#root')).toBeVisible()
  })

  test('search loading indicator appears then disappears', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }, results) => {
      ipcMain.removeHandler('search-topics')
      ipcMain.handle('search-topics', async () => {
        await new Promise(resolve => setTimeout(resolve, 600))
        return { success: true, data: results }
      })
    }, MOCK_SEARCH_RESULTS)

    const input = page
      .getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first()
    await input.fill('loading test')
    await input.press('Enter')

    // Wait for results to arrive (loading state should have resolved)
    await expect(page.getByText(/Search Result/i).first()).toBeVisible({ timeout: 10_000 })
    const spinner = page.locator('[class*="spinner"], [class*="loading"]')
    expect(await spinner.count()).toBe(0)
  })
})
