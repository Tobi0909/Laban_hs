import "server-only";
import { env } from "@/lib/env";
import type { TtsProvider } from "./types";
import { MockTtsProvider } from "./providers/mock";
import { HttpTtsProvider } from "./providers/http";

let cached: TtsProvider | null = null;

export function getTtsProvider(): TtsProvider {
  if (cached) return cached;

  if (env.TTS_PROVIDER === "http") {
    if (!env.TTS_API_URL || !env.TTS_API_KEY) {
      throw new Error("TTS_PROVIDER=http cần TTS_API_URL và TTS_API_KEY.");
    }
    cached = new HttpTtsProvider(env.TTS_API_URL, env.TTS_API_KEY);
  } else {
    cached = new MockTtsProvider();
  }
  return cached;
}
