const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './e2e/tests',
  // Electron launch/teardown for the worker-scoped app fixture is charged against
  // whichever test is running at the time, so this needs headroom beyond a typical
  // web-app per-test timeout, especially on loaded CI runners.
  timeout: 90_000,
  expect: { timeout: 12_000 },
  // Each worker gets its own Electron instance. Tests within a file run
  // sequentially (fullyParallel: false) to share the worker-scoped app.
  // Multiple workers run different spec files in parallel for speed.
  fullyParallel: false,
  workers: 4,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    trace: 'retain-on-failure',
  },
})
