import {defineConfig} from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: ['site.spec.mjs'],
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
  },
  reporter: [
    ['line'],
    ['html', {outputFolder: 'playwright-report', open: 'never'}],
  ],
  outputDir: 'test-results',
  use: {
    baseURL: 'http://127.0.0.1:4173/',
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173/',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'desktop-1440',
      use: {viewport: {width: 1440, height: 900}},
    },
    {
      name: 'tablet-768',
      use: {viewport: {width: 768, height: 1024}},
    },
    {
      name: 'mobile-390',
      use: {viewport: {width: 390, height: 844}},
    },
  ],
});
