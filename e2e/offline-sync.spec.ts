import { test, expect, type Page } from "@playwright/test";

const JOIN_CODE = "2A2026";
const STUDENT_NAME = "Bin";
const PICK_1_LABEL = "Mặt trời";
const PICK_2_LABEL = "Thuyền";

async function setClassSession(page: Page, action: "open" | "close") {
  const response = await page.request.post("/api/dev/class-session", {
    data: { joinCode: JOIN_CODE, action },
  });
  expect(response.ok()).toBeTruthy();
}

async function loginAsBin(page: Page) {
  await page.goto(`/c/${JOIN_CODE}`);
  await page.getByRole("button", { name: STUDENT_NAME }).click();
  await page.getByRole("button", { name: PICK_1_LABEL }).click();
  await page.getByRole("button", { name: PICK_2_LABEL }).click();
  await expect(page).toHaveURL(/\/s$/, { timeout: 15_000 });
}

test.describe("Mất mạng giữa phiên không mất bài", () => {
  test.beforeEach(async ({ page }) => {
    await setClassSession(page, "open");
  });

  test.afterEach(async ({ page }) => {
    await setClassSession(page, "close");
  });

  test("nộp bài khi mất mạng → lưu tạm IndexedDB → tự gửi lại khi có mạng", async ({ page, context }) => {
    await loginAsBin(page);
    await page.getByRole("link", { name: /Bắt đầu học/ }).click();
    await expect(page).toHaveURL(/\/learn\//);

    // Màn 1: chọn mức tự tin, bỏ qua thẻ "vì sao".
    await page.getByRole("button", { name: "Em nghĩ em làm được" }).click();
    await page.getByText("Bỏ qua").click();

    // Mất mạng NGAY TRƯỚC khi nộp bài đầu tiên (27 + 6 = 33).
    await context.setOffline(true);

    for (const d of "33") {
      await page.getByRole("button", { name: d, exact: true }).click();
    }
    await page.getByRole("button", { name: "Xong" }).click();

    // Không có mạng: bài được lưu tạm, không báo lỗi làm trẻ hoảng,
    // không nhảy thẳng sang màn phản tư (chưa có kết quả thật để hiện).
    await expect(page.getByText("Kim đang giữ bài của em")).toBeVisible({ timeout: 10_000 });

    // Có mạng lại: hàng đợi IndexedDB tự gửi, màn phản tư xuất hiện bình
    // thường — bài làm không bị mất.
    await context.setOffline(false);
    await expect(page.getByText(/Em làm đúng rồi!|Chưa đúng, mình cùng xem lại nhé/)).toBeVisible({
      timeout: 20_000,
    });
  });
});
