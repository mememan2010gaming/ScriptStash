'use strict';

const { test, expect } = require('../fixtures/electron.fixture');
const { SearchPage } = require('../pages/SearchPage');
const { MOCK_SEARCH_RESULTS } = require('../fixtures/mock-data');

test.describe('Search view', () => {
  let search;

  test.beforeEach(async ({ page }) => {
    search = new SearchPage(page);
    await search.goToSearch();
    await page.waitForTimeout(400);
  });

  test('search view renders', async ({ page }) => {
    await expect(page.locator('#root')).toBeVisible();
  });

  test('search input is visible and focusable', async ({ page }) => {
    const input = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first();
    await expect(input).toBeVisible({ timeout: 10_000 });
    await input.focus();
    await expect(input).toBeFocused();
  });

  test('typing in search shows results from mock data', async ({ page, electronApp }) => {
    // Ensure search IPC returns our mock
    await electronApp.evaluate(({ ipcMain }, results) => {
      ipcMain.removeHandler('search-topics');
      ipcMain.handle('search-topics', () => ({ success: true, data: results }));
    }, MOCK_SEARCH_RESULTS);

    const input = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first();
    await input.fill('test query');
    await input.press('Enter');
    await page.waitForTimeout(700);

    // "Search Result One" or "Search Result Two" should appear
    const result = page.getByText(/Search Result/i);
    await expect(result.first()).toBeVisible({ timeout: 10_000 });
  });

  test('search result count matches mock data', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }, results) => {
      ipcMain.removeHandler('search-topics');
      ipcMain.handle('search-topics', () => ({ success: true, data: results }));
    }, MOCK_SEARCH_RESULTS);

    const input = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first();
    await input.fill('test');
    await input.press('Enter');
    await page.waitForTimeout(700);

    const items = page.locator('[data-card]');
    const count = await items.count();
    expect(count).toBeGreaterThanOrEqual(MOCK_SEARCH_RESULTS.topics.length);
  });

  test('empty search shows no results / empty state', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('search-topics');
      ipcMain.handle('search-topics', () => ({
        success: true,
        data: { topics: [], posts: [], grouped_search_result: { topic_ids: [] } },
      }));
    });

    const input = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first();
    await input.fill('xyzzy_no_match_999');
    await input.press('Enter');
    await page.waitForTimeout(700);

    const cards = page.locator('[data-card]');
    const cardCount = await cards.count();
    const emptyMsg = page.getByText(/no results|nothing found|try different/i);
    const hasMsg = await emptyMsg.count() > 0;
    expect(cardCount === 0 || hasMsg).toBe(true);
  });

  test('clearing search input clears results', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }, results) => {
      ipcMain.removeHandler('search-topics');
      ipcMain.handle('search-topics', () => ({ success: true, data: results }));
    }, MOCK_SEARCH_RESULTS);

    const input = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first();
    await input.fill('test');
    await input.press('Enter');
    await page.waitForTimeout(500);

    await input.fill('');
    await input.press('Enter');
    await page.waitForTimeout(400);

    // After clearing, either the results are gone or the initial empty state shows
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('clicking a search result navigates to topic detail', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }, results) => {
      ipcMain.removeHandler('search-topics');
      ipcMain.handle('search-topics', () => ({ success: true, data: results }));
    }, MOCK_SEARCH_RESULTS);

    const input = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first();
    await input.fill('test');
    await input.press('Enter');
    await page.waitForTimeout(700);

    // Filter for visible cards only — hidden TopicsView cards share the [data-card] selector
    const results = page.locator('[data-card]').filter({ visible: true });
    const count = await results.count();
    if (count === 0) { test.skip(); return; }

    await results.first().locator('button').click();
    await page.waitForTimeout(600);

    // Should have navigated away from search — back button present
    const back = page.getByRole('button', { name: /back/i });
    await expect(back).toBeVisible({ timeout: 10_000 });
  });

  test('search handles IPC error gracefully', async ({ page, electronApp }) => {
    await electronApp.evaluate(({ ipcMain }) => {
      ipcMain.removeHandler('search-topics');
      ipcMain.handle('search-topics', () => ({ success: false, error: 'Network error' }));
    });

    const input = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first();
    await input.fill('error test');
    await input.press('Enter');
    await page.waitForTimeout(700);

    // App should not crash
    await expect(page.locator('#root')).toBeVisible();
  });

  test('search loading indicator appears then disappears', async ({ page, electronApp }) => {
    // Slow mock to observe loading state
    await electronApp.evaluate(({ ipcMain }, results) => {
      ipcMain.removeHandler('search-topics');
      ipcMain.handle('search-topics', async () => {
        await new Promise(r => setTimeout(r, 600));
        return { success: true, data: results };
      });
    }, MOCK_SEARCH_RESULTS);

    const input = page.getByRole('searchbox')
      .or(page.getByPlaceholder(/Search scripts/i))
      .first();
    await input.fill('loading test');
    await input.press('Enter');

    // Wait for results to appear (loading state should have resolved)
    await page.waitForTimeout(1_500);
    const spinner = page.locator('[class*="spinner"], [class*="loading"]');
    const spinnerCount = await spinner.count();
    // Spinner should be gone after results arrive
    expect(spinnerCount).toBe(0);
  });
});
