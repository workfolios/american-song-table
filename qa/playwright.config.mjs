import {defineConfig} from '@playwright/test';

const viewports = [
  ['desktop-1440', {width: 1440, height: 900}],
  ['tablet-768', {width: 768, height: 1024}],
  ['mobile-390', {width: 390, height: 844}],
];

const browsers = ['chromium', 'firefox', 'webkit'];

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
  projects: browsers.flatMap((browserName) =>
    viewports.map(([viewportName, viewport]) => ({
      name: `${browserName}-${viewportName}`,
      use: {browserName, viewport},
    })),
  ),
});
