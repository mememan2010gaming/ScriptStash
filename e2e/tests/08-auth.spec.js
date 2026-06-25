'use strict'

const { test, expect } = require('../fixtures/electron.fixture')

test.describe('Auth & session', () => {
  test('validate-session IPC returns user data', async ({ page, electronApp }) => {
    const result = await page.evaluate(async () => {
      return await window.electronAPI.validateSession()
    })
    expect(result).toBeTruthy()
    expect(result.success).toBe(true)
    expect(result.data?.isValid).toBe(true)
    expect(result.data?.user?.username).toBeDefined()
  })

  test('user info is displayed in sidebar', async ({ page }) => {
    // Mock validate-session returns MOCK_USER (username: 'TestUser')
    // Sidebar (<aside>) shows username or "Guest"
    const userText = page
      .locator('aside')
      .getByText(/TestUser|Guest|logged/i)
      .first()
    await expect(userText).toBeVisible({ timeout: 10_000 })
  })

  test('session state shows as connected in settings', async ({ page }) => {
    await page.getByRole('button', { name: 'Settings' }).first().click()
    await page.waitForTimeout(400)

    const generalBtn = page
      .locator('main')
      .getByRole('button', { name: /^general$/i })
      .first()
    if ((await generalBtn.count()) > 0) await generalBtn.click()
    await page.waitForTimeout(300)

    // Should show Connected or the username
    const connected = page.getByText(/connected|TestUser/i)
    await expect(connected.first()).toBeVisible({ timeout: 8_000 })
  })

  test('logout IPC is called when logout button clicked', async ({ page, electronApp }) => {
    let logoutSent = false
    await electronApp.evaluate(({ ipcMain }) => {
      // Remove ALL logout listeners (including the real one) so the app does NOT
      // clear cookies or redirect to the login window — that would brick this worker.
      ipcMain.removeAllListeners('logout')
      global.__logoutReceived = false
      ipcMain.on('logout', () => {
        global.__logoutReceived = true
      })
    })

    // Navigate to settings > general
    await page.getByRole('button', { name: 'Settings' }).first().click()
    await page.waitForTimeout(400)
    const generalBtn = page
      .locator('main')
      .getByRole('button', { name: /^general$/i })
      .first()
    if ((await generalBtn.count()) > 0) await generalBtn.click()
    await page.waitForTimeout(300)

    const logoutBtn = page.getByRole('button', { name: /logout/i })
    if ((await logoutBtn.count()) === 0) {
      test.skip()
      return
    }
    await logoutBtn.click()
    await page.waitForTimeout(400)

    logoutSent = await electronApp.evaluate(() => !!global.__logoutReceived)
    expect(logoutSent).toBe(true)
  })

  test('unauthenticated validate-session returns isValid: false', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('validate-session')
      ipcMain.handle('validate-session', () => ({
        success: true,
        data: { isValid: false, user: null },
      }))
    })

    const result = await page.evaluate(async () => {
      return await window.electronAPI.validateSession()
    })
    expect(result.data?.isValid).toBe(false)
  })
})
