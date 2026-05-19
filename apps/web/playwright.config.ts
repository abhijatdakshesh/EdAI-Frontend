import { defineConfig, devices } from '@playwright/test';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const isProduction = !!process.env.BASE_URL;

// In CI we want a faster, stable server than `next dev` (HMR + compile-on-
// request makes 14 s page loads — that's the symptom that took down PR #31's
// E2E gate even though prod was fine). Use the production build when on CI,
// dev mode locally.
const localServerCommand = process.env.CI
  ? 'NEXT_PUBLIC_USE_MOCKS=true NEXT_PUBLIC_USE_MOCK=true pnpm start -p 3000'
  : 'NEXT_PUBLIC_USE_MOCKS=true NEXT_PUBLIC_USE_MOCK=true pnpm dev';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['html', { open: 'never' }],
    ['junit', { outputFile: 'playwright-results.xml' }],
    ['list'],
  ],
  use: {
    baseURL: BASE_URL,
    trace: 'on-first-retry',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    // P2 projects — run on demand or in nightly CI
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'mobile',   use: { ...devices['iPhone 13'] } },
  ],
  webServer: isProduction ? undefined : {
    command: localServerCommand,
    url: 'http://localhost:3000',
    reuseExistingServer: !process.env.CI,
    timeout: 180_000, // production build can take 2-3 min on a cold CI runner
  },
});
