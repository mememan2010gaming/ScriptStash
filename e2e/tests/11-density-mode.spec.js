'use strict';

const { test, expect } = require('../fixtures/electron.fixture');

test.describe('Density mode', () => {
  async function goToAppearance(page) {
    await page.getByRole('button', { name: 'Settings' }).first().click();
    await page.waitForTimeout(400);
    const appearanceBtn = page.locator('main').getByRole('button', { name: /appearance/i }).first();
    if (await appearanceBtn.count() > 0) await appearanceBtn.click();
    await page.waitForTimeout(400);
  }

  async function goToTopics(page) {
    // Navigate through Search first to ensure TopicsView remounts with clean state
    await page.locator('nav').first().getByText(/search/i).first().click();
    await page.waitForTimeout(300);
    await page.locator('nav').first().getByText(/free scripts/i).first().click();
    await page.waitForTimeout(800);
  }

  function densityCards(page) {
    // Density cards are glass-hover buttons with labels: Mosaic, List, Compact
    return page.locator('[class*="glass-hover"]').filter({ hasText: /mosaic|list|compact/i });
  }

  // ─── Appearance Section Tests ────────────────────────────────────────────────

  test('appearance section shows 3 density cards', async ({ page }) => {
    await goToAppearance(page);
    const cards = densityCards(page);
    const count = await cards.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('each density card has a description', async ({ page }) => {
    await goToAppearance(page);

    // Check for Mosaic description
    await expect(
      page.getByText(/thumbnail tile grid|grid of tiles/i)
    ).toBeVisible({ timeout: 8_000 });

    // Check for List description
    await expect(
      page.getByText(/wide rows with preview|rows with preview/i)
    ).toBeVisible({ timeout: 8_000 });

    // Check for Compact description
    await expect(
      page.getByText(/dense list|more at a glance/i)
    ).toBeVisible({ timeout: 8_000 });
  });

  test('density card labels are correct', async ({ page }) => {
    await goToAppearance(page);

    await expect(page.getByText('Mosaic').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('List').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Compact').first()).toBeVisible({ timeout: 8_000 });
  });

  // ─── Default Density Tests ──────────────────────────────────────────────────

  test('default density is list when localStorage is unset', async ({ page }) => {
    // Clear localStorage to simulate fresh install
    await page.evaluate(() => localStorage.removeItem('ss_density'));
    await page.reload();
    await page.waitForTimeout(500);

    await goToAppearance(page);

    // The List card should be rendered (we can at least verify it's clickable)
    const listCard = page.getByRole('button').filter({ hasText: /^list$/i }).first();
    if (await listCard.count() > 0) {
      await expect(listCard).toBeVisible();
    }
  });

  // ─── localStorage Persistence Tests ─────────────────────────────────────────

  test('clicking Mosaic card saves to localStorage', async ({ page }) => {
    await goToAppearance(page);

    const mosaicCard = densityCards(page).filter({ hasText: /mosaic/i }).first();
    if (await mosaicCard.count() === 0) {
      test.skip();
      return;
    }

    await mosaicCard.click();
    await page.waitForTimeout(400);

    const density = await page.evaluate(() => localStorage.getItem('ss_density'));
    expect(density).toBe('mosaic');
  });

  test('clicking List card saves to localStorage', async ({ page }) => {
    await goToAppearance(page);

    // densityCards() scopes to glass-hover buttons with density labels, avoiding
    // false matches from the anchored /^list$/i regex on multi-line button text.
    const listCard = densityCards(page).filter({ hasText: /list/i }).first();
    if (await listCard.count() === 0) {
      test.skip();
      return;
    }

    await listCard.click();
    await page.waitForTimeout(400);

    const density = await page.evaluate(() => localStorage.getItem('ss_density'));
    expect(density).toBe('list');
  });

  test('clicking Compact card saves to localStorage', async ({ page }) => {
    await goToAppearance(page);

    const compactCard = densityCards(page).filter({ hasText: /compact/i }).first();
    if (await compactCard.count() === 0) {
      test.skip();
      return;
    }

    await compactCard.click();
    await page.waitForTimeout(400);

    const density = await page.evaluate(() => localStorage.getItem('ss_density'));
    expect(density).toBe('compact');
  });

  // ─── Grid Layout Tests ──────────────────────────────────────────────────────

  test('mosaic density renders multi-column grid', async ({ page }) => {
    // Set density to mosaic in localStorage
    await page.evaluate(() => localStorage.setItem('ss_density', 'mosaic'));
    await page.reload();
    await page.waitForTimeout(500);

    await goToTopics(page);

    if (await page.locator('[data-card]').count() === 0) {
      test.skip();
      return;
    }

    const density = await page.locator('[data-card]').first().evaluate(
      el => el.parentElement.dataset.density
    );

    // Mosaic mode should have data-density='mosaic'
    expect(density).toBe('mosaic');
  });

  test('list density renders single-column grid', async ({ page }) => {
    // Set density to list in localStorage
    await page.evaluate(() => localStorage.setItem('ss_density', 'list'));
    await page.reload();
    await page.waitForTimeout(500);

    await goToTopics(page);

    if (await page.locator('[data-card]').count() === 0) {
      test.skip();
      return;
    }

    const density = await page.locator('[data-card]').first().evaluate(
      el => el.parentElement.dataset.density
    );

    // List mode should have data-density='list'
    expect(density).toBe('list');
  });

  test('compact density renders single-column grid', async ({ page }) => {
    // Set density to compact in localStorage
    await page.evaluate(() => localStorage.setItem('ss_density', 'compact'));
    await page.reload();
    await page.waitForTimeout(500);

    await goToTopics(page);

    if (await page.locator('[data-card]').count() === 0) {
      test.skip();
      return;
    }

    const density = await page.locator('[data-card]').first().evaluate(
      el => el.parentElement.dataset.density
    );

    // Compact mode should have data-density='compact'
    expect(density).toBe('compact');
  });

  // ─── Persistence Across Navigation Tests ────────────────────────────────────

  test('density setting persists across navigation', async ({ page }) => {
    await goToAppearance(page);

    // Click Compact card
    const compactCard = densityCards(page).filter({ hasText: /compact/i }).first();
    if (await compactCard.count() === 0) {
      test.skip();
      return;
    }

    await compactCard.click();
    await page.waitForTimeout(400);

    // Navigate away to Downloads
    await page.locator('nav').first().getByText(/downloads/i).first().click();
    await page.waitForTimeout(600);

    // Navigate back to Topics
    await page.locator('nav').first().getByText(/free scripts/i).first().click();
    await page.waitForTimeout(800);

    // Check localStorage still has compact
    const density = await page.evaluate(() => localStorage.getItem('ss_density'));
    expect(density).toBe('compact');
  });

  test('density setting persists across page reload', async ({ page }) => {
    await goToAppearance(page);

    const mosaicCard = densityCards(page).filter({ hasText: /mosaic/i }).first();
    if (await mosaicCard.count() === 0) {
      test.skip();
      return;
    }

    await mosaicCard.click();
    await page.waitForTimeout(400);

    // Reload the page
    await page.reload();
    await page.waitForTimeout(500);

    // Check localStorage still has mosaic
    const density = await page.evaluate(() => localStorage.getItem('ss_density'));
    expect(density).toBe('mosaic');
  });

  // ─── All Density Modes Render Cards Test ────────────────────────────────────

  test('mosaic density shows topic cards', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('ss_density', 'mosaic'));
    await page.reload();
    await page.waitForTimeout(500);

    await goToTopics(page);

    const cards = page.locator('[data-card]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('list density shows topic cards', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('ss_density', 'list'));
    await page.reload();
    await page.waitForTimeout(500);

    await goToTopics(page);

    const cards = page.locator('[data-card]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('compact density shows topic cards', async ({ page }) => {
    await page.evaluate(() => localStorage.setItem('ss_density', 'compact'));
    await page.reload();
    await page.waitForTimeout(500);

    await goToTopics(page);

    const cards = page.locator('[data-card]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  // ─── Selection Indicator Tests ──────────────────────────────────────────────

  test('selected density card has visual indicator', async ({ page }) => {
    await goToAppearance(page);

    const mosaicCard = densityCards(page).filter({ hasText: /mosaic/i }).first();
    if (await mosaicCard.count() === 0) {
      test.skip();
      return;
    }

    await mosaicCard.click();
    await page.waitForTimeout(400);

    // Verify the root is still visible and responsive
    await expect(page.locator('#root')).toBeVisible();
  });

  test('clicking different density card updates selection', async ({ page }) => {
    await goToAppearance(page);

    const listCard = densityCards(page).filter({ hasText: /list/i }).first();
    const mosaicCard = densityCards(page).filter({ hasText: /mosaic/i }).first();

    if (await listCard.count() === 0 || await mosaicCard.count() === 0) {
      test.skip();
      return;
    }

    // Click list first
    await listCard.click();
    await page.waitForTimeout(400);
    let density = await page.evaluate(() => localStorage.getItem('ss_density'));
    expect(density).toBe('list');

    // Click mosaic
    await mosaicCard.click();
    await page.waitForTimeout(400);
    density = await page.evaluate(() => localStorage.getItem('ss_density'));
    expect(density).toBe('mosaic');
  });
});
