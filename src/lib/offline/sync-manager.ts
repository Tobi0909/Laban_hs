import { getPendingAttempts, removePendingAttempt } from "./queue";
import type { SubmitAnswerResult } from "@/lib/learning/submit-answer";

/** Phiên đăng nhập học sinh đã hết/không hợp lệ — khác với mất mạng thật,
 * thử lại sẽ không bao giờ tự khỏi nên cần báo cho người dùng đăng nhập lại. */
export class SessionExpiredError extends Error {}

/**
 * Gửi lại toàn bộ lượt làm bài đang xếp hàng trong IndexedDB lên
 * POST /api/sync (idempotent theo clientId). Trả về kết quả của các
 * clientId đồng bộ thành công; các mục thất bại vẫn nằm trong hàng đợi để
 * thử lại sau.
 */
export async function trySyncQueue(): Promise<Record<string, SubmitAnswerResult>> {
  const items = await getPendingAttempts();
  if (items.length === 0) return {};

  const response = await fetch("/api/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ items }),
  });
  if (response.status === 401) throw new SessionExpiredError("unauthorized");
  if (!response.ok) throw new Error("sync_failed");

  const { results } = (await response.json()) as {
    results: Record<string, SubmitAnswerResult | { error: string }>;
  };

  const succeeded: Record<string, SubmitAnswerResult> = {};
  for (const item of items) {
    const result = results[item.clientId];
    if (result && !("error" in result)) {
      succeeded[item.clientId] = result;
      await removePendingAttempt(item.clientId);
    }
  }
  return succeeded;
}
