'use strict';

const { test: base, _electron: electron, expect } = require('@playwright/test');
const path = require('path');
const {
  MOCK_TOPICS,
  MOCK_TOPIC_DETAIL,
  MOCK_SEARCH_RESULTS,
  MOCK_DOWNLOAD_PATH,
  MOCK_APP_VERSION,
  MOCK_SETTINGS,
  MOCK_ADBLOCKER_STATUS,
  MOCK_NOTIFICATIONS,
  MOCK_USER,
  MOCK_YTDLP_VERSION,
} = require('./mock-data');

const APP_ROOT = path.resolve(__dirname, '../..');

// All ipcMain channels and their mock responses.
// Passed as a plain-serialisable object to electronApp.evaluate() so it crosses
// the process boundary cleanly.
const MOCK_IPC = {
  topics: { success: true, data: { topics: MOCK_TOPICS, total: MOCK_TOPICS.length, page: 1, perPage: 20 } },
  topicDetail: { success: true, data: MOCK_TOPIC_DETAIL },
  searchResults: { success: true, data: MOCK_SEARCH_RESULTS },
  downloadPath: { success: true, data: MOCK_DOWNLOAD_PATH },
  appVersion: { success: true, data: MOCK_APP_VERSION },
  settings: { success: true, data: MOCK_SETTINGS },
  adBlockerStatus: { success: true, data: MOCK_ADBLOCKER_STATUS },
  notifications: { success: true, data: { notifications: MOCK_NOTIFICATIONS, total_rows_notifications: MOCK_NOTIFICATIONS.length } },
  user: { success: true, data: { isValid: true, user: MOCK_USER } },
  ytdlpVersion: { success: true, data: MOCK_YTDLP_VERSION },
  maxDownloads: { success: true, data: 3 },
  downloadHistory: { success: true, data: [] },
  activeDownloads: { success: true, data: [] },
};

/**
 * Injects mock handlers into the Electron main process.
 * Runs inside electronApp.evaluate() — only plain-serialisable values
 * and inline functions are allowed here.
 */
async function injectMocks(electronApp, mocks) {
  await electronApp.evaluate(({ ipcMain }, m) => {
    const replace = (channel, handler) => {
      try { ipcMain.removeHandler(channel); } catch {}
      ipcMain.handle(channel, handler);
    };

    // Auth / session
    replace('validate-session', () => m.user);
    replace('get-session', () => m.user);
    replace('check-auth', () => m.user);

    // Topics
    replace('get-topics', () => m.topics);
    replace('get-paid-topics', () => m.topics);
    replace('get-topic-details', () => m.topicDetail);
    replace('get-topics-by-tag', () => m.topics);

    // Search
    replace('search-topics', () => m.searchResults);
    replace('search', () => m.searchResults);

    // Downloads
    replace('get-download-path', () => m.downloadPath);
    replace('get-download-history', () => m.downloadHistory);
    replace('get-active-downloads', () => m.activeDownloads);
    replace('get-max-downloads', () => m.maxDownloads);
    replace('set-max-downloads', () => ({ success: true }));
    replace('set-download-path', () => m.downloadPath);
    replace('start-download', () => ({ success: true, data: { downloadId: 'test-dl-001' } }));
    replace('download-file', () => ({ success: true, data: { downloadId: 'test-dl-001' } }));
    replace('download-paired', () => ({ success: true, data: { downloadId: 'test-dl-002' } }));
    replace('cancel-download', () => ({ success: true }));
    replace('clear-download-history', () => ({ success: true }));
    replace('get-library-path', () => m.downloadPath);
    replace('scan-library', () => ({ success: true, data: [] }));

    // Settings
    replace('get-settings', () => m.settings);
    replace('save-settings', () => ({ success: true }));
    replace('get-app-version', () => m.appVersion);
    replace('get-app-settings', () => m.settings);
    replace('get-update-status', () => ({ state: 'idle', updateAvailable: false }));
    replace('get-changelog', () => ({ success: true, data: '## v2.4.29\n- Test release\n' }));
    replace('install-update', () => ({ success: true }));
    replace('open-devtools', () => ({ success: true }));
    replace('clear-cache', () => ({ success: true }));

    // Ad blocker
    replace('get-adblocker-status', () => m.adBlockerStatus);
    replace('set-adblocker-enabled', () => ({ success: true }));
    replace('update-adblocker-list', () => ({ success: true }));

    // Notifications
    replace('get-notifications', () => m.notifications);
    replace('mark-notification-read', () => ({ success: true }));
    replace('mark-notifications-read', () => ({ success: true }));
    replace('mark-all-notifications-read', () => ({ success: true }));
    replace('dismiss-new-topics', () => ({ success: true }));
    replace('get-new-topics', () => ({ success: true, data: [] }));

    // yt-dlp / streaming
    replace('get-ytdlp-version', () => m.ytdlpVersion);
    replace('check-ytdlp', () => m.ytdlpVersion);
    replace('install-ytdlp', () => ({ success: true }));
    replace('update-ytdlp', () => ({ success: true }));
    replace('stream-video', () => ({ success: true, data: { streamUrl: 'http://localhost:9999/stream/test' } }));

    // Player
    replace('open-player', () => ({ success: true }));
    replace('load-funscript', () => ({ success: true, data: { actions: [] } }));

    // Update
    replace('check-for-updates', () => ({ success: true, data: { updateAvailable: false, current: '2.4.29' } }));

    // Window controls (no-op in tests)
    replace('window-minimize', () => {});
    replace('window-maximize', () => {});
    replace('window-close', () => {});

    // Dialog
    replace('open-folder-dialog', () => m.downloadPath);
  }, mocks);
}

/** Launch Electron, inject mocks, reload the main window, and return {electronApp, page}. */
async function launchApp() {
  // --test-mode tells the main process to:
  //   • skip auth cookie validation (goes straight to the main window)
  //   • skip adblocker init, update checks, and yt-dlp updates
  //   • apply --headless and --disable-gpu Chromium switches for display-free runs
  const appInstance = await electron.launch({
    args: [APP_ROOT, '--test-mode'],
    timeout: 15_000,
  });

  // Wait for the first window to fully load before calling evaluate().
  // evaluate() called before domcontentloaded destroys the execution context.
  // firstWindow() defaults to 30s; CI runners under load need more headroom.
  const page = await appInstance.firstWindow({ timeout: 60_000 });
  await page.waitForLoadState('domcontentloaded');

  // Renderer context is stable — safe to inject mocks now
  await injectMocks(appInstance, MOCK_IPC);

  // Reload so mock handlers service all data fetches from scratch
  await page.reload();
  await page.waitForLoadState('domcontentloaded');

  // Wait for the React root to be ready
  await page.waitForSelector('#root', { timeout: 10_000 });

  return { electronApp: appInstance, page };
}

// Base fixture shared by all test files.
// electronApp is worker-scoped: Electron launches ONCE per worker and is reused
// across all tests, making the suite dramatically faster.
// The page fixture (test-scoped) resets all IPC mocks before each test so that
// override-heavy tests in error-states.spec.js don't pollute later tests.
const test = base.extend({
  electronApp: [async ({}, use) => {
    const { electronApp } = await launchApp();
    await use(electronApp);
    await electronApp.close();
  }, { scope: 'worker' }],

  page: [async ({ electronApp }, use) => {
    const page = await electronApp.firstWindow();
    // Reset all mocks to defaults before every test.
    await injectMocks(electronApp, MOCK_IPC);
    await page.waitForSelector('#root', { timeout: 10_000 });
    await use(page);
  }, { scope: 'test' }],
});

module.exports = { test, expect, launchApp, injectMocks, MOCK_IPC };
