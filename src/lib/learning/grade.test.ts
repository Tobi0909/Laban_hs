import { describe, expect, it } from "vitest";
import { calibrate, gradeAnswer } from "./grade";
import type { AnswerValue, TaskAnswerKey } from "./types";

describe("calibrate", () => {
  it("confidence 1 + đúng = under", () => {
    expect(calibrate(1, true)).toBe("under");
  });

  it("confidence 1 + sai = match", () => {
    expect(calibrate(1, false)).toBe("match");
  });

  it("confidence 2 + đúng = match", () => {
    expect(calibrate(2, true)).toBe("match");
  });

  it("confidence 2 + sai = over", () => {
    expect(calibrate(2, false)).toBe("over");
  });

  it("confidence 3 + đúng = match", () => {
    expect(calibrate(3, true)).toBe("match");
  });

  it("confidence 3 + sai = over", () => {
    expect(calibrate(3, false)).toBe("over");
  });
});

describe("gradeAnswer", () => {
  it("pick_image: đúng", () => {
    const key: TaskAnswerKey = {
      correct: { type: "pick_image", optionId: "opt2" },
      distractors: [
        { value: { type: "pick_image", optionId: "opt1" }, mistakeTag: "quen_nho" },
        { value: { type: "pick_image", optionId: "opt3" }, mistakeTag: "nham_hang_chuc" },
        { value: { type: "pick_image", optionId: "opt4" }, mistakeTag: "doan_lung_tung" },
      ],
    };
    expect(gradeAnswer(key, { type: "pick_image", optionId: "opt2" })).toEqual({
      isCorrect: true,
      mistakeTag: null,
    });
  });

  it("pick_image: sai khớp 1 distractor → gắn đúng mistake_tag", () => {
    const key: TaskAnswerKey = {
      correct: { type: "pick_image", optionId: "opt2" },
      distractors: [
        { value: { type: "pick_image", optionId: "opt1" }, mistakeTag: "quen_nho" },
        { value: { type: "pick_image", optionId: "opt3" }, mistakeTag: "nham_hang_chuc" },
        { value: { type: "pick_image", optionId: "opt4" }, mistakeTag: "doan_lung_tung" },
      ],
    };
    expect(gradeAnswer(key, { type: "pick_image", optionId: "opt1" })).toEqual({
      isCorrect: false,
      mistakeTag: "quen_nho",
    });
  });

  it("number: đúng", () => {
    const key: TaskAnswerKey = {
      correct: { type: "number", value: 33 },
      distractors: [
        { value: { type: "number", value: 23 }, mistakeTag: "quen_nho" },
        { value: { type: "number", value: 32 }, mistakeTag: "nham_hang_chuc" },
        { value: { type: "number", value: 39 }, mistakeTag: "doan_lung_tung" },
      ],
    };
    expect(gradeAnswer(key, { type: "number", value: 33 }).isCorrect).toBe(true);
  });

  it("number: sai không khớp distractor nào → mistake_tag mặc định doan_lung_tung", () => {
    const key: TaskAnswerKey = {
      correct: { type: "number", value: 33 },
      distractors: [
        { value: { type: "number", value: 23 }, mistakeTag: "quen_nho" },
        { value: { type: "number", value: 32 }, mistakeTag: "nham_hang_chuc" },
        { value: { type: "number", value: 39 }, mistakeTag: "doan_lung_tung" },
      ],
    };
    expect(gradeAnswer(key, { type: "number", value: 99 })).toEqual({
      isCorrect: false,
      mistakeTag: "doan_lung_tung",
    });
  });

  it("true_false: đúng và sai", () => {
    const key: TaskAnswerKey = {
      correct: { type: "true_false", value: true },
      distractors: [{ value: { type: "true_false", value: false }, mistakeTag: "doan_lung_tung" }],
    };
    expect(gradeAnswer(key, { type: "true_false", value: true }).isCorrect).toBe(true);
    expect(gradeAnswer(key, { type: "true_false", value: false })).toEqual({
      isCorrect: false,
      mistakeTag: "doan_lung_tung",
    });
  });

  it("order_steps: đúng thứ tự và sai thứ tự", () => {
    const key: TaskAnswerKey = {
      correct: { type: "order_steps", order: ["s1", "s2", "s3"] },
      distractors: [
        { value: { type: "order_steps", order: ["s2", "s1", "s3"] }, mistakeTag: "nham_hang_chuc" },
      ],
    };
    expect(gradeAnswer(key, { type: "order_steps", order: ["s1", "s2", "s3"] }).isCorrect).toBe(true);
    expect(gradeAnswer(key, { type: "order_steps", order: ["s2", "s1", "s3"] })).toEqual({
      isCorrect: false,
      mistakeTag: "nham_hang_chuc",
    });
  });

  it("drag_drop: đúng và sai mapping", () => {
    const key: TaskAnswerKey = {
      correct: { type: "drag_drop", mapping: { chip_4: "box_chuc", chip_7: "box_donvi" } },
      distractors: [
        {
          value: { type: "drag_drop", mapping: { chip_4: "box_donvi", chip_7: "box_chuc" } },
          mistakeTag: "nham_hang_chuc",
        },
      ],
    };
    expect(
      gradeAnswer(key, { type: "drag_drop", mapping: { chip_4: "box_chuc", chip_7: "box_donvi" } })
        .isCorrect,
    ).toBe(true);
    expect(
      gradeAnswer(key, { type: "drag_drop", mapping: { chip_4: "box_donvi", chip_7: "box_chuc" } }),
    ).toEqual({ isCorrect: false, mistakeTag: "nham_hang_chuc" });
  });

  it("các dạng khác nhau không bao giờ coi là trùng nhau", () => {
    const key: TaskAnswerKey = {
      correct: { type: "number", value: 1 },
      distractors: [],
    };
    const wrongType: AnswerValue = { type: "true_false", value: true };
    expect(gradeAnswer(key, wrongType).isCorrect).toBe(false);
  });
});
