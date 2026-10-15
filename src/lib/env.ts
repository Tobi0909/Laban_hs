import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  AUTH_GOOGLE_ID: z.string().min(1),
  AUTH_GOOGLE_SECRET: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  BLOB_READ_WRITE_TOKEN: z.string().min(1),
  // AI (chỉ dùng ở trang giáo viên — xem src/lib/ai/)
  AI_MODEL: z.string().min(1).default("anthropic/claude-sonnet-4-5"),
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
  // TTS (sinh audio cho bài đã duyệt — xem src/lib/tts/)
  TTS_PROVIDER: z.enum(["mock", "http"]).default("mock"),
  TTS_API_KEY: z.string().min(1).optional(),
  TTS_API_URL: z.string().url().optional(),
  // Dọn dữ liệu quá hạn lưu trữ (xem vercel.json + /api/cron/cleanup)
  CRON_SECRET: z.string().min(1),
  RETENTION_DAYS: z.coerce.number().int().positive().default(180),
});

export const env = envSchema.parse(process.env);
