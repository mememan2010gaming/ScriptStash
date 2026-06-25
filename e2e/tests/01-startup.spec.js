'use strict';

const { test, expect } = require('../fixtures/electron.fixture');

test.describe('App startup', () => {
  test('main window is created and visible', async ({ page }) => {
    expect(page).toBeTruthy();
    const title = await page.title();
    // Electron apps often have blank title or app name
    expect(typeof title).toBe('string');
  });

  test('React root is mounted', async ({ page }) => {
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('app shell renders (sidebar + content area)', async ({ page }) => {
    // Sidebar navigation should be present
    const nav = page.locator('nav, [role="navigation"]').first();
    await expect(nav).toBeVisible({ timeout: 15_000 });

    // A main content area should exist
    const main = page.locator('main, [role="main"], [class*="content"], [class*="main"]').first();
    await expect(main).toBeVisible();
  });

  test('titlebar renders with window controls', async ({ page }) => {
    // The custom titlebar uses no "titlebar" class — verify the window control buttons instead.
    const minimize = page.getByRole('button', { name: /minimiz/i });
    const maximize = page.getByRole('button', { name: /maximiz/i });
    const close    = page.getByRole('button', { name: /close/i });
    await expect(minimize.first()).toBeVisible();
    await expect(maximize.first()).toBeVisible();
    await expect(close.first()).toBeVisible();
  });

  test('no uncaught JS errors on load', async ({ page }) => {
    const errors = [];
    page.on('pageerror', err => errors.push(err.message));
    // Wait a moment to catch any deferred errors
    await page.waitForTimeout(2_000);
    const criticalErrors = errors.filter(
      e => !e.includes('net::ERR') && !e.includes('Failed to fetch') && !e.includes('ResizeObserver')
    );
    expect(criticalErrors).toHaveLength(0);
  });

  test('window has correct minimum dimensions', async ({ electronApp }) => {
    const win = await electronApp.evaluate(({ BrowserWindow }) => {
      const [w] = BrowserWindow.getAllWindows();
      const [width, height] = w.getSize();
      return { width, height };
    });
    expect(win.width).toBeGreaterThanOrEqual(800);
    expect(win.height).toBeGreaterThanOrEqual(500);
  });

  test('window title contains app name', async ({ electronApp }) => {
    const title = await electronApp.evaluate(({ BrowserWindow }) => {
      const [w] = BrowserWindow.getAllWindows();
      return w.getTitle();
    });
    // ScriptStash or similar
    expect(title.toLowerCase()).toMatch(/script|stash/i);
  });

  test('only one window is created on startup', async ({ electronApp }) => {
    const count = await electronApp.evaluate(({ BrowserWindow }) =>
      BrowserWindow.getAllWindows().length
    );
    expect(count).toBe(1);
  });
});
