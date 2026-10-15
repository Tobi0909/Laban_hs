import { NextResponse } from "next/server";
import { lt } from "drizzle-orm";
import { db } from "@/lib/db";
import { sessions } from "@/lib/db/schema";
import { env } from "@/lib/env";

/**
 * Vercel Cron gọi route này (xem vercel.json) để xoá dữ liệu lượt học quá
 * hạn lưu trữ (RETENTION_DAYS). Xoá bản ghi `sessions` quá hạn sẽ cascade
 * xoá luôn attempts/reflections/next_steps liên quan (xem schema).
 */
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.CRON_SECRET}`) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const cutoff = new Date(Date.now() - env.RETENTION_DAYS * 24 * 60 * 60 * 1000);
  const deleted = await db.delete(sessions).where(lt(sessions.startedAt, cutoff)).returning({ id: sessions.id });

  return NextResponse.json({ deletedSessions: deleted.length, cutoff: cutoff.toISOString() });
}
