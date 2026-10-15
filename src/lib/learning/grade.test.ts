import { describe, expect, it } from "vitest";
import { calibrate } from "./grade";

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
