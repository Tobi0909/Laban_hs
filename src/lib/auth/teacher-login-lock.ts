import { redis } from "@/lib/redis";

const MAX_ATTEMPTS = 5;
const LOCK_WINDOW_SECONDS = 10 * 60;

function key(ip: string) {
  return `teacher-login-lock:${ip}`;
}

/** Cùng cơ chế khoá tạm với học sinh (student-lock.ts), nhưng khoá theo IP vì
 * TEACHER_PASSWORD dùng chung cho mọi giáo viên, không có user id để khoá theo. */
export async function isTeacherLoginLocked(ip: string): Promise<boolean> {
  const count = await redis.get<number>(key(ip));
  return (count ?? 0) >= MAX_ATTEMPTS;
}

export async function recordFailedTeacherLogin(ip: string): Promise<void> {
  const count = await redis.incr(key(ip));
  if (count === 1) {
    await redis.expire(key(ip), LOCK_WINDOW_SECONDS);
  }
}

export async function clearFailedTeacherLogins(ip: string): Promise<void> {
  await redis.del(key(ip));
}
