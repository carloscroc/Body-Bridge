import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests",
  // Increase test timeout to allow slower machines and CI environments
  timeout: 60_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: 1,
  reporter: "html",
  use: {
    baseURL: "http://localhost:7770",
    trace: "on-first-retry",
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  /* Start the Vite dev server before running tests */
  webServer: {
    command: "npm run dev",
    url: "http://localhost:7770",
    reuseExistingServer: true,
    // Increase web server startup timeout
    timeout: 120_000,
  },
});
