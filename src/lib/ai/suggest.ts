import "server-only";
import { generateObject, gateway } from "ai";
import { env } from "@/lib/env";
import {
  AUTHOR_SYSTEM_PROMPT,
  buildPrompt,
  outputSchemaFor,
  type SuggestInput,
} from "./schemas";

/**
 * Gọi AI Gateway để soạn gợi ý nội dung bài học. CHỈ dùng ở trang giáo
 * viên — prompt chỉ chứa nội dung bài học (đề bài/chủ đề/khối lớp), không
 * bao giờ chứa dữ liệu học sinh (tên, lớp, kết quả làm bài...).
 */
export async function requestAuthorSuggestion(input: SuggestInput) {
  const schema = outputSchemaFor(input.kind);
  const { object } = await generateObject({
    model: gateway(env.AI_MODEL),
    system: AUTHOR_SYSTEM_PROMPT,
    prompt: buildPrompt(input),
    schema,
  });
  return object;
}
