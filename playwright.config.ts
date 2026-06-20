import { defineConfig, devices } from "@playwright/test";

/**
 * Cross-browser smoke tests for the Fairytale Farms storefront.
 *
 * Runs the same specs across Chromium, Firefox, WebKit (Safari), plus mobile
 * Chrome and mobile Safari viewports — catching layout/rendering regressions
 * that unit tests can't see.
 *
 * First-time setup (browser binaries are NOT bundled):
 *   pnpm e2e:install      # npx playwright install --with-deps
 *   pnpm test:e2e
 *
 * Point at a deployed environment instead of spinning up a local server:
 *   E2E_BASE_URL=https://fairytalefarms.net pnpm test:e2e
 */
const baseURL = process.env.E2E_BASE_URL || "http://localhost:3000";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  timeout: 30_000,
  expect: { timeout: 10_000 },

  use: {
    baseURL,
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    { name: "chromium", use: { ...devices["Desktop Chrome"] } },
    { name: "firefox", use: { ...devices["Desktop Firefox"] } },
    { name: "webkit", use: { ...devices["Desktop Safari"] } },
    { name: "mobile-chrome", use: { ...devices["Pixel 5"] } },
    { name: "mobile-safari", use: { ...devices["iPhone 12"] } },
  ],

  // Only auto-start a local server when targeting localhost.
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "pnpm dev",
        url: baseURL,
        env: { PORT: "3000", NODE_ENV: "development" },
        reuseExistingServer: !process.env.CI,
        timeout: 120_000,
      },
});
