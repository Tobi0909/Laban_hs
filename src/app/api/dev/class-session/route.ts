import { NextResponse } from "next/server";
import { and, eq, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { classSessions } from "@/lib/db/schema";
import { getClassByJoinCode, getOpenClassSession } from "@/lib/auth/class-session";

/**
 * Route chỉ dùng cho Playwright e2e mở/đóng phiên lớp mà không cần đăng nhập
 * Google thật. Không tồn tại ở production (trả 404) — không thay thế luồng
 * mở/đóng phiên thật của giáo viên trong trang /teacher.
 */
export async function POST(request: Request) {
  if (process.env.NODE_ENV === "production") {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const { joinCode, action } = (await request.json()) as {
    joinCode: string;
    action: "open" | "close";
  };

  const classRow = await getClassByJoinCode(joinCode);
  if (!classRow) {
    return NextResponse.json({ error: "class not found" }, { status: 404 });
  }

  if (action === "open") {
    const existing = await getOpenClassSession(classRow.id);
    if (!existing) {
      await db.insert(classSessions).values({ classId: classRow.id, openedBy: classRow.teacherId });
    }
  } else {
    const existing = await db.query.classSessions.findFirst({
      where: and(eq(classSessions.classId, classRow.id), isNull(classSessions.closedAt)),
    });
    if (existing) {
      await db.update(classSessions).set({ closedAt: new Date() }).where(eq(classSessions.id, existing.id));
    }
  }

  return NextResponse.json({ ok: true });
}
