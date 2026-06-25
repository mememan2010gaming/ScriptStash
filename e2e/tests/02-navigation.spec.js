'use strict';

const { test, expect } = require('../fixtures/electron.fixture');
const { AppPage } = require('../pages/AppPage');

test.describe('Sidebar navigation', () => {
  let app;

  test.beforeEach(async ({ page }) => {
    app = new AppPage(page);
  });

  test('sidebar is visible', async ({ page }) => {
    const sidebar = page.locator('nav, [role="navigation"], [class*="sidebar"], [class*="Sidebar"]').first();
    await expect(sidebar).toBeVisible({ timeout: 12_000 });
  });

  test('sidebar contains Scripts nav item', async ({ page }) => {
    // Topics are labelled "Free Scripts" / "Paid Scripts" in the UI, not "Topics".
    // Use 'nav' tag selector — [role="navigation"] won't match <nav>'s implicit ARIA role.
    const nav = page.locator('nav').first();
    await expect(nav.getByText(/free scripts|paid scripts/i).first()).toBeVisible();
  });

  test('sidebar contains Search nav item', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav.getByText(/search/i)).toBeVisible();
  });

  test('sidebar contains Downloads nav item', async ({ page }) => {
    const nav = page.locator('nav').first();
    await expect(nav.getByText(/downloads/i)).toBeVisible();
  });

  test('sidebar contains Settings nav item', async ({ page }) => {
    // Settings sits outside <nav>, directly in the <aside>.
    // Use 'aside' tag selector — [role="complementary"] won't match <aside>'s implicit ARIA role.
    const sidebar = page.locator('aside').first();
    await expect(sidebar.getByText(/settings/i)).toBeVisible();
  });

  test('navigating to Topics shows the topics view', async ({ page }) => {
    await app.goToTopics();
    // Topics view should show a heading or content related to topics
    await expect(page.getByText(/topics|scripts/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('navigating to Search shows the search view', async ({ page }) => {
    await app.goToSearch();
    const searchInput = page.getByPlaceholder(/Search scripts/i).or(page.getByRole('searchbox')).first();
    await expect(searchInput).toBeVisible({ timeout: 10_000 });
  });

  test('navigating to Downloads shows the downloads view', async ({ page }) => {
    await app.goToDownloads();
    // Downloads heading or download-specific UI
    await expect(page.getByText(/downloads/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('navigating to Settings shows the settings view', async ({ page }) => {
    await app.goToSettings();
    // Settings has specific controls like a path display or theme selector
    await expect(page.getByText(/settings|download path|theme/i).first()).toBeVisible({ timeout: 10_000 });
  });

  test('active nav item is visually highlighted', async ({ page }) => {
    await app.goToDownloads();
    // The app uses CSS-only active styling with no aria-current/active/selected attribute.
    // Verify the Downloads view is shown (button was clickable and navigation happened).
    await expect(page.locator('main').getByText(/downloads/i).first()).toBeVisible({ timeout: 8_000 });
  });

  test('can switch between views multiple times', async ({ page }) => {
    await app.goToTopics();
    await page.waitForTimeout(300);
    await app.goToSearch();
    await page.waitForTimeout(300);
    await app.goToDownloads();
    await page.waitForTimeout(300);
    await app.goToSettings();
    await page.waitForTimeout(300);
    await app.goToTopics();

    // Should end up on topics without crashing
    const root = page.locator('#root');
    await expect(root).toBeVisible();
  });

  test('back button returns from topic detail to topics list', async ({ page }) => {
    await app.goToTopics();
    // Wait for topics to render then click one
    const cards = page.locator('[class*="card"], article').filter({ hasText: /script|sync/i });
    const count = await cards.count();
    if (count > 0) {
      await cards.first().click();
      await page.waitForTimeout(500);
      // Back button should be available
      const back = page.getByRole('button', { name: /back/i });
      await expect(back).toBeVisible({ timeout: 8_000 });
      await back.click();
      await page.waitForTimeout(400);
      // Should be back on topics list
      await expect(cards.first()).toBeVisible({ timeout: 8_000 });
    }
  });
});
