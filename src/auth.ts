import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { authConfig } from "@/auth.config";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { env } from "@/lib/env";
import { consumeLoginTicket } from "@/lib/auth/login-ticket";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    ...authConfig.providers,
    Credentials({
      id: "teacher",
      name: "Giáo viên",
      credentials: { password: { label: "password", type: "password" } },
      async authorize(credentials) {
        const password = typeof credentials?.password === "string" ? credentials.password : null;
        if (!password || password !== env.TEACHER_PASSWORD) return null;

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
