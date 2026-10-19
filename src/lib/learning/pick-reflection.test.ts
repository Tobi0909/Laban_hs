import { describe, expect, it } from "vitest";
import { pickReflectionTemplate, type ReflectionTemplateRow } from "./pick-reflection";

const templates: ReflectionTemplateRow[] = [
  { id: "match-1", calibration: "match", mistakeTag: null, question: "Q match 1", choices: [] },
  { id: "match-2", calibration: "match", mistakeTag: null, question: "Q match 2", choices: [] },
  { id: "under-1", calibration: "under", mistakeTag: null, question: "Q under 1", choices: [] },
  { id: "over-generic", calibration: "over", mistakeTag: null, question: "Q over generic", choices: [] },
  { id: "over-quen-nho", calibration: "over", mistakeTag: "quen_nho", question: "Q over quen_nho", choices: [] },
  { id: "over-nham", calibration: "over", mistakeTag: "nham_hang_chuc", question: "Q over nham", choices: [] },
];

describe("pickReflectionTemplate", () => {
  it("calibration=under → chọn mẫu under", () => {
    const picked = pickReflectionTemplate(templates, "under", null);
    expect(picked?.calibration).toBe("under");
  });

  it("calibration=over + mistakeTag khớp → ưu tiên mẫu đúng mistake_tag", () => {
    const picked = pickReflectionTemplate(templates, "over", "quen_nho");
    expect(picked?.id).toBe("over-quen-nho");
  });

  it("calibration=over + mistakeTag không có mẫu riêng → rơi về mẫu chung", () => {
    const picked = pickReflectionTemplate(templates, "over", "doan_lung_tung");
    expect(picked?.id).toBe("over-generic");
  });

  it("không có mẫu nào khớp calibration → trả về null", () => {
    const picked = pickReflectionTemplate([], "match", null);
    expect(picked).toBeNull();
  });

  it("seed khác nhau có thể xoay vòng giữa các mẫu cùng calibration", () => {
    const first = pickReflectionTemplate(templates, "match", null, 0);
    const second = pickReflectionTemplate(templates, "match", null, 1);
    expect(first?.id).not.toBe(second?.id);
  });
});
