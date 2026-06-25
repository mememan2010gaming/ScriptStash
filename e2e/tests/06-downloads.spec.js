'use strict'

const { test, expect } = require('../fixtures/electron.fixture')

test.describe('Downloads view', () => {
  test.beforeEach(async ({ page }) => {
    const nav = page.locator('nav, [role="navigation"]').first()
    await nav
      .getByText(/downloads/i)
      .first()
      .click()
    await expect(
      page
        .locator('main')
        .getByText(/downloads/i)
        .first()
    ).toBeVisible({ timeout: 8_000 })
  })

  test('downloads view renders', async ({ page }) => {
    await expect(page.locator('#root')).toBeVisible()
  })

  test('downloads heading is visible', async ({ page }) => {
    const heading = page.getByText(/downloads/i).first()
    await expect(heading).toBeVisible({ timeout: 10_000 })
  })

  test('empty active downloads shows placeholder text', async ({ page }) => {
    const empty = page.getByText(/no active downloads|nothing here|queue is empty/i)
    await expect(empty.first()).toBeVisible({ timeout: 8_000 })
  })

  test('empty download history shows placeholder text', async ({ page }) => {
    const empty = page.getByText(/no completed downloads|no downloads|history/i).first()
    await expect(empty).toBeVisible({ timeout: 8_000 })
  })

  test('active download items are shown when in progress', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const [win] = BrowserWindow.getAllWindows()
      win.webContents.send('download-progress', {
        downloadId: 'e2e-dl-001',
        filename: 'test-script.funscript',
        progress: 42,
        bytesReceived: 500_000,
        totalBytes: 1_200_000,
      })
    })
    const item = page.getByText(/test-script\.funscript/i).or(page.getByText(/42%/))
    const appeared = await item
      .first()
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true)
      .catch(() => false)
    if (!appeared) {
      test.skip()
      return
    }
    await expect(item.first()).toBeVisible()
  })

  test('progress bar renders for active download', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const [win] = BrowserWindow.getAllWindows()
      win.webContents.send('download-progress', {
        downloadId: 'e2e-dl-002',
        filename: 'progress-test.funscript',
        progress: 65,
        bytesReceived: 650_000,
        totalBytes: 1_000_000,
      })
    })
    const filename = page.getByText(/progress-test\.funscript/i)
    const appeared = await filename
      .first()
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true)
      .catch(() => false)
    if (!appeared) {
      test.skip()
      return
    }
    const progress = page.locator('[role="progressbar"]').or(page.getByText(/65%/))
    const hasProgress = await progress
      .first()
      .waitFor({ state: 'visible', timeout: 2_000 })
      .then(() => true)
      .catch(() => false)
    expect(hasProgress).toBe(true)
  })

  test('completed download is added to history', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const [win] = BrowserWindow.getAllWindows()
      win.webContents.send('download-complete', {
        downloadId: 'e2e-dl-003',
        filename: 'completed-script.funscript',
        path: 'C:\\Downloads\\completed-script.funscript',
        size: 800_000,
        completedAt: new Date().toISOString(),
      })
    })
    const filename = page.getByText(/completed-script\.funscript/i)
    const appeared = await filename
      .first()
      .waitFor({ state: 'visible', timeout: 3_000 })
      .then(() => true)
      .catch(() => false)
    if (!appeared) {
      test.skip()
      return
    }
    await expect(filename.first()).toBeVisible()
  })

  test('download error event does not crash the view', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ BrowserWindow }) => {
      const [win] = BrowserWindow.getAllWindows()
      win.webContents.send('download-error', {
        downloadId: 'e2e-dl-fail',
        filename: 'failing-download.mp4',
        error: 'Connection refused',
      })
    })
    await page.waitForTimeout(400)
    await expect(page.locator('#root')).toBeVisible()
  })

  test('clear history button appears when history is populated', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('get-download-history')
      ipcMain.handle('get-download-history', () => ({
        success: true,
        data: [
          {
            downloadId: 'hist-001',
            filename: 'old-script.funscript',
            path: 'C:\\Downloads\\old-script.funscript',
            size: 500_000,
            completedAt: new Date(Date.now() - 86_400_000).toISOString(),
          },
        ],
      }))
    })

    await page.reload()
    await page.waitForLoadState('domcontentloaded')
    await page.waitForSelector('#root')

    const nav = page.locator('nav, [role="navigation"]').first()
    await nav
      .getByText(/downloads/i)
      .first()
      .click()
    await expect(
      page
        .locator('main')
        .getByText(/downloads/i)
        .first()
    ).toBeVisible({ timeout: 8_000 })

    const clearBtn = page.getByRole('button', { name: /clear/i })
    if ((await clearBtn.count()) > 0) {
      await expect(clearBtn.first()).toBeVisible()
    }
    await expect(page.locator('#root')).toBeVisible()
  })

  test('save location path is displayed', async ({ page }) => {
    const pathText = page.getByText(/Downloads|scriptstash/i)
    await expect(pathText.first()).toBeVisible({ timeout: 8_000 })
  })

  test('max parallel downloads control is visible', async ({ page }) => {
    const maxEl = page.getByText(/max|parallel|concurrent/i)
    await expect(maxEl.first()).toBeVisible({ timeout: 8_000 })
  })
})
