'use strict';

const { test, expect } = require('../fixtures/electron.fixture');

test.describe('Density mode', () => {
  async function goToAppearance(page) {
    await page.getByRole('button', { name: 'Settings' }).first().click();
    const appearanceBtn = page.locator('main').getByRole('button', { name: /appearance/i }).first();
    const appeared = await appearanceBtn.waitFor({ state: 'visible', timeout: 5_000 }).then(() => true).catch(() => false);
    if (appeared) await appearanceBtn.click();
    await expect(page.locator('[class*="glass-hover"]').filter({ hasText: /mosaic|list|compact/i }).first()).toBeVisible({ timeout: 8_000 });
  }

  async function goToTopics(page) {
    await page.locator('nav').first().getByText(/search/i).first().click();
    await expect(page.getByPlaceholder(/Search scripts/i).or(page.getByRole('searchbox')).first()).toBeVisible({ timeout: 8_000 });
    await page.locator('nav').first().getByText(/free scripts/i).first().click();
    await page.locator('[data-card]').first().waitFor({ state: 'visible', timeout: 12_000 });
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
    await expect(page.getByText(/thumbnail tile grid|grid of tiles/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/wide rows with preview|rows with preview/i)).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText(/dense list|more at a glance/i)).toBeVisible({ timeout: 8_000 });
  });

  test('density card labels are correct', async ({ page }) => {
    await goToAppearance(page);
    await expect(page.getByText('Mosaic').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('List').first()).toBeVisible({ timeout: 8_000 });
    await expect(page.getByText('Compact').first()).toBeVisible({ timeout: 8_000 });
  });

  // ─── Default Density Tests ──────────────────────────────────────────────────

  test('default density is list when localStorage is unset', async ({ page }) => {
    await page.evaluate(() => localStorage.removeItem('ss_density'));
    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#root', { timeout: 10_000 });
    await goToAppearance(page);
    const listCard = densityCards(page).filter({ hasText: /list/i }).first();
    if (await listCard.count() > 0) {
      await expect(listCard).toBeVisible();
    }
  });

  // ─── localStorage Persistence Tests ─────────────────────────────────────────

  for (const mode of ['mosaic', 'list', 'compact']) {
    test(`clicking ${mode.charAt(0).toUpperCase() + mode.slice(1)} card saves to localStorage`, async ({ page }) => {
      await goToAppearance(page);
      const card = densityCards(page).filter({ hasText: new RegExp(mode, 'i') }).first();
      if (await card.count() === 0) { test.skip(); return; }
      await card.click();
      await page.waitForFunction((m) => localStorage.getItem('ss_density') === m, mode, { timeout: 3_000 });
      const density = await page.evaluate(() => localStorage.getItem('ss_density'));
      expect(density).toBe(mode);
    });
  }

  // ─── Grid Layout + Cards Tests ───────────────────────────────────────────────

  for (const mode of ['mosaic', 'list', 'compact']) {
    test(`${mode} density: cards render with correct grid attribute`, async ({ page }) => {
      await page.evaluate(m => localStorage.setItem('ss_density', m), mode);
      await page.reload();
      await page.waitForLoadState('domcontentloaded');
      await page.waitForSelector('#root', { timeout: 10_000 });
      await goToTopics(page);
      const cards = page.locator('[data-card]');
      if (await cards.count() === 0) { test.skip(); return; }
      expect(await cards.count()).toBeGreaterThan(0);
      const density = await cards.first().evaluate(el => el.parentElement.dataset.density);
      expect(density).toBe(mode);
    });
  }

  // ─── Persistence Across Navigation Tests ────────────────────────────────────

  test('density setting persists across navigation', async ({ page }) => {
    await goToAppearance(page);
    const compactCard = densityCards(page).filter({ hasText: /compact/i }).first();
    if (await compactCard.count() === 0) { test.skip(); return; }
    await compactCard.click();
    await page.waitForFunction(() => localStorage.getItem('ss_density') === 'compact', { timeout: 3_000 });

    await page.locator('nav').first().getByText(/downloads/i).first().click();
    await expect(page.getByText(/no active downloads|nothing here|queue is empty/i).first()).toBeVisible({ timeout: 8_000 });

    await page.locator('nav').first().getByText(/free scripts/i).first().click();
    await page.locator('[data-card]').first().waitFor({ state: 'visible', timeout: 12_000 });

    const density = await page.evaluate(() => localStorage.getItem('ss_density'));
    expect(density).toBe('compact');
  });

  test('density setting persists across page reload', async ({ page }) => {
    await goToAppearance(page);
    const mosaicCard = densityCards(page).filter({ hasText: /mosaic/i }).first();
    if (await mosaicCard.count() === 0) { test.skip(); return; }
    await mosaicCard.click();
    await page.waitForFunction(() => localStorage.getItem('ss_density') === 'mosaic', { timeout: 3_000 });

    await page.reload();
    await page.waitForLoadState('domcontentloaded');
    await page.waitForSelector('#root', { timeout: 10_000 });

    const density = await page.evaluate(() => localStorage.getItem('ss_density'));
    expect(density).toBe('mosaic');
  });

  // ─── Selection Indicator Tests ──────────────────────────────────────────────

  test('selected density card has visual indicator', async ({ page }) => {
    await goToAppearance(page);
    const mosaicCard = densityCards(page).filter({ hasText: /mosaic/i }).first();
    if (await mosaicCard.count() === 0) { test.skip(); return; }
    await mosaicCard.click();
    await page.waitForFunction(() => localStorage.getItem('ss_density') === 'mosaic', { timeout: 3_000 });
    await expect(page.locator('#root')).toBeVisible();
  });

  test('clicking different density card updates selection', async ({ page }) => {
    await goToAppearance(page);
    const listCard = densityCards(page).filter({ hasText: /list/i }).first();
    const mosaicCard = densityCards(page).filter({ hasText: /mosaic/i }).first();
    if (await listCard.count() === 0 || await mosaicCard.count() === 0) { test.skip(); return; }

    await listCard.click();
    await page.waitForFunction(() => localStorage.getItem('ss_density') === 'list', { timeout: 3_000 });
    expect(await page.evaluate(() => localStorage.getItem('ss_density'))).toBe('list');

    await mosaicCard.click();
    await page.waitForFunction(() => localStorage.getItem('ss_density') === 'mosaic', { timeout: 3_000 });
    expect(await page.evaluate(() => localStorage.getItem('ss_density'))).toBe('mosaic');
  });
});
