import type { TtsProvider, TtsResult } from "../types";

/**
 * Provider tổng quát gọi 1 HTTP TTS API bất kỳ (ElevenLabs, Azure, Google...)
 * qua cấu hình TTS_API_URL/TTS_API_KEY — đổi nhà cung cấp chỉ cần đổi biến
 * môi trường, không cần sửa code gọi TTS trong app.
 */
export class HttpTtsProvider implements TtsProvider {
  constructor(
    private readonly apiUrl: string,
    private readonly apiKey: string,
  ) {}

  async synthesize(text: string): Promise<TtsResult> {
    const response = await fetch(this.apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({ text, lang: "vi-VN", format: "mp3" }),
    });

    if (!response.ok) {
      throw new Error(`TTS API lỗi ${response.status}: ${await response.text().catch(() => "")}`);
    }

    const contentType = response.headers.get("content-type") ?? "audio/mpeg";
    const audio = Buffer.from(await response.arrayBuffer());
    const extension = contentType.includes("wav") ? "wav" : "mp3";
    return { audio, contentType, extension };
  }
}
