const { defineConfig } = require('@playwright/test')

module.exports = defineConfig({
  testDir: './e2e/tests',
  timeout: 45_000,
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
