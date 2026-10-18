import { timingSafeEqual } from "node:crypto";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { consumeLoginTicket } from "@/lib/auth/login-ticket";
import {
  isTeacherLoginLocked,
  recordFailedTeacherLogin,
  clearFailedTeacherLogins,
} from "@/lib/auth/teacher-login-lock";

/** So khớp 2 chuỗi không lộ timing side-channel; khác độ dài coi như không khớp. */
function timingSafeEqualString(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Lấy IP nguồn để khoá tạm sau nhiều lần sai — Vercel/most proxy đặt sẵn header này. */
function clientIpFrom(request: Request | undefined): string {
  const forwardedFor = request?.headers.get("x-forwarded-for");
  return forwardedFor?.split(",")[0]?.trim() || "unknown";
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "teacher",
      name: "Giáo viên",
      credentials: { password: { label: "password", type: "password" } },
      async authorize(credentials, request) {
        const ip = clientIpFrom(request);
        if (await isTeacherLoginLocked(ip)) return null;

        const password = typeof credentials?.password === "string" ? credentials.password : null;
        if (!password || !timingSafeEqualString(password, env.TEACHER_PASSWORD)) {
          await recordFailedTeacherLogin(ip);
          return null;
        }
        await clearFailedTeacherLogins(ip);

        let teacher = await db.query.teachers.findFirst();
        if (!teacher) {
          [teacher] = await db
            .insert(teachers)
            .values({ email: "giaovien@local", name: "Giáo viên" })
            .returning();
        }

        return { id: teacher.id, name: teacher.name, role: "teacher" as const };
      },
    }),
    Credentials({
      id: "student",
      name: "Học sinh",
      credentials: { ticket: { label: "ticket", type: "text" } },
      async authorize(credentials) {
        const ticket = typeof credentials?.ticket === "string" ? credentials.ticket : null;
        if (!ticket) return null;
        const studentId = await consumeLoginTicket(ticket);
        if (!studentId) return null;

        const student = await db.query.students.findFirst({
          where: (s, { eq: eqOp }) => eqOp(s.id, studentId),
        });
        if (!student) return null;

        return {
          id: student.id,
          name: student.displayName,
          role: "student" as const,
          classId: student.classId,
          avatarId: student.avatarId,
        };
      },
    }),
  ],
});
