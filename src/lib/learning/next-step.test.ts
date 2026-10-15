import { describe, expect, it } from "vitest";
import { suggestNextStep } from "./next-step";

describe("suggestNextStep", () => {
  it("sai → review_example (bất kể tự tin)", () => {
    expect(suggestNextStep(false, 1).suggested).toBe("review_example");
    expect(suggestNextStep(false, 2).suggested).toBe("review_example");
    expect(suggestNextStep(false, 3).suggested).toBe("review_example");
  });

  it("đúng + tự tin 1 → practice", () => {
    expect(suggestNextStep(true, 1).suggested).toBe("practice");
  });

  it("đúng + tự tin 3 → harder", () => {
    expect(suggestNextStep(true, 3).suggested).toBe("harder");
  });

  it("đúng + tự tin 2 (còn lại) → practice", () => {
    expect(suggestNextStep(true, 2).suggested).toBe("practice");
  });

  it("luôn kèm 1 câu lý do", () => {
    const result = suggestNextStep(true, 3);
    expect(result.reasonText.length).toBeGreaterThan(0);
  });
});
