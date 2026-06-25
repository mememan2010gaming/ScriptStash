'use strict';

const { test, expect } = require('../fixtures/electron.fixture');
const { MOCK_TOPICS, MOCK_TOPIC_DETAIL } = require('../fixtures/mock-data');

test.describe('Topic detail view', () => {
  // Navigate into the first topic card before each test
  test.beforeEach(async ({ page }) => {
    const nav = page.locator('nav').first();
    await nav.getByText(/free scripts/i).first().click();
    await page.locator('[data-card]').first().waitFor({ state: 'visible', timeout: 10_000 });

    const cards = page.locator('[data-card]');
    const count = await cards.count();
    if (count === 0) return;
    await cards.first().locator('button').click();
    await page.getByRole('button', { name: /back/i }).waitFor({ state: 'visible', timeout: 10_000 }).catch(() => {});
  });

  test('detail view renders without crash', async ({ page }) => {
    await expect(page.locator('#root')).toBeVisible();
  });

  test('back button is present', async ({ page }) => {
    const back = page.getByRole('button', { name: /back/i });
    await expect(back).toBeVisible({ timeout: 10_000 });
  });

  test('back button returns to topics list', async ({ page }) => {
    const back = page.getByRole('button', { name: /back/i });
    if (await back.count() === 0) { test.skip(); return; }
    await back.click();
    const cards = page.locator('[data-card]');
    await expect(cards.first()).toBeVisible({ timeout: 10_000 });
  });

  test('topic title is displayed', async ({ page }) => {
    const title = page.getByText(/Amazing PMV Script|PMV|script/i).first();
    await expect(title).toBeVisible({ timeout: 10_000 });
  });

  test('post content is rendered', async ({ page }) => {
    const post = page.getByText(/PMV script for an amazing video/i).first();
    await expect(post).toBeVisible({ timeout: 10_000 });
  });

  test('download button is present when funscript link exists', async ({ page }) => {
    const downloadBtn = page.getByRole('button', { name: /download/i })
      .or(page.locator('[class*="download"]').filter({ hasText: /download/i }));
    const count = await downloadBtn.count();
    if (count > 0) {
      await expect(downloadBtn.first()).toBeVisible();
    } else {
      const link = page.getByRole('link', { name: /funscript|download/i });
      await expect(link.first()).toBeVisible({ timeout: 8_000 });
    }
  });

  test('video link section is present', async ({ page }) => {
    const videoSection = page.getByText(/video|watch|stream/i);
    const count = await videoSection.count();
    expect(count).toBeGreaterThan(0);
  });

  test('tags are displayed in detail view', async ({ page }) => {
    const tags = page.locator('[class*="tag"], [class*="badge"]')
      .or(page.getByText(/free|pmv|pov/i));
    const count = await tags.count();
    expect(count).toBeGreaterThan(0);
  });

  test('topic stats (views, likes) are shown', async ({ page }) => {
    // Mock has views: 5000 → formatted as '5k', like_count: 120. Use filter({ visible: true })
    // because the hidden TopicsView also contains these values and is first in DOM order.
    const stats = page.getByText('5k').filter({ visible: true })
      .or(page.getByText('120').filter({ visible: true }))
      .first();
    await expect(stats).toBeVisible({ timeout: 8_000 });
  });

  test('clicking download triggers IPC download call', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      global.__e2eDownloadCalled = false;
      const capture = () => {
        global.__e2eDownloadCalled = true;
        return { success: true, data: { downloadId: 'test-123' } };
      };
      ipcMain.removeHandler('download-file');
      ipcMain.handle('download-file', capture);
      ipcMain.removeHandler('download-paired');
      ipcMain.handle('download-paired', capture);
    });

    const downloadBtn = page.getByRole('button', { name: /^(download|get)$/i });
    if (await downloadBtn.count() === 0) { test.skip(); return; }
    await downloadBtn.first().click();
    await page.waitForTimeout(100);

    const called = await electronApp.evaluate(() => !!global.__e2eDownloadCalled);
    expect(called).toBe(true);
  });
});
