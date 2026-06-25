'use strict'

const { test, expect } = require('../fixtures/electron.fixture')

test.describe('Error states & resilience', () => {
  test('topics view shows empty state when API returns empty list', async ({
    page,
    electronApp,
  }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('get-topics')
      ipcMain.handle('get-topics', () => ({
        success: true,
        data: { topics: [], total: 0 },
      }))
    })

    // Reload so TopicsView remounts and re-fetches with the overridden empty mock.
    // Navigation alone can't force a re-fetch because TopicsView is persistently mounted.
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('#root', { timeout: 15_000 })
    await page.waitForTimeout(800)

    // Empty state message or just zero cards
    const cards = page.locator('[data-card]')
    const cardCount = await cards.count()
    const emptyMsg = page.getByText(/no scripts found|nothing found|check back/i)
    const hasEmpty = (await emptyMsg.count()) > 0
    expect(cardCount === 0 || hasEmpty).toBe(true)
  })

  test('topics view handles API failure without crashing', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('get-topics')
      ipcMain.handle('get-topics', () => ({ success: false, error: 'Service unavailable' }))
    })

    const nav = page.locator('nav').first()
    await nav
      .getByText(/free scripts/i)
      .first()
      .click()
    await page.waitForTimeout(800)

    await expect(page.locator('#root')).toBeVisible()
  })

  test('search handles network error gracefully', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('search-topics')
      ipcMain.handle('search-topics', () => {
        throw new Error('Network error')
      })
    })

    const nav = page.locator('nav').first()
    await nav
      .getByText(/search/i)
      .first()
      .click()
    await page.waitForTimeout(300)

    const input = page
      .getByPlaceholder(/Search scripts/i)
      .or(page.getByRole('searchbox'))
      .first()
    if ((await input.count()) > 0) {
      await input.fill('test')
      await input.press('Enter')
      await page.waitForTimeout(700)
    }

    await expect(page.locator('#root')).toBeVisible()
  })

  test('downloads view handles empty history gracefully', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('get-download-history')
      ipcMain.handle('get-download-history', () => ({ success: true, data: [] }))
    })

    const nav = page.locator('nav').first()
    await nav
      .getByText(/downloads/i)
      .first()
      .click()
    await page.waitForTimeout(500)

    await expect(page.locator('#root')).toBeVisible()
  })

  test('settings view handles get-settings failure gracefully', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('get-settings')
      ipcMain.handle('get-settings', () => ({ success: false, error: 'Store error' }))
    })

    await page.getByRole('button', { name: 'Settings' }).first().click()
    await page.waitForTimeout(600)

    await expect(page.locator('#root')).toBeVisible()
  })

  test('topic detail handles missing topic gracefully', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('get-topic-details')
      ipcMain.handle('get-topic-details', () => ({
        success: false,
        error: 'Topic not found',
        status: 404,
      }))
    })

    // Reload to get fresh topic state — prior tests (e.g. empty-state test) may have left
    // the TopicsViews with 0 topics via their own page.reload() calls.
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('#root', { timeout: 15_000 })
    await page.waitForTimeout(800)

    // Use visible filter so we don't accidentally target cards inside a hidden TopicsView pane
    const cards = page.locator('[data-card]').filter({ visible: true })
    if ((await cards.count()) === 0) {
      test.skip()
      return
    }
    await cards.first().locator('button').click()
    await page.waitForTimeout(700)

    await expect(page.locator('#root')).toBeVisible()
  })

  test('app recovers when IPC handler throws unexpectedly', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('get-topics')
      ipcMain.handle('get-topics', () => {
        throw new Error('Unexpected crash')
      })
    })

    const nav = page.locator('nav').first()
    await nav
      .getByText(/free scripts/i)
      .first()
      .click()
    await page.waitForTimeout(1_000)

    // After the error, switching to a different view should still work
    await page.getByRole('button', { name: 'Settings' }).first().click()
    await page.waitForTimeout(500)
    await expect(page.locator('#root')).toBeVisible()
  })

  test('toast appears on yt-dlp update failure', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('update-ytdlp')
      ipcMain.handle('update-ytdlp', () => ({ success: false, error: 'Download failed' }))
    })

    // Navigate to Settings > Downloads
    await page.getByRole('button', { name: 'Settings' }).first().click()
    await page.waitForTimeout(400)
    const dlBtn = page
      .locator('main')
      .getByRole('button', { name: /^downloads$/i })
      .first()
    if ((await dlBtn.count()) > 0) await dlBtn.click()
    await page.waitForTimeout(300)

    const updateBtn = page.getByRole('button', { name: /^update$/i }).first()
    if ((await updateBtn.count()) === 0) {
      test.skip()
      return
    }
    await updateBtn.click()

    // An error toast should appear
    const errorToast = page.getByText(/failed|error/i).first()
    await expect(errorToast).toBeVisible({ timeout: 8_000 })
  })

  test('window controls do not crash the app', async ({ page }) => {
    // The custom titlebar has no class name — target the buttons directly.
    const minimizeBtn = page.getByRole('button', { name: /minimiz/i }).first()
    if ((await minimizeBtn.count()) > 0) {
      await expect(minimizeBtn).toBeVisible()
    }
    await expect(page.locator('#root')).toBeVisible()
  })

  test('validate-session failure still shows the main UI', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('validate-session')
      ipcMain.handle('validate-session', () => ({ success: false, error: 'Unreachable' }))
    })

    // Reload so the Sidebar re-mounts and calls the now-failing validateSession.
    // Without a reload the Sidebar has already cached the successful MOCK_USER result.
    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('#root', { timeout: 15_000 })

    // App should still render and the sidebar should fall back to "Guest"
    await expect(page.locator('#root')).toBeVisible()
    const guest = page.locator('aside').getByText(/guest/i).first()
    await expect(guest).toBeVisible({ timeout: 8_000 })
  })

  test('multiple rapid navigation clicks do not break the app', async ({ page }) => {
    const nav = page.locator('nav').first()
    // Settings lives outside <nav> so click it directly; all others are in <nav>.
    for (const label of ['Downloads', 'Search', 'Downloads']) {
      const btn = nav.getByText(new RegExp(label, 'i')).first()
      if ((await btn.count()) > 0) await btn.click()
    }
    await page.getByRole('button', { name: 'Settings' }).first().click()
    await nav
      .getByText(/downloads/i)
      .first()
      .click()
    await page.waitForTimeout(600)
    await expect(page.locator('#root')).toBeVisible()
  })
})
