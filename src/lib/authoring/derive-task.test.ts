import { describe, expect, it } from "vitest";
import { deriveDragDrop, deriveNumber, deriveOrderSteps, derivePickImage, deriveTrueFalse } from "./derive-task";
import { gradeAnswer } from "@/lib/learning/grade";

describe("derivePickImage", () => {
  it("tạo đúng answerKey và chỉ gắn distractor cho option có mistake_tag", () => {
    const result = derivePickImage({
      type: "pick_image",
      options: [
        { id: "a", iconId: "star", label: "12" },
        { id: "b", iconId: "star", label: "13" },
        { id: "c", iconId: "star", label: "14" },
      ],
      correctOptionId: "b",
      distractorTags: { a: "quen_nho", c: "doan_lung_tung" },
    });
    expect(result.answerKey.correct).toEqual({ type: "pick_image", optionId: "b" });
    expect(result.answerKey.distractors).toHaveLength(2);
    expect(gradeAnswer(result.answerKey, { type: "pick_image", optionId: "b" }).isCorrect).toBe(true);
    expect(gradeAnswer(result.answerKey, { type: "pick_image", optionId: "a" })).toEqual({
      isCorrect: false,
      mistakeTag: "quen_nho",
    });
  });
});

describe("deriveNumber", () => {
  it("chấm đúng dựa trên dữ liệu đã soạn", () => {
    const result = deriveNumber({
      type: "number",
      maxDigits: 2,
      correctValue: 33,
      distractors: [{ value: 23, mistakeTag: "quen_nho" }],
    });
    expect(gradeAnswer(result.answerKey, { type: "number", value: 33 }).isCorrect).toBe(true);
    expect(gradeAnswer(result.answerKey, { type: "number", value: 23 }).mistakeTag).toBe("quen_nho");
  });
});

describe("deriveTrueFalse", () => {
  it("tự tạo 1 distractor là giá trị ngược lại", () => {
    const result = deriveTrueFalse({ type: "true_false", correctValue: true });
    expect(result.answerKey.distractors).toEqual([
      { value: { type: "true_false", value: false }, mistakeTag: "doan_lung_tung" },
    ]);
  });
});

describe("deriveDragDrop", () => {
  it("tự sinh 1 distractor hoán vị khi có >1 thẻ", () => {
    const result = deriveDragDrop({
      type: "drag_drop",
      items: [
        { id: "i1", label: "5" },
        { id: "i2", label: "8" },
      ],
      targets: [
        { id: "t1", label: "Chục" },
        { id: "t2", label: "Đơn vị" },
      ],
      correctMapping: { i1: "t1", i2: "t2" },
    });
    expect(result.answerKey.distractors).toHaveLength(1);
    expect(
      gradeAnswer(result.answerKey, { type: "drag_drop", mapping: { i1: "t1", i2: "t2" } }).isCorrect,
    ).toBe(true);
    expect(
      gradeAnswer(result.answerKey, { type: "drag_drop", mapping: { i1: "t2", i2: "t1" } }).mistakeTag,
    ).toBe("nham_hang_chuc");
  });
});

describe("deriveOrderSteps", () => {
  it("xáo trộn hiển thị nhưng answerKey giữ đúng thứ tự đã nhập", () => {
    const steps = [
      { id: "s1", text: "Bước 1", iconId: "star" as const },
      { id: "s2", text: "Bước 2", iconId: "sun" as const },
      { id: "s3", text: "Bước 3", iconId: "leaf" as const },
    ];
    const result = deriveOrderSteps({ type: "order_steps", stepsInCorrectOrder: steps });
    expect(result.answerKey.correct).toEqual({ type: "order_steps", order: ["s1", "s2", "s3"] });
    expect(result.content).toMatchObject({ type: "order_steps" });
    if (result.content.type === "order_steps") {
      expect(result.content.steps.map((s) => s.id).sort()).toEqual(["s1", "s2", "s3"]);
    }
    expect(
      gradeAnswer(result.answerKey, { type: "order_steps", order: ["s1", "s2", "s3"] }).isCorrect,
    ).toBe(true);
    expect(result.answerKey.distractors.length).toBeGreaterThan(0);
  });
});
