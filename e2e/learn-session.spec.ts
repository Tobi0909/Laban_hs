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

async function answerConfidenceScreen(page: Page) {
  // Màn 1: chọn 1 trong 3 mức tự tin, rồi bỏ qua thẻ "vì sao".
  await page.getByRole("button", { name: "Em nghĩ em làm được" }).click();
  await page.getByText("Bỏ qua").click();
}

async function answerTaskScreen(page: Page, digits: string) {
  // 3 bài đầu của phiên (xem select-session-tasks.ts) là dạng "number".
  for (const d of digits) {
    await page.getByRole("button", { name: d, exact: true }).click();
  }
  await page.getByRole("button", { name: "Xong" }).click();
}

async function passReflectionAndNextStep(page: Page) {
  // Màn 3: nếu có mẫu câu phản tư thì chọn thẻ đầu tiên, nếu không thì bỏ qua.
  await page.waitForTimeout(200);
  const skip = page.getByText("Bỏ qua");
  if (await skip.isVisible().catch(() => false)) {
    await skip.click();
  } else {
    await page.getByRole("button").first().click();
  }

  // Màn 4: luôn chọn "Luyện thêm" để bỏ qua phần xem nội dung ví dụ/cách làm.
  await page.getByRole("button", { name: "Luyện thêm" }).click();
}

test.describe("Luồng học trọn 1 phiên", () => {
  test.beforeEach(async ({ page }) => {
    await setClassSession(page, "open");
  });

  test.afterEach(async ({ page }) => {
    await setClassSession(page, "close");
  });

  test("học sinh làm trọn phiên học và thấy màn chúc mừng", async ({ page }) => {
    await loginAsBin(page);

    await page.getByRole("link", { name: /Bắt đầu học/ }).click();
    await expect(page).toHaveURL(/\/learn\//);

    // 3 bài "number" đầu tiên theo thứ tự xen kẽ độ khó: 27+6=33, 46+27=73, 76+48=124.
    for (const digits of ["33", "73", "124"]) {
      await answerConfidenceScreen(page);
      await answerTaskScreen(page, digits);
      await passReflectionAndNextStep(page);
    }

    // Bài thứ 4: pick_image "9 + 4" → chọn đáp án 13.
    await answerConfidenceScreen(page);
    await page.getByRole("button", { name: "13", exact: true }).click();
    await passReflectionAndNextStep(page);

    // Bài thứ 5: drag_drop — kéo "5" vào Hàng chục, "8" vào Hàng đơn vị.
    await answerConfidenceScreen(page);
    const chip5 = page.getByRole("button", { name: "5", exact: true });
    const chip8 = page.getByRole("button", { name: "8", exact: true });
    const boxChuc = page.getByText("Hàng chục");
    const boxDonvi = page.getByText("Hàng đơn vị");

    await chip5.dragTo(boxChuc);
    await chip8.dragTo(boxDonvi);
    await page.getByRole("button", { name: "Nộp bài" }).click();
    await passReflectionAndNextStep(page);

    await expect(page.getByText("Em học giỏi quá!")).toBeVisible({ timeout: 10_000 });
    await expect(page.getByRole("link", { name: "Về lớp học" })).toBeVisible();
  });
});
