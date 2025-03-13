// @ts-check
import { defineConfig, devices } from '@playwright/test';

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
  timeout: 60000,
  expect: {
    timeout: 60000,
  },
  use: {
    launchOptions: {
      slowMo: 0,
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
      use: { ...devices['Desktop Chromium'], viewport: null, permissions: ['clipboard-read', 'clipboard-write'] },
    },
  ],
});