import { test, expect, type Page } from "@playwright/test";

const JOIN_CODE = "2A2026";
const STUDENT_NAME = "Bin";
// Phải khớp logic sinh mật khẩu hình trong src/lib/db/seed.ts cho học sinh đầu tiên (i = 0):
// pick1 = ICON_IDS[0] = "sun" (Mặt trời), pick2 = ICON_IDS[3] = "boat" (Thuyền).
const PICK_1_LABEL = "Mặt trời";
const PICK_2_LABEL = "Thuyền";

async function setClassSession(page: Page, action: "open" | "close") {
  const response = await page.request.post("/api/dev/class-session", {
    data: { joinCode: JOIN_CODE, action },
  });
  expect(response.ok()).toBeTruthy();
}

test.describe("Luồng đăng nhập học sinh", () => {
  test("học sinh vào lớp bằng avatar + 2 hình bí mật trong dưới 30 giây", async ({ page }) => {
    await setClassSession(page, "open");
    const start = Date.now();

    await page.goto(`/c/${JOIN_CODE}`);
    await page.getByRole("button", { name: STUDENT_NAME }).click();
    await page.getByRole("button", { name: PICK_1_LABEL }).click();
    await page.getByRole("button", { name: PICK_2_LABEL }).click();

    await expect(page).toHaveURL(/\/s$/, { timeout: 15_000 });
    await expect(page.getByText(STUDENT_NAME)).toBeVisible();

    const elapsedSeconds = (Date.now() - start) / 1000;
    expect(elapsedSeconds).toBeLessThan(30);

    await setClassSession(page, "close");
  });

  test("không đăng nhập được khi phiên lớp đang đóng", async ({ page }) => {
    await setClassSession(page, "close");

    await page.goto(`/c/${JOIN_CODE}`);

    await expect(page.getByText("chưa mở")).toBeVisible();
    await expect(page.getByRole("button", { name: STUDENT_NAME })).not.toBeVisible();
  });

  test("đoán sai 2 hình thì báo chưa đúng, không vào được", async ({ page }) => {
    await setClassSession(page, "open");

    await page.goto(`/c/${JOIN_CODE}`);
    await page.getByRole("button", { name: STUDENT_NAME }).click();
    await page.getByRole("button", { name: "Ngôi sao" }).click();
    await page.getByRole("button", { name: "Quả táo" }).click();

    await expect(page.getByText("Chưa đúng")).toBeVisible();
    await expect(page).not.toHaveURL(/\/s$/);

    await setClassSession(page, "close");
  });
});
