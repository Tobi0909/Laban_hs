import { describe, expect, it } from "vitest";
import {
  distractorsOutputSchema,
  reflectionsOutputSchema,
  simplifyOutputSchema,
  stepsOutputSchema,
  suggestInputSchema,
} from "./schemas";

describe("suggestInputSchema", () => {
  it("chấp nhận input distractors hợp lệ", () => {
    const result = suggestInputSchema.safeParse({
      kind: "distractors",
      prompt: "27 + 6 = ?",
      correctAnswerDescription: "33",
      grade: 2,
    });
    expect(result.success).toBe(true);
  });

  it("từ chối kind không hợp lệ", () => {
    const result = suggestInputSchema.safeParse({ kind: "grade_essay", prompt: "x" });
    expect(result.success).toBe(false);
  });

  it("từ chối grade ngoài phạm vi 1-5", () => {
    const result = suggestInputSchema.safeParse({
      kind: "simplify",
      text: "Hello",
      grade: 9,
    });
    expect(result.success).toBe(false);
  });
});

describe("distractorsOutputSchema", () => {
  it("yêu cầu đúng 3 distractor có mistake_tag hợp lệ", () => {
    const valid = {
      distractors: [
        { text: "23", mistake_tag: "quen_nho", why: "quên nhớ" },
        { text: "32", mistake_tag: "nham_hang_chuc", why: "đảo chữ số" },
        { text: "39", mistake_tag: "doan_lung_tung", why: "đoán" },
      ],
    };
    expect(distractorsOutputSchema.safeParse(valid).success).toBe(true);
  });

  it("từ chối nếu thiếu/thừa distractor hoặc mistake_tag sai", () => {
    expect(
      distractorsOutputSchema.safeParse({
        distractors: [{ text: "23", mistake_tag: "quen_nho", why: "x" }],
      }).success,
    ).toBe(false);

    expect(
      distractorsOutputSchema.safeParse({
        distractors: [
          { text: "23", mistake_tag: "sai_tag_khong_ton_tai", why: "x" },
          { text: "32", mistake_tag: "nham_hang_chuc", why: "x" },
          { text: "39", mistake_tag: "doan_lung_tung", why: "x" },
        ],
      }).success,
    ).toBe(false);
  });
});

describe("stepsOutputSchema", () => {
  it("chấp nhận steps + worked_example hợp lệ", () => {
    const valid = {
      steps: [{ text: "Bước 1" }, { text: "Bước 2" }],
      worked_example: [{ text: "Ví dụ bước 1" }, { text: "Ví dụ bước 2" }],
    };
    expect(stepsOutputSchema.safeParse(valid).success).toBe(true);
  });

  it("từ chối nếu chỉ có 1 bước (ít hơn tối thiểu 2)", () => {
    expect(
      stepsOutputSchema.safeParse({ steps: [{ text: "chỉ 1" }], worked_example: [{ text: "x" }] }).success,
    ).toBe(false);
  });
});

describe("reflectionsOutputSchema", () => {
  it("yêu cầu đúng 3 câu, mỗi câu 2-3 thẻ trả lời", () => {
    const valid = {
      reflections: [
        { calibration: "match", question: "Q1", choices: [{ text: "A" }, { text: "B" }] },
        { calibration: "over", question: "Q2", choices: [{ text: "A" }, { text: "B" }, { text: "C" }] },
        { calibration: "under", question: "Q3", choices: [{ text: "A" }, { text: "B" }] },
      ],
    };
    expect(reflectionsOutputSchema.safeParse(valid).success).toBe(true);
  });

  it("từ chối nếu thiếu 1 trong 3 mức calibration", () => {
    const invalid = {
      reflections: [
        { calibration: "match", question: "Q1", choices: [{ text: "A" }, { text: "B" }] },
        { calibration: "over", question: "Q2", choices: [{ text: "A" }, { text: "B" }] },
      ],
    };
    expect(reflectionsOutputSchema.safeParse(invalid).success).toBe(false);
  });
});

describe("simplifyOutputSchema", () => {
  it("chỉ cần 1 trường text không rỗng", () => {
    expect(simplifyOutputSchema.safeParse({ text: "Câu đơn giản hơn" }).success).toBe(true);
    expect(simplifyOutputSchema.safeParse({ text: "" }).success).toBe(false);
  });
});
