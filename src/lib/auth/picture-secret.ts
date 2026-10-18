import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { env } from "@/lib/env";
import type { IconId } from "@/components/kid/icons";

/** So khớp 2 chuỗi hex không lộ timing side-channel; khác độ dài coi như không khớp. */
function timingSafeEqualHex(a: string, b: string): boolean {
  const bufA = Buffer.from(a, "hex");
  const bufB = Buffer.from(b, "hex");
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

/** Băm thứ tự 2 hình bí mật của học sinh (HMAC, khoá = AUTH_SECRET). */
export function hashPictureSecret(studentId: string, picks: IconId[]): string {
  return createHmac("sha256", env.AUTH_SECRET).update(`${studentId}:${picks.join(",")}`).digest("hex");
}

export function verifyPictureSecret(studentId: string, picks: IconId[], hash: string): boolean {
  return timingSafeEqualHex(hashPictureSecret(studentId, picks), hash);
}

export function generateQrToken(): string {
  return randomBytes(16).toString("hex");
}

export function hashQrToken(token: string): string {
  return createHmac("sha256", env.AUTH_SECRET).update(token).digest("hex");
}

export function verifyQrToken(token: string, hash: string): boolean {
  return timingSafeEqualHex(hashQrToken(token), hash);
}
