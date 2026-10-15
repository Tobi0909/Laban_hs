import type { NextAuthConfig } from "next-auth";
import Google from "next-auth/providers/google";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { teachers } from "@/lib/db/schema";
import { env } from "@/lib/env";

/**
 * Cấu hình Auth.js an toàn cho Edge Runtime (dùng trong middleware/proxy):
 * không import bất kỳ module nào cần node:crypto (xem auth.ts cho provider
 * Credentials đầy đủ, chỉ chạy ở Node runtime trong route handler).
 */
export const authConfig = {
  secret: env.AUTH_SECRET,
  // Luôn deploy sau 1 reverse proxy đáng tin (Vercel) — khai báo rõ để
  // tránh lỗi "UntrustedHost" tuỳ theo cách mỗi runtime (Node/Edge) tự
  // suy luận biến môi trường VERCEL.
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Google({
      clientId: env.AUTH_GOOGLE_ID,
      clientSecret: env.AUTH_GOOGLE_SECRET,
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google") {
        const email = user.email;
        if (!email) return false;
        const existing = await db.query.teachers.findFirst({ where: eq(teachers.email, email) });
        if (!existing) {
          await db.insert(teachers).values({ email, name: user.name ?? email });
        }
      }
      return true;
    },
    async jwt({ token, user, account }) {
      if (account?.provider === "google" && user?.email) {
        const teacher = await db.query.teachers.findFirst({ where: eq(teachers.email, user.email) });
        if (teacher) {
          token.role = "teacher";
          token.teacherId = teacher.id;
        }
      } else if (user && "role" in user && user.role === "student") {
        token.role = "student";
        token.studentId = user.id;
        token.classId = user.classId;
        token.avatarId = user.avatarId;
        token.name = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.role === "teacher") {
        session.user.role = "teacher";
        session.user.teacherId = token.teacherId as string;
      } else if (token.role === "student") {
        session.user.role = "student";
        session.user.studentId = token.studentId as string;
        session.user.classId = token.classId as string;
        session.user.avatarId = token.avatarId as string;
        session.user.name = token.name as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/teacher/login",
  },
} satisfies NextAuthConfig;
