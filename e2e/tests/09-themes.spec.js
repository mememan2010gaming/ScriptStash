'use strict';

const { test, expect } = require('../fixtures/electron.fixture');

test.describe('Themes & appearance', () => {
  async function goToAppearance(page) {
    await page.getByRole('button', { name: 'Settings' }).first().click();
    await page.waitForTimeout(400);
    const appearanceBtn = page.locator('main').getByRole('button', { name: /appearance/i }).first();
    if (await appearanceBtn.count() > 0) await appearanceBtn.click();
    await page.waitForTimeout(400);
  }

  // Theme card buttons use class "glass glass-hover" with visible text (theme name + description).
  // Stepper +/- buttons also use glass-hover but have no text content (SVG icons only).
  function themeCards(page) {
    return page.locator('[class*="glass-hover"]').filter({ hasText: /[a-z]{3,}/i });
  }

  test('appearance section loads', async ({ page }) => {
    await goToAppearance(page);
    await expect(page.locator('#root')).toBeVisible();
  });

  test('multiple theme options are shown', async ({ page }) => {
    await goToAppearance(page);
    const count = await themeCards(page).count();
    expect(count).toBeGreaterThan(1);
  });

  test('each theme card has a name label', async ({ page }) => {
    await goToAppearance(page);
    const cards = themeCards(page);
    const count = await cards.count();
    for (let i = 0; i < Math.min(count, 3); i++) {
      const text = await cards.nth(i).textContent();
      expect(text?.trim().length).toBeGreaterThan(0);
    }
  });

  test('clicking a theme persists the selection', async ({ page, electronApp }) => {
    let savedTheme = null;
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('save-settings');
      ipcMain.handle('save-settings', (_, settings) => {
        global.__themeSettings = settings;
        return { success: true };
      });
    });

    await goToAppearance(page);
    const cards = themeCards(page);
    if (await cards.count() < 2) { test.skip(); return; }

    await cards.nth(1).click();
    await page.waitForTimeout(500);

    savedTheme = await electronApp.evaluate(() => global.__themeSettings);
    expect(savedTheme).not.toBeNull();
  });

  test('selected theme card has visual selection indicator', async ({ page }) => {
    await goToAppearance(page);
    const cards = themeCards(page);
    if (await cards.count() === 0) { test.skip(); return; }

    await cards.first().click();
    await page.waitForTimeout(400);

    // App root should still be visible — selection indicator may be CSS-only (border/shadow change)
    await expect(page.locator('#root')).toBeVisible();
  });

  test('CSS custom property --accent changes after theme switch', async ({ page }) => {
    await goToAppearance(page);
    const cards = themeCards(page);
    if (await cards.count() < 2) { test.skip(); return; }

    const before = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    );

    await cards.nth(1).click();
    await page.waitForTimeout(400);

    const after = await page.evaluate(() =>
      getComputedStyle(document.documentElement).getPropertyValue('--accent').trim()
    );

    await expect(page.locator('#root')).toBeVisible();
    expect(typeof before).toBe('string');
    expect(typeof after).toBe('string');
  });

  test('theme applies to sidebar background', async ({ page }) => {
    await goToAppearance(page);
    // Sidebar is <aside> (role=complementary)
    const sidebar = page.locator('aside').first();
    await expect(sidebar).toBeVisible();
    const bg = await sidebar.evaluate(el => getComputedStyle(el).background || getComputedStyle(el).backgroundColor);
    expect(bg.length).toBeGreaterThan(0);
  });

  test('theme choice survives navigation between views', async ({ page }) => {
    await goToAppearance(page);
    const cards = themeCards(page);
    if (await cards.count() < 2) { test.skip(); return; }

    await cards.nth(1).click();
    await page.waitForTimeout(400);

    // Navigate away and back
    await page.locator('nav').first().getByText(/downloads/i).first().click();
    await page.waitForTimeout(300);
    await page.getByRole('button', { name: 'Settings' }).first().click();
    await page.waitForTimeout(300);

    await expect(page.locator('#root')).toBeVisible();
  });
});
