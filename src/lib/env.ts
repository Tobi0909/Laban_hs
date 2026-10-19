import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  AUTH_SECRET: z.string().min(1),
  TEACHER_PASSWORD: z.string().min(1),
  UPSTASH_REDIS_REST_URL: z.string().url(),
  UPSTASH_REDIS_REST_TOKEN: z.string().min(1),
  // AI (chỉ dùng ở trang giáo viên — xem src/lib/ai/)
  AI_MODEL: z.string().min(1).default("anthropic/claude-sonnet-4-5"),
  AI_GATEWAY_API_KEY: z.string().min(1).optional(),
  ANTHROPIC_API_KEY: z.string().min(1).optional(),
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

// Netlify bundles proxy.ts (Edge middleware) by actually executing the
// compiled module to resolve its exports — a separate step from `next build`
// that never sets NEXT_PHASE and has no secrets injected at all. Detect that
// sandbox by checking that *every* required secret is absent (not just
// DATABASE_URL) — a genuinely misconfigured deployment normally has most
// variables set and only one missing/typo'd, so it still hits envSchema.parse
// below and fails loudly instead of silently falling back to raw,
// un-defaulted process.env.
const hasNoRealEnvAtAll =
  !process.env.DATABASE_URL &&
  !process.env.AUTH_SECRET &&
  !process.env.TEACHER_PASSWORD &&
  !process.env.UPSTASH_REDIS_REST_URL &&
  !process.env.CRON_SECRET;

export const env = isBuildPhase || hasNoRealEnvAtAll
  ? (process.env as unknown as z.infer<typeof envSchema>)
  : envSchema.parse(process.env);
