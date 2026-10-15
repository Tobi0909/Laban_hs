import "server-only";
import { put } from "@vercel/blob";
import { env } from "@/lib/env";
import { getTtsProvider } from "./adapter";

export type { TtsProvider, TtsResult } from "./types";

/** Sinh audio tiếng Việt cho 1 câu và lưu vào Vercel Blob, trả về URL công khai. */
export async function synthesizeAndUpload(text: string, pathHint: string): Promise<string> {
  const provider = getTtsProvider();
  const { audio, contentType, extension } = await provider.synthesize(text);

  const blob = await put(`audio/${pathHint}.${extension}`, audio, {
    access: "public",
    contentType,
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true,
  });

  return blob.url;
}

/** Lưu trực tiếp 1 file giáo viên tự ghi âm (bỏ qua TTS). */
export async function uploadReplacementAudio(
  file: Buffer,
  contentType: string,
  pathHint: string,
): Promise<string> {
  const extension = contentType.includes("wav") ? "wav" : contentType.includes("mpeg") ? "mp3" : "audio";
  const blob = await put(`audio/${pathHint}.${extension}`, file, {
    access: "public",
    contentType,
    token: env.BLOB_READ_WRITE_TOKEN,
    addRandomSuffix: true,
  });
  return blob.url;
}
