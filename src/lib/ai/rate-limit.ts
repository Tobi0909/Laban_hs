import { Ratelimit } from "@upstash/ratelimit";
import { redis } from "@/lib/redis";

/** Giới hạn gọi AI soạn bài: 20 lần / 10 phút cho mỗi giáo viên. */
const ratelimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(20, "10 m"),
  prefix: "ai-suggest",
});

export async function checkAiRateLimit(teacherId: string): Promise<{ allowed: boolean; remaining: number }> {
  const { success, remaining } = await ratelimit.limit(teacherId);
  return { allowed: success, remaining };
}
