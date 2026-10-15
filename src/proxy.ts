import NextAuth from "next-auth";
import { NextResponse } from "next/server";
import { authConfig } from "@/auth.config";

// 'unsafe-eval' chỉ bật ở dev vì React dev mode cần eval() để dựng lại call
// stack khi debug (next dev / Turbopack HMR) — production không dùng eval().
const DEV_SCRIPT_SRC = process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'";

// Audio bài học (TTS) được lưu trên Vercel Blob — domain công khai dạng
// *.public.blob.vercel-storage.com, không cùng origin với app.
const BLOB_HOST = "https://*.public.blob.vercel-storage.com";

const CSP = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${DEV_SCRIPT_SRC}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self'",
  `connect-src 'self' ${BLOB_HOST}`,
  `media-src 'self' blob: ${BLOB_HOST}`,
  "worker-src 'self'",
  "manifest-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "frame-ancestors 'none'",
].join("; ");

const { auth } = NextAuth(authConfig);

export default auth((req) => {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/teacher") && pathname !== "/teacher/login") {
    if (req.auth?.user.role !== "teacher") {
      const loginUrl = new URL("/teacher/login", req.nextUrl.origin);
      return NextResponse.redirect(loginUrl);
    }
  }

  const res = NextResponse.next();
  res.headers.set("Content-Security-Policy", CSP);
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  return res;
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
