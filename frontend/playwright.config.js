import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  outputDir: './test-results/playwright-artifacts',
  timeout: 30_000,
  expect: { timeout: 8_000 },
  fullyParallel: false,
  workers: 1,
  retries: 0,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL: process.env.E2E_FRONTEND_URL || 'http://127.0.0.1:5173',
    viewport: { width: 1280, height: 900 },
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    video: 'off',
    launchOptions: { executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe' },
  },
  webServer: process.env.E2E_EXTERNAL_SERVERS === 'true' ? undefined : [
    {
      command: 'node src/server.js',
      cwd: '../backend',
      url: 'http://127.0.0.1:5113/api/health',
      reuseExistingServer: true,
      timeout: 30_000,
      env: { NODE_ENV: 'test', PORT: '5113', DISABLE_BACKGROUND_WORKERS: 'true' },
    },
    {
      command: 'node node_modules/vite/bin/vite.js --host 127.0.0.1',
      cwd: '.',
      url: 'http://127.0.0.1:5173',
      reuseExistingServer: true,
      timeout: 30_000,
    },
  ],
});
