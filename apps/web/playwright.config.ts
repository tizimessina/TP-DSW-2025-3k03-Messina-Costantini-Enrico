import { defineConfig, devices } from "@playwright/test";

/**
 * Tests end-to-end. Levanta backend (3000) y frontend (5173) si no están corriendo.
 * Requiere la base local migrada y con el seed cargado (`pnpm db:migrate && pnpm db:seed`).
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 60_000,
  expect: { timeout: 10_000 },
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never", outputFolder: "playwright-report" }]],
  use: {
    baseURL: "http://localhost:5173",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    locale: "es-AR",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: [
    {
      command: "pnpm --filter server dev",
      cwd: "../..",
      url: "http://localhost:3000/health",
      reuseExistingServer: true,
      timeout: 90_000,
    },
    {
      command: "pnpm dev",
      url: "http://localhost:5173",
      reuseExistingServer: true,
      timeout: 90_000,
    },
  ],
});
