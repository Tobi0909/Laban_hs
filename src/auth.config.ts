import type { NextAuthConfig } from "next-auth";
import { env } from "@/lib/env";

/**
 * Cấu hình Auth.js an toàn cho Edge Runtime (dùng trong middleware/proxy):
 * không import bất kỳ module nào cần node:crypto hay truy cập DB (xem
 * auth.ts cho các provider Credentials đầy đủ, chỉ chạy ở Node runtime
 * trong route handler).
 */
export const authConfig = {
  secret: env.AUTH_SECRET,
  // Luôn deploy sau 1 reverse proxy đáng tin (Vercel) — khai báo rõ để
  // tránh lỗi "UntrustedHost" tuỳ theo cách mỗi runtime (Node/Edge) tự
  // suy luận biến môi trường VERCEL.
  trustHost: true,
  // Mặc định Auth.js hết phiên sau 30 ngày — tăng lên 90 ngày vì giáo viên/
  // học sinh thường dùng chung 1 thiết bị lâu dài, không muốn đăng nhập lại
  // thường xuyên.
  session: { strategy: "jwt", maxAge: 90 * 24 * 60 * 60 },
  jwt: { maxAge: 90 * 24 * 60 * 60 },
  providers: [],
  callbacks: {
    async jwt({ token, user, account }) {
      if (account?.provider === "teacher" && user?.id) {
        token.role = "teacher";
        token.teacherId = user.id;
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
