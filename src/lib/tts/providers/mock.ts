import type { TtsProvider, TtsResult } from "../types";

/**
 * Provider dự phòng khi chưa cấu hình TTS_PROVIDER thật (dev/demo). Sinh ra
 * 1 file WAV hợp lệ (im lặng, độ dài tỉ lệ theo số từ) để toàn bộ luồng
 * lưu Blob + phát lại hoạt động đúng kiến trúc, không phải audio thật.
 */
function buildSilentWav(durationSeconds: number): Buffer {
  const sampleRate = 8000;
  const numSamples = Math.max(1, Math.floor(sampleRate * durationSeconds));
  const dataSize = numSamples * 2; // 16-bit mono
  const buffer = Buffer.alloc(44 + dataSize);

  buffer.write("RIFF", 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write("WAVE", 8);
  buffer.write("fmt ", 12);
  buffer.writeUInt32LE(16, 16);
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write("data", 36);
  buffer.writeUInt32LE(dataSize, 40);
  // Phần dữ liệu còn lại đã là 0 (im lặng) do Buffer.alloc.

  return buffer;
}

export class MockTtsProvider implements TtsProvider {
  async synthesize(text: string): Promise<TtsResult> {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    const durationSeconds = Math.min(6, Math.max(0.6, words * 0.35));
    return {
      audio: buildSilentWav(durationSeconds),
      contentType: "audio/wav",
      extension: "wav",
    };
  }
}
