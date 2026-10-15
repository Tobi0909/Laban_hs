import { NextResponse } from "next/server";
import { z } from "zod";
import { requireStudent } from "@/lib/auth/guards";
import { submitAnswerCore, type SubmitAnswerResult } from "@/lib/learning/submit-answer";

const answerValueSchema = z.union([
  z.object({ type: z.literal("pick_image"), optionId: z.string() }),
  z.object({ type: z.literal("drag_drop"), mapping: z.record(z.string(), z.string()) }),
  z.object({ type: z.literal("number"), value: z.number() }),
  z.object({ type: z.literal("true_false"), value: z.boolean() }),
  z.object({ type: z.literal("order_steps"), order: z.array(z.string()) }),
]);

const queueItemSchema = z.object({
  sessionId: z.string().uuid(),
  taskId: z.string().uuid(),
  confidence: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  reasonCard: z.string().nullable(),
  answer: answerValueSchema,
  clientId: z.string().min(1),
});

const bodySchema = z.object({ items: z.array(queueItemSchema).min(1).max(20) });

/**
 * Đồng bộ lại các lượt làm bài đã xếp hàng trong IndexedDB khi học sinh mất
 * mạng giữa phiên. Idempotent theo `clientId` — gửi lại cùng 1 clientId
 * nhiều lần (reload trang, retry) không tạo thêm attempt mới.
 */
export async function POST(request: Request) {
  let studentId: string;
  try {
    ({ studentId } = await requireStudent());
  } catch {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_input" }, { status: 400 });
  }

  const results: Record<string, SubmitAnswerResult | { error: string }> = {};
  for (const item of parsed.data.items) {
    try {
      results[item.clientId] = await submitAnswerCore(studentId, item);
    } catch (error) {
      results[item.clientId] = { error: error instanceof Error ? error.message : "sync_failed" };
    }
  }

  return NextResponse.json({ results });
}
