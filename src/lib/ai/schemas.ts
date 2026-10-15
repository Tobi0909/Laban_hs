import { z } from "zod";
import { MISTAKE_TAGS } from "@/lib/learning/types";

export const SUGGEST_KINDS = ["distractors", "steps", "reflections", "simplify"] as const;
export type SuggestKind = (typeof SUGGEST_KINDS)[number];

export const distractorsInputSchema = z.object({
  kind: z.literal("distractors"),
  prompt: z.string().min(1),
  correctAnswerDescription: z.string().min(1),
  grade: z.number().int().min(1).max(5),
});

export const stepsInputSchema = z.object({
  kind: z.literal("steps"),
  prompt: z.string().min(1),
  correctAnswerDescription: z.string().min(1),
  grade: z.number().int().min(1).max(5),
});

export const reflectionsInputSchema = z.object({
  kind: z.literal("reflections"),
  topicTitle: z.string().min(1),
  grade: z.number().int().min(1).max(5),
});

export const simplifyInputSchema = z.object({
  kind: z.literal("simplify"),
  text: z.string().min(1),
  grade: z.number().int().min(1).max(5),
});

export const suggestInputSchema = z.discriminatedUnion("kind", [
  distractorsInputSchema,
  stepsInputSchema,
  reflectionsInputSchema,
  simplifyInputSchema,
]);
export type SuggestInput = z.infer<typeof suggestInputSchema>;

export const distractorsOutputSchema = z.object({
  distractors: z
    .array(
      z.object({
        text: z.string().min(1),
        mistake_tag: z.enum(MISTAKE_TAGS),
        why: z.string().min(1),
      }),
    )
    .length(3),
});

export const stepsOutputSchema = z.object({
  steps: z.array(z.object({ text: z.string().min(1) })).min(2).max(6),
  worked_example: z.array(z.object({ text: z.string().min(1) })).min(2).max(6),
});

export const reflectionsOutputSchema = z.object({
  reflections: z
    .array(
      z.object({
        calibration: z.enum(["match", "over", "under"]),
        question: z.string().min(1),
        choices: z.array(z.object({ text: z.string().min(1) })).min(2).max(3),
      }),
    )
    .length(3),
});

export const simplifyOutputSchema = z.object({
  text: z.string().min(1),
});

export function outputSchemaFor(kind: SuggestKind) {
  switch (kind) {
    case "distractors":
      return distractorsOutputSchema;
    case "steps":
      return stepsOutputSchema;
    case "reflections":
      return reflectionsOutputSchema;
    case "simplify":
      return simplifyOutputSchema;
  }
}

/**
 * System prompt dùng chung cho mọi lời gọi AI soạn bài (chỉ trang giáo
 * viên). Không bao giờ nhận dữ liệu học sinh trong prompt — chỉ nội dung
 * bài học (đề bài, mô tả đáp án, chủ đề, khối lớp).
 */
export const AUTHOR_SYSTEM_PROMPT = `Bạn hỗ trợ giáo viên tiểu học Việt Nam soạn nội dung học tập theo Chương trình GDPT 2018.
Quy tắc bắt buộc:
- Câu dưới 12 từ nếu dành cho lớp 1–2, dưới 20 từ nếu dành cho lớp 3–5.
- Luôn xưng "em" khi nói với học sinh, giọng ấm áp, rõ ràng.
- Không bao giờ khen hay chê năng lực học sinh (không dùng từ như "giỏi nhất", "dốt", "kém").
- Câu phản tư (reflection) không được tiết lộ đáp án đúng.
- Không dùng tên thương hiệu, nhân vật có bản quyền, hoặc nội dung đáng sợ/bạo lực.
- Chỉ trả lời đúng theo schema JSON được yêu cầu, không thêm giải thích ngoài schema.`;

function buildPrompt(input: SuggestInput): string {
  switch (input.kind) {
    case "distractors":
      return `Đề bài: "${input.prompt}"
Mô tả đáp án đúng: "${input.correctAnswerDescription}"
Khối lớp: ${input.grade}
Hãy đề xuất đúng 3 đáp án nhiễu (sai nhưng hợp lý với lỗi học sinh hay mắc), mỗi đáp án gắn 1 mistake_tag phù hợp nhất (quen_nho = quên nhớ 1 chục, nham_hang_chuc = nhầm hàng chục/đơn vị, doan_lung_tung = đoán số lung tung) và giải thích ngắn (why) vì sao học sinh có thể nghĩ vậy.`;
    case "steps":
      return `Đề bài: "${input.prompt}"
Mô tả đáp án đúng: "${input.correctAnswerDescription}"
Khối lớp: ${input.grade}
Hãy viết các bước giải ngắn gọn (steps) để học sinh sắp xếp lại (StepCards), và một ví dụ đã giải đầy đủ (worked_example) theo đúng các bước đó.`;
    case "reflections":
      return `Chủ đề: "${input.topicTitle}"
Khối lớp: ${input.grade}
Hãy soạn đúng 3 câu phản tư, mỗi câu ứng với 1 trong 3 mức: match (dự đoán đúng về bản thân), over (tự tin nhưng làm sai), under (ít tự tin nhưng làm đúng). Mỗi câu kèm 2-3 thẻ trả lời ngắn cho học sinh chọn.`;
    case "simplify":
      return `Viết lại câu sau cho phù hợp với học sinh lớp ${input.grade}, giữ nguyên ý nghĩa, ngắn gọn dễ hiểu hơn: "${input.text}"`;
  }
}

export { buildPrompt };
