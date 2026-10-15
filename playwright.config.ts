import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: true,
    timeout: 60_000,
  },
  use: {
    baseURL: "http://localhost:3000",
  },
  projects: [
    {
      name: "tablet-landscape",
      testIgnore: /accessibility\.spec\.ts/,
      use: { ...devices["iPad (gen 7) landscape"] },
    },
    {
      // Riêng cho accessibility.spec.ts: dùng Chromium (không cần cài thêm
      // thư viện hệ thống như WebKit) để chạy axe-core ổn định ở mọi môi
      // trường CI/sandbox.
      name: "a11y-chromium",
      testMatch: /accessibility\.spec\.ts/,
      use: { ...devices["iPad (gen 7) landscape"], browserName: "chromium" },
    },
  ],
});
