// @ts-check
const { defineConfig, devices } = require('@playwright/test');

module.exports = defineConfig({
  testDir: './tests',
  outputDir: './test-results',
  snapshotDir: './test-results/snapshots',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [
    ['html', { outputFolder: './test-results', open: 'never' }],
    ['json', { outputFile: './test-results/results.json' }]
  ],
  timeout: 180000,
  expect: {
    timeout: 180000,
  },
  use: {
    launchOptions: {
      slowMo: 100,
      args: [
        '--start-maximized',
      ]
    },
    headless: true,
    baseURL: 'https://app.intempt.com/',
    trace: 'on-first-retry',
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chromium'],
        launchOptions: {
          args: ['--start-maximized'],
        },
        viewport: null, // This will allow the browser to use the full screen size
        permissions: ['clipboard-read', 'clipboard-write']
      },
    },
  ],
});