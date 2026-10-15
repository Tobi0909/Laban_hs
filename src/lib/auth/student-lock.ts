import { redis } from "@/lib/redis";

const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_SECONDS = 10 * 60;

function key(studentId: string) {
  return `student-lock:${studentId}`;
}

export async function isStudentLocked(studentId: string): Promise<boolean> {
  const count = await redis.get<number>(key(studentId));
  return (count ?? 0) >= MAX_ATTEMPTS;
}

/** Ghi nhận 1 lần đoán sai; khoá tạm sau 5 lần sai liên tiếp trong 10 phút. */
export async function recordFailedAttempt(studentId: string): Promise<{ locked: boolean; remaining: number }> {
  const count = await redis.incr(key(studentId));
  if (count === 1) {
    await redis.expire(key(studentId), LOCK_WINDOW_SECONDS);
  }
  const locked = count >= MAX_ATTEMPTS;
  return { locked, remaining: Math.max(0, MAX_ATTEMPTS - count) };
}

export async function clearFailedAttempts(studentId: string): Promise<void> {
  await redis.del(key(studentId));
}
