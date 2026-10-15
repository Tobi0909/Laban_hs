import "server-only";
import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { classes } from "@/lib/db/schema";

export class AuthError extends Error {}

export async function requireStudent() {
  const session = await auth();
  if (session?.user.role !== "student" || !session.user.studentId || !session.user.classId) {
    throw new AuthError("Cần đăng nhập học sinh.");
  }
  return {
    studentId: session.user.studentId,
    classId: session.user.classId,
    displayName: session.user.name ?? "",
    avatarId: session.user.avatarId ?? "",
  };
}

/**
 * Bắt buộc là giáo viên. Nếu truyền classId, kiểm tra thêm lớp đó thuộc
 * đúng giáo viên đang đăng nhập.
 */
export async function requireTeacher(classId?: string) {
  const session = await auth();
  if (session?.user.role !== "teacher" || !session.user.teacherId) {
    throw new AuthError("Cần đăng nhập giáo viên.");
  }
  const teacherId = session.user.teacherId;

  if (classId) {
    const classRow = await db.query.classes.findFirst({ where: eq(classes.id, classId) });
    if (!classRow || classRow.teacherId !== teacherId) {
      throw new AuthError("Không có quyền trên lớp này.");
    }
  }

  return { teacherId };
}
