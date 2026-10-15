import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

const PAGES = ["/dev/learn-preview", "/dev/journal-preview", "/", "/teacher/login"];

test.describe("Kiểm tra a11y (axe) — không có lỗi nghiêm trọng", () => {
  for (const path of PAGES) {
    test(`axe: ${path}`, async ({ page }) => {
      await page.goto(path);
      const results = await new AxeBuilder({ page }).analyze();

      const serious = results.violations.filter((v) => v.impact === "serious" || v.impact === "critical");
      if (serious.length > 0) {
        console.log(JSON.stringify(serious, null, 2));
      }
      expect(serious).toEqual([]);
    });
  }
});
