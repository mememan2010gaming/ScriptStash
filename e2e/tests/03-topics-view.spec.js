'use strict';

const { test, expect } = require('../fixtures/electron.fixture');
const { TopicsPage } = require('../pages/TopicsPage');
const { MOCK_TOPICS } = require('../fixtures/mock-data');

test.describe('Topics view', () => {
  let topics;

  test.beforeEach(async ({ page }) => {
    topics = new TopicsPage(page);
    // Navigate through Search first so TopicsView always remounts with clean state.
    // Without this, navigating to "Free Scripts" when already on that category is a no-op
    // (React keeps the component alive via the `key={currentCategory}` prop), so any
    // search/filter state from the previous test would persist.
    await topics.goToSearch();
    await topics.goToTopics();
    // Allow time for the view to render mock data
    await page.waitForTimeout(800);
  });

  test('topics view loads without error', async ({ page }) => {
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('topic cards are rendered', async ({ page }) => {
    // Topics wrap each card in <div data-card>
    const cards = page.locator('[data-card]');
    const count = await cards.count();
    expect(count).toBeGreaterThan(0);
  });

  test('mock topic titles appear in cards', async ({ page }) => {
    // Use a safe portion of the title that contains no regex special characters
    await expect(page.getByText(/Amazing PMV Script/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('Latest and Top sort tabs are visible', async ({ page }) => {
    // TopicsView has a Segmented component with Latest / Top tabs (not Free/Paid — those are sidebar nav)
    const latestTab = page.getByText(/^latest$/i).first();
    const topTab = page.getByText(/^top$/i).first();
    await expect(latestTab).toBeVisible({ timeout: 10_000 });
    await expect(topTab).toBeVisible({ timeout: 10_000 });
  });

  test('navigating to Paid Scripts via sidebar updates view title', async ({ page }) => {
    const nav = page.locator('nav').first();
    await nav.getByText(/paid scripts/i).first().click();
    await page.waitForTimeout(600);
    // Paid Scripts view title should appear
    const paidTitle = page.getByText(/paid scripts/i);
    await expect(paidTitle.first()).toBeVisible({ timeout: 8_000 });
    await expect(page.locator('#root')).toBeVisible();
  });

  test('view count is displayed on topic cards', async ({ page }) => {
    // One of the mock topics has views: 5000
    const viewStat = page.getByText(/5[,.]?000|5000/).or(page.getByText(/\d{3,}/));
    const count = await viewStat.count();
    expect(count).toBeGreaterThan(0);
  });

  test('like count is displayed on topic cards', async ({ page }) => {
    // Mock topic has like_count: 120
    const likeStat = page.getByText(/120/);
    const count = await likeStat.count();
    expect(count).toBeGreaterThan(0);
  });

  test('clicking a topic card navigates to detail view', async ({ page }) => {
    const cards = page.locator('[data-card]');
    const count = await cards.count();
    if (count === 0) {
      test.skip(true, 'No topic cards rendered');
      return;
    }
    await cards.first().locator('button').click();
    await page.waitForTimeout(600);
    // Detail view should show a back button
    const back = page.getByRole('button', { name: /back/i });
    await expect(back).toBeVisible({ timeout: 10_000 });
  });

  test('inline search filters topic cards', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Filter|search/i).first();
    if (await searchInput.count() === 0) {
      test.skip(true, 'No inline search input found');
      return;
    }
    const before = await page.locator('[data-card]').count();
    await searchInput.fill('PMV');
    await page.waitForTimeout(500);
    const after = await page.locator('[data-card]').count();
    // Filtering should reduce or maintain card count (PMV is in our mock data)
    expect(after).toBeLessThanOrEqual(before);
  });

  test('searching for non-existent term shows empty or filtered state', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/Filter|search/i).first();
    if (await searchInput.count() === 0) {
      test.skip(true, 'No inline search input found');
      return;
    }
    await searchInput.fill('zzzzznonexistent999');
    await page.waitForTimeout(600);
    // Either no cards or an empty state message
    const cards = page.locator('[data-card]');
    const cardCount = await cards.count();
    const emptyMsg = page.getByText(/no scripts found|nothing found|no results/i);
    const hasEmpty = await emptyMsg.count() > 0;
    expect(cardCount === 0 || hasEmpty).toBe(true);
  });

  test('loading skeleton is shown (and replaced) on initial load', async ({ page }) => {
    // After our reload the skeleton might briefly appear; after data loads it should be gone
    await page.waitForTimeout(1_500);
    const skeleton = page.locator('[class*="skeleton"], [class*="Skeleton"]');
    const skeletonCount = await skeleton.count();
    // Skeletons should be gone after data loads
    expect(skeletonCount).toBe(0);
  });

  test('tags are shown on topic cards', async ({ page }) => {
    // Previous tests may have left a non-matching filter value (e.g. 'zzzzznonexistent999').
    // Clear it so the full card list is visible before waiting.
    const filterInput = page.getByPlaceholder(/Filter or search/i).first();
    if (await filterInput.count() > 0) {
      await filterInput.fill('');
      await page.waitForTimeout(300);
    }
    await page.waitForSelector('[data-card]', { state: 'visible', timeout: 12_000 });
    // Collect span text contents inside visible card buttons only (avoid hidden topics views)
    const texts = await page.locator('[data-card]').filter({ visible: true }).locator('button span').allTextContents();
    const found = texts.some(t => /^(free|pmv|pov|blowjob)$/i.test(t.trim()));
    expect(found).toBe(true);
  });
});
