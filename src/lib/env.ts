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

// Next.js imports route modules during "Collecting page data" at build time
// just to inspect their config, without ever invoking them. That import can
// reach this module before real secrets are available in the build
// environment (e.g. Netlify's production build step). Skip strict
// validation in that phase so the build doesn't fail for unused routes;
// real requests still go through full validation at runtime.
const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

export const env = isBuildPhase
  ? (process.env as unknown as z.infer<typeof envSchema>)
  : envSchema.parse(process.env);
