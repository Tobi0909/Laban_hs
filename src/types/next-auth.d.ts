import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      role?: "teacher" | "student";
      teacherId?: string;
      studentId?: string;
      classId?: string;
      avatarId?: string;
    };
  }

  interface User {
    role?: "teacher" | "student";
    classId?: string;
    avatarId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: "teacher" | "student";
    teacherId?: string;
    studentId?: string;
    classId?: string;
    avatarId?: string;
  }
}
